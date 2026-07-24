// 多米诺球场 · Rapier 物理 × three.js
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import * as RAPIER from '../vendor/rapier.mjs';
import { buildCourse, buildField, SPACING, DOMINO } from './course.js';

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

await RAPIER.init();

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
scene.fog = new THREE.Fog(0xdfe9f2, 160, 420);

const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 800);
camera.position.set(-90, 60, 85);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(-5, 0, -4);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 3;
controls.maxDistance = 260;
controls.maxPolarAngle = 1.55;
controls.autoRotateSpeed = 0.5;

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.45;

/* ---------------- lights & sky ---------------- */

const dirLight = new THREE.DirectionalLight(0xfff2e0, 2.6);
dirLight.position.set(70, 110, 60);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(4096, 4096);
Object.assign(dirLight.shadow.camera, { left: -75, right: 75, top: 62, bottom: -62, near: 20, far: 260 });
dirLight.shadow.camera.updateProjectionMatrix();
dirLight.shadow.bias = -0.0006;
dirLight.shadow.normalBias = 0.05;
scene.add(dirLight, dirLight.target);

const hemi = new THREE.HemisphereLight(0xcfe4ff, 0x5c7a52, 0.55);
scene.add(hemi);

const SKY = {
  dayTop: new THREE.Color(0x7db2e8), dayBot: new THREE.Color(0xeaf2f8),
  nightTop: new THREE.Color(0x070c1c), nightBot: new THREE.Color(0x16202e),
};
const skyUni = { uTop: { value: SKY.dayTop.clone() }, uBot: { value: SKY.dayBot.clone() } };
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(420, 24, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: skyUni,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: `varying vec3 vP; uniform vec3 uTop; uniform vec3 uBot;
      void main(){ float h = clamp(normalize(vP).y*1.5+0.16, 0.0, 1.0); gl_FragColor = vec4(mix(uBot,uTop,pow(h,0.75)),1.0); }`,
  })
);
scene.add(sky);

/* ---------------- course & field ---------------- */

const course = buildCourse();
const env = buildField(scene);
const N = course.poses.length;
$('chipCount').textContent = N + ' 张';

const geo = new THREE.BoxGeometry(DOMINO.w, DOMINO.h, DOMINO.t);
const mat = new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.04 });
const inst = new THREE.InstancedMesh(geo, mat, N);
inst.castShadow = true;
inst.receiveShadow = true;
inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
scene.add(inst);

const _c = new THREE.Color();
function applyScheme(name) {
  for (let i = 0; i < N; i++) {
    if (i === N - 1 || i === course.forkIdx) _c.setHex(0xf2b544);
    else if (name === 'rainbow') _c.setHSL((i / N * 0.9) % 1, 0.75, 0.58);
    else if (name === 'redwhite') _c.setHex(((i / 9) | 0) % 2 ? 0xf2f4f6 : 0xe23b2e);
    else _c.setHex(((i / 9) | 0) % 2 ? 0x2fd6b5 : 0xf2b544);
    inst.setColorAt(i, _c);
  }
  inst.instanceColor.needsUpdate = true;
}
applyScheme('rainbow');

/* ---------------- physics ---------------- */

const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
world.timestep = 1 / 60;
world.createCollider(RAPIER.ColliderDesc.cuboid(70, 0.5, 50).setTranslation(0, -0.5, 0).setFriction(0.9));

const _e = new THREE.Euler(), _qq = new THREE.Quaternion();
function poseQuat(p) {
  if (p.lying) {
    _qq.setFromEuler(_e.set(Math.PI / 2, p.lyingYaw || 0, 0, 'YXZ'));
  } else {
    _qq.setFromEuler(_e.set(0, Math.PI / 2 - p.a, 0));
  }
  return { x: _qq.x, y: _qq.y, z: _qq.z, w: _qq.w };
}
function poseY(p) {
  return p.lying ? p.y : (p.y || 0) + DOMINO.h / 2 + 0.004;
}
const bodies = [];
const initial = [];
for (const p of course.poses) {
  const q = poseQuat(p);
  const bd = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(p.x, poseY(p), p.z)
    .setRotation(q);
  const rb = world.createRigidBody(bd);
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(DOMINO.w / 2, DOMINO.h / 2, DOMINO.t / 2)
      .setDensity(55).setFriction(0.62).setRestitution(0.02),
    rb
  );
  rb.sleep();
  bodies.push(rb);
  initial.push({ t: { x: p.x, y: poseY(p), z: p.z }, q });
}

