// 北极风空调 · 装配 / 爆炸图 / 运行演示
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
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
renderer.toneMappingExposure = 1.12;
stage.prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xdfe9f2, 10, 30);

const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 120);
camera.position.set(2.9, 2.15, 3.6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0.15, 1.25, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 0.4;
controls.maxDistance = 16;
controls.maxPolarAngle = 1.58;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.55;

/* ---------------- lights ---------------- */

const dirLight = new THREE.DirectionalLight(0xfff2e0, 2.8);
dirLight.position.set(3.2, 5.2, 4.0);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
Object.assign(dirLight.shadow.camera, { left: -3.4, right: 3.4, top: 3.6, bottom: -1.5, near: 1, far: 16 });
dirLight.shadow.camera.updateProjectionMatrix();
dirLight.shadow.bias = -0.0003;
dirLight.shadow.normalBias = 0.02;
scene.add(dirLight, dirLight.target);

const fillLight = new THREE.DirectionalLight(0xdbe8ff, 0.55);
fillLight.position.set(-2.6, 3.0, -3.6);
scene.add(fillLight);

const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x8f857a, 0.5);
scene.add(hemi);

const roomLight = new THREE.PointLight(0xffd9a8, 0, 7, 1.8);
roomLight.position.set(1.3, 2.2, 1.2);
scene.add(roomLight);

/* ---------------- sky & clouds ---------------- */

