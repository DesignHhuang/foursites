import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { buildWorld } from './model.js';

const Q = new URLSearchParams(location.search);
const FREEZE = Q.has('freeze');

const stage = document.getElementById('stage');
const $ = (id) => document.getElementById(id);
const panel = $('panel');

const renderer = new THREE.WebGLRenderer({ antialias: Q.get('aa') !== '0' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xdbe4e4, 8, 26);

const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 80);
camera.position.set(2.75, 2.42, 5.55);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.0, 1.85, 0.05);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1.0;
controls.maxDistance = 13;
controls.maxPolarAngle = 1.55;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.62;

const key = new THREE.DirectionalLight(0xffffff, 3.2);
key.position.set(3.8, 5.5, 4.0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
Object.assign(key.shadow.camera, { left: -3.0, right: 3.0, top: 4.5, bottom: -0.8, near: 1, far: 14 });
key.shadow.camera.updateProjectionMatrix();
key.shadow.bias = -0.0003;
key.shadow.normalBias = 0.02;
scene.add(key, key.target);

const fill = new THREE.DirectionalLight(0xcde7ff, 0.75);
fill.position.set(-3.4, 3.0, 2.5);
scene.add(fill);

const hemi = new THREE.HemisphereLight(0xdbf2ff, 0xa1a7a2, 0.52);
scene.add(hemi);

const nightAccent = new THREE.PointLight(0x6eea61, 0, 5.5, 1.6);
nightAccent.position.set(0.8, 2.6, 1.1);
scene.add(nightAccent);

const world = buildWorld();
scene.add(world.root);
const parts = world.parts;
const N = parts.length;
const rayTargets = [];
parts.forEach((p, i) => {
  p.index = i;
  p.flyFrom = p.explode.clone().normalize().multiplyScalar(0.9 + p.explode.length() * 0.25);
  p.spinAxis = new THREE.Vector3(Math.sin(i * 2.1), Math.cos(i * 1.7), Math.sin(i * 3.2)).normalize();
  p.group.traverse((obj) => { if (obj.isMesh) rayTargets.push(obj); });
});

const state = {
  p: 0,
  playing: false,
  speed: 1,
  follow: true,
  explode: 0,
  explodeTarget: 0,
  tags: false,
  cutaway: false,
  batteryOpen: false,
  night: false,
  flow: true,
  orbit: false,
  active: null,
  hover: null,
  run: { on: false, mode: 'tariff', load: 62, quiet: true },
  nightV: 0,
  flowPhase: 0
};

const DUR = 0.10;
const STEP = (1 - DUR) / Math.max(1, N - 1);
const TOTAL_T = 28;

const VIEWS = {
  hero: [new THREE.Vector3(2.75, 2.42, 5.55), new THREE.Vector3(0.0, 1.85, 0.05)],
  battery: [new THREE.Vector3(2.25, 1.72, 3.2), new THREE.Vector3(0.0, 1.25, 0.08)],
  inverter: [new THREE.Vector3(1.7, 3.15, 2.65), new THREE.Vector3(0.0, 3.25, 0.03)],
  explode: [new THREE.Vector3(3.8, 2.85, 4.4), new THREE.Vector3(0.0, 2.25, 0.05)]
};

let camTween = null;
function tweenCam(pos, target, dur = 1.0) {
  camTween = { t: 0, dur, p0: camera.position.clone(), p1: pos.clone(), t0: controls.target.clone(), t1: target.clone() };
}
function stepCam(dt) {
  if (!camTween) return;
  camTween.t += dt;
  const k = Math.min(1, camTween.t / camTween.dur);
  const e = ease(k);
  camera.position.lerpVectors(camTween.p0, camTween.p1, e);
  controls.target.lerpVectors(camTween.t0, camTween.t1, e);
  if (k >= 1) camTween = null;
}
controls.addEventListener('start', () => { camTween = null; });

function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
function partAssemblyProgress(i) {
  return smoothstep(i * STEP, i * STEP + DUR, state.p);
}
function applyTransforms() {
  parts.forEach((p, i) => {
    const a = partAssemblyProgress(i);
    const assembled = p.home.clone().add(p.flyFrom.clone().multiplyScalar(1 - a));
    const exploded = p.home.clone().add(p.explode.clone().multiplyScalar(state.explode));
    p.group.position.lerpVectors(assembled, exploded, state.explode);
    p.group.quaternion.copy(p.homeQuat);
    if (a < 0.999) {
      const q = new THREE.Quaternion().setFromAxisAngle(p.spinAxis, (1 - a) * Math.PI * 0.34);
      p.group.quaternion.multiply(q);
    }
    const visible = a > 0.012 || state.p > 0.98;
    p.group.visible = visible;
  });
}

function applyModes(dt) {
  state.explode += (state.explodeTarget - state.explode) * Math.min(1, dt * 3.2);
  state.nightV += ((state.night ? 1 : 0) - state.nightV) * Math.min(1, dt * 2.4);

  renderer.setClearColor(new THREE.Color().lerpColors(new THREE.Color(0xe8eeee), new THREE.Color(0x091016), state.nightV));
  scene.fog.color.lerpColors(new THREE.Color(0xdbe4e4), new THREE.Color(0x0f1a1d), state.nightV);
  key.intensity = THREE.MathUtils.lerp(3.2, 1.2, state.nightV);
  fill.intensity = THREE.MathUtils.lerp(0.75, 0.25, state.nightV);
  hemi.intensity = THREE.MathUtils.lerp(0.52, 0.18, state.nightV);
  nightAccent.intensity = state.run.on ? THREE.MathUtils.lerp(0.35, 2.4, state.nightV) : THREE.MathUtils.lerp(0, 1.0, state.nightV);
  world.env.wall.visible = !state.explode;

  parts.forEach((p) => {
    let targetOpacity = 1;
    if (state.cutaway && p.cover) targetOpacity = 0.16;
    if (state.cutaway && p.inverterInner) targetOpacity = 1;
    if (state.batteryOpen && p.batteryShell) targetOpacity = 0.24;
    if (state.batteryOpen && p.batteryInner) targetOpacity = 1;
    p.materials.forEach((m) => {
      const baseOpacity = m.userData.baseOpacity ?? 1;
      m.opacity += (baseOpacity * targetOpacity - m.opacity) * Math.min(1, dt * 5);
      m.transparent = m.opacity < 0.98 || m.userData.baseTransparent;
      m.depthWrite = m.opacity > 0.45 && m.userData.baseDepthWrite !== false;
    });
  });

  state.flowPhase += dt * (state.run.on ? 2.5 : 0.8);
  world.flowObjects.forEach((obj, i) => {
    const pulse = 0.5 + 0.5 * Math.sin(state.flowPhase * 3.5 + i * 1.2);
    obj.visible = state.flow && (state.run.on || state.explode > 0.04);
    obj.material.opacity = (state.run.on ? 0.55 : 0.18) + pulse * 0.32;
    obj.material.emissiveIntensity = (state.run.on ? 1.0 : 0.2) + pulse * 1.8;
  });
  world.ledObjects.forEach((obj, i) => {
    const pulse = state.run.on ? 0.72 + 0.28 * Math.sin(state.flowPhase * 5 + i * 0.7) : 0.22;
    obj.material.emissiveIntensity = pulse * 2.2;
    obj.scale.setScalar(state.run.on ? 1 + pulse * 0.14 : 1);
  });
}

function updateAssembly(dt) {
  if (!state.playing) return;
  state.p = Math.min(1, state.p + dt * state.speed / TOTAL_T);
  if (state.p >= 1) state.playing = false;
  $('asmSlider').value = Math.round(state.p * 1000);
  updateAssemblyUI();
}

function updateAssemblyUI() {
  $('asmPct').textContent = `${Math.round(state.p * 100)}%`;
  const idx = Math.min(N - 1, Math.max(0, Math.floor(state.p / STEP)));
  if (state.p <= 0.01) $('nowBuilding').textContent = `尚未开始 · ${N} 件零件待装`;
  else if (state.p >= 0.995) $('nowBuilding').textContent = `整机装配完成 · ${N} 件就位`;
  else $('nowBuilding').innerHTML = `正在装配 <b>${String(idx + 1).padStart(2, '0')}</b> · ${parts[idx].name}`;
  $('btnPlay').textContent = state.playing ? 'Ⅱ 暂停' : (state.p >= 1 ? '▶ 重新组装' : '▶ 开始组装');
}

function updateExplodeUI() {
  $('expSlider').value = Math.round(state.explodeTarget * 1000);
  $('expPct').textContent = `${Math.round(state.explodeTarget * 100)}%`;
}

function updateRunUI() {
  $('btnPower').classList.toggle('on', state.run.on);
  $('btnPower').textContent = state.run.on ? '⏻ WattMatic 运行中' : '⏻ 启动 WattMatic';
  $('runPanel').classList.toggle('hidden', !state.run.on);
  $('loadOut').textContent = `${state.run.load}%`;
  $('runStat').classList.toggle('parallel', state.run.mode === 'parallel');
  const modeText = { tariff: 'AI 电价优化', backup: '全屋备电', parallel: '离网并联' }[state.run.mode];
  const loadKw = (state.run.load * 0.206).toFixed(1);
  const pv = state.run.mode === 'backup' ? '0.0' : (state.run.load * 0.19 + 6.4).toFixed(1);
  const bat = {
    tariff: '充电 4.8 kW',
    backup: `放电 ${Math.max(3.2, state.run.load * 0.14).toFixed(1)} kW`,
    parallel: '并联输出 25.0 kW'
  }[state.run.mode];
  const strategy = {
    tariff: '谷价充电 · 峰价削峰',
    backup: 'EPS 待命 · 关键负载在线',
    parallel: '5 台并联 · 125 kW'
  }[state.run.mode];
  $('runStat').innerHTML = `模式 <b>${modeText}</b> · 负载 <b>${loadKw} kW</b><br>PV 输入 <b>${pv} kW</b> · 电池 <b>${bat}</b><br>${strategy} · <b>15 min</b> 调度刷新<br><b>&lt;20 ms</b> 切换待命 · BMS <b>AutoSync™</b> · 温度 <b>${state.run.quiet ? 42 : 38} ℃</b>`;
}

function toast(msg) {
  const el = $('phaseToast');
  el.innerHTML = msg;
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 1500);
}

