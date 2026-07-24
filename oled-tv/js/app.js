// 极夜 OLED 电视 · 装配 / 爆炸图 / 观影演示
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
scene.fog = new THREE.Fog(0xdfe9f2, 11, 32);

const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 120);
camera.position.set(2.4, 1.75, 3.4);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.95, 0.3);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.4;
controls.maxDistance = 16;
controls.maxPolarAngle = 1.58;
controls.autoRotateSpeed = 0.9;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;
RectAreaLightUniformsLib.init();

/* ---------------- lights ---------------- */

const dirLight = new THREE.DirectionalLight(0xfff2e0, 2.6);
dirLight.position.set(3.4, 5.0, 3.6);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
Object.assign(dirLight.shadow.camera, { left: -3.6, right: 3.6, top: 3.6, bottom: -1.5, near: 1, far: 16 });
dirLight.shadow.camera.updateProjectionMatrix();
dirLight.shadow.bias = -0.0003;
dirLight.shadow.normalBias = 0.02;
scene.add(dirLight, dirLight.target);

const fillLight = new THREE.DirectionalLight(0xdbe8ff, 0.5);
fillLight.position.set(-2.8, 2.6, 2.8);
scene.add(fillLight);

const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x8f857a, 0.45);
scene.add(hemi);

// 屏幕面光(开机后照亮房间)
const screenLight = new THREE.RectAreaLight(0x9fe8dc, 0, 1.41, 0.80);
screenLight.position.set(0, 0.98, -0.13);
screenLight.lookAt(0, 0.80, 3.0);
scene.add(screenLight);

// 氛围灯(电视背后的墙面光晕)
const biasLight = new THREE.PointLight(0x2fd6b5, 0, 2.2, 1.6);
biasLight.position.set(0, 1.05, -0.36);
scene.add(biasLight);

// 落地灯(夜晚)
const lampLight = new THREE.PointLight(0xffd9a0, 0, 5, 1.8);
scene.add(lampLight);

/* ---------------- sky & clouds ---------------- */

const SKY = {
  dayTop: new THREE.Color(0x82b4e6), dayBot: new THREE.Color(0xeef4f8),
  nightTop: new THREE.Color(0x070d1e), nightBot: new THREE.Color(0x1a2438),
  rainTop: new THREE.Color(0x8a99a8), rainBot: new THREE.Color(0xcfd6dc),
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

function cloudSprite() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 64;
  const g = c.getContext('2d');
  for (const [x, y, r] of [[36, 40, 20], [64, 32, 26], [92, 42, 18], [56, 46, 20]]) {
    const gr = g.createRadialGradient(x, y, 2, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,0.85)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 128, 64);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.SpriteMaterial({ map: t, transparent: true, opacity: 0.5, depthWrite: false, fog: false });
  return new THREE.Sprite(m);
}
const clouds = [];
[[-7, 5.4, -9, 4.4], [4, 6.4, -11, 5.6], [9, 4.8, -6, 3.6], [-9, 6.0, -4, 4.8]].forEach(([x, y, z, s]) => {
  const sp = cloudSprite();
  sp.position.set(x, y, z);
  sp.scale.set(s, s * 0.42, 1);
  scene.add(sp);
  clouds.push(sp);
});

/* ---------------- world ---------------- */

const world = buildWorld();
scene.add(world.root);
const parts = world.parts;
const N = parts.length;
lampLight.position.copy(world.env.lampPos);

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
  if (p.sub) p.sub.forEach(s => { s.home = s.obj.position.clone(); });
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
  tags: true, cutaway: false, furniture: true, night: false, rain: false, orbit: false,
  run: { on: false, source: 'demo', vol: 12, bias: true },
  focus: null, hover: null, active: null,
  nightV: 0, rainV: 0, furnV: 1,
};