const SKY = {
  dayTop: new THREE.Color(0x82b4e6), dayBot: new THREE.Color(0xeef4f8),
  nightTop: new THREE.Color(0x0a1226), nightBot: new THREE.Color(0x1d2940),
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
  const m = new THREE.SpriteMaterial({ map: t, transparent: true, opacity: 0.55, depthWrite: false, fog: false });
  return new THREE.Sprite(m);
}
const clouds = [];
[[-6, 5.2, -9, 4.4], [4, 6.4, -11, 5.6], [9, 4.6, -6, 3.6], [-9, 5.8, -4, 4.8], [1, 7, -14, 6.4]].forEach(([x, y, z, s]) => {
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

const DUR = 0.085;
const STEP = (1 - DUR) / (N - 1);
const TOTAL_T = 36; // 1 倍速走完的秒数

parts.forEach((p, i) => {
  const len = p.explode.length();
  const dir = len > 0.01 ? p.explode.clone().normalize() : new THREE.Vector3(0.15, 0.9, 0.35).normalize();
  p.flyFrom = dir.multiplyScalar(1.15 + len * 0.45);
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
world.env.wallMats.forEach(m => {
  m.userData.baseOpacity = m.opacity;
  m.userData.baseTransparent = m.transparent;
});

const rayTargets = [];
parts.forEach(p => p.group.traverse(o => { if (o.isMesh) rayTargets.push(o); }));

/* ---------------- state ---------------- */

const state = {
  p: 0, playing: false, speed: 1, follow: true,
  explode: 0, explodeTarget: 0,
  tags: true, cutaway: false, ghost: false, night: false, rain: false, orbit: false,
  run: { on: false, mode: 'cool', temp: 26, swing: true },
  focus: null, hover: null, active: null,
  nightV: 0, rainV: 0, ghostV: 1,
  louverAngle: 0.85, crossSpd: 0, axialSpd: 0,
};

const CUT_IDS = new Set(['in-front', 'in-filter', 'in-energy', 'in-display', 'ou-top', 'ou-front', 'ou-grille', 'ou-side', 'ou-guard']);
// 整机收拢时藏在壳体内、标签无意义的零件
const INNER_IDS = new Set(['ou-comp', 'ou-part', 'ou-4way', 'ou-fanmotor', 'ou-pcb', 'ou-cond', 'ou-base',
  'in-plate', 'in-evap', 'in-fan', 'in-fanmotor', 'in-ctrl', 'in-drainpan', 'mt-sleeve']);

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
  hero: [new THREE.Vector3(2.9, 2.15, 3.6), new THREE.Vector3(0.15, 1.25, 0)],
  explode: [new THREE.Vector3(5.0, 2.75, 3.2), new THREE.Vector3(0.30, 1.30, -0.05)],
  indoor: [new THREE.Vector3(0.5, 2.3, 2.2), new THREE.Vector3(-0.52, 1.85, 0.2)],
  outdoor: [new THREE.Vector3(2.2, 1.4, -2.4), new THREE.Vector3(0.55, 1.0, -0.3)],
  top: [new THREE.Vector3(0.7, 5.6, 1.0), new THREE.Vector3(0.3, 0.8, -0.2)],
};

/* ---------------- assembly / explode transforms ---------------- */

const _v = new THREE.Vector3();
const _q = new THREE.Quaternion();
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function applyParts(t) {
  const ex = state.explode;
  for (const key of ['indoor', 'outdoor']) {
    const u = world.units[key];
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
      _q.setFromAxisAngle(p.settleAxis, 0.38 * (1 - e));
      p.group.quaternion.copy(p.homeQuat).multiply(_q);
      const s = 0.72 + 0.28 * e;
      p.group.scale.setScalar(s);
      if (state.playing) active = p;
    } else {
      p.group.quaternion.copy(p.homeQuat);
      p.group.scale.setScalar(1);
    }
    if (p.id === 'ou-comp' && state.run.on && !FREEZE) _v.y += Math.sin(t * 82) * 0.0007;
    p.group.position.copy(_v);
    if (p.sub) p.sub.forEach(s => s.obj.position.copy(s.home).addScaledVector(s.vec, ex));
  }
  state.active = active;
}

/* ---------------- fade helpers ---------------- */

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
  const gt = (state.ghost || state.explode > 0.12) ? 0.16 : 1;
  state.ghostV += Math.max(-spd, Math.min(spd, gt - state.ghostV));
  world.env.wallMats.forEach(m => fadeMat(m, state.ghostV));
}

/* ---------------- particles ---------------- */

function makePuffTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, 'rgba(255,255,255,0.9)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
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
const puffTex = makePuffTex();

class Puffs {
  constructor(n, color, baseAlpha, tex = puffTex) {
    this.n = n;
    this.pos = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    this.maxLife = new Float32Array(n);
    this.alpha = new Float32Array(n);
    this.size = new Float32Array(n);
    this.cursor = 0; this.acc = 0;
    this.baseAlpha = baseAlpha;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.alpha, 1));
    geo.setAttribute('aSize', new THREE.BufferAttribute(this.size, 1));
    this.uni = { uTex: { value: tex }, uColor: { value: new THREE.Color(color) }, uScale: { value: 1000 } };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uni, transparent: true, depthWrite: false,
      vertexShader: `attribute float aAlpha; attribute float aSize; varying float vA; uniform float uScale;
        void main(){ vA = aAlpha; vec4 mv = modelViewMatrix*vec4(position,1.0);
          gl_PointSize = aSize*uScale/max(0.1,-mv.z); gl_Position = projectionMatrix*mv; }`,
      fragmentShader: `uniform sampler2D uTex; uniform vec3 uColor; varying float vA;
        void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(uColor, t.a*vA); }`,
    });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 10;
    scene.add(this.points);
  }
  spawn(p, v, life, size) {
    const i = this.cursor;
    this.cursor = (i + 1) % this.n;
    this.pos.set([p.x, p.y, p.z], i * 3);
    this.vel.set([v.x, v.y, v.z], i * 3);
    this.life[i] = 0.0001;
    this.maxLife[i] = life;
    this.size[i] = size;
  }
  update(dt, accel) {
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) { this.alpha[i] = 0; continue; }
      this.life[i] += dt;
      const f = this.life[i] / this.maxLife[i];
      if (f >= 1) { this.life[i] = 0; this.alpha[i] = 0; continue; }
      const j = i * 3;
      if (accel) accel(this.vel, j, dt, f, this.pos);
      this.pos[j] += this.vel[j] * dt;
      this.pos[j + 1] += this.vel[j + 1] * dt;
      this.pos[j + 2] += this.vel[j + 2] * dt;
      this.alpha[i] = Math.sin(Math.PI * f) * this.baseAlpha;
    }
    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.aAlpha.needsUpdate = true;
    this.points.geometry.attributes.aSize.needsUpdate = true;
  }
}

const flowIn = new Puffs(560, 0x8ec9f0, 0.30);
const flowOut = new Puffs(320, 0xffb185, 0.24);

// 雨
const RAIN_N = 750;
const rainPos = new Float32Array(RAIN_N * 3);
for (let i = 0; i < RAIN_N; i++) {
  rainPos[i * 3] = -1.4 + Math.random() * 3.4;
  rainPos[i * 3 + 1] = Math.random() * 2.9;
  rainPos[i * 3 + 2] = -2.35 + Math.random() * 2.15;
}
const rainGeo = new THREE.BufferGeometry();
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rainMat = new THREE.PointsMaterial({
  map: makeStreakTex(), size: 0.065, transparent: true, opacity: 0,
  depthWrite: false, color: 0xd8e2ea, sizeAttenuation: true,
});
const rain = new THREE.Points(rainGeo, rainMat);
rain.frustumCulled = false;
rain.visible = false;
scene.add(rain);

