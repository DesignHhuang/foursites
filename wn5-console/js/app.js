// 白夜五号游戏主机 · 装配 / 爆炸图 / 开机演示
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from '../vendor/RectAreaLightUniformsLib.js';
import { buildWorld } from './model.js';

const Q = new URLSearchParams(location.search);
const SHOT = [...Q.keys()].length > 0;
const FREEZE = Q.has('freeze');
const DIAG = Q.has('diag');
function diagMsg(s) {
  let el = document.getElementById('diagBox');
  if (!el) {
    el = document.createElement('div');
    el.id = 'diagBox';
    el.style.cssText = 'position:fixed;top:8px;right:8px;z-index:99;background:#300;color:#ffd;padding:10px 14px;font:13px/1.5 monospace;max-width:640px;white-space:pre-wrap;';
    document.body.appendChild(el);
  }
  el.textContent = s;
}
if (DIAG) {
  window.addEventListener('error', (e) => {
    diagMsg('ERR ' + e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno);
  });
}

const stage = document.getElementById('stage');
const $ = (id) => document.getElementById(id);

/* ---------------- renderer / scene ---------------- */

const renderer = new THREE.WebGLRenderer({ antialias: Q.get('aa') !== '0' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xdfe9f2, 10, 30);

const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 120);
camera.position.set(1.85, 1.5, 2.5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.05, 0.85, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.3;
controls.maxDistance = 14;
controls.maxPolarAngle = 1.58;
controls.autoRotateSpeed = 0.9;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;
RectAreaLightUniformsLib.init();

/* ---------------- lights ---------------- */

const dirLight = new THREE.DirectionalLight(0xfff2e0, 2.5);
dirLight.position.set(3.0, 4.6, 3.4);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
Object.assign(dirLight.shadow.camera, { left: -3.2, right: 3.2, top: 3.4, bottom: -1.4, near: 1, far: 15 });
dirLight.shadow.camera.updateProjectionMatrix();
dirLight.shadow.bias = -0.0003;
dirLight.shadow.normalBias = 0.02;
scene.add(dirLight, dirLight.target);

const fillLight = new THREE.DirectionalLight(0xdbe8ff, 0.5);
fillLight.position.set(-2.6, 2.4, 2.6);
scene.add(fillLight);

const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x8f857a, 0.45);
scene.add(hemi);

// 显示器面光
const monLight = new THREE.RectAreaLight(0x9fb4ff, 0, 0.60, 0.35);
scene.add(monLight);

// 主机灯带的微光
const conLight = new THREE.PointLight(0xbcd0ff, 0, 1.4, 1.8);
scene.add(conLight);

/* ---------------- sky ---------------- */