// 静态结构:台阶 / 桥面 / 桥墩(碰撞体 + 可视网格)
{
  const stepMat = new THREE.MeshStandardMaterial({ color: 0xb9bdc1, roughness: 0.85 });
  const deckMat = new THREE.MeshStandardMaterial({ color: 0x39414c, roughness: 0.7 });
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x8a9096, roughness: 0.6, metalness: 0.3 });
  for (const st of course.statics) {
    world.createCollider(RAPIER.ColliderDesc.cuboid(st.hx, st.hy, st.hz).setTranslation(st.cx, st.cy, st.cz).setFriction(0.9));
    const m = new THREE.Mesh(new THREE.BoxGeometry(st.hx * 2, st.hy * 2, st.hz * 2),
      st.kind === 'deck' ? deckMat : st.kind === 'pillar' ? pillarMat : stepMat);
    m.position.set(st.cx, st.cy, st.cz);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
  }
}

// 巨型足球(终点 −x 球门前)
const BALL_START = { x: -49.3, y: 1.51, z: 0 };
const ballBody = world.createRigidBody(
  RAPIER.RigidBodyDesc.dynamic().setTranslation(BALL_START.x, BALL_START.y, BALL_START.z).setAngularDamping(0.15)
);
world.createCollider(RAPIER.ColliderDesc.ball(1.5).setDensity(1.2).setFriction(0.5).setRestitution(0.25), ballBody);
ballBody.sleep();

const ballTex = (() => {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#f2f4f6'; g.fillRect(0, 0, 512, 256);
  g.fillStyle = '#17191c';
  for (let i = 0; i < 14; i++) {
    const x = (i % 7) * 74 + (i > 6 ? 37 : 0), y = i > 6 ? 170 : 60;
    g.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = k / 5 * Math.PI * 2 - Math.PI / 2;
      const px = x + Math.cos(a) * 26, py = y + Math.sin(a) * 26;
      k ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath(); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(1.5, 36, 24),
  new THREE.MeshStandardMaterial({ map: ballTex, roughness: 0.55 }));
ballMesh.castShadow = ballMesh.receiveShadow = true;
ballMesh.position.copy(BALL_START);
scene.add(ballMesh);

/* ---------------- confetti ---------------- */

const CONF_N = 320;
const confGeo = new THREE.PlaneGeometry(0.5, 0.28);
const confMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, vertexColors: false });
const confetti = new THREE.InstancedMesh(confGeo, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), CONF_N);
const confData = [];
confetti.visible = false;
scene.add(confetti);
for (let i = 0; i < CONF_N; i++) {
  _c.setHSL(Math.random(), 0.85, 0.6);
  confetti.setColorAt(i, _c);
  confData.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3() });
}
let confT = -1;
function burstConfetti(cx, cy, cz) {
  confT = 0;
  confetti.visible = true;
  for (const d of confData) {
    d.p.set(cx + (Math.random() - 0.5) * 3, cy + Math.random() * 2, cz + (Math.random() - 0.5) * 6);
    d.v.set((Math.random() - 0.2) * 7, 6 + Math.random() * 9, (Math.random() - 0.5) * 8);
    d.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    d.w.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9);
  }
}
const _m4 = new THREE.Matrix4(), _qt = new THREE.Quaternion(), _s = new THREE.Vector3(1, 1, 1);
function stepConfetti(dt) {
  if (confT < 0) return;
  confT += dt;
  if (confT > 5) { confT = -1; confetti.visible = false; return; }
  const sc = confT > 4 ? 1 - (confT - 4) : 1;
  _s.setScalar(Math.max(0.001, sc));
  confData.forEach((d, i) => {
    d.v.y -= 12 * dt;
    d.v.multiplyScalar(1 - 0.5 * dt);
    d.p.addScaledVector(d.v, dt);
    if (d.p.y < 0.1) { d.p.y = 0.1; d.v.set(0, 0, 0); }
    d.r.x += d.w.x * dt; d.r.y += d.w.y * dt; d.r.z += d.w.z * dt;
    _qt.setFromEuler(d.r);
    _m4.compose(d.p, _qt, _s);
    confetti.setMatrixAt(i, _m4);
  });
  confetti.instanceMatrix.needsUpdate = true;
}