// 冷媒流动指示
const REF_N = 46;
const refPos = new Float32Array(REF_N * 3);
const refGeo = new THREE.BufferGeometry();
refGeo.setAttribute('position', new THREE.BufferAttribute(refPos, 3));
const refMat = new THREE.PointsMaterial({
  map: puffTex, size: 0.03, transparent: true, opacity: 0.9,
  depthWrite: false, color: 0x66e0ff, sizeAttenuation: true, blending: THREE.AdditiveBlending,
});
const refDots = new THREE.Points(refGeo, refMat);
refDots.frustumCulled = false;
refDots.visible = false;
scene.add(refDots);

const _e1 = new THREE.Vector3(), _e2 = new THREE.Vector3();
function stepParticles(dt, t) {
  if (state.run.on && !FREEZE && state.p > 0.98) {
    // 室内出风
    flowIn.acc += dt * 210;
    const em = world.emitters.indoor;
    while (flowIn.acc > 1) {
      flowIn.acc--;
      _e1.lerpVectors(em.a, em.b, Math.random());
      em.obj.localToWorld(_e1);
      const heat = state.run.mode === 'heat';
      const spd = 0.9 + Math.random() * 0.5;
      _e2.set((Math.random() - 0.5) * 0.25, heat ? -1.0 : -0.3 + (Math.random() - 0.5) * 0.1, heat ? 0.75 : 1.15).multiplyScalar(spd);
      flowIn.spawn(_e1, _e2, 2.2 + Math.random() * 1.2, 0.042 + Math.random() * 0.02);
    }
    // 室外排风
    flowOut.acc += dt * 130;
    const eo = world.emitters.outdoor;
    while (flowOut.acc > 1) {
      flowOut.acc--;
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * eo.r;
      _e1.copy(eo.c); _e1.x += Math.cos(a) * r; _e1.y += Math.sin(a) * r;
      eo.obj.localToWorld(_e1);
      _e2.set(Math.cos(a) * 0.15, Math.sin(a) * 0.15, -1.4 - Math.random() * 0.5);
      flowOut.spawn(_e1, _e2, 1.4 + Math.random() * 0.6, 0.05 + Math.random() * 0.02);
    }
  }
  const heat = state.run.mode === 'heat';
  flowIn.uni.uColor.value.setHex(heat ? 0xffa268 : 0x74bdee);
  flowOut.uni.uColor.value.setHex(heat ? 0x8fc6f5 : 0xffab77);
  flowIn.update(dt, (vel, j, d, f, pos) => {
    if (pos[j + 1] < 0.10 && !heat) {
      vel[j + 1] = 0;
      vel[j] *= 0.955; vel[j + 2] *= 0.955;
    } else {
      vel[j + 1] += (heat ? (f > 0.3 ? 0.55 : 0) : -0.55) * d;
    }
  });
  flowOut.update(dt);

  // 雨
  rain.visible = state.rainV > 0.02;
  rainMat.opacity = 0.62 * state.rainV;
  if (rain.visible && !FREEZE) {
    for (let i = 0; i < RAIN_N; i++) {
      let y = rainPos[i * 3 + 1] - dt * 3.4;
      if (y < 0.03) y = 2.9;
      rainPos[i * 3 + 1] = y;
    }
    rainGeo.attributes.position.needsUpdate = true;
  }

  // 冷媒流
  const showRef = state.run.on && state.p > 0.98;
  refDots.visible = showRef;
  if (showRef) {
    refMat.color.setHex(heat ? 0xffa060 : 0x66e0ff);
    const dir = heat ? -1 : 1;
    const curve = world.emitters.pipeCurve;
    for (let i = 0; i < REF_N; i++) {
      let u = (i / REF_N + dir * t * 0.05) % 1;
      if (u < 0) u += 1;
      curve.getPointAt(u, _e1);
      refPos.set([_e1.x, _e1.y, _e1.z], i * 3);
    }
    refGeo.attributes.position.needsUpdate = true;
  }
}

/* ---------------- environment (night / rain) ---------------- */

const fogDay = new THREE.Color(0xdfe9f2), fogNight = new THREE.Color(0x141b28);
const dirDay = new THREE.Color(0xfff2e0), dirNight = new THREE.Color(0x9db4d6);
const _c1 = new THREE.Color(), _c2 = new THREE.Color();