const list = $('partList');
let lastPhase = '';
parts.forEach((p, i) => {
  if (p.phase !== lastPhase) {
    lastPhase = p.phase;
    const h = document.createElement('li');
    h.className = 'phase-head';
    h.textContent = p.phase;
    list.appendChild(h);
  }
  const li = document.createElement('li');
  li.dataset.i = i;
  li.innerHTML = `<i>${String(i + 1).padStart(2, '0')}</i><span class="n">${p.name}</span><em>${p.en}</em>`;
  li.addEventListener('click', () => showDossier(i, true));
  list.appendChild(li);
});
$('partCount').textContent = `× ${N}`;

function setActive(i) {
  state.active = i == null ? null : parts[i];
  list.querySelectorAll('li[data-i]').forEach((li) => li.classList.toggle('active', Number(li.dataset.i) === i));
}

function showDossier(i, moveCam = false) {
  const p = parts[i];
  if (!p) return;
  setActive(i);
  $('dNum').textContent = String(i + 1).padStart(2, '0');
  $('dTitle').textContent = p.name;
  $('dEn').textContent = p.en;
  $('dBlurb').textContent = p.blurb;
  $('dSpec').innerHTML = p.spec.map((s) => `<span>${s}</span>`).join('');
  $('dIdx').textContent = `${i + 1} / ${N}`;
  $('dossier').classList.remove('hidden');
  if (moveCam) {
    const pos = new THREE.Vector3();
    p.group.getWorldPosition(pos);
    tweenCam(pos.clone().add(new THREE.Vector3(1.05, 0.72, 1.35)), pos, 0.85);
  }
}

