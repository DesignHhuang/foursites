// 多米诺球场 —— 路线生成(海龟法)+ 球场环境
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';

export const SPACING = 0.92;
export const DOMINO = { w: 1.2, h: 2.2, t: 0.24 };

/* ================= 路线 ================= */

export function buildCourse() {
  const poses = [];       // {x, y, z, a}  y = 底面高度
  const segments = [];    // {name, start}
  const statics = [];     // 静态碰撞体 {cx,cy,cz,hx,hy,hz,kind}
  let x = 0, z = 0, th = 0, acc = 0, lvl = 0;
  const DS = 0.02;

  const seg = (name) => segments.push({ name, start: poses.length });
  const start = (x0, z0, th0) => { x = x0; z = z0; th = th0; lvl = 0; acc = SPACING; };
  function march(len, curv) {
    let s = 0;
    while (s < len) {
      const d = Math.min(DS, len - s);
      th += curv * d;
      x += Math.cos(th) * d;
      z += Math.sin(th) * d;
      s += d; acc += d;
      if (acc >= SPACING) { poses.push({ x, y: lvl, z, a: th }); acc -= SPACING; }
    }
  }
  const straight = (len) => march(len, 0);
  const arcL = (deg, r) => march(deg * Math.PI / 180 * r, 1 / r);
  const arcR = (deg, r) => march(deg * Math.PI / 180 * r, -1 / r);

  // —— 主线:下半场蛇形 ——
  start(-44, -31, 0);
  seg('起点 · 开球');
  straight(88);
  arcL(180, 2.4); straight(88);
  arcR(180, 2.4); straight(88);
  arcL(180, 2.4); straight(88);
  arcR(180, 2.4);
  seg('螺旋岔口');
  straight(40);
  const forkIdx = poses.length - 1;   // 岔口(x ≈ -4, z = -11.8)
  straight(48);
  seg('绕门大弯');
  arcL(180, 11.8);                    // 绕过 +x 球门背后
  seg('上半场长直道');
  straight(80);                       // (44,11.8) → (-36,11.8)
  arcR(180, 2.4);
  straight(20);                       // (-36,16.6) → (-16,16.6)

  // —— 立体环节 1:登阶(11 级台阶爬上 4.62m)——
  seg('登阶而上');
  const RISE = 0.42, TREAD = 0.98, NSTEP = 11;
  for (let i = 0; i < NSTEP; i++) {
    const topY = RISE * (i + 1);
    const cx = x + TREAD * (i + 0.5);
    statics.push({ cx, cy: topY / 2, cz: z, hx: TREAD / 2 + 0.01, hy: topY / 2, hz: 1.6, kind: 'step' });
    poses.push({ x: cx, y: topY, z, a: th });
  }
  x += TREAD * NSTEP; lvl = RISE * NSTEP; acc = SPACING * 0.55;

  // —— 立体环节 2:天桥(4.62m 高空直道)——
  seg('高空天桥');
  const bridgeStart = x;
  straight(35.2);
  const lastBx = poses[poses.length - 1].x;
  const deckEnd = lastBx + 0.28;          // 桥板在末牌脚前 28cm 截断:末牌翻沿跳水
  statics.push({
    cx: (bridgeStart - 0.5 + deckEnd) / 2, cy: lvl - 0.19, cz: z,
    hx: (deckEnd - (bridgeStart - 0.5)) / 2, hy: 0.19, hz: 1.6, kind: 'deck',
  });
  for (let k = 0; k < 5; k++) {
    const px = bridgeStart + 2 + (deckEnd - bridgeStart - 4) * k / 4;
    statics.push({ cx: px, cy: (lvl - 0.38) / 2, cz: z, hx: 0.4, hy: (lvl - 0.38) / 2, hz: 0.4, kind: 'pillar' });
  }

  // —— 立体环节 3:跳水与地面接应(3×3 错行接应床,兜住任意落点)——
  seg('跳水接力');
  lvl = 0;
  const bed0 = deckEnd + 1.1;
  for (let c = 0; c < 3; c++) {
    const bx = bed0 + c * 0.95;
    const rows = c % 2 === 0 ? [-1.15, 0, 1.15] : [-0.575, 0.575];
    for (const rz of rows) poses.push({ x: bx, y: 0, z: z + rz, a: 0 });
  }
  x = bed0 + 2 * 0.95; th = 0; acc = SPACING * 0.5;

  // —— 折返去骨牌大阵 ——
  arcL(90, 4.0);
  arcL(90, 4.0);                      // 到 (≈34.4, 24.6) 朝 -x
  straight(x + 13.0);                 // 直行至阵列东侧
  poses.push({ x: -14.4 + 0.92, y: 0, z: 24.6, a: Math.PI });  // 敲门牌:与阵列首列精确 0.92m

  // —— 立体环节 4:骨牌大阵(16 × 11 密集方阵,V 形波扩散)——
  seg('骨牌大阵');
  const ACOLS = 15, AROWS = 11, ADX = 1.20, ADZ = 1.15;  // 列距 1.2m:撞击更有冲量,防斜靠成拱
  const ax0 = -14.4, az0 = 24.6;
  for (let c = 0; c < ACOLS; c++) {
    for (let r = 0; r < AROWS; r++) {
      const rr = r - (AROWS - 1) / 2;
      poses.push({
        x: ax0 - c * ADX,
        y: 0,
        z: az0 + rr * ADZ + (c % 2 ? ADZ * 0.5 : 0),   // 奇数列错行,让波前横向扩散
        a: Math.PI,
      });
    }
  }
  x = ax0 - (ACOLS - 1) * ADX; z = az0; th = Math.PI; acc = SPACING * 0.5;

  // —— 冲刺与射门 ——
  seg('冲刺与射门');
  straight(Math.abs(x - (-36)));
  arcL(90, 5);
  straight(16.4);
  arcR(90, 3.2);
  straight(3.0);
  const mainCount = poses.length;

  // —— 支线:中圈螺旋(由岔口触发) ——
  seg('中圈螺旋');
  const fp = poses[forkIdx];
  {
    // 贝塞尔:岔口 → 螺旋入口
    const p0 = new THREE.Vector2(fp.x + 0.85, fp.z + 0.45);
    const phi0 = -75 * Math.PI / 180;
    const r0 = 8.6;
    const p3 = new THREE.Vector2(r0 * Math.cos(phi0), r0 * Math.sin(phi0));
    const t3 = new THREE.Vector2(Math.cos(phi0 + Math.PI / 2), Math.sin(phi0 + Math.PI / 2));
    const p1 = p0.clone().add(new THREE.Vector2(2.4 * Math.cos(0.35), 2.4 * Math.sin(0.35)));
    const p2 = p3.clone().addScaledVector(t3, -2.6);
    let prev = p0.clone(), a2 = SPACING * 0.9;
    for (let i = 1; i <= 300; i++) {
      const t = i / 300;
      const u = 1 - t;
      const px = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x;
      const pz = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y;
      a2 += Math.hypot(px - prev.x, pz - prev.y);
      if (a2 >= SPACING) {
        poses.push({ x: px, y: 0, z: pz, a: Math.atan2(pz - prev.y, px - prev.x) });
        a2 -= SPACING;
      }
      prev.set(px, pz);
    }
    // 螺旋:外圈缓收(0.46/rad),末半圈猛收(1.15/rad)俯冲进中心撞塔
    let theta = 0, acc2 = 0, r = r0;
    let lx = r0 * Math.cos(phi0), lz = r0 * Math.sin(phi0);
    while (true) {
      theta += 0.004;
      r -= (r < 3.4 ? 1.15 : 0.46) * 0.004;
      if (r < 1.55) break;
      const phi = phi0 + theta;
      const sx = r * Math.cos(phi), sz = r * Math.sin(phi);
      acc2 += Math.hypot(sx - lx, sz - lz);
      if (acc2 >= SPACING) {
        poses.push({ x: sx, y: 0, z: sz, a: Math.atan2(sz - lz, sx - lx) });
        acc2 -= SPACING;
      }
      lx = sx; lz = sz;
    }
  }

  // —— 立体环节 5:中圈井字叠塔(被螺旋末牌撞塌)——
  seg('中心叠塔');
  for (let layer = 0; layer < 7; layer++) {
    for (const off of [-0.42, 0.42]) {
      const along = layer % 2 === 0;
      poses.push({
        x: along ? off : 0,
        y: 0.121 + layer * 0.245,
        z: along ? 0 : off,
        a: 0,
        lying: true,
        lyingYaw: along ? 0 : Math.PI / 2,
      });
    }
  }

  // 安全检查:非相邻牌间距
  let minD = 1e9, minPair = null;
  for (let i = 0; i < poses.length; i++) {
    if (poses[i].lying) continue;
    for (let j = i + 3; j < poses.length; j++) {
      if (poses[j].lying) continue;
      const dx = poses[i].x - poses[j].x, dz = poses[i].z - poses[j].z;
      const dy = (poses[i].y || 0) - (poses[j].y || 0);
      const d2 = dx * dx + dz * dz + dy * dy;
      if (d2 < minD) { minD = d2; minPair = [i, j]; }
    }
  }
  console.log(`[course] ${poses.length} dominoes, min non-neighbor dist = ${Math.sqrt(minD).toFixed(2)}m @`, minPair);

  return { poses, segments, statics, forkIdx, mainCount };
}