function stepEnv(dt) {
  const spd = FREEZE ? 1e9 : dt * 3;
  const nt = state.night ? 1 : 0, rt = state.rain ? 1 : 0;
  state.nightV += Math.max(-spd, Math.min(spd, nt - state.nightV));
  state.rainV += Math.max(-spd, Math.min(spd, rt - state.rainV));
  const nv = state.nightV, rv = state.rainV;

  dirLight.intensity = (2.8 - rv * 1.2) * (1 - nv * 0.92);
  dirLight.color.lerpColors(dirDay, dirNight, nv);
  fillLight.intensity = 0.55 * (1 - nv * 0.8);
  hemi.intensity = 0.5 * (1 - nv * 0.82) * (1 - rv * 0.3);
  scene.environmentIntensity = 0.55 * (1 - nv * 0.8);
  roomLight.intensity = nv * 1.15;
  renderer.toneMappingExposure = 1.12 - nv * 0.1;

  _c1.copy(SKY.dayTop).lerp(SKY.rainTop, rv * 0.75).lerp(SKY.nightTop, nv);
  _c2.copy(SKY.dayBot).lerp(SKY.rainBot, rv * 0.75).lerp(SKY.nightBot, nv);
  skyUni.uTop.value.copy(_c1);
  skyUni.uBot.value.copy(_c2);
  scene.fog.color.lerpColors(fogDay, fogNight, nv);
  clouds.forEach((c, i) => {
    c.material.opacity = (0.55 - rv * 0.2) * (1 - nv * 0.88);
    if (!FREEZE) {
      c.position.x += dt * (0.06 + i * 0.015);
      if (c.position.x > 14) c.position.x = -14;
    }
  });
}

/* ---------------- run mode anim ---------------- */

function stepMachine(dt, t) {
  const run = state.run.on && state.p > 0.98;
  const accel = FREEZE ? 1e9 : dt * 1.6;
  state.crossSpd += Math.max(-accel * 12, Math.min(accel * 12, (run ? 17 : 0) - state.crossSpd));
  state.axialSpd += Math.max(-accel * 8, Math.min(accel * 8, (run ? 9.5 : 0) - state.axialSpd));
  if (!FREEZE) {
    world.anim.crossflow.rotation.x -= state.crossSpd * dt;
    world.anim.axialFan.rotation.z += state.axialSpd * dt;
  }
  // 导风板
  let want = 0.85; // 关闭:贴着机身下沿
  if (run) {
    const base = state.run.mode === 'heat' ? 1.05 : 0.30;
    want = base + (state.run.swing && !FREEZE ? Math.sin(t * 0.9) * 0.22 : 0);
  }
  state.louverAngle += (FREEZE ? 1 : Math.min(1, dt * 3)) * (want - state.louverAngle);
  world.anim.louver.rotation.x = state.louverAngle;
  // 竖导风叶
  const vy = run && state.run.swing && !FREEZE ? Math.sin(t * 0.55) * 0.3 : 0.12;
  world.anim.vanes.forEach((v, i) => { v.rotation.y = vy + (run ? Math.sin(i) * 0.02 : 0); });
}

/* ---------------- labels ---------------- */

const tagsBox = $('tags');
const leaders = $('leaders');
const tagObjs = [];

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
  const o = { el, line, dot, w: 120, h: 34, shown: false };
  return o;
}

parts.forEach((p) => {
  p.tag = makeTag(p.cn, p.en, '', () => focusPart(p, true));
});
const unitTags = [
  { key: 'indoor', off: new THREE.Vector3(0, 0.32, 0), tag: makeTag('室内机', 'INDOOR UNIT', 'unit') },
  { key: 'outdoor', off: new THREE.Vector3(0, 0.45, 0), tag: makeTag('室外机', 'OUTDOOR UNIT', 'unit') },
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
  t.line.setAttribute('stroke', hot ? 'rgba(255,105,70,0.85)' : 'rgba(235,238,244,0.45)');
  t.dot.setAttribute('cx', ax.toFixed(1));
  t.dot.setAttribute('cy', ay.toFixed(1));
  t.dot.setAttribute('visibility', 'visible');
  t.dot.setAttribute('fill', hot ? '#ff6a45' : '#f3f5f8');
  t.shown = true;
}