function closeDossier() {
  $('dossier').classList.add('hidden');
  setActive(null);
}

$('dClose').addEventListener('click', closeDossier);
$('dPrev').addEventListener('click', () => showDossier((parts.indexOf(state.active) - 1 + N) % N, true));
$('dNext').addEventListener('click', () => showDossier((parts.indexOf(state.active) + 1) % N, true));

$('asmSlider').addEventListener('input', (e) => {
  state.p = Number(e.target.value) / 1000;
  state.playing = false;
  updateAssemblyUI();
});
$('btnPlay').addEventListener('click', () => {
  if (state.p >= 0.999) state.p = 0;
  state.playing = !state.playing;
  updateAssemblyUI();
  toast(state.playing ? '<b>Assembly</b> 装配开始' : '<b>Assembly</b> 暂停');
});
$('btnReset').addEventListener('click', () => {
  state.p = 0;
  state.playing = false;
  state.explodeTarget = 0;
  updateAssemblyUI();
  updateExplodeUI();
  closeDossier();
  toast('<b>Reset</b> 已回到散件状态');
});
$('speedSeg').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-s]');
  if (!btn) return;
  state.speed = Number(btn.dataset.s);
  $('speedSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === btn));
});
$('tglFollow').addEventListener('change', (e) => { state.follow = e.target.checked; });