const SKY = {
  dayTop: new THREE.Color(0x82b4e6), dayBot: new THREE.Color(0xeef4f8),
  nightTop: new THREE.Color(0x070c1c), nightBot: new THREE.Color(0x181f30),
};
const skyUni = { uTop: { value: SKY.dayTop.clone() }, uBot: { value: SKY.dayBot.clone() } };
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(40, 24, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: skyUni,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec3 vP; uniform vec3 uTop; uniform vec3 uBot;
      void main(){ float h = clamp(normalize(vP).y*1.4+0.18, 0.0, 1.0); gl_FragColor = vec4(mix(uBot,uTop,pow(h,0.8)),1.0); }`,
  })
);
scene.add(sky);

/* ---------------- world ---------------- */

const world = buildWorld();
scene.add(world.root);
const parts = world.parts;
const N = parts.length;
monLight.position.copy(world.env.monScreenPos).add(new THREE.Vector3(0, 0, 0.04));
monLight.lookAt(world.env.monScreenPos.x, 0.7, 3.0);
conLight.position.set(0.56, 1.05, 0.10);

const DUR = 0.10;
const STEP = (1 - DUR) / (N - 1);
const TOTAL_T = 26;

parts.forEach((p, i) => {
  const len = p.explode.length();
  const dir = len > 0.01 ? p.explode.clone().normalize() : new THREE.Vector3(0.15, 0.9, 0.45).normalize();
  p.flyFrom = p.fly ? new THREE.Vector3(...p.fly).multiplyScalar(1.15) : dir.multiplyScalar(1.15 + len * 0.4);
  p.settleAxis = new THREE.Vector3(Math.sin(i * 2.3), Math.cos(i * 1.7), Math.sin(i * 3.1)).normalize();
  p.homeQuat = p.group.quaternion.clone();
  p.fade = 1;
  p.tl = 0;
  p.mats.forEach(m => {
    m.userData.baseOpacity = m.opacity;
    m.userData.baseTransparent = m.transparent;
    m.userData.baseDepthWrite = m.depthWrite;
  });
});
world.env.furnitureMats.forEach(m => {
  m.userData.baseOpacity = m.opacity;
  m.userData.baseTransparent = m.transparent;
  m.userData.baseDepthWrite = m.depthWrite;
});

const rayTargets = [];
parts.forEach(p => p.group.traverse(o => { if (o.isMesh) rayTargets.push(o); }));

/* ---------------- state ---------------- */

const state = {
  p: 0, playing: false, speed: 1, follow: true,
  explode: 0, explodeTarget: 0,
  tags: true, cutaway: false, desk: true, night: false, rgb: true, orbit: false,
  run: { on: false, source: 'home', fan: 45, breath: true },
  focus: null, hover: null, active: null,
  nightV: 0, deskV: 1,
};

const CUT_IDS = new Set(['c-plateL', 'c-plateR', 'c-body', 'c-led']);
const INNER_IDS = new Set(['c-frame', 'c-board', 'c-lm', 'c-sink', 'c-shield', 'c-m2', 'c-psu', 'c-fan', 'c-dust', 'c-bd', 'c-disc']);

/* ---------------- tweens ---------------- */

const tweens = [];
function tween(dur, apply, onDone) {
  tweens.push({ t: 0, dur, apply, onDone });
}
function stepTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const k = Math.min(1, tw.t / tw.dur);
    tw.apply(k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2, k);
    if (k >= 1) { tweens.splice(i, 1); tw.onDone && tw.onDone(); }
  }
}

let camTween = null;
function tweenCam(pos, target, dur = 1.0) {
  camTween = {
    t: 0, dur,
    p0: camera.position.clone(), p1: pos.clone(),
    t0: controls.target.clone(), t1: target.clone(),
  };
}
function stepCamTween(dt) {
  if (!camTween) return;
  camTween.t += dt;
  const k = Math.min(1, camTween.t / camTween.dur);
  const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  camera.position.lerpVectors(camTween.p0, camTween.p1, e);
  controls.target.lerpVectors(camTween.t0, camTween.t1, e);
  if (k >= 1) camTween = null;
}
controls.addEventListener('start', () => { camTween = null; });

const VIEWS = {
  hero: [new THREE.Vector3(1.85, 1.5, 2.5), new THREE.Vector3(0.05, 0.85, 0)],
  explode: [new THREE.Vector3(3.15, 1.95, 2.55), new THREE.Vector3(0.8, 1.32, 0.1)],
  console: [new THREE.Vector3(1.55, 1.2, 1.15), new THREE.Vector3(0.56, 0.96, -0.02)],
  game: [new THREE.Vector3(0.45, 1.35, 1.85), new THREE.Vector3(-0.20, 1.02, -0.30)],
  guts: [new THREE.Vector3(1.9, 1.3, 1.3), new THREE.Vector3(0.56, 0.95, -0.02)],
  top: [new THREE.Vector3(0.6, 4.0, 1.1), new THREE.Vector3(0.1, 0.6, 0.3)],
};

/* ---------------- assembly / explode ---------------- */

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function applyParts() {
  const ex = state.explode;
  for (const u of Object.values(world.units)) {
    u.group.position.copy(u.base).addScaledVector(u.vec, ex);
  }
  let active = null;
  for (let i = 0; i < N; i++) {
    const p = parts[i];
    const tl = Math.min(1, Math.max(0, (state.p - i * STEP) / DUR));
    p.tl = tl;
    if (tl <= 0) { p.group.visible = false; continue; }
    p.group.visible = p.fade > 0.02;
    const e = easeOut(tl);
    _v.copy(p.home).addScaledVector(p.explode, ex);
    if (tl < 1) {
      _v.addScaledVector(p.flyFrom, 1 - e);
      _q.setFromAxisAngle(p.settleAxis, 0.35 * (1 - e));
      p.group.quaternion.copy(p.homeQuat).multiply(_q);
      p.group.scale.setScalar(0.72 + 0.28 * e);
      if (state.playing) active = p;
    } else {
      p.group.quaternion.copy(p.homeQuat);
      p.group.scale.setScalar(1);
    }
    p.group.position.copy(_v);
  }
  state.active = active;
}

/* ---------------- fades ---------------- */

function fadeMat(m, v) {
  const base = m.userData.baseOpacity ?? 1;
  const want = base * v;
  if (Math.abs(m.opacity - want) < 0.004) return;
  m.opacity = want;
  const needT = v < 0.999 || m.userData.baseTransparent;
  if (m.transparent !== needT) { m.transparent = needT; m.needsUpdate = true; }
  m.depthWrite = v > 0.5 ? (m.userData.baseDepthWrite ?? true) : false;
}

function stepFades(dt) {
  const spd = FREEZE ? 1e9 : dt * 7;
  for (const p of parts) {
    const target = (state.cutaway && CUT_IDS.has(p.id)) ? 0.06 : 1;
    p.fade += Math.max(-spd, Math.min(spd, target - p.fade));
    if (Math.abs(p.fade - target) < 0.01) p.fade = target;
    p.mats.forEach(m => fadeMat(m, p.fade));
  }
  // 爆炸时自动淡出桌面外设,让零件云独占舞台
  const ft = (!state.desk || state.explode > 0.35) ? 0.07 : 1;
  state.deskV += Math.max(-spd, Math.min(spd, ft - state.deskV));
  world.env.furnitureMats.forEach(m => fadeMat(m, state.deskV));
}

/* ---------------- signal dots ---------------- */

function makeDotTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, 'rgba(255,255,255,0.95)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const SIG_N = 24;
const sigPos = new Float32Array(SIG_N * 3);
const sigGeo = new THREE.BufferGeometry();
sigGeo.setAttribute('position', new THREE.BufferAttribute(sigPos, 3));
const sigMat = new THREE.PointsMaterial({
  map: makeDotTex(), size: 0.022, transparent: true, opacity: 0.9,
  depthWrite: false, color: 0x6c8cff, sizeAttenuation: true, blending: THREE.AdditiveBlending,
});
const sigDots = new THREE.Points(sigGeo, sigMat);
sigDots.frustumCulled = false;
sigDots.visible = false;
scene.add(sigDots);
const _sv = new THREE.Vector3();

function stepFx(t) {
  const show = state.run.on && state.p > 0.98 && state.explode < 0.1 && state.deskV > 0.5;
  sigDots.visible = show;
  if (show) {
    for (let i = 0; i < SIG_N; i++) {
      let u = (i / SIG_N + t * 0.22) % 1;
      world.env.hdmiCurve.getPointAt(1 - u, _sv);
      sigPos.set([_sv.x, _sv.y, _sv.z], i * 3);
    }
    sigGeo.attributes.position.needsUpdate = true;
  }
}

/* ---------------- environment ---------------- */

const fogDay = new THREE.Color(0xdfe9f2), fogNight = new THREE.Color(0x0e121c);
const dirDay = new THREE.Color(0xfff2e0), dirNight = new THREE.Color(0x8fa8cc);
const _c1 = new THREE.Color(), _c2 = new THREE.Color();

function stepEnv(dt) {
  const spd = FREEZE ? 1e9 : dt * 3;
  state.nightV += Math.max(-spd, Math.min(spd, (state.night ? 1 : 0) - state.nightV));
  const nv = state.nightV;
  dirLight.intensity = 2.5 * (1 - nv * 0.95);
  dirLight.color.lerpColors(dirDay, dirNight, nv);
  fillLight.intensity = 0.5 * (1 - nv * 0.85);
  hemi.intensity = 0.45 * (1 - nv * 0.86);
  scene.environmentIntensity = 0.5 * (1 - nv * 0.85);
  renderer.toneMappingExposure = 1.1 - nv * 0.07;
  _c1.copy(SKY.dayTop).lerp(SKY.nightTop, nv);
  _c2.copy(SKY.dayBot).lerp(SKY.nightBot, nv);
  skyUni.uTop.value.copy(_c1);
  skyUni.uBot.value.copy(_c2);
  scene.fog.color.lerpColors(fogDay, fogNight, nv);
}

/* ---------------- console runtime ---------------- */

const GLOW = {
  home: { color: 0x5c7cff, int: 1.0 },
  race: { color: 0xff9a5c, int: 1.3 },
  perf: { color: 0x58e0a8, int: 0.8 },
};
let screenAcc = 0;
const _rgbC = new THREE.Color();

function stepMachine(dt, t) {
  const on = state.run.on && state.p > 0.98;
  screenAcc -= dt;
  if (screenAcc <= 0) {
    screenAcc = 0.045;
    world.anim.screen.draw(on, state.run.source, t);
  }
  // 风扇
  if (!FREEZE && on) world.anim.fan.rotation.x -= dt * (state.run.fan / 100) * 30;
  // 主机灯带:开机白蓝呼吸,待机琥珀
  const led = world.anim.ledMats[0];
  if (on) {
    led.emissive.setHex(0xbcd0ff);
    led.emissiveIntensity = state.run.breath && !FREEZE ? 0.9 + Math.sin(t * 1.6) * 0.55 : 1.3;
  } else {
    led.emissive.setHex(0xffb454);
    led.emissiveIntensity = state.p > 0.9 ? 0.35 : 0;
  }
  // 手柄灯条
  world.anim.padLedMat.emissiveIntensity = on ? 0.8 + Math.sin(t * 2.2) * 0.3 : 0;
  // RGB 氛围灯
  const rgbOn = state.rgb;
  world.anim.rgbMats.forEach(m => {
    if (rgbOn) {
      _rgbC.setHSL((t * 0.05) % 1, 0.7, 0.55);
      m.emissive.copy(_rgbC);
      m.emissiveIntensity = 0.9 + state.nightV * 1.6;
    } else {
      m.emissiveIntensity = 0;
    }
  });
  // 灯光
  const g = GLOW[state.run.source];
  const flick = 1 + Math.sin(t * 6.7) * 0.09 + Math.sin(t * 13.1) * 0.05;
  const collapsed = 1 - state.explode;
  monLight.color.setHex(g.color);
  monLight.intensity = on && state.deskV > 0.5 ? g.int * (0.5 + state.nightV * 1.8) * flick * world.anim.screen.brightness * 2.2 : 0;
  conLight.intensity = on ? (0.15 + state.nightV * 0.35) * collapsed : 0;
}

/* ---------------- labels ---------------- */

const tagsBox = $('tags');
const leaders = $('leaders');

function makeTag(cn, en, cls, onClick) {
  const el = document.createElement('div');
  el.className = 'tag' + (cls ? ' ' + cls : '');
  el.innerHTML = `<b>${cn}</b><i>${en}</i>`;
  el.style.visibility = 'hidden';
  tagsBox.appendChild(el);
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('stroke', 'rgba(235,238,244,0.5)');
  line.setAttribute('stroke-width', '1');
  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('r', '2.6');
  dot.setAttribute('fill', '#f3f5f8');
  leaders.appendChild(line);
  leaders.appendChild(dot);
  if (onClick) el.addEventListener('click', onClick);
  return { el, line, dot, w: 120, h: 34, shown: false };
}

parts.forEach((p) => {
  p.tag = makeTag(p.cn, p.en, '', () => focusPart(p, true));
});
const unitTags = [
  { key: 'console', off: new THREE.Vector3(0, 0.42, 0.02), tag: makeTag('白夜五号 WN-5000', 'GAME CONSOLE', 'unit') },
];
requestAnimationFrame(() => {
  [...parts.map(p => p.tag), ...unitTags.map(u => u.tag)].forEach(t => {
    const r = t.el.getBoundingClientRect();
    t.w = r.width; t.h = r.height;
  });
});

const _pv = new THREE.Vector3();
function project(v3, out) {
  _pv.copy(v3).project(camera);
  out.x = (_pv.x * 0.5 + 0.5) * stage.clientWidth;
  out.y = (-_pv.y * 0.5 + 0.5) * stage.clientHeight;
  out.behind = _pv.z > 1;
  return out;
}

const placedRects = [];
function rectsOverlap(a, b) {
  return a.x < b.x + b.w + 6 && a.x + a.w + 6 > b.x && a.y < b.y + b.h + 4 && a.y + a.h + 4 > b.y;
}
function hideTag(t) {
  if (t.shown) {
    t.el.style.visibility = 'hidden';
    t.line.setAttribute('visibility', 'hidden');
    t.dot.setAttribute('visibility', 'hidden');
    t.shown = false;
  }
}
function showTag(t, cx, cy, ax, ay, hot) {
  t.el.style.visibility = 'visible';
  t.el.style.transform = `translate(${(cx - t.w / 2).toFixed(1)}px, ${(cy - t.h / 2).toFixed(1)}px)`;
  t.el.classList.toggle('hot', !!hot);
  const dx = ax - cx, dy = ay - cy;
  const tx = dx !== 0 ? (t.w / 2 + 2) / Math.abs(dx) : 1e9;
  const ty = dy !== 0 ? (t.h / 2 + 2) / Math.abs(dy) : 1e9;
  const k = Math.min(1, Math.min(tx, ty));
  t.line.setAttribute('x1', (cx + dx * k).toFixed(1));
  t.line.setAttribute('y1', (cy + dy * k).toFixed(1));
  t.line.setAttribute('x2', ax.toFixed(1));
  t.line.setAttribute('y2', ay.toFixed(1));
  t.line.setAttribute('visibility', 'visible');
  t.line.setAttribute('stroke', hot ? 'rgba(140,165,255,0.9)' : 'rgba(235,238,244,0.45)');
  t.dot.setAttribute('cx', ax.toFixed(1));
  t.dot.setAttribute('cy', ay.toFixed(1));
  t.dot.setAttribute('visibility', 'visible');
  t.dot.setAttribute('fill', hot ? '#8ca5ff' : '#f3f5f8');
  t.shown = true;
}

const _a2 = { x: 0, y: 0, behind: false }, _u2 = { x: 0, y: 0, behind: false };
function stepLabels() {
  placedRects.length = 0;
  const W = stage.clientWidth, H = stage.clientHeight;

  for (const u of unitTags) {
    const unit = world.units[u.key];
    const any = parts.some(p => p.unit === u.key && p.tl > 0.5);
    const ok = state.tags && any && !state.playing;
    if (!ok) { hideTag(u.tag); continue; }
    _v.copy(unit.group.position).add(u.off);
    project(_v, _a2);
    if (_a2.behind || _a2.x < -50 || _a2.x > W + 50) { hideTag(u.tag); continue; }
    const cx = _a2.x, cy = _a2.y - 46;
    showTag(u.tag, cx, cy, _a2.x, _a2.y, true);
    placedRects.push({ x: cx - u.tag.w / 2, y: cy - u.tag.h / 2, w: u.tag.w, h: u.tag.h });
  }

  const order = [...parts].sort((a, b) => {
    const pa = (a === state.focus ? 0 : a === state.hover ? 1 : a === state.active ? 2 : 3 + a.idx / 100);
    const pb = (b === state.focus ? 0 : b === state.hover ? 1 : b === state.active ? 2 : 3 + b.idx / 100);
    return pa - pb;
  });

  for (const p of order) {
    const priority = p === state.focus || p === state.hover || p === state.active;
    let ok;
    if (state.playing) ok = priority;
    else if (!state.tags) ok = priority && p.tl > 0;
    else {
      ok = (p.tl >= 0.999 || (p.tl > 0.6)) && p.fade > 0.5;
      if (ok && !priority && INNER_IDS.has(p.id) && state.explode < 0.15 && !state.cutaway) ok = false;
    }
    if (p === state.focus) ok = p.tl > 0;
    if (!ok || !p.group.visible) { hideTag(p.tag); continue; }

    p.group.getWorldPosition(_v).add(p.anchorOff);
    project(_v, _a2);
    if (_a2.behind || _a2.x < -80 || _a2.x > W + 80 || _a2.y < -60 || _a2.y > H + 60) { hideTag(p.tag); continue; }

    project(_v.copy(world.units.console.group.position).add(new THREE.Vector3(0, 0.05, 0)), _u2);
    let dx = _a2.x - _u2.x, dy = _a2.y - _u2.y;
    const dl = Math.hypot(dx, dy);
    if (dl < 4) { dx = 0.7; dy = -0.7; } else { dx /= dl; dy /= dl; }
    dy -= 0.25;

    const base = 54 + (p.idx % 5) * 24 + state.explode * 30;
    let placedOk = false, cx = 0, cy = 0;
    for (let k = 0; k < 6; k++) {
      cx = _a2.x + dx * (base + k * 30);
      cy = _a2.y + dy * (base + k * 30);
      cx = Math.max(p.tag.w / 2 + 4, Math.min(W - p.tag.w / 2 - 4, cx));
      cy = Math.max(p.tag.h / 2 + 4, Math.min(H - p.tag.h / 2 - 4, cy));
      const rect = { x: cx - p.tag.w / 2, y: cy - p.tag.h / 2, w: p.tag.w, h: p.tag.h };
      if (!placedRects.some(r => rectsOverlap(r, rect))) { placedRects.push(rect); placedOk = true; break; }
    }
    if (!placedOk && !priority) { hideTag(p.tag); continue; }
    showTag(p.tag, cx, cy, _a2.x, _a2.y, priority);
  }
}

/* ---------------- focus / dossier ---------------- */

const dossier = $('dossier');
let focusPulseMats = [];

function clearFocus() {
  focusPulseMats.forEach(m => { if (m.emissive) { m.emissive.setHex(0x000000); m.emissiveIntensity = 1; } });
  focusPulseMats = [];
  state.focus = null;
  dossier.classList.add('hidden');
  document.querySelectorAll('#partList li.active').forEach(li => li.classList.remove('active'));
}

function focusPart(p, fly) {
  clearFocus();
  state.focus = p;
  const skip = new Set([...world.anim.ledMats, world.anim.padLedMat, ...world.anim.rgbMats]);
  focusPulseMats = p.mats.filter(m => m.emissive && !skip.has(m));
  $('dNum').textContent = String(p.idx + 1).padStart(2, '0');
  $('dTitle').textContent = p.cn;
  $('dEn').textContent = p.en;
  $('dBlurb').textContent = p.blurb;
  $('dSpec').innerHTML = p.spec.split('·').map(s => `<span>${s.trim()}</span>`).join('');
  $('dIdx').textContent = `${p.idx + 1} / ${N}`;
  dossier.classList.remove('hidden');
  const li = document.querySelector(`#partList li[data-idx="${p.idx}"]`);
  if (li) { li.classList.add('active'); li.scrollIntoView({ block: 'nearest' }); }
  if (fly) {
    p.group.getWorldPosition(_v).add(p.anchorOff);
    const dir = camera.position.clone().sub(controls.target).normalize();
    const dist = Math.min(2.6, Math.max(0.35, p.radius * 3.6));
    tweenCam(_v.clone().addScaledVector(dir, dist), _v.clone(), 0.9);
  }
}