/* ---------------- state ---------------- */

const state = {
  triggered: false, goal: false, elapsed: 0, speed: 1,
  follow: true, orbit: false, night: false, nightV: 0,
  fallen: 0, waveIdx: 0, waveSpeed: 0, physMs: 0,
  ballAssisted: false, ballMoveT: -1,
};
let physAcc = 0;

/* ---------------- trigger / reset ---------------- */

function topple(i, dirX, dirZ) {
  const rb = bodies[i];
  rb.wakeUp();
  const t = rb.translation();
  rb.applyImpulseAtPoint(
    { x: dirX * 130, y: 0, z: dirZ * 130 },
    { x: t.x, y: t.y + DOMINO.h * 0.42, z: t.z },
    true
  );
}

function triggerFirst() {
  if (state.triggered) return;
  state.triggered = true;
  state.elapsed = 0;
  const p = course.poses[0];
  topple(0, Math.cos(p.a), Math.sin(p.a));
  $('hint').style.opacity = '0';
}

function resetAll() {
  state.triggered = false; state.goal = false; state.elapsed = 0;
  state.fallen = 0; state.waveIdx = 0; state.waveSpeed = 0;
  state.ballAssisted = false; state.ballMoveT = -1;
  physAcc = 0;
  bodies.forEach((rb, i) => {
    rb.setTranslation(initial[i].t, false);
    rb.setRotation(initial[i].q, false);
    rb.setLinvel({ x: 0, y: 0, z: 0 }, false);
    rb.setAngvel({ x: 0, y: 0, z: 0 }, false);
    rb.sleep();
  });
  ballBody.setTranslation(BALL_START, false);
  ballBody.setRotation({ x: 0, y: 0, z: 0, w: 1 }, false);
  ballBody.setLinvel({ x: 0, y: 0, z: 0 }, false);
  ballBody.setAngvel({ x: 0, y: 0, z: 0 }, false);
  ballBody.sleep();
  confT = -1; confetti.visible = false;
  env.scoreboard.draw(0, N, 0, '00:00.0', false);
  $('liveStat').textContent = '尚未触发 · 全部站立';
  syncInstances();
}

/* ---------------- sync & scan ---------------- */

const _p = new THREE.Vector3();
const _ONE = new THREE.Vector3(1, 1, 1);
function syncInstances() {
  for (let i = 0; i < N; i++) {
    const t = bodies[i].translation();
    const r = bodies[i].rotation();
    _p.set(t.x, t.y, t.z);
    _qt.set(r.x, r.y, r.z, r.w);
    _m4.compose(_p, _qt, _ONE);
    inst.setMatrixAt(i, _m4);
  }
  inst.instanceMatrix.needsUpdate = true;
  const bt = ballBody.translation();
  ballMesh.position.set(bt.x, bt.y, bt.z);
  const br = ballBody.rotation();
  ballMesh.quaternion.set(br.x, br.y, br.z, br.w);
}