$('expSlider').addEventListener('input', (e) => {
  state.explodeTarget = Number(e.target.value) / 1000;
  updateExplodeUI();
});
$('btnExplode').addEventListener('click', () => {
  state.p = 1;
  state.explodeTarget = 1;
  updateAssemblyUI();
  updateExplodeUI();
  tweenCam(...VIEWS.explode, 0.9);
  toast('<b>Exploded</b> 逆变器与电池塔已展开');
});
$('btnCollapse').addEventListener('click', () => {
  state.explodeTarget = 0;
  updateExplodeUI();
  tweenCam(...VIEWS.hero, 0.9);
});
$('tglTags').addEventListener('change', (e) => { state.tags = e.target.checked; });
$('tglCutaway').addEventListener('change', (e) => { state.cutaway = e.target.checked; });
$('tglBattery').addEventListener('change', (e) => { state.batteryOpen = e.target.checked; });
$('tglNight').addEventListener('change', (e) => { state.night = e.target.checked; });
$('tglFlow').addEventListener('change', (e) => { state.flow = e.target.checked; });
$('tglOrbit').addEventListener('change', (e) => { state.orbit = e.target.checked; });
$('btnCam').addEventListener('click', () => tweenCam(...VIEWS.hero, 0.9));
$('panelToggle').addEventListener('click', () => {
  panel.classList.toggle('open');
});

$('btnPower').addEventListener('click', () => {
  state.run.on = !state.run.on;
  if (state.run.on && state.p < 0.99) state.p = 1;
  updateRunUI();
  updateAssemblyUI();
  toast(state.run.on ? '<b>RUN</b> 逆变器已并机自检' : '<b>STOP</b> 逆变器已停机');
});
$('modeSeg').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-m]');
  if (!btn) return;
  state.run.mode = btn.dataset.m;
  $('modeSeg').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === btn));
  updateRunUI();
});
$('loadDown').addEventListener('click', () => { state.run.load = Math.max(12, state.run.load - 8); updateRunUI(); });
$('loadUp').addEventListener('click', () => { state.run.load = Math.min(100, state.run.load + 8); updateRunUI(); });
$('tglQuiet').addEventListener('change', (e) => { state.run.quiet = e.target.checked; updateRunUI(); });

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function pick(clientX, clientY) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(rayTargets, true)[0];
  return hit?.object?.userData?.part || null;
}
renderer.domElement.addEventListener('pointermove', (e) => {
  state.hover = pick(e.clientX, e.clientY);
  renderer.domElement.style.cursor = state.hover ? 'pointer' : 'grab';
});
renderer.domElement.addEventListener('dblclick', (e) => {
  const p = pick(e.clientX, e.clientY);
  if (p) showDossier(p.index, true);
});