function stepFocusPulse(t) {
  if (!state.focus) return;
  const k = 0.10 + (Math.sin(t * 5.5) * 0.5 + 0.5) * 0.22;
  focusPulseMats.forEach(m => { m.emissive.setHex(0x6c8cff); m.emissiveIntensity = k; });
}

/* ---------------- raycast ---------------- */

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let downPos = null, hoverCooldown = 0;

renderer.domElement.addEventListener('pointerdown', (e) => { downPos = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]);
  downPos = null;
  if (moved < 5) {
    const p = pick(e);
    if (p) focusPart(p, true);
  }
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (hoverCooldown > 0) return;
  hoverCooldown = 0.07;
  const p = pick(e);
  state.hover = p;
  renderer.domElement.style.cursor = p ? 'pointer' : 'grab';
});

function pick(e) {
  const r = renderer.domElement.getBoundingClientRect();
  mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects(rayTargets, false);
  for (const h of hits) {
    const idx = h.object.userData.partIdx;
    if (idx === undefined) continue;
    const p = parts[idx];
    if (!p.group.visible || p.fade < 0.5 || p.tl <= 0) continue;
    return p;
  }
  return null;
}

/* ---------------- UI ---------------- */

const asmSlider = $('asmSlider'), asmPct = $('asmPct');
const expSlider = $('expSlider'), expPct = $('expPct');
const btnPlay = $('btnPlay');
const nowBuilding = $('nowBuilding');
const phaseToast = $('phaseToast');