let scanAcc = 0, lastWaveIdx = 0, lastWaveT = 0, simClock = 0;
function scanFallen(dt) {
  scanAcc -= dt;
  if (scanAcc > 0) return;
  scanAcc = 0.25;
  let fallen = 0, wave = 0;
  for (let i = 0; i < N; i++) {
    if (course.poses[i].lying) continue;
    const q = bodies[i].rotation();
    const upY = 1 - 2 * (q.x * q.x + q.z * q.z);
    if (upY < 0.55) { fallen++; if (i < course.mainCount && i > wave) wave = i; }
  }
  state.fallen = fallen;
  if (wave > lastWaveIdx) {
    state.waveSpeed = (wave - lastWaveIdx) * SPACING / Math.max(0.001, simClock - lastWaveT);
    lastWaveIdx = wave; lastWaveT = simClock;
    state.waveIdx = wave;
  }
  // 足球助攻:被撞后若滚不动,补一脚
  if (state.triggered && !state.goal) {
    const bv = ballBody.linvel();
    const bs = Math.hypot(bv.x, bv.z);
    const bx = ballBody.translation().x;
    if (state.ballMoveT < 0 && bs > 0.25) state.ballMoveT = simClock;
    if (state.ballMoveT > 0 && !state.ballAssisted && simClock - state.ballMoveT > 0.8 && bx > -50.6 && bs < 2.5) {
      state.ballAssisted = true;
      ballBody.applyImpulse({ x: -75, y: 0, z: 0 }, true);
    }
    if (bx < -52.7 && Math.abs(ballBody.translation().z) < 3.8) {
      state.goal = true;
      burstConfetti(-51.5, 2.5, 0);
      toast(`⚽ GOOOOAL!!! 用时 ${fmtTime(state.elapsed)} · ${state.fallen} 张牌倒下`);
      env.scoreboard.draw(fallen, N, 0, '', true);
    }
  }
  // 面板与记分牌
  if (state.triggered) {
    const pct = Math.round(fallen / N * 100);
    $('liveStat').innerHTML =
      `已倒下 <b>${fallen}</b> / ${N}(${pct}%)· 波前 <b>${state.waveSpeed.toFixed(1)} m/s</b><br>` +
      `用时 <b>${fmtTime(state.elapsed)}</b> · 物理 <b>${state.physMs.toFixed(1)} ms</b>/帧` +
      (state.goal ? ' · <b>⚽ GOAL!</b>' : '');
    if (!state.goal) env.scoreboard.draw(fallen, N, state.waveSpeed, fmtTime(state.elapsed), false);
  }
}

function fmtTime(s) {
  return `${String((s / 60) | 0).padStart(2, '0')}:${String((s % 60) | 0).padStart(2, '0')}.${((s * 10) | 0) % 10}`;
}

let toastTimer = 0;
function toast(html) {
  $('phaseToast').innerHTML = html;
  toastTimer = 5;
}

/* ---------------- camera ---------------- */