const CUT_IDS = new Set(['tv-back', 'tv-portcover']);
// 整机收拢时藏在壳体内的零件
const INNER_IDS = new Set(['tv-cof', 'tv-tcon', 'tv-graphite', 'tv-backplate', 'tv-psu', 'tv-main', 'tv-wifi', 'tv-ir', 'tv-speakers', 'tv-woofer']);

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
  hero: [new THREE.Vector3(2.4, 1.75, 3.4), new THREE.Vector3(0, 0.95, 0.3)],
  explode: [new THREE.Vector3(3.5, 2.6, 4.0), new THREE.Vector3(0.1, 1.40, 0.45)],
  front: [new THREE.Vector3(0.05, 1.1, 2.85), new THREE.Vector3(0, 0.95, -0.1)],
  watch: [new THREE.Vector3(0.45, 1.25, 3.1), new THREE.Vector3(0, 0.92, -0.12)],
  boards: [new THREE.Vector3(2.0, 1.35, 1.5), new THREE.Vector3(0.15, 0.85, -0.12)],
  top: [new THREE.Vector3(0.7, 4.6, 1.6), new THREE.Vector3(0.1, 0.6, 0.6)],
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
    if (p.sub) p.sub.forEach(s => s.obj.position.copy(s.home).addScaledVector(s.vec, ex));
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
  const ft = state.furniture ? 1 : 0.07;
  state.furnV += Math.max(-spd, Math.min(spd, ft - state.furnV));
  world.env.furnitureMats.forEach(m => fadeMat(m, state.furnV));
}

/* ---------------- rain & signal dots ---------------- */

function makeStreakTex() {
  const c = document.createElement('canvas');
  c.width = 32; c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 64);
  gr.addColorStop(0, 'rgba(255,255,255,0)');
  gr.addColorStop(0.5, 'rgba(255,255,255,0.9)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(13, 0, 6, 64);
  return new THREE.CanvasTexture(c);
}
const RAIN_N = 600;
const rainPos = new Float32Array(RAIN_N * 3);
for (let i = 0; i < RAIN_N; i++) {
  rainPos[i * 3] = -2.1 + Math.random() * 1.8;
  rainPos[i * 3 + 1] = Math.random() * 2.7;
  rainPos[i * 3 + 2] = -1.5 + Math.random() * 0.85;
}
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainMat = new THREE.PointsMaterial({
  map: makeStreakTex(), size: 0.06, transparent: true, opacity: 0,
  depthWrite: false, color: 0xd8e2ea, sizeAttenuation: true,
});
const rain = new THREE.Points(rainGeo, rainMat);
rain.frustumCulled = false;
rain.visible = false;
scene.add(rain);

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
const SIG_N = 26;
const sigPos = new Float32Array(SIG_N * 3);
const sigGeo = new THREE.BufferGeometry();
sigGeo.setAttribute('position', new THREE.BufferAttribute(sigPos, 3));
const sigMat = new THREE.PointsMaterial({
  map: makeDotTex(), size: 0.026, transparent: true, opacity: 0.9,
  depthWrite: false, color: 0x2fd6b5, sizeAttenuation: true, blending: THREE.AdditiveBlending,
});
const sigDots = new THREE.Points(sigGeo, sigMat);
sigDots.frustumCulled = false;
sigDots.visible = false;
scene.add(sigDots);
const _sv = new THREE.Vector3();

function stepFx(dt, t) {
  rain.visible = state.rainV > 0.02;
  rainMat.opacity = 0.6 * state.rainV;
  if (rain.visible && !FREEZE) {
    for (let i = 0; i < RAIN_N; i++) {
      let y = rainPos[i * 3 + 1] - dt * 3.4;
      if (y < 0.02) y = 2.7;
      rainPos[i * 3 + 1] = y;
    }
    rainGeo.attributes.position.needsUpdate = true;
  }
  const showSig = state.run.on && state.run.source === 'game' && state.p > 0.98 && state.explode < 0.1;
  sigDots.visible = showSig;
  if (showSig) {
    for (let i = 0; i < SIG_N; i++) {
      let u = (i / SIG_N + t * 0.25) % 1;
      world.anim.hdmiCurve.getPointAt(u, _sv);
      sigPos.set([_sv.x, _sv.y, _sv.z], i * 3);
    }
    sigGeo.attributes.position.needsUpdate = true;
  }
}

/* ---------------- environment (night / rain) ---------------- */

const fogDay = new THREE.Color(0xdfe9f2), fogNight = new THREE.Color(0x10141f);
const dirDay = new THREE.Color(0xfff2e0), dirNight = new THREE.Color(0x8fa8cc);
const cityDay = new THREE.Color(0x8fa2b5), cityNight = new THREE.Color(0xffffff);
const _c1 = new THREE.Color(), _c2 = new THREE.Color();