function setProgress(v, fromSlider) {
  state.p = Math.max(0, Math.min(1, v));
  if (!fromSlider) asmSlider.value = Math.round(state.p * 1000);
  asmPct.textContent = Math.round(state.p * 100) + '%';
}
function setExplodeTarget(v, fromSlider) {
  state.explodeTarget = Math.max(0, Math.min(1, v));
  if (!fromSlider) expSlider.value = Math.round(state.explodeTarget * 1000);
  expPct.textContent = Math.round(state.explodeTarget * 100) + '%';
}

asmSlider.addEventListener('input', () => { setProgress(asmSlider.value / 1000, true); state.playing = false; updatePlayBtn(); });
expSlider.addEventListener('input', () => setExplodeTarget(expSlider.value / 1000, true));

function updatePlayBtn() {
  btnPlay.textContent = state.playing ? '⏸ 暂停' : (state.p >= 1 ? '▶ 重新组装' : state.p > 0 ? '▶ 继续' : '▶ 开始组装');
}
btnPlay.addEventListener('click', () => {
  if (state.playing) state.playing = false;
  else {
    if (state.p >= 1) setProgress(0);
    if (state.explodeTarget > 0) setExplodeTarget(0);
    state.playing = true;
  }
  updatePlayBtn();
});
$('btnReset').addEventListener('click', () => {
  state.playing = false;
  setProgress(0);
  setExplodeTarget(0);
  updatePlayBtn();
  tweenCam(...VIEWS.hero, 1.1);
});