const tagLayer = $('tags');
const leaders = $('leaders');
const tagEls = parts.map((p, i) => {
  const el = document.createElement('div');
  el.className = 'tag';
  el.innerHTML = `<b>${p.name}</b><i>${p.en}</i>`;
  el.addEventListener('click', () => showDossier(i, true));
  tagLayer.appendChild(el);
  return el;
});
const unitEls = world.unitTags.map((u) => {
  const el = document.createElement('div');
  el.className = 'tag unit';
  el.innerHTML = `<b>${u.name}</b><i>${u.en}</i>`;
  tagLayer.appendChild(el);
  return el;
});

function project(v) {
  const p = v.clone().project(camera);
  return {
    x: (p.x * 0.5 + 0.5) * stage.clientWidth,
    y: (-p.y * 0.5 + 0.5) * stage.clientHeight,
    z: p.z
  };
}

function updateTags() {
  leaders.innerHTML = '';
  const show = state.tags && state.p > 0.88;
  tagLayer.style.display = show ? '' : 'none';
  if (!show) return;
  parts.forEach((p, i) => {
    const worldPos = p.tag.clone();
    p.group.localToWorld(worldPos);
    const s = project(worldPos);
    const visible = s.z > -1 && s.z < 1 && p.group.visible;
    const hot = p === state.hover || p === state.active;
    const el = tagEls[i];
    el.classList.toggle('hot', hot);
    el.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) return;
    const offsetX = p.explode.x >= 0 ? 26 : -150;
    const offsetY = -22 - (i % 3) * 16;
    el.style.transform = `translate(${Math.round(s.x + offsetX)}px, ${Math.round(s.y + offsetY)}px)`;
    const x2 = s.x + (p.explode.x >= 0 ? 18 : -18);
    const y2 = s.y + offsetY + 18;
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', s.x.toFixed(1));
    line.setAttribute('y1', s.y.toFixed(1));
    line.setAttribute('x2', x2.toFixed(1));
    line.setAttribute('y2', y2.toFixed(1));
    line.setAttribute('stroke', hot ? 'rgba(110,234,97,0.9)' : 'rgba(232,236,239,0.45)');
    line.setAttribute('stroke-width', hot ? '1.4' : '1');
    leaders.appendChild(line);
  });
  world.unitTags.forEach((u, i) => {
    const s = project(u.point);
    unitEls[i].style.visibility = s.z > -1 && s.z < 1 ? 'visible' : 'hidden';
    unitEls[i].style.transform = `translate(${Math.round(s.x + 18)}px, ${Math.round(s.y - 28)}px)`;
  });
}

function resize() {
  const w = stage.clientWidth;
  const h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
function animate() {
  const dt = Math.min(0.05, clock.getDelta());
  updateAssembly(dt);
  applyModes(dt);
  applyTransforms();
  if (state.follow && state.playing) {
    const idx = Math.min(N - 1, Math.floor(state.p / STEP));
    const target = new THREE.Vector3();
    parts[idx].group.getWorldPosition(target);
    controls.target.lerp(target, dt * 1.5);
  }
  if (state.orbit && !camTween) {
    const target = controls.target;
    const rel = camera.position.clone().sub(target);
    rel.applyAxisAngle(new THREE.Vector3(0, 1, 0), dt * 0.18);
    camera.position.copy(target).add(rel);
  }
  stepCam(dt);
  controls.update();
  updateTags();
  renderer.render(scene, camera);
  if (!FREEZE) requestAnimationFrame(animate);
}

state.p = 1;
$('asmSlider').value = 1000;
updateAssemblyUI();
updateExplodeUI();
updateRunUI();
toast('<b>WattMatic</b> AIO Home 模型已加载');
animate();