const _a2 = { x: 0, y: 0, behind: false }, _u2 = { x: 0, y: 0, behind: false };
function stepLabels() {
  placedRects.length = 0;
  const W = stage.clientWidth, H = stage.clientHeight;

  // 整机标签
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

  // 排序:焦点 > 悬停 > 装配中 > 其余
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

    const unit = world.units[p.unit === 'mount' || p.unit === 'lines' || p.unit === 'extras' ? (p.home.z + p.anchorOff.z > 0.05 ? 'indoor' : 'outdoor') : p.unit];
    project(_v.copy(unit.group.position).add(new THREE.Vector3(0, 0.05, 0)), _u2);
    let dx = _a2.x - _u2.x, dy = _a2.y - _u2.y;
    const dl = Math.hypot(dx, dy);
    if (dl < 4) { dx = 0.7; dy = -0.7; } else { dx /= dl; dy /= dl; }
    dy -= 0.25;

    const base = 58 + (p.idx % 5) * 24 + state.explode * 30;
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
  focusPulseMats = p.mats.filter(m => m.emissive);
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
    const dist = Math.min(3.2, Math.max(0.55, p.radius * 3.6));
    tweenCam(_v.clone().addScaledVector(dir, dist), _v.clone(), 0.9);
  }
}

function stepFocusPulse(t) {
  if (!state.focus) return;
  const k = 0.10 + (Math.sin(t * 5.5) * 0.5 + 0.5) * 0.22;
  focusPulseMats.forEach(m => { m.emissive.setHex(0xff4d2e); m.emissiveIntensity = k; });
}

/* ---------------- raycast hover / click ---------------- */

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

/* ---------------- UI wiring ---------------- */

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
$('tglGhost').addEventListener('change', (e) => { state.ghost = e.target.checked; });
$('tglNight').addEventListener('change', (e) => { state.night = e.target.checked; });
$('tglRain').addEventListener('change', (e) => { state.rain = e.target.checked; });
$('tglOrbit').addEventListener('change', (e) => { state.orbit = e.target.checked; controls.autoRotate = state.orbit; });
controls.autoRotateSpeed = 0.9;

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

// 运行模式
const btnPower = $('btnPower'), runPanel = $('runPanel'), runStat = $('runStat'), tOut = $('tOut');
function syncRunUI() {
  btnPower.classList.toggle('on', state.run.on);
  btnPower.textContent = state.run.on ? '⏻ 关机' : '⏻ 开机试运行';
  runPanel.classList.toggle('hidden', !state.run.on);
  runStat.classList.toggle('heat', state.run.mode === 'heat');
  tOut.textContent = state.run.temp + ' ℃';
  world.anim.display.draw(state.run.on, state.run.mode, state.run.temp);
}
btnPower.addEventListener('click', () => {
  if (!state.run.on && state.p < 1) {
    const from = state.p;
    state.playing = false; updatePlayBtn();
    tween(0.8, (e) => setProgress(from + (1 - from) * e), () => { state.run.on = true; syncRunUI(); });
  } else {
    state.run.on = !state.run.on;
    syncRunUI();
  }
});
$('modeSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  state.run.mode = b.dataset.m;
  [...$('modeSeg').querySelectorAll('button')].forEach(x => x.classList.toggle('on', x === b));
  syncRunUI();
});
$('tDown').addEventListener('click', () => { state.run.temp = Math.max(16, state.run.temp - 1); syncRunUI(); });
$('tUp').addEventListener('click', () => { state.run.temp = Math.min(30, state.run.temp + 1); syncRunUI(); });
$('tglSwing').addEventListener('change', (e) => { state.run.swing = e.target.checked; });

// 零件列表
const PHASE_EN = { '室外机': 'OUTDOOR UNIT', '穿墙': 'THROUGH-WALL', '室内机': 'INDOOR UNIT', '管线': 'LINES & HOSES', '收尾': 'FINISHING' };
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

/* ---------------- follow camera & toast ---------------- */

const followTmp = new THREE.Vector3();
let toastTimer = 0;