$('speedSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  state.speed = parseFloat(b.dataset.s);
  [...$('speedSeg').querySelectorAll('button')].forEach(x => x.classList.toggle('on', x === b));
});

$('tglFollow').addEventListener('change', (e) => { state.follow = e.target.checked; });
$('tglTags').addEventListener('change', (e) => { state.tags = e.target.checked; });
$('tglCutaway').addEventListener('change', (e) => { state.cutaway = e.target.checked; });
$('tglDesk').addEventListener('change', (e) => { state.desk = !e.target.checked; });
$('tglNight').addEventListener('change', (e) => { state.night = e.target.checked; });
$('tglRGB').addEventListener('change', (e) => { state.rgb = e.target.checked; });
$('tglOrbit').addEventListener('change', (e) => { state.orbit = e.target.checked; controls.autoRotate = state.orbit; });

$('btnExplode').addEventListener('click', () => {
  const go = () => { setExplodeTarget(1); tweenCam(...VIEWS.explode, 1.3); };
  if (state.p < 1) {
    state.playing = false; updatePlayBtn();
    const from = state.p;
    tween(0.7, (e) => setProgress(from + (1 - from) * e), go);
  } else go();
});
$('btnCollapse').addEventListener('click', () => setExplodeTarget(0));
$('btnCam').addEventListener('click', () => tweenCam(...VIEWS.hero, 1.1));