function stepEnv(dt) {
  const spd = FREEZE ? 1e9 : dt * 3;
  state.nightV += Math.max(-spd, Math.min(spd, (state.night ? 1 : 0) - state.nightV));
  state.rainV += Math.max(-spd, Math.min(spd, (state.rain ? 1 : 0) - state.rainV));
  const nv = state.nightV, rv = state.rainV;

  dirLight.intensity = (2.6 - rv * 1.1) * (1 - nv * 0.94);
  dirLight.color.lerpColors(dirDay, dirNight, nv);
  fillLight.intensity = 0.5 * (1 - nv * 0.85);
  hemi.intensity = 0.45 * (1 - nv * 0.85) * (1 - rv * 0.3);
  scene.environmentIntensity = 0.5 * (1 - nv * 0.85);
  renderer.toneMappingExposure = 1.1 - nv * 0.08;

  lampLight.intensity = nv * 1.3;
  world.env.lampShadeMat.emissiveIntensity = nv * 0.9;
  world.env.cityMat.color.lerpColors(cityDay, cityNight, nv);

  _c1.copy(SKY.dayTop).lerp(SKY.rainTop, rv * 0.75).lerp(SKY.nightTop, nv);
  _c2.copy(SKY.dayBot).lerp(SKY.rainBot, rv * 0.75).lerp(SKY.nightBot, nv);
  skyUni.uTop.value.copy(_c1);
  skyUni.uBot.value.copy(_c2);
  scene.fog.color.lerpColors(fogDay, fogNight, nv);
  clouds.forEach((c, i) => {
    c.material.opacity = (0.5 - rv * 0.2) * (1 - nv * 0.9);
    if (!FREEZE) {
      c.position.x += dt * (0.06 + i * 0.015);
      if (c.position.x > 14) c.position.x = -14;
    }
  });
}

/* ---------------- TV runtime ---------------- */

const GLOW = {
  demo: { color: 0x63e0c8, int: 1.6 },
  bars: { color: 0xf2f4f0, int: 3.0 },
  game: { color: 0xc98cff, int: 2.1 },
};
let screenAcc = 0, sbAcc = 0;

function stepTV(dt, t) {
  const on = state.run.on && state.p > 0.98;
  screenAcc -= dt; sbAcc -= dt;
  if (screenAcc <= 0) {
    screenAcc = state.run.source === 'bars' && on ? 0.25 : 0.045;
    world.anim.screen.draw(on, state.run.source, t);
  }
  if (sbAcc <= 0) {
    sbAcc = 0.1;
    world.anim.soundbar.draw(on, t, state.run.vol);
  }
  const g = GLOW[state.run.source];
  const flick = 1 + Math.sin(t * 6.7) * 0.10 + Math.sin(t * 13.1) * 0.06;
  const collapsed = 1 - state.explode;
  screenLight.color.setHex(g.color);
  screenLight.intensity = on ? g.int * (0.5 + state.nightV * 1.6) * flick * collapsed : 0;
  biasLight.intensity = (on && state.run.bias) ? (0.5 + state.nightV * 1.2) * (1 + Math.sin(t * 1.8) * 0.25) * collapsed : 0;
  world.anim.standbyLedMat.emissiveIntensity = (!on && state.p > 0.9) ? (0.7 + Math.sin(t * 2.5) * 0.4) : 0;
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
  { key: 'tv', off: new THREE.Vector3(0, 0.64, 0.02), tag: makeTag('极夜 OLED65X9', 'OLED TV', 'unit') },
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
  t.line.setAttribute('stroke', hot ? 'rgba(58,226,192,0.9)' : 'rgba(235,238,244,0.45)');
  t.dot.setAttribute('cx', ax.toFixed(1));
  t.dot.setAttribute('cy', ay.toFixed(1));
  t.dot.setAttribute('visibility', 'visible');
  t.dot.setAttribute('fill', hot ? '#3ae2c0' : '#f3f5f8');
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

    project(_v.copy(world.units.tv.group.position).add(new THREE.Vector3(0, 0.05, 0)), _u2);
    let dx = _a2.x - _u2.x, dy = _a2.y - _u2.y;
    const dl = Math.hypot(dx, dy);
    if (dl < 4) { dx = 0.7; dy = -0.7; } else { dx /= dl; dy /= dl; }
    dy -= 0.25;

    const base = 56 + (p.idx % 5) * 24 + state.explode * 30;
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
  focusPulseMats = p.mats.filter(m => m.emissive && m !== world.anim.standbyLedMat && m !== world.anim.consoleLedMat);
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
    const dist = Math.min(3.4, Math.max(0.5, p.radius * 3.4));
    tweenCam(_v.clone().addScaledVector(dir, dist), _v.clone(), 0.9);
  }
}