function stepFollow(dt) {
  if (!(state.playing && state.follow && state.active)) return;
  const p = state.active;
  p.group.getWorldPosition(followTmp).add(p.anchorOff);
  const side = (p.unit === 'indoor' || p.unit === 'extras' || (p.unit === 'lines' && p.home.z + p.anchorOff.z >= 0)) ? 1 : -1;
  const dist = Math.max(1.15, p.radius * 5);
  _v.set(side * 0.75, 0.42, side * 1.05).normalize().multiplyScalar(dist).add(followTmp);
  const k = Math.min(1, dt * 2.2);
  camera.position.lerp(_v, k);
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

/* ---------------- run stats ticker ---------------- */

let statTimer = 0;
function stepStats(dt, t) {
  statTimer -= dt;
  if (statTimer > 0) return;
  statTimer = 0.4;
  if (state.run.on) {
    const heat = state.run.mode === 'heat';
    const rps = Math.round((heat ? 52 : 38) + Math.sin(t * 0.7) * 4);
    const w = Math.round((heat ? 980 : 760) + Math.sin(t * 0.9 + 2) * 55);
    const out = heat ? '42 ℃ 热风' : '12 ℃ 凉风';
    runStat.innerHTML = `压缩机 <b>${rps} rps</b> · 输入功率 <b>${w} W</b><br>出风 <b>${out}</b> · 冷媒 R32 循环中`;
  }
  // 零件列表进度
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
  const scale = h / (2 * Math.tan((camera.fov * Math.PI / 180) / 2));
  flowIn.uni.uScale.value = scale;
  flowOut.uni.uScale.value = scale;
}
new ResizeObserver(resize).observe(stage);
resize();

/* ---------------- URL params (screenshot / deep link) ---------------- */

function applyParams() {
  if (Q.has('p')) setProgress(parseFloat(Q.get('p')));
  if (Q.has('x')) setExplodeTarget(parseFloat(Q.get('x')));
  state.explode = state.explodeTarget;
  if (Q.has('labels')) state.tags = Q.get('labels') !== '0';
  $('tglTags').checked = state.tags;
  if (Q.get('cut') === '1') { state.cutaway = true; $('tglCutaway').checked = true; }
  if (Q.get('ghost') === '1') { state.ghost = true; $('tglGhost').checked = true; }
  if (Q.get('night') === '1') { state.night = true; $('tglNight').checked = true; }
  if (Q.get('rain') === '1') { state.rain = true; $('tglRain').checked = true; }
  if (Q.has('run')) {
    state.run.on = true;
    if (Q.get('run') === 'heat') state.run.mode = 'heat';
    setProgress(1);
    [...$('modeSeg').querySelectorAll('button')].forEach(x => x.classList.toggle('on', x.dataset.m === state.run.mode));
    syncRunUI();
  }
  if (Q.get('play') === '1') state.playing = true;
  const v = VIEWS[Q.get('view')];
  if (v) { camera.position.copy(v[0]); controls.target.copy(v[1]); }
  if (SHOT) $('hint').style.display = 'none';
  // 预热:同步快进模拟(粒子、风扇、导风板到位)
  const warm = parseFloat(Q.get('warm') || 0);
  for (let i = 0; i < warm * 60; i++) {
    const d = 1 / 60;
    simT += d;
    if (state.playing) setProgress(state.p + d * state.speed / TOTAL_T);
    stepTweens(d);
    applyParts(simT);
    stepFades(d);
    stepMachine(d, simT);
    stepEnv(d);
    stepParticles(d, simT);
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
  applyParts(simT);
  stepFades(dt);
  stepMachine(dt, simT);
  stepEnv(dt);
  stepParticles(dt, simT);
  stepFollow(dt);
  stepCamTween(dt);
  stepFocusPulse(simT);
  stepToast(dt);
  stepStats(dt, simT);
  controls.update();
  stepLabels();
  renderer.render(scene, camera);
  // 截图辅助:headless SwiftShader 无法合成 WebGL2 画布,渲染后立即转成 <img>
  if (shotImgPending && renderer.info.render.frame > 2) {
    shotImgPending = false;
    const img = document.createElement('img');
    img.src = renderer.domElement.toDataURL('image/png');
    img.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:2;';
    stage.insertBefore(img, $('leaders'));
  }
  if (DIAG && renderer.info.render.frame % 30 === 5) {
    const r = renderer.info.render;
    diagMsg(`tri ${r.triangles} calls ${r.calls}\ncam ${camera.position.toArray().map(v => v.toFixed(2))}\ntgt ${controls.target.toArray().map(v => v.toFixed(2))}\nvisible parts ${parts.filter(p => p.group.visible).length}/${N} p=${state.p}`);
  }
}

applyParams();
applyParts(0);
stepFades(1);
stepEnv(1);
updatePlayBtn();
syncRunUI();
frame();

// 自动开场:无参数时自动播放装配
if (!SHOT) {
  setTimeout(() => {
    if (!state.playing && state.p === 0) { state.playing = true; updatePlayBtn(); }
  }, 900);
  setTimeout(() => { $('hint').style.opacity = '0'; }, 9000);
}