// 开机
const btnPower = $('btnPower'), runPanel = $('runPanel'), runStat = $('runStat'), tOut = $('tOut');
function syncRunUI() {
  btnPower.classList.toggle('on', state.run.on);
  btnPower.textContent = state.run.on ? '⏻ 关机' : '⏻ 开机';
  runPanel.classList.toggle('hidden', !state.run.on);
  tOut.textContent = state.run.fan + '%';
  [...$('sourceSeg').querySelectorAll('button')].forEach(x => x.classList.toggle('on', x.dataset.m === state.run.source));
}
btnPower.addEventListener('click', () => {
  if (!state.run.on && state.p < 1) {
    const from = state.p;
    state.playing = false; updatePlayBtn();
    tween(0.8, (e) => setProgress(from + (1 - from) * e), () => {
      state.run.on = true; syncRunUI();
      tweenCam(...VIEWS.game, 1.4);
    });
  } else {
    state.run.on = !state.run.on;
    syncRunUI();
    if (state.run.on) tweenCam(...VIEWS.game, 1.4);
  }
});
$('sourceSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  state.run.source = b.dataset.m;
  syncRunUI();
});
$('tDown').addEventListener('click', () => { state.run.fan = Math.max(30, state.run.fan - 5); syncRunUI(); });
$('tUp').addEventListener('click', () => { state.run.fan = Math.min(100, state.run.fan + 5); syncRunUI(); });
$('tglBreath').addEventListener('change', (e) => { state.run.breath = e.target.checked; });