const VIEWS = {
  hero: [new THREE.Vector3(-90, 60, 85), new THREE.Vector3(-5, 0, -4)],
  start: [new THREE.Vector3(-56, 7, -22), new THREE.Vector3(-38, 1, -30)],
  spiral: [new THREE.Vector3(2, 46, 20), new THREE.Vector3(0, 0, -1)],
  bridge: [new THREE.Vector3(14, 13, 33), new THREE.Vector3(4, 3.4, 16.6)],
  goal: [new THREE.Vector3(-63, 5, 13), new THREE.Vector3(-49, 1.5, 0)],
  top: [new THREE.Vector3(0, 165, 3), new THREE.Vector3(0, 0, 0)],
};
let camTween = null;
function tweenCam(pos, target, dur = 1.2) {
  camTween = { t: 0, dur, p0: camera.position.clone(), p1: pos.clone(), t0: controls.target.clone(), t1: target.clone() };
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

const _fv = new THREE.Vector3();
function stepFollow(dt) {
  if (!(state.triggered && state.follow)) return;
  if (state.goal) return;
  const idx = Math.min(state.waveIdx + 7, course.mainCount - 1);
  const p = course.poses[idx];
  const dx = Math.cos(p.a), dz = Math.sin(p.a);
  _fv.set(p.x - dx * 12 - dz * 6.5, (p.y || 0) + 8.5, p.z - dz * 12 + dx * 6.5);
  camera.position.lerp(_fv, Math.min(1, dt * 1.8));
  _fv.set(p.x + dx * 4, (p.y || 0) + 1.0, p.z + dz * 4);
  controls.target.lerp(_fv, Math.min(1, dt * 2.6));
}

/* ---------------- interaction ---------------- */

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let downPos = null;
renderer.domElement.addEventListener('pointerdown', (e) => { downPos = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downPos) return;
  const moved = Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]);
  downPos = null;
  if (moved > 5) return;
  const r = renderer.domElement.getBoundingClientRect();
  mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObject(inst, false);
  if (hits.length && hits[0].instanceId !== undefined) {
    const i = hits[0].instanceId;
    const dir = _fv.copy(hits[0].point).sub(camera.position).setY(0).normalize();
    topple(i, dir.x, dir.z);
    if (!state.triggered) { state.triggered = true; state.elapsed = 0; $('hint').style.opacity = '0'; }
  }
});

/* ---------------- UI ---------------- */

$('btnGo').addEventListener('click', triggerFirst);
$('btnMulti').addEventListener('click', () => {
  if (!state.triggered) { state.triggered = true; state.elapsed = 0; $('hint').style.opacity = '0'; }
  course.segments.forEach(s => {
    const p = course.poses[s.start];
    topple(s.start, Math.cos(p.a), Math.sin(p.a));
  });
});
$('btnReset').addEventListener('click', resetAll);
$('speedSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  state.speed = parseFloat(b.dataset.s);
  [...$('speedSeg').querySelectorAll('button')].forEach(x => x.classList.toggle('on', x === b));
});
$('schemeSeg').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  applyScheme(b.dataset.c);
  [...$('schemeSeg').querySelectorAll('button')].forEach(x => x.classList.toggle('on', x === b));
});
$('tglFollow').addEventListener('change', (e) => { state.follow = e.target.checked; });
$('tglOrbit').addEventListener('change', (e) => { state.orbit = e.target.checked; controls.autoRotate = state.orbit; });
$('tglNight').addEventListener('change', (e) => { state.night = e.target.checked; });
$('vHero').addEventListener('click', () => tweenCam(...VIEWS.hero));
$('vStart').addEventListener('click', () => tweenCam(...VIEWS.start));
$('vSpiral').addEventListener('click', () => tweenCam(...VIEWS.spiral));
$('vGoal').addEventListener('click', () => tweenCam(...VIEWS.goal));
$('vBridge').addEventListener('click', () => tweenCam(...VIEWS.bridge));

// 路线列表
const segList = $('segList');
course.segments.forEach((s, i) => {
  const li = document.createElement('li');
  li.dataset.idx = i;
  const end = (course.segments[i + 1]?.start ?? N) - 1;
  li.innerHTML = `<i>${String(i + 1).padStart(2, '0')}</i><span class="n">${s.name}</span><em>#${s.start + 1}–${end + 1}</em>`;
  li.addEventListener('click', () => {
    const p = course.poses[s.start];
    const dx = Math.cos(p.a), dz = Math.sin(p.a);
    tweenCam(
      new THREE.Vector3(p.x - dx * 14 - dz * 8, 9, p.z - dz * 14 + dx * 8),
      new THREE.Vector3(p.x + dx * 6, 1, p.z + dz * 6)
    );
    [...segList.querySelectorAll('li')].forEach(x => x.classList.toggle('active', x === li));
  });
  segList.appendChild(li);
});
$('segCount').textContent = '× ' + course.segments.length;

/* ---------------- environment ---------------- */