/* ================= 球场环境 ================= */

function canvasTex(w, h, draw, opts = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (opts.repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...opts.repeat); }
  return t;
}

export function buildField(scene) {
  const env = {};

  // 草皮 + 全套球场画线(105×68,含边缘草坪裙边)
  const pitchTex = canvasTex(2100, 1360, (g, W, H) => {
    const S = 2100 / 121;                      // px per meter(含 8m 裙边)
    const px = (m) => (m + 60.5) * S;
    const pz = (m) => (m + 34) * (H / 68);
    for (let i = 0; i < 16; i++) {             // 条纹草皮
      g.fillStyle = i % 2 ? '#3d9b4f' : '#45a957';
      g.fillRect(i * (W / 16), 0, W / 16 + 1, H);
    }
    g.strokeStyle = '#f4f7f4'; g.lineWidth = 5; g.lineCap = 'round';
    const line = (x1, z1, x2, z2) => { g.beginPath(); g.moveTo(px(x1), pz(z1)); g.lineTo(px(x2), pz(z2)); g.stroke(); };
    // 边线 / 中线 / 中圈
    g.strokeRect(px(-52.5), pz(-34) + 3, 105 * S, H - 6);
    line(0, -34, 0, 34);
    g.beginPath(); g.arc(px(0), pz(0), 9.15 * S, 0, 6.29); g.stroke();
    g.fillStyle = '#f4f7f4';
    g.beginPath(); g.arc(px(0), pz(0), 6, 0, 6.29); g.fill();
    for (const sx of [-1, 1]) {                // 禁区 / 小禁区 / 点球点 / 弧
      const gx = 52.5 * sx;
      g.strokeRect(Math.min(px(gx), px(gx - 16.5 * sx)), pz(-20.15), 16.5 * S, 40.3 * (H / 68));
      g.strokeRect(Math.min(px(gx), px(gx - 5.5 * sx)), pz(-9.16), 5.5 * S, 18.32 * (H / 68));
      g.beginPath(); g.arc(px(gx - 11 * sx), pz(0), 5, 0, 6.29); g.fill();
      g.beginPath(); g.arc(px(gx - 11 * sx), pz(0), 9.15 * S, sx > 0 ? Math.PI * 0.63 : -Math.PI * 0.37, sx > 0 ? Math.PI * 1.37 : Math.PI * 0.37); g.stroke();
    }
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(121, 84), new THREE.MeshStandardMaterial({ map: pitchTex, roughness: 0.9 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // 球门 ×2
  const postMat = new THREE.MeshStandardMaterial({ color: 0xf2f4f6, roughness: 0.4, metalness: 0.3 });
  const netTex = canvasTex(128, 128, (g) => {
    g.clearRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(240,244,246,0.85)'; g.lineWidth = 1.6;
    for (let i = 0; i <= 128; i += 12) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke();
    }
  }, { repeat: [4, 2] });
  const netMat = new THREE.MeshBasicMaterial({ map: netTex, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  for (const sx of [-1, 1]) {
    const goal = new THREE.Group();
    const post = (x0, z0) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.44, 12), postMat);
      p.position.set(x0, 1.22, z0); p.castShadow = true;
      return p;
    };
    goal.add(post(0, -3.66), post(0, 3.66));
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 7.5, 12), postMat);
    bar.rotation.x = Math.PI / 2;
    bar.position.set(0, 2.44, 0); bar.castShadow = true;
    goal.add(bar);
    const netBack = new THREE.Mesh(new THREE.PlaneGeometry(7.32, 2.44), netMat);
    netBack.position.set(sx * 1.9, 1.22, 0);
    netBack.rotation.y = Math.PI / 2;
    goal.add(netBack);
    const netTop = new THREE.Mesh(new THREE.PlaneGeometry(1.95, 7.32), netMat);
    netTop.position.set(sx * 0.95, 2.42, 0);
    netTop.rotation.z = Math.PI / 2;
    netTop.rotation.y = Math.PI / 2;
    netTop.rotation.x = Math.PI / 2 - 0.25 * sx;
    goal.add(netTop);
    for (const sz of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.44), netMat);
      side.position.set(sx * 0.95, 1.22, sz * 3.66);
      goal.add(side);
    }
    goal.position.set(sx * 52.6, 0, 0);
    scene.add(goal);
  }

  // 看台 ×2(±z)+ 人群噪点
  const crowdTex = canvasTex(512, 128, (g) => {
    g.fillStyle = '#2b2f38'; g.fillRect(0, 0, 512, 128);
    const cols = ['#c95d4a', '#4a7fc9', '#c9b34a', '#58a06b', '#8a6fc9', '#d8dde2', '#3a3f47'];
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = cols[(Math.random() * cols.length) | 0];
      g.beginPath(); g.arc(Math.random() * 512, Math.random() * 128, 1.7, 0, 6.29); g.fill();
    }
  }, { repeat: [6, 1] });
  for (const sz of [-1, 1]) {
    const stand = new THREE.Group();
    for (let t = 0; t < 4; t++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(112, 2.2, 3.4),
        t % 2 ? new THREE.MeshStandardMaterial({ map: crowdTex, roughness: 0.9 })
              : new THREE.MeshStandardMaterial({ color: 0x39414c, roughness: 0.8 }));
      step.position.set(0, 1.1 + t * 1.9, sz * (45.5 + t * 3.2));
      step.castShadow = step.receiveShadow = true;
      stand.add(step);
    }
    scene.add(stand);
  }

  // 广告围栏(系列品牌客串)
  const adTex = canvasTex(2048, 64, (g) => {
    g.fillStyle = '#101318'; g.fillRect(0, 0, 2048, 64);
    const ads = [
      ['北极风空调 ARCTIC BREEZE', '#ff4d2e'],
      ['极夜电视 POLAR NIGHT', '#2fd6b5'],
      ['白夜五号 WHITE NIGHT V', '#6c8cff'],
      ['DOMINO PITCH · FIELD-105', '#46d06a'],
    ];
    ads.forEach(([txt, col], i) => {
      g.fillStyle = col;
      g.font = 'bold 30px "PingFang SC",sans-serif';
      g.fillText(txt, 40 + i * 512, 42);
    });
  }, { repeat: [1, 1] });
  for (const sz of [-1, 1]) {
    const board = new THREE.Mesh(new THREE.BoxGeometry(110, 1.1, 0.15),
      new THREE.MeshStandardMaterial({ map: adTex, roughness: 0.5 }));
    board.position.set(0, 0.55, sz * 40.5);
    board.castShadow = true;
    scene.add(board);
  }

  // 记分牌(北看台上方)
  const sc = document.createElement('canvas');
  sc.width = 1024; sc.height = 256;
  const sg = sc.getContext('2d');
  const scoreTex = new THREE.CanvasTexture(sc);
  scoreTex.colorSpace = THREE.SRGBColorSpace;
  const board = new THREE.Mesh(new THREE.BoxGeometry(24, 6, 0.6),
    [null, null, null, null, new THREE.MeshBasicMaterial({ map: scoreTex, toneMapped: false }), null]
      .map(m => m || new THREE.MeshStandardMaterial({ color: 0x14171c, roughness: 0.7 })));
  board.position.set(0, 13, -56);
  scene.add(board);
  const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 10, 10), new THREE.MeshStandardMaterial({ color: 0x39414c }));
  pole1.position.set(-8, 5, -56); scene.add(pole1);
  const pole2 = pole1.clone(); pole2.position.x = 8; scene.add(pole2);
  env.scoreboard = {
    draw(fallen, total, speed, elapsed, goal) {
      sg.fillStyle = '#0a0e14'; sg.fillRect(0, 0, 1024, 256);
      sg.strokeStyle = '#2a3240'; sg.lineWidth = 6; sg.strokeRect(6, 6, 1012, 244);
      if (goal) {
        sg.fillStyle = '#f2b544'; sg.font = 'bold 130px "PingFang SC",sans-serif';
        sg.textAlign = 'center'; sg.fillText('GOAL!!!', 512, 165); sg.textAlign = 'left';
      } else {
        sg.fillStyle = '#46d06a'; sg.font = 'bold 76px Menlo,monospace';
        sg.fillText(String(fallen).padStart(4, '0'), 60, 120);
        sg.fillStyle = '#8b93a1'; sg.font = '36px Menlo';
        sg.fillText('/ ' + total, 340, 118);
        sg.fillStyle = '#dde5ff'; sg.font = '34px "PingFang SC",sans-serif';
        sg.fillText(`波前 ${speed.toFixed(1)} m/s`, 560, 118);
        sg.fillStyle = '#8b93a1'; sg.font = '40px Menlo';
        sg.fillText(elapsed, 60, 210);
        sg.fillStyle = '#46d06a';
        sg.fillRect(320, 185, 620 * Math.min(1, fallen / total), 26);
        sg.strokeStyle = '#3a4152'; sg.strokeRect(320, 185, 620, 26);
      }
      scoreTex.needsUpdate = true;
    },
  };
  env.scoreboard.draw(0, 0, 0, '00:00.0', false);

  // 夜场灯柱 ×4
  env.floodMats = [];
  env.floodLights = [];
  for (const [fx, fz] of [[-56, -40], [56, -40], [-56, 40], [56, 40]]) {
    const pyl = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 22, 10), new THREE.MeshStandardMaterial({ color: 0x4a5160, roughness: 0.6 }));
    pole.position.y = 11; pole.castShadow = true;
    pyl.add(pole);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x39414c, emissive: 0xfff4d8, emissiveIntensity: 0 });
    const head = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.6, 0.5), headMat);
    head.position.set(0, 23, 0);
    head.lookAt(fx * 0.2, 0, fz * 0.2);
    pyl.add(head);
    pyl.position.set(fx, 0, fz);
    scene.add(pyl);
    env.floodMats.push(headMat);
    const sp = new THREE.SpotLight(0xfff2d8, 0, 160, 0.7, 0.5, 1.2);
    sp.position.set(fx, 23, fz);
    sp.target.position.set(fx * 0.15, 0, fz * 0.15);
    scene.add(sp, sp.target);
    env.floodLights.push(sp);
  }

  return env;
}