// 零件列表
const PHASE_EN = { '核心': 'CORE STACK', '散热与电源': 'THERMAL & POWER', '驱动与接口': 'DRIVE & I/O', '外壳': 'SHELL', '桌面': 'DESK SETUP' };
const listEl = $('partList');
let lastPhase = null;
parts.forEach((p) => {
  if (p.phase !== lastPhase) {
    lastPhase = p.phase;
    const head = document.createElement('li');
    head.className = 'phase-head';
    head.textContent = `${p.phase} · ${PHASE_EN[p.phase]}`;
    listEl.appendChild(head);
  }
  const li = document.createElement('li');
  li.dataset.idx = p.idx;
  li.innerHTML = `<i>${String(p.idx + 1).padStart(2, '0')}</i><span class="n">${p.cn}</span><em>${p.en}</em>`;
  li.addEventListener('click', () => focusPart(p, true));
  listEl.appendChild(li);
});
$('partCount').textContent = '× ' + N;

$('dClose').addEventListener('click', clearFocus);
$('dPrev').addEventListener('click', () => focusPart(parts[(state.focus.idx + N - 1) % N], true));
$('dNext').addEventListener('click', () => focusPart(parts[(state.focus.idx + 1) % N], true));

/* ---------------- follow & toast ---------------- */

const followTmp = new THREE.Vector3();
let toastTimer = 0;

function stepFollow(dt) {
  if (!(state.playing && state.follow && state.active)) return;
  const p = state.active;
  p.group.getWorldPosition(followTmp).add(p.anchorOff);
  // 目的地加权:镜头主要盯住零件即将安装的位置,而不是追着它飞
  const unit = world.units[p.unit];
  _v.copy(p.home).applyQuaternion(unit.group.quaternion).add(unit.group.position).add(p.anchorOff);
  followTmp.lerp(_v, 0.7);
  const sideX = p.explode.x >= 0 ? 1 : -1;
  const dist = Math.max(1.0, p.radius * 5.5);
  _v.set(sideX * 0.8, 0.45, 1.15).normalize().multiplyScalar(dist).add(followTmp);
  camera.position.lerp(_v, Math.min(1, dt * 2.2));
  controls.target.lerp(followTmp, Math.min(1, dt * 3.2));
}

function stepToast(dt) {
  if (state.playing && state.active) {
    toastTimer = 1.4;
    const p = state.active;
    phaseToast.innerHTML = `${p.phase} · 第 <b>${p.idx + 1}</b> / ${N} 件 · <b>${p.cn}</b> ${p.en}`;
    nowBuilding.innerHTML = `正在安装 <b>${String(p.idx + 1).padStart(2, '0')} ${p.cn}</b> · ${p.en}`;
  } else if (!state.playing) {
    if (state.p >= 1) nowBuilding.innerHTML = `整机装配完成 · ${N} 件就位`;
    else if (state.p === 0) nowBuilding.textContent = `尚未开始 · ${N} 件零件待装`;
    else nowBuilding.innerHTML = `装配暂停 · <b>${Math.round(state.p * 100)}%</b>`;
  }
  toastTimer -= dt;
  phaseToast.classList.toggle('show', toastTimer > 0);
}

/* ---------------- stats ---------------- */

let statTimer = 0;
function stepStats(dt, t) {
  statTimer -= dt;
  if (statTimer > 0) return;
  statTimer = 0.4;
  if (state.run.on) {
    const srcName = { home: '主界面', race: '《白夜传说》竞速', perf: '性能面板' }[state.run.source];
    const load = state.run.source === 'race' ? 1 : state.run.source === 'home' ? 0.4 : 0.7;
    const temp = Math.round(48 + load * 22 - (state.run.fan - 45) * 0.18 + Math.sin(t * 0.5) * 1.5);
    const w = Math.round(90 + load * 118 + Math.sin(t * 0.8) * 6);
    const rpm = Math.round(state.run.fan * 52);
    const db = (24 + state.run.fan * 0.14).toFixed(0);
    runStat.innerHTML = `画面 <b>${srcName}</b> · 功耗 <b>${w} W</b><br>SoC <b>${temp} ℃</b> · 风扇 <b>${rpm} rpm</b> · 噪音 ≈<b>${db} dB</b>`;
  }
  document.querySelectorAll('#partList li[data-idx]').forEach(li => {
    const p = parts[+li.dataset.idx];
    li.style.opacity = p.tl >= 1 ? 1 : p.tl > 0 ? 0.85 : 0.45;
  });
}