const fogDay = new THREE.Color(0xdfe9f2), fogNight = new THREE.Color(0x0c1018);
const dirDay = new THREE.Color(0xfff2e0), dirNight = new THREE.Color(0xbcd0ee);
function stepEnv(dt) {
  const spd = FREEZE ? 1e9 : dt * 2.5;
  state.nightV += Math.max(-spd, Math.min(spd, (state.night ? 1 : 0) - state.nightV));
  const nv = state.nightV;
  dirLight.intensity = 2.6 * (1 - nv * 0.88);
  dirLight.color.lerpColors(dirDay, dirNight, nv);
  hemi.intensity = 0.55 * (1 - nv * 0.75);
  scene.environmentIntensity = 0.45 * (1 - nv * 0.8);
  renderer.toneMappingExposure = 1.1 - nv * 0.05;
  skyUni.uTop.value.copy(SKY.dayTop).lerp(SKY.nightTop, nv);
  skyUni.uBot.value.copy(SKY.dayBot).lerp(SKY.nightBot, nv);
  scene.fog.color.lerpColors(fogDay, fogNight, nv);
  env.floodMats.forEach(m => { m.emissiveIntensity = nv * 1.8; });
  env.floodLights.forEach(l => { l.intensity = nv * 26000; });
}

/* ---------------- main loop ---------------- */

function stepPhysics(dt) {
  if (FREEZE) return;
  physAcc += dt * state.speed;
  let steps = 0;
  const t0 = performance.now();
  while (physAcc >= 1 / 60 && steps < 10) {
    world.step();
    simClock += 1 / 60;
    if (state.triggered && !state.goal) state.elapsed += 1 / 60;
    physAcc -= 1 / 60;
    steps++;
  }
  if (steps === 10) physAcc = 0;
  state.physMs = performance.now() - t0;
}

const clock = new THREE.Clock();
let shotImgPending = Q.has('shotimg');

function frame() {
  requestAnimationFrame(frame);
  try { frameBody(); } catch (err) {
    if (DIAG) diagMsg('FRAME ERR: ' + err.message + '\n' + (err.stack || '').split('\n').slice(0, 4).join('\n'));
    throw err;
  }
}
function frameBody() {
  let dt = Math.min(0.05, clock.getDelta());
  if (FREEZE) dt = 0;
  stepPhysics(dt);
  syncInstances();
  scanFallen(dt);
  stepFollow(dt);
  stepCamTween(dt);
  stepEnv(dt);
  stepConfetti(dt * state.speed);
  toastTimer -= dt;
  $('phaseToast').classList.toggle('show', toastTimer > 0);
  controls.update();
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
    diagMsg(`tri ${r.triangles} calls ${r.calls}\ndominoes ${N} fallen ${state.fallen}\nphys ${state.physMs.toFixed(1)}ms cam ${camera.position.toArray().map(v => v.toFixed(0))}`);
  }
}

/* ---------------- resize & params ---------------- */

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);
resize();

function applyParams() {
  if (Q.get('night') === '1') { state.night = true; $('tglNight').checked = true; }
  if (Q.has('scheme')) applyScheme(Q.get('scheme'));
  const v = VIEWS[Q.get('view')];
  if (v) { camera.position.copy(v[0]); controls.target.copy(v[1]); }
  if (Q.get('follow') === '0') { state.follow = false; $('tglFollow').checked = false; }
  if (SHOT) $('hint').style.display = 'none';
  if (Q.get('go') === '1') {
    triggerFirst();
    const warm = parseFloat(Q.get('warm') || 0);
    for (let i = 0; i < warm * 60; i++) {
      world.step();
      simClock += 1 / 60;
      state.elapsed += 1 / 60;
      if (i % 15 === 0) { scanFallen(1); stepFollow(0.25); }
    }
    scanFallen(1);
    stepFollow(1);
  }
}

applyParams();
stepEnv(1);
syncInstances();
if (!state.triggered) env.scoreboard.draw(0, N, 0, '00:00.0', false);
frame();

if (!SHOT) {
  setTimeout(() => { $('hint').style.opacity = '0'; }, 12000);
}