function stepFocusPulse(t) {
  if (!state.focus) return;
  const k = 0.10 + (Math.sin(t * 5.5) * 0.5 + 0.5) * 0.22;
  focusPulseMats.forEach(m => { m.emissive.setHex(0x2fd6b5); m.emissiveIntensity = k; });
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
$('tglFurniture').addEventListener('change', (e) => { state.furniture = !e.target.checked; });
$('tglNight').addEventListener('change', (e) => { state.night = e.target.checked; });
$('tglRain').addEventListener('change', (e) => { state.rain = e.target.checked; });
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

// 观影模式
const btnPower = $('btnPower'), runPanel = $('runPanel'), runStat = $('runStat'), tOut = $('tOut');
function syncRunUI() {
  btnPower.classList.toggle('on', state.run.on);
  btnPower.textContent = state.run.on ? '⏻ 关机' : '⏻ 开机观影';
  runPanel.classList.toggle('hidden', !state.run.on);
  tOut.textContent = String(state.run.vol);
  [...$('sourceSeg').querySelectorAll('button')].forEach(x => x.classList.toggle('on', x.dataset.m === state.run.source));
}
btnPower.addEventListener('click', () => {
  if (!state.run.on && state.p < 1) {
    const from = state.p;
    state.playing = false; updatePlayBtn();
    tween(0.8, (e) => setProgress(from + (1 - from) * e), () => {
      state.run.on = true; syncRunUI();
      tweenCam(...VIEWS.watch, 1.4);
    });
  } else {
    state.run.on = !state.run.on;
    syncRunUI();
    if (state.run.on) tweenCam(...VIEWS.watch, 1.4);
  }
});
$('sourceSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  state.run.source = b.dataset.m;
  syncRunUI();
});
$('tDown').addEventListener('click', () => { state.run.vol = Math.max(0, state.run.vol - 1); world.anim.screen.osd(state.run.vol, simT + 1.6); syncRunUI(); });
$('tUp').addEventListener('click', () => { state.run.vol = Math.min(30, state.run.vol + 1); world.anim.screen.osd(state.run.vol, simT + 1.6); syncRunUI(); });
$('tglBias').addEventListener('change', (e) => { state.run.bias = e.target.checked; });

// 零件列表
const PHASE_EN = { '屏幕': 'PANEL STACK', '电路': 'ELECTRONICS', '声学': 'AUDIO', '整机': 'ENCLOSURE', '客厅': 'LIVING ROOM' };
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
  const sideX = (p.home.x + p.anchorOff.x) >= 0 ? 1 : -1;
  const dist = Math.max(1.7, p.radius * 5);
  _v.set(sideX * 0.7, 0.5, 1.3).normalize().multiplyScalar(dist).add(followTmp);
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

/* ---------------- stats ticker ---------------- */

let statTimer = 0;
function stepStats(dt, t) {
  statTimer -= dt;
  if (statTimer > 0) return;
  statTimer = 0.4;
  if (state.run.on) {
    const srcName = { demo: 'OLED 演示', bars: '信号发生器', game: 'HDMI 1 · 游戏主机' }[state.run.source];
    const w = Math.round((state.run.source === 'bars' ? 320 : 210) + Math.sin(t * 0.9) * 18);
    const temp = Math.round(38 + Math.sin(t * 0.4) * 2);
    runStat.innerHTML = `信号 <b>${srcName}</b> · 3840×2160 120Hz<br>面板 <b>${temp} ℃</b> · 整机功耗 <b>${w} W</b> · 音量 <b>${state.run.vol}</b>`;
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
  if (Q.get('nofurn') === '1') { state.furniture = false; $('tglFurniture').checked = true; }
  if (Q.get('night') === '1') { state.night = true; $('tglNight').checked = true; }
  if (Q.get('rain') === '1') { state.rain = true; $('tglRain').checked = true; }
  if (Q.has('run')) {
    state.run.on = true;
    const s = Q.get('run');
    if (['demo', 'bars', 'game'].includes(s)) state.run.source = s;
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
    stepTV(d, simT);
    stepEnv(d);
    stepFx(d, simT);
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
  stepTV(dt, simT);
  stepEnv(dt);
  stepFx(dt, simT);
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
stepTV(0, simT);
updatePlayBtn();
syncRunUI();
frame();

if (!SHOT) {
  setTimeout(() => {
    if (!state.playing && state.p === 0) { state.playing = true; updatePlayBtn(); }
  }, 900);
  setTimeout(() => { $('hint').style.opacity = '0'; }, 9000);
}