/* ---------------- resize ---------------- */

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();

/* ---------------- URL params ---------------- */

function applyParams() {
  if (Q.has('p')) setProgress(parseFloat(Q.get('p')));
  if (Q.has('x')) setExplodeTarget(parseFloat(Q.get('x')));
  state.explode = state.explodeTarget;
  if (Q.has('labels')) state.tags = Q.get('labels') !== '0';
  $('tglTags').checked = state.tags;
  if (Q.get('cut') === '1') { state.cutaway = true; $('tglCutaway').checked = true; }
  if (Q.get('nodesk') === '1') { state.desk = false; $('tglDesk').checked = true; }
  if (Q.get('night') === '1') { state.night = true; $('tglNight').checked = true; }
  if (Q.get('rgb') === '0') { state.rgb = false; $('tglRGB').checked = false; }
  if (Q.has('run')) {
    state.run.on = true;
    const s = Q.get('run');
    if (['home', 'race', 'perf'].includes(s)) state.run.source = s;
    setProgress(1);
    syncRunUI();
  }
  if (Q.get('play') === '1') state.playing = true;
  const v = VIEWS[Q.get('view')];
  if (v) { camera.position.copy(v[0]); controls.target.copy(v[1]); }
  if (SHOT) $('hint').style.display = 'none';
  const warm = parseFloat(Q.get('warm') || 0);
  for (let i = 0; i < warm * 60; i++) {
    const d = 1 / 60;
    simT += d;
    if (state.playing) setProgress(state.p + d * state.speed / TOTAL_T);
    stepTweens(d);
    applyParts();
    stepFades(d);
    stepMachine(d, simT);
    stepEnv(d);
    stepFx(simT);
    stepFollow(d);
    stepToast(d);
  }
}

/* ---------------- main loop ---------------- */

const clock = new THREE.Clock();
let simT = 0;
let shotImgPending = Q.has('shotimg');

function frame() {
  requestAnimationFrame(frame);
  try {
    frameBody();
  } catch (err) {
    if (DIAG) diagMsg('FRAME ERR: ' + err.message + '\n' + (err.stack || '').split('\n').slice(0, 4).join('\n'));
    throw err;
  }
}
function frameBody() {
  let dt = Math.min(0.05, clock.getDelta());
  if (FREEZE) dt = 0;
  simT += dt;
  hoverCooldown -= dt;

  if (state.playing && !FREEZE) {
    setProgress(state.p + dt * state.speed / TOTAL_T);
    if (state.p >= 1) {
      state.playing = false;
      updatePlayBtn();
      if (state.follow) tweenCam(...VIEWS.hero, 1.6);
    }
  }

  const es = FREEZE ? 1 : Math.min(1, dt * 7);
  state.explode += (state.explodeTarget - state.explode) * es;
  if (Math.abs(state.explode - state.explodeTarget) < 0.002) state.explode = state.explodeTarget;

  stepTweens(dt);
  applyParts();
  stepFades(dt);
  stepMachine(dt, simT);
  stepEnv(dt);
  stepFx(simT);
  stepFollow(dt);
  stepCamTween(dt);
  stepFocusPulse(simT);
  stepToast(dt);
  stepStats(dt, simT);
  controls.update();
  stepLabels();
  renderer.render(scene, camera);
  if (shotImgPending && renderer.info.render.frame > 2) {
    shotImgPending = false;
    const img = document.createElement('img');
    img.src = renderer.domElement.toDataURL('image/png');
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:2;';
    stage.insertBefore(img, $('leaders'));
  }
  if (DIAG && renderer.info.render.frame % 30 === 5) {
    const r = renderer.info.render;
    diagMsg(`tri ${r.triangles} calls ${r.calls}\ncam ${camera.position.toArray().map(v => v.toFixed(2))}\nvisible ${parts.filter(p => p.group.visible).length}/${N} p=${state.p}`);
  }
}

applyParams();
applyParts();
stepFades(1);
stepEnv(1);
stepMachine(0, simT);
updatePlayBtn();
syncRunUI();
frame();

if (!SHOT) {
  setTimeout(() => {
    if (!state.playing && state.p === 0) { state.playing = true; updatePlayBtn(); }
  }, 900);
  setTimeout(() => { $('hint').style.opacity = '0'; }, 9000);
}
