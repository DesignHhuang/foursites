// 极夜 OLED 电视 —— 全部零件用 three.js 基础几何体手工建模
import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';

/* ---------------- canvas texture helpers ---------------- */

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

const TEX = {};

function buildTextures() {
  // 木地板
  TEX.wood = canvasTex(512, 256, (g) => {
    g.fillStyle = '#a87c56'; g.fillRect(0, 0, 512, 256);
    for (let y = 0; y < 256; y += 32) {
      for (let x = -64; x < 512; x += 128) {
        const off = (y / 32) % 2 ? 64 : 0;
        const h = Math.abs(Math.sin((x + y) * 3.7)) * 16;
        g.fillStyle = `rgb(${160 + h}, ${112 + h * 0.8}, ${74 + h * 0.6})`;
        g.fillRect(x + off, y, 126, 30);
      }
    }
    g.strokeStyle = 'rgba(84,56,36,0.5)'; g.lineWidth = 2;
    for (let y = 0; y <= 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  }, { repeat: [2, 2] });

  // 柜体木纹
  TEX.cabinet = canvasTex(256, 128, (g) => {
    g.fillStyle = '#8a6647'; g.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 40; i++) {
      const y = i * 3.5 + Math.sin(i) * 2;
      g.strokeStyle = `rgba(${100 + i % 3 * 10},${70 + i % 3 * 8},${46},0.35)`;
      g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(80, y + 3, 180, y - 3, 256, y + 2); g.stroke();
    }
  }, { repeat: [3, 1] });

  // 地毯
  TEX.rug = canvasTex(512, 352, (g) => {
    g.fillStyle = '#b5a48d'; g.fillRect(0, 0, 512, 352);
    g.strokeStyle = '#8f7f6a'; g.lineWidth = 10;
    g.strokeRect(18, 18, 476, 316);
    g.strokeStyle = '#2fd6b5'; g.lineWidth = 3;
    g.strokeRect(34, 34, 444, 284);
    g.strokeStyle = 'rgba(120,105,86,0.55)'; g.lineWidth = 2;
    for (let x = 60; x < 460; x += 44) {
      for (let y = 60; y < 300; y += 44) {
        g.beginPath();
        g.moveTo(x, y - 14); g.lineTo(x + 14, y); g.lineTo(x, y + 14); g.lineTo(x - 14, y);
        g.closePath(); g.stroke();
      }
    }
  });

  // 窗帘竖褶
  TEX.curtain = canvasTex(128, 256, (g) => {
    for (let x = 0; x < 128; x += 16) {
      const grad = g.createLinearGradient(x, 0, x + 16, 0);
      grad.addColorStop(0, '#5f7a72');
      grad.addColorStop(0.5, '#7b988f');
      grad.addColorStop(1, '#54695f');
      g.fillStyle = grad;
      g.fillRect(x, 0, 16, 256);
    }
  }, { repeat: [2, 1] });

  // 窗外城市
  TEX.city = canvasTex(512, 384, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 384);
    grad.addColorStop(0, '#1a2a44'); grad.addColorStop(1, '#31465e');
    g.fillStyle = grad; g.fillRect(0, 0, 512, 384);
    g.fillStyle = '#e8d9a8'; g.beginPath(); g.arc(430, 60, 22, 0, 6.29); g.fill();
    let x = 0; let i = 0;
    while (x < 512) {
      const w = 40 + (Math.abs(Math.sin(i * 7.3)) * 50) | 0;
      const h = 90 + (Math.abs(Math.sin(i * 3.1)) * 200) | 0;
      g.fillStyle = i % 2 ? '#101c2e' : '#152238';
      g.fillRect(x, 384 - h, w - 5, h);
      g.fillStyle = 'rgba(255,224,150,0.85)';
      for (let wx = x + 5; wx < x + w - 12; wx += 11) {
        for (let wy = 384 - h + 8; wy < 372; wy += 16) {
          if (Math.abs(Math.sin(wx * wy)) > 0.55) g.fillRect(wx, wy, 5, 7);
        }
      }
      x += w; i++;
    }
  });

  // 电路板
  TEX.pcb = canvasTex(256, 192, (g) => {
    g.fillStyle = '#14501f'; g.fillRect(0, 0, 256, 192);
    g.strokeStyle = '#2e8a4f'; g.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      const x = 10 + Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1) * 236;
      const y = 10 + Math.abs(Math.sin(i * 78.233) * 12543.123 % 1) * 172;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30, y); g.lineTo(x + 30, y + 22); g.stroke();
      g.fillStyle = '#c9a24a'; g.fillRect(x - 2, y - 2, 4, 4);
    }
    g.fillStyle = '#111';
    g.fillRect(30, 30, 52, 34); g.fillRect(150, 100, 64, 40); g.fillRect(100, 40, 30, 20);
    g.fillStyle = '#dfe3e8'; g.font = '11px Menlo,monospace';
    g.fillText('POLARNIGHT X9', 100, 178);
    g.fillStyle = '#c0c6cd';
    for (let x2 = 40; x2 < 220; x2 += 14) g.fillRect(x2, 148, 8, 10);
  });

  // 电源板(黄色玻纤)
  TEX.psu = canvasTex(256, 160, (g) => {
    g.fillStyle = '#8a6f2f'; g.fillRect(0, 0, 256, 160);
    g.strokeStyle = '#b99a4e'; g.lineWidth = 2;
    for (let i = 0; i < 18; i++) {
      const x = 12 + Math.abs(Math.sin(i * 9.1) % 1) * 230;
      const y = 12 + Math.abs(Math.sin(i * 5.7) % 1) * 136;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + 26, y); g.lineTo(x + 26, y + 18); g.stroke();
    }
    g.fillStyle = '#222'; g.fillRect(30, 40, 60, 50);
    g.fillStyle = '#dfe3e8'; g.font = '10px Menlo';
    g.fillText('AC 220V ⚡ CAUTION', 80, 150);
    g.fillStyle = '#c33'; g.fillRect(10, 140, 14, 12);
  });

  // 后壳散热格栅
  TEX.vents = canvasTex(256, 128, (g) => {
    g.fillStyle = '#1b1d20'; g.fillRect(0, 0, 256, 128);
    g.fillStyle = '#0d0e10';
    for (let x = 8; x < 248; x += 12) {
      for (let y = 10; y < 118; y += 18) g.fillRect(x, y, 6, 12);
    }
  });

  // 后壳铭牌
  TEX.nameplate = canvasTex(180, 90, (g) => {
    g.fillStyle = '#e8e9ea'; g.fillRect(0, 0, 180, 90);
    g.fillStyle = '#222'; g.font = 'bold 11px "PingFang SC",sans-serif';
    g.fillText('极夜 POLAR NIGHT', 10, 16);
    g.font = '8px "PingFang SC",sans-serif'; g.fillStyle = '#444';
    ['型号 OLED65X9  65″', '电源 220V~ 50Hz 380W', '面板 WOLED 3840×2160', 'GB 8898 · 中国制造'].forEach((s, i) => g.fillText(s, 10, 32 + i * 13));
    for (let x = 10; x < 90; x += 3) {
      if (Math.abs(Math.sin(x * 7.13)) > 0.4) { g.fillStyle = '#111'; g.fillRect(x, 74, 2, 12); }
    }
    g.strokeStyle = '#999'; g.strokeRect(1, 1, 178, 88);
  });

  // 品牌字(透明)
  TEX.logo = canvasTex(512, 80, (g) => {
    g.clearRect(0, 0, 512, 80);
    g.fillStyle = 'rgba(190,196,204,0.9)';
    g.font = '600 30px "PingFang SC",sans-serif';
    g.fillText('极夜', 20, 50);
    g.fillStyle = 'rgba(160,168,178,0.7)';
    g.font = '300 22px "Helvetica Neue",sans-serif';
    g.fillText('P O L A R  N I G H T', 96, 48);
  });

  // 遥控器
  TEX.remote = canvasTex(96, 288, (g) => {
    g.fillStyle = '#23262b'; g.fillRect(0, 0, 96, 288);
    const btn = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 6.29); g.fill(); };
    btn(48, 30, 11, '#c0392b');
    g.fillStyle = '#3a3f46'; g.beginPath(); g.arc(48, 108, 34, 0, 6.29); g.fill();
    g.fillStyle = '#565d66'; g.beginPath(); g.arc(48, 108, 14, 0, 6.29); g.fill();
    btn(24, 170, 9, '#3a3f46'); btn(72, 170, 9, '#3a3f46');
    btn(24, 200, 9, '#3a3f46'); btn(72, 200, 9, '#3a3f46');
    g.fillStyle = '#2fd6b5'; g.fillRect(30, 228, 36, 12);
    btn(24, 258, 9, '#3a3f46'); btn(72, 258, 9, '#3a3f46');
    g.fillStyle = '#9aa2ac'; g.font = '8px "PingFang SC",sans-serif';
    g.fillText('OK', 41, 112); g.fillText('极夜', 40, 237);
  });

  // 杂志封面
  TEX.magazine = canvasTex(128, 176, (g) => {
    g.fillStyle = '#e7e2d8'; g.fillRect(0, 0, 128, 176);
    g.fillStyle = '#2fd6b5'; g.fillRect(0, 0, 128, 42);
    g.fillStyle = '#0d1013'; g.font = 'bold 17px "PingFang SC",sans-serif';
    g.fillText('客厅志', 12, 28);
    g.fillStyle = '#8a94a0';
    g.fillRect(14, 60, 100, 66);
    g.fillStyle = '#5b6672'; g.beginPath();
    g.moveTo(14, 126); g.lineTo(50, 84); g.lineTo(80, 112); g.lineTo(114, 78); g.lineTo(114, 126);
    g.closePath(); g.fill();
    g.fillStyle = '#444'; g.font = '9px "PingFang SC",sans-serif';
    g.fillText('本期:如何优雅地藏起电线', 10, 150);
  });
}

/* ---------------- materials ---------------- */

const M = {
  glassBlack: () => new THREE.MeshPhysicalMaterial({ color: 0x07090b, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.06, metalness: 0.2 }),
  darkShell: () => new THREE.MeshStandardMaterial({ color: 0x1c1e21, roughness: 0.62 }),
  darkPlastic: () => new THREE.MeshStandardMaterial({ color: 0x2c2f34, roughness: 0.6 }),
  alu: () => new THREE.MeshStandardMaterial({ color: 0xcfd4d9, roughness: 0.35, metalness: 0.85 }),
  aluDark: () => new THREE.MeshStandardMaterial({ color: 0x6f767e, roughness: 0.4, metalness: 0.8 }),
  steel: () => new THREE.MeshStandardMaterial({ color: 0x9299a1, roughness: 0.45, metalness: 0.75 }),
  copper: () => new THREE.MeshStandardMaterial({ color: 0xc47a45, roughness: 0.3, metalness: 1.0 }),
  graphite: () => new THREE.MeshStandardMaterial({ color: 0x3a3d41, roughness: 0.5, metalness: 0.6 }),
  fabric: (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 }),
  wood: () => new THREE.MeshStandardMaterial({ map: TEX.cabinet, roughness: 0.65 }),
  white: () => new THREE.MeshStandardMaterial({ color: 0xf1f1ee, roughness: 0.6 }),
};

/* ---------------- mesh helpers ---------------- */

function mesh(geo, mat, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
const box = (w, h, d, mat, x, y, z) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z);
const rbox = (w, h, d, r, mat, x, y, z) => mesh(new RoundedBoxGeometry(w, h, d, 3, r), mat, x, y, z);

function cyl(rt, rb, h, mat, x, y, z, axis = 'y', seg = 24, opts = {}) {
  const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, opts.open || false, opts.t0 || 0, opts.tl || Math.PI * 2);
  if (axis === 'x') g.rotateZ(Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  return mesh(g, mat, x, y, z);
}

function tube(pts, r, mat, seg = 48) {
  const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
  const m = mesh(new THREE.TubeGeometry(curve, seg, r, 8), mat);
  m.userData.curve = curve;
  return m;
}

function grp(x = 0, y = 0, z = 0, ...children) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  children.forEach(c => g.add(c));
  return g;
}

function decal(w, h, tex, x, y, z, rx = 0, ry = 0, opts = {}) {
  const m = mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({
    map: tex, transparent: opts.alpha !== false, roughness: 0.6,
    polygonOffset: true, polygonOffsetFactor: -1,
  }), x, y, z);
  m.rotation.set(rx, ry, 0);
  m.castShadow = false;
  return m;
}

/* ================= WORLD ================= */

export function buildWorld() {
  buildTextures();
  const root = new THREE.Group();
  const parts = [];
  const anim = {};
  const env = { furnitureMats: [] };

  const TV_POS = new THREE.Vector3(0, 0.98, -0.16);
  const tvG = grp(TV_POS.x, TV_POS.y, TV_POS.z);
  const avG = grp(0, 0, 0);
  const exG = grp(0, 0, 0);
  root.add(tvG, avG, exG);

  const units = {
    tv: { group: tvG, base: TV_POS.clone(), vec: new THREE.Vector3(0, 0.40, 0.42) },
    av: { group: avG, base: new THREE.Vector3(), vec: new THREE.Vector3(0, 0, 0) },
    extras: { group: exG, base: new THREE.Vector3(), vec: new THREE.Vector3(0, 0, 0) },
  };

  function addPart(def, group) {
    def.group = group;
    def.home = group.position.clone();
    def.explode = new THREE.Vector3(...def.explode);
    units[def.unit].group.add(group);
    parts.push(def);
    return def;
  }

  function collectMats(obj, arr) {
    obj.traverse((o) => {
      if (o.isMesh) {
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (!arr.includes(m)) arr.push(m); });
      }
    });
  }

  /* ============ 环境:客厅 ============ */
  {
    // 展台
    const base = rbox(4.6, 0.12, 3.9, 0.035, new THREE.MeshStandardMaterial({ color: 0x25282d, roughness: 0.7 }), 0, -0.061, 0.85);
    root.add(base);
    // 木地板(墙前)
    root.add(box(4.3, 0.024, 3.1, new THREE.MeshStandardMaterial({ map: TEX.wood, roughness: 0.6 }), 0, 0.012, 1.12));

    // 墙(带窗洞)
    const ws = new THREE.Shape();
    ws.moveTo(-2.1, 0); ws.lineTo(2.1, 0); ws.lineTo(2.1, 2.5); ws.lineTo(-2.1, 2.5); ws.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-1.75, 0.9); hole.lineTo(-0.75, 0.9); hole.lineTo(-0.75, 2.05); hole.lineTo(-1.75, 2.05); hole.closePath();
    ws.holes.push(hole);
    const wallGeo = new THREE.ExtrudeGeometry(ws, { depth: 0.14, bevelEnabled: false });
    wallGeo.translate(0, 0, -0.57);
    const wallFace = new THREE.MeshStandardMaterial({ color: 0xded8cb, roughness: 0.9 });
    const wallCut = new THREE.MeshStandardMaterial({ color: 0xb5aea0, roughness: 0.9 });
    const wall = new THREE.Mesh(wallGeo, [wallFace, wallCut]);
    wall.castShadow = true; wall.receiveShadow = true;
    root.add(wall);
    // 踢脚线
    root.add(box(4.2, 0.08, 0.014, M.white(), 0, 0.064, -0.425));

    // 窗:框 + 中梃 + 玻璃 + 窗台
    const frameMat = M.white();
    const win = grp(-1.25, 1.475, -0.435);
    win.add(box(1.06, 0.05, 0.06, frameMat, 0, 0.60, 0));
    win.add(box(1.06, 0.05, 0.06, frameMat, 0, -0.60, 0));
    win.add(box(0.05, 1.15, 0.06, frameMat, -0.505, 0, 0));
    win.add(box(0.05, 1.15, 0.06, frameMat, 0.505, 0, 0));
    win.add(box(0.03, 1.15, 0.03, frameMat, 0, 0, 0));
    win.add(box(1.0, 0.03, 0.03, frameMat, 0, 0, 0));
    const glass = box(1.0, 1.15, 0.006, new THREE.MeshPhysicalMaterial({
      color: 0xaec6d4, roughness: 0.05, transparent: true, opacity: 0.16, side: THREE.DoubleSide,
    }), 0, 0, 0);
    glass.castShadow = false;
    win.add(glass);
    win.add(box(1.14, 0.03, 0.12, frameMat, 0, -0.635, 0.04));
    root.add(win);

    // 窗外城市(夜晚发光由 app 调节)
    const cityMat = new THREE.MeshBasicMaterial({ map: TEX.city, color: 0x8fa2b5 });
    const city = mesh(new THREE.PlaneGeometry(2.4, 1.8), cityMat, -1.25, 1.35, -1.45);
    city.castShadow = false; city.receiveShadow = false;
    root.add(city);
    env.cityMat = cityMat;

    // 窗帘
    const curMat = () => new THREE.MeshStandardMaterial({ map: TEX.curtain, roughness: 0.92, side: THREE.DoubleSide });
    const c1 = box(0.34, 1.72, 0.05, curMat(), -1.93, 1.32, -0.38);
    const c2 = box(0.30, 1.72, 0.05, curMat(), -0.60, 1.32, -0.38);
    root.add(c1, c2);
    root.add(cyl(0.012, 0.012, 1.65, M.aluDark(), -1.28, 2.22, -0.37, 'x', 12));
    root.add(mesh(new THREE.SphereGeometry(0.022, 12, 10), M.aluDark(), -2.11, 2.22, -0.37));
    root.add(mesh(new THREE.SphereGeometry(0.022, 12, 10), M.aluDark(), -0.45, 2.22, -0.37));

    // 电视柜
    const cab = grp(0, 0, 0);
    cab.add(rbox(1.78, 0.413, 0.52, 0.012, M.wood(), 0, 0.2305, -0.17));
    const shelfIn = box(0.72, 0.30, 0.46, new THREE.MeshStandardMaterial({ color: 0x4a3826, roughness: 0.8 }), 0.42, 0.245, -0.185);
    cab.add(shelfIn);
    cab.add(box(0.68, 0.014, 0.44, M.wood(), 0.42, 0.245, -0.19));
    // 抽屉面板 ×2(左侧)
    cab.add(rbox(0.78, 0.155, 0.016, 0.004, new THREE.MeshStandardMaterial({ color: 0x9c7451, roughness: 0.6 }), -0.44, 0.315, 0.082));
    cab.add(rbox(0.78, 0.155, 0.016, 0.004, new THREE.MeshStandardMaterial({ color: 0x9c7451, roughness: 0.6 }), -0.44, 0.148, 0.082));
    cab.add(box(0.16, 0.012, 0.02, M.aluDark(), -0.44, 0.315, 0.094));
    cab.add(box(0.16, 0.012, 0.02, M.aluDark(), -0.44, 0.148, 0.094));
    for (const [lx, lz] of [[-0.82, 0.02], [0.82, 0.02], [-0.82, -0.40], [0.82, -0.40]]) {
      cab.add(cyl(0.016, 0.012, 0.05, M.aluDark(), lx, 0.049, lz, 'y', 10));
    }
    root.add(cab);

    // 地毯
    const rug = mesh(new RoundedBoxGeometry(2.3, 0.014, 1.55, 3, 0.007),
      new THREE.MeshStandardMaterial({ map: TEX.rug, roughness: 0.95 }), 0.1, 0.031, 1.28);
    root.add(rug);

    // 沙发
    const sofaC = 0x8a8378;
    const sofa = grp(0.12, 0, 2.22);
    sofa.add(rbox(1.96, 0.30, 0.88, 0.05, M.fabric(sofaC), 0, 0.24, 0));
    const backC = rbox(1.96, 0.52, 0.24, 0.05, M.fabric(sofaC), 0, 0.55, 0.36);
    backC.rotation.x = -0.10;
    sofa.add(backC);
    sofa.add(rbox(0.24, 0.50, 0.86, 0.05, M.fabric(sofaC), -0.98, 0.42, 0.03));
    sofa.add(rbox(0.24, 0.50, 0.86, 0.05, M.fabric(sofaC), 0.98, 0.42, 0.03));
    for (const sx of [-0.58, 0, 0.58]) {
      sofa.add(rbox(0.55, 0.13, 0.6, 0.04, M.fabric(0x938c80), sx, 0.435, -0.05));
    }
    const pil1 = rbox(0.34, 0.34, 0.1, 0.05, M.fabric(0x2fae97), -0.68, 0.62, 0.28);
    pil1.rotation.z = 0.18; pil1.rotation.x = -0.2;
    const pil2 = rbox(0.34, 0.34, 0.1, 0.05, M.fabric(0xc9a24a), 0.66, 0.62, 0.28);
    pil2.rotation.z = -0.22; pil2.rotation.x = -0.2;
    sofa.add(pil1, pil2);
    for (const [lx, lz] of [[-0.9, -0.35], [0.9, -0.35], [-0.9, 0.38], [0.9, 0.38]]) {
      sofa.add(cyl(0.02, 0.015, 0.09, M.aluDark(), lx, 0.045, lz, 'y', 10));
    }
    root.add(sofa);

    // 茶几 + 杂志 + 马克杯
    const table = grp(0.15, 0, 1.12);
    table.add(rbox(0.92, 0.035, 0.52, 0.01, M.wood(), 0, 0.415, 0));
    table.add(rbox(0.84, 0.02, 0.44, 0.008, new THREE.MeshStandardMaterial({ color: 0x6b5138, roughness: 0.7 }), 0, 0.18, 0));
    for (const [lx, lz] of [[-0.4, -0.2], [0.4, -0.2], [-0.4, 0.2], [0.4, 0.2]]) {
      table.add(cyl(0.012, 0.012, 0.40, M.aluDark(), lx, 0.2, lz, 'y', 10));
    }
    const mag = box(0.20, 0.005, 0.27, new THREE.MeshStandardMaterial({ map: TEX.magazine, roughness: 0.7 }), -0.18, 0.436, 0.02);
    mag.rotation.y = 0.3;
    table.add(mag);
    const mug = grp(0.12, 0.433, -0.12);
    mug.add(cyl(0.033, 0.03, 0.078, M.white(), 0, 0.039, 0, 'y', 18));
    const handle = mesh(new THREE.TorusGeometry(0.022, 0.006, 8, 16), M.white(), 0.036, 0.042, 0);
    handle.rotation.y = Math.PI / 2;
    mug.add(handle);
    table.add(mug);
    root.add(table);

    // 落地灯
    const lamp = grp(-1.52, 0.024, 1.42);
    lamp.add(cyl(0.14, 0.15, 0.02, M.aluDark(), 0, 0.01, 0, 'y', 24));
    lamp.add(cyl(0.011, 0.011, 1.42, M.aluDark(), 0, 0.73, 0, 'y', 12));
    const shade = cyl(0.115, 0.165, 0.26, new THREE.MeshStandardMaterial({
      color: 0xe9dfc9, roughness: 0.9, side: THREE.DoubleSide, emissive: 0xffd9a0, emissiveIntensity: 0,
    }), 0, 1.52, 0, 'y', 24, { open: true });
    shade.castShadow = false;
    lamp.add(shade);
    root.add(lamp);
    env.lampShadeMat = shade.material;
    env.lampPos = new THREE.Vector3(-1.52, 1.52, 1.42);

    // 绿植
    const plant = grp(1.72, 0.024, 0.08);
    plant.add(cyl(0.085, 0.065, 0.17, new THREE.MeshStandardMaterial({ color: 0xa85f3f, roughness: 0.8 }), 0, 0.085, 0));
    plant.add(cyl(0.013, 0.017, 0.26, new THREE.MeshStandardMaterial({ color: 0x6b5138, roughness: 0.9 }), 0, 0.28, 0));
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f7d4e, roughness: 0.75 });
    [[0, 0.5, 0, 0.14], [-0.1, 0.4, 0.03, 0.09], [0.09, 0.4, -0.04, 0.10], [0.02, 0.58, 0.05, 0.08]].forEach(([x, y, z, r]) => {
      const s = mesh(new THREE.SphereGeometry(r, 12, 10), leafMat, x, y, z);
      s.scale.y = 0.85; plant.add(s);
    });
    root.add(plant);

    // 置物架 + 书
    const shelves = grp(1.28, 0, -0.415);
    shelves.add(box(0.72, 0.026, 0.17, M.wood(), 0, 1.62, 0.085));
    shelves.add(box(0.72, 0.026, 0.17, M.wood(), 0, 1.22, 0.085));
    const bookCols = [0xc0574f, 0x2f6f8f, 0xc9a24a, 0x4a7c59, 0x7a5f8a, 0x9c9c94];
    let bx = -0.28;
    bookCols.forEach((c, i) => {
      const h = 0.14 + (i % 3) * 0.02;
      const b = box(0.028, h, 0.12, M.fabric(c), bx, 1.233 + h / 2, 0.08);
      b.rotation.z = i === 4 ? -0.12 : 0;
      shelves.add(b);
      bx += 0.045;
    });
    shelves.add(cyl(0.035, 0.028, 0.06, M.white(), 0.24, 1.665, 0.08, 'y', 14));
    shelves.add(mesh(new THREE.SphereGeometry(0.045, 10, 8), M.fabric(0x4a7c59), 0.24, 1.72, 0.08));
    shelves.add(rbox(0.11, 0.14, 0.012, 0.004, new THREE.MeshStandardMaterial({ color: 0x3a3025, roughness: 0.6 }), -0.18, 1.71, 0.08));
    root.add(shelves);

    // 墙上电源插座
    root.add(rbox(0.075, 0.075, 0.016, 0.004, M.white(), -0.95, 0.16, -0.422));

    // 可隐藏家具材质
    [sofa, table, rug, lamp, plant, shelves].forEach(o => collectMats(o, env.furnitureMats));
  }

  /* ============ 电视零件(组内坐标 = 面板中心) ============ */

  // 01 OLED 面板
  {
    const g = grp(0, 0, 0.020);
    g.add(box(1.446, 0.834, 0.005, M.glassBlack(), 0, 0, 0));
    // 屏幕显示面(动态画布)
    const sc = document.createElement('canvas');
    sc.width = 960; sc.height = 540;
    const sg = sc.getContext('2d');
    const stex = new THREE.CanvasTexture(sc);
    stex.colorSpace = THREE.SRGBColorSpace;
    stex.anisotropy = 8;
    const smat = new THREE.MeshBasicMaterial({ map: stex, toneMapped: false });
    const screen = mesh(new THREE.PlaneGeometry(1.412, 0.795), smat, 0, 0, 0.0032);
    screen.castShadow = false;
    g.add(screen);

    // 星星(演示模式用,固定种子)
    const stars = [];
    for (let i = 0; i < 90; i++) {
      stars.push([Math.abs(Math.sin(i * 12.9)) % 1 * 960, Math.abs(Math.sin(i * 5.3)) % 1 * 260, (i % 3) + 1]);
    }
    let osdVol = -1, osdUntil = 0;
    const api = {
      osd(vol, until) { osdVol = vol; osdUntil = until; },
      brightness: 0.35,
      draw(on, source, t) {
        const W = 960, H = 540;
        if (!on) {
          sg.fillStyle = '#020304'; sg.fillRect(0, 0, W, H);
          const sheen = sg.createLinearGradient(0, 0, W, H);
          sheen.addColorStop(0.3, 'rgba(255,255,255,0)');
          sheen.addColorStop(0.5, 'rgba(160,190,210,0.05)');
          sheen.addColorStop(0.7, 'rgba(255,255,255,0)');
          sg.fillStyle = sheen; sg.fillRect(0, 0, W, H);
          api.brightness = 0;
          stex.needsUpdate = true;
          return;
        }
        if (source === 'demo') {
          const grad = sg.createLinearGradient(0, 0, 0, H);
          grad.addColorStop(0, '#030818'); grad.addColorStop(0.7, '#0a1a33'); grad.addColorStop(1, '#0d2440');
          sg.fillStyle = grad; sg.fillRect(0, 0, W, H);
          stars.forEach(([x, y, r], i) => {
            sg.fillStyle = `rgba(255,255,255,${0.3 + 0.5 * Math.abs(Math.sin(t * 1.6 + i))})`;
            sg.fillRect(x, y, r, r);
          });
          sg.fillStyle = '#dfe8ee'; sg.beginPath(); sg.arc(800, 90, 26, 0, 6.29); sg.fill();
          sg.globalCompositeOperation = 'lighter';
          const bands = [['47,214,181', 0], ['110,231,183', 1.4], ['147,112,219', 2.6]];
          bands.forEach(([col, ph], bi) => {
            sg.beginPath();
            sg.moveTo(0, H);
            for (let x = 0; x <= W; x += 24) {
              sg.lineTo(x, 190 + bi * 34 + Math.sin(x * 0.006 + t * 0.7 + ph) * 46 + Math.sin(x * 0.017 - t * 0.5) * 18);
            }
            sg.lineTo(W, H);
            sg.closePath();
            const bg = sg.createLinearGradient(0, 120, 0, 420);
            bg.addColorStop(0, `rgba(${col},0.30)`); bg.addColorStop(1, `rgba(${col},0)`);
            sg.fillStyle = bg; sg.fill();
          });
          sg.globalCompositeOperation = 'source-over';
          sg.fillStyle = '#050b14';
          sg.beginPath(); sg.moveTo(0, 540);
          sg.lineTo(0, 430); sg.lineTo(140, 360); sg.lineTo(300, 445); sg.lineTo(470, 340);
          sg.lineTo(650, 452); sg.lineTo(800, 385); sg.lineTo(960, 460); sg.lineTo(960, 540);
          sg.closePath(); sg.fill();
          sg.fillStyle = 'rgba(230,240,246,0.85)'; sg.font = '300 34px "Helvetica Neue",sans-serif';
          sg.fillText('21:36', 48, 82);
          sg.font = '13px "PingFang SC",sans-serif'; sg.fillStyle = 'rgba(200,214,224,0.5)';
          sg.fillText('极夜 · OLED 演示影片', 48, 106);
          api.brightness = 0.35;
        } else if (source === 'bars') {
          const cols = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0', '#131313'];
          const bw = W / cols.length;
          cols.forEach((c, i) => { sg.fillStyle = c; sg.fillRect(i * bw, 0, bw + 1, H * 0.78); });
          sg.fillStyle = '#080808'; sg.fillRect(0, H * 0.78, W, H * 0.22);
          for (let i = 0; i < 32; i++) {
            const v = Math.round(i / 31 * 255);
            sg.fillStyle = `rgb(${v},${v},${v})`;
            sg.fillRect(40 + i * 22, H * 0.82, 22, 36);
          }
          sg.fillStyle = '#e8e8e8'; sg.font = '15px Menlo,monospace';
          sg.fillText('SIGNAL 3840×2160 · 120 Hz · 10bit BT.2020', 46, H - 24);
          api.brightness = 0.8;
        } else if (source === 'game') {
          sg.fillStyle = '#0c0518'; sg.fillRect(0, 0, W, H);
          const hy = 300;
          const sun = sg.createLinearGradient(0, 120, 0, hy);
          sun.addColorStop(0, '#ff9a5c'); sun.addColorStop(1, '#c86cff');
          sg.fillStyle = sun;
          sg.beginPath(); sg.arc(480, hy - 10, 110, Math.PI, 0); sg.closePath(); sg.fill();
          sg.fillStyle = '#0c0518';
          for (let i = 0; i < 5; i++) sg.fillRect(370, hy - 24 - i * 26, 220, 8);
          sg.strokeStyle = 'rgba(200,108,255,0.7)'; sg.lineWidth = 2;
          for (let i = -9; i <= 9; i++) {
            sg.beginPath(); sg.moveTo(480 + i * 26, hy); sg.lineTo(480 + i * 190, H); sg.stroke();
          }
          const off = (t * 1.6) % 1;
          for (let i = 0; i < 9; i++) {
            const k = Math.pow((i + off) / 9, 2.2);
            sg.beginPath(); sg.moveTo(0, hy + k * 240); sg.lineTo(W, hy + k * 240); sg.stroke();
          }
          sg.fillStyle = '#2fd6b5';
          sg.beginPath();
          sg.moveTo(480, 470); sg.lineTo(510, 505); sg.lineTo(480, 497); sg.lineTo(450, 505);
          sg.closePath(); sg.fill();
          sg.fillStyle = '#f5e6ff'; sg.font = 'bold 20px Menlo,monospace';
          sg.fillText('SCORE 042180', 40, 52);
          sg.fillText('120 FPS', 830, 52);
          api.brightness = 0.5;
        }
        // 音量 OSD
        if (t < osdUntil) {
          sg.fillStyle = 'rgba(10,14,18,0.82)';
          sg.beginPath(); sg.roundRect(280, 460, 400, 46, 10); sg.fill();
          sg.fillStyle = '#2fd6b5';
          sg.font = '16px "PingFang SC",sans-serif';
          sg.fillText('音量', 300, 489);
          sg.fillStyle = 'rgba(255,255,255,0.2)'; sg.fillRect(348, 476, 280, 14);
          sg.fillStyle = '#2fd6b5'; sg.fillRect(348, 476, 280 * (osdVol / 30), 14);
          sg.fillStyle = '#e8f6f2'; sg.font = '15px Menlo'; sg.fillText(String(osdVol), 640, 489);
        }
        stex.needsUpdate = true;
      },
    };
    api.draw(false, 'demo', 0);
    anim.screen = api;
    anim.screenWorldPos = new THREE.Vector3(0, 0.98, -0.135);
    addPart({
      id: 'tv-panel', cn: 'OLED 面板', en: 'OLED Panel', unit: 'tv', phase: '屏幕',
      explode: [0, 0.05, 1.30],
      blurb: '830 万个自发光像素,不需要背光,黑就是纯粹的黑。整块面板连玻璃才 5 毫米厚,是全机最贵、也是唯一碎了就等于换电视的零件。',
      spec: '65″ WOLED · 3840×2160 · 120 Hz · 10bit',
    }, g);
  }

  // 02 源极驱动排线
  {
    const g = grp(0, -0.395, 0.012);
    for (let i = 0; i < 12; i++) {
      g.add(box(0.048, 0.030, 0.0012, M.copper(), -0.616 + i * 0.112, 0.012, 0));
    }
    const bMat = new THREE.MeshStandardMaterial({ map: TEX.pcb, roughness: 0.6 });
    g.add(box(0.56, 0.034, 0.003, bMat, -0.31, -0.018, -0.002));
    g.add(box(0.56, 0.034, 0.003, bMat, 0.31, -0.018, -0.002));
    addPart({
      id: 'tv-cof', cn: '源极驱动排线', en: 'Source COF Flex', unit: 'tv', phase: '屏幕',
      explode: [0, -0.32, 1.05],
      blurb: '十二条柔性覆晶薄膜把 T-CON 的信号"缝"进面板,弯折半径以毫米计。拆机翻车率最高的就是它们——扯断一条,竖着一列像素就永远黑了。',
      spec: 'COF ×12 · 邦定工艺 · 不可单独更换',
    }, g);
  }

  // 03 T-CON 时序控制板
  {
    const g = grp(0, 0.08, 0.011);
    g.add(box(0.27, 0.115, 0.004, new THREE.MeshStandardMaterial({ map: TEX.pcb, roughness: 0.55 }), 0, 0, 0));
    g.add(box(0.20, 0.085, 0.002, M.alu(), 0, 0, 0.004));
    g.add(box(0.055, 0.012, 0.003, M.darkPlastic(), -0.10, -0.063, 0));
    g.add(box(0.055, 0.012, 0.003, M.darkPlastic(), 0.10, -0.063, 0));
    addPart({
      id: 'tv-tcon', cn: 'T-CON 时序板', en: 'Timing Controller', unit: 'tv', phase: '屏幕',
      explode: [0, 0.28, 0.92],
      blurb: '把主板送来的整帧画面,翻译成每一行每一列像素的开关节拍。120 Hz 下它每秒要调度近 20 亿次子像素刷新,顶上那块铝片就是给它退烧的。',
      spec: '8K 带宽 · 屏蔽罩 · 双 LVDS 输入',
    }, g);
  }

  // 04 石墨散热膜
  {
    const g = grp(0, 0, 0.007);
    g.add(box(1.40, 0.79, 0.0016, M.graphite(), 0, 0, 0));
    addPart({
      id: 'tv-graphite', cn: '石墨散热膜', en: 'Graphite Sheet', unit: 'tv', phase: '屏幕',
      explode: [0, 0.02, 0.78],
      blurb: 'OLED 怕热,更怕热得不均匀——长期局部高温就是烧屏的起点。整片石墨膜把热量横向摊平,是面板背后无名的保镖。',
      spec: '导热 1500 W/m·K(横向) · 0.1 mm',
    }, g);
  }

  // 05 中框
  {
    const g = grp(0, 0, 0.017);
    const fm = M.aluDark();
    g.add(box(1.452, 0.012, 0.012, fm, 0, 0.4225, 0));
    g.add(box(1.452, 0.012, 0.012, fm, 0, -0.4225, 0));
    g.add(box(0.012, 0.834, 0.012, fm, -0.72, 0, 0));
    g.add(box(0.012, 0.834, 0.012, fm, 0.72, 0, 0));
    addPart({
      id: 'tv-midframe', cn: '中框', en: 'Mid Frame', unit: 'tv', phase: '屏幕',
      explode: [0, 0.02, 0.62],
      blurb: '一圈铝合金,把 5 毫米的玻璃面板绷得笔直。你从正面看到的那道细边,就是它。',
      spec: '铝合金 · 阳极氧化',
    }, g);
  }

  // 06 金属背板
  {
    const g = grp(0, 0, 0);
    g.add(box(1.442, 0.826, 0.006, M.steel(), 0, 0, 0));
    for (const ry of [-0.25, 0, 0.25]) g.add(box(1.30, 0.03, 0.004, M.steel(), 0, ry, -0.005));
    for (const [vx, vy] of [[-0.2, 0.1], [0.2, 0.1], [-0.2, -0.2], [0.2, -0.2]]) {
      g.add(cyl(0.011, 0.011, 0.01, M.steel(), vx, vy, -0.006, 'z', 10));
    }
    addPart({
      id: 'tv-backplate', cn: '金属背板', en: 'Rear Chassis', unit: 'tv', phase: '屏幕',
      explode: [0, 0.02, 0.45],
      blurb: '冲压钢板,整台电视的脊椎:面板贴在它前面,所有电路板拧在它后面,壁挂孔也开在它身上。',
      spec: '冲压钢板 0.8 mm · VESA 300×200',
    }, g);
  }

  // 07 电源板
  {
    const g = grp(-0.34, -0.19, -0.020);
    g.add(box(0.30, 0.175, 0.004, new THREE.MeshStandardMaterial({ map: TEX.psu, roughness: 0.6 }), 0, 0, 0));
    for (const [cx, cy] of [[-0.09, 0.03], [-0.05, 0.03], [-0.01, 0.03]]) {
      g.add(cyl(0.0125, 0.0125, 0.032, M.darkShell(), cx, cy, -0.018, 'z', 14));
    }
    g.add(box(0.052, 0.045, 0.03, M.darkShell(), 0.07, 0.02, -0.017));
    for (let i = 0; i < 4; i++) g.add(box(0.0025, 0.05, 0.024, M.alu(), 0.115 + i * 0.007, -0.045, -0.014));
    addPart({
      id: 'tv-psu', cn: '电源板', en: 'Power Supply', unit: 'tv', phase: '电路',
      explode: [-0.42, -0.02, 0.30],
      blurb: '220 V 进,各路直流出,峰值要喂饱 380 W。断电之后大电容里仍存着上百伏,维修行规:先放电,再动手。',
      spec: '输入 220 V~ · 峰值 380 W · PFC',
    }, g);
  }

  // 08 主板
  {
    const g = grp(0.34, -0.19, -0.018);
    g.add(box(0.32, 0.19, 0.004, new THREE.MeshStandardMaterial({ map: TEX.pcb, roughness: 0.55 }), 0, 0, 0));
    g.add(box(0.06, 0.05, 0.012, M.aluDark(), -0.03, 0.03, -0.009));
    g.add(box(0.03, 0.014, 0.004, M.darkShell(), 0.06, 0.05, -0.004));
    g.add(box(0.03, 0.014, 0.004, M.darkShell(), 0.06, 0.01, -0.004));
    for (let i = 0; i < 4; i++) {
      g.add(box(0.022, 0.009, 0.014, M.alu(), 0.145, 0.062 - i * 0.026, -0.008));
    }
    g.add(box(0.02, 0.014, 0.01, M.alu(), 0.145, -0.05, -0.006));
    addPart({
      id: 'tv-main', cn: '主板', en: 'Main Board', unit: 'tv', phase: '电路',
      explode: [0.42, -0.02, 0.30],
      blurb: 'SoC、内存和四个 HDMI 2.1 都在这。你换台,是它在解码;画质引擎逐帧插补降噪,也是它在算。电视的"智能"二字,全押在这块板上。',
      spec: '四核 A73 · 4 GB · HDMI 2.1 ×4 · Wi-Fi 6',
    }, g);
  }

  // 09 Wi-Fi 模块
  {
    const g = grp(0, 0.30, -0.010);
    g.add(box(0.095, 0.024, 0.003, new THREE.MeshStandardMaterial({ map: TEX.pcb, roughness: 0.55 }), 0, 0, 0));
    g.add(box(0.018, 0.008, 0.001, M.alu(), -0.06, 0.008, 0));
    g.add(box(0.018, 0.008, 0.001, M.alu(), 0.06, 0.008, 0));
    addPart({
      id: 'tv-wifi', cn: 'Wi-Fi / 蓝牙模块', en: 'Wireless Module', unit: 'tv', phase: '电路',
      explode: [0, 0.30, 0.32],
      blurb: '双天线小板,装在整机最高处、离金属背板最远的位置——追剧的码率和语音遥控的灵敏,都指望它信号好。',
      spec: 'Wi-Fi 6 2×2 · BT 5.2',
    }, g);
  }

  // 10 红外与按键板
  {
    const g = grp(0, -0.405, 0.006);
    g.add(box(0.115, 0.018, 0.003, new THREE.MeshStandardMaterial({ map: TEX.pcb, roughness: 0.55 }), 0, 0, 0));
    g.add(cyl(0.004, 0.004, 0.006, M.darkShell(), -0.03, 0, 0.004, 'z', 10));
    const led = box(0.006, 0.004, 0.003, new THREE.MeshStandardMaterial({
      color: 0x330a08, emissive: 0xff2a1a, emissiveIntensity: 0,
    }), 0.03, 0, 0.0035);
    led.castShadow = false;
    g.add(led);
    anim.standbyLedMat = led.material;
    addPart({
      id: 'tv-ir', cn: '红外与按键板', en: 'IR & Button Board', unit: 'tv', phase: '电路',
      explode: [0, -0.36, 0.40],
      blurb: '屏幕下沿的小板:红外接收头、待机指示灯,和全机唯一一颗实体按键。遥控器找不到的时候,你戳的就是它。',
      spec: 'IR 38 kHz · 五向摇杆键 ×1',
    }, g);
  }

  // 11 扬声器 ×2
  {
    const g = grp(0, -0.385, -0.022);
    for (const sx of [-1, 1]) {
      const sp = grp(sx * 0.44, 0, 0);
      sp.add(rbox(0.19, 0.052, 0.034, 0.006, M.darkShell(), 0, 0, 0));
      sp.add(cyl(0.017, 0.017, 0.003, M.graphite(), -0.05 * sx, -0.027, 0, 'y', 16));
      sp.add(cyl(0.017, 0.017, 0.003, M.graphite(), 0.03 * sx, -0.027, 0, 'y', 16));
      g.add(sp);
    }
    addPart({
      id: 'tv-speakers', cn: '扬声器 ×2', en: 'Speakers', unit: 'tv', phase: '声学',
      explode: [0, -0.30, 0.22], sub: null,
      blurb: '一对向下发声的全频单元,声音先打在柜面再反射进人耳——这是薄电视共同的妥协,也是回音壁存在的理由。',
      spec: '10 W ×2 · 全频 · 下出声',
    }, g);
  }

  // 12 低音单元
  {
    const g = grp(0, -0.10, -0.028);
    g.add(rbox(0.24, 0.15, 0.044, 0.01, M.darkShell(), 0, 0, 0));
    for (const sx of [-0.055, 0.055]) {
      g.add(cyl(0.042, 0.028, 0.012, M.graphite(), sx, 0, -0.022, 'z', 20));
      g.add(cyl(0.012, 0.012, 0.006, M.aluDark(), sx, 0, -0.028, 'z', 12));
    }
    addPart({
      id: 'tv-woofer', cn: '低音单元', en: 'Woofer Box', unit: 'tv', phase: '声学',
      explode: [0, 0.30, 0.30],
      blurb: '藏在背部的独立低音腔,负责 80–200 Hz 的那份厚度。看爆炸大片时茶几的轻微震动,出处在这。',
      spec: '20 W · 密闭腔体 · 双振膜',
    }, g);
  }

  // 13 接口盖板
  {
    const g = grp(0.55, -0.16, -0.052);
    g.add(rbox(0.16, 0.13, 0.006, 0.003, M.darkShell(), 0, 0, 0));
    g.add(cyl(0.004, 0.004, 0.004, M.graphite(), -0.05, -0.045, -0.004, 'z', 8));
    g.add(cyl(0.004, 0.004, 0.004, M.graphite(), 0.05, -0.045, -0.004, 'z', 8));
    addPart({
      id: 'tv-portcover', cn: '接口盖板', en: 'Port Cover', unit: 'tv', phase: '整机',
      explode: [0.34, -0.02, -0.24], fly: [0.5, 0.9, 0.6],
      blurb: '盖住 HDMI 和电源的检修小门,顺便管住线缆走向。装完这块,理线强迫症才算安心。',
      spec: 'ABS · 免工具卡扣',
    }, g);
  }

  // 14 后壳
  {
    const g = grp(0, 0, -0.012);
    g.add(rbox(1.45, 0.47, 0.010, 0.003, M.darkShell(), 0, 0.185, 0));
    g.add(rbox(1.45, 0.40, 0.05, 0.008, M.darkShell(), 0, -0.222, -0.022));
    const vents = decal(0.62, 0.14, TEX.vents, -0.30, -0.21, -0.0475, 0, Math.PI, { alpha: false });
    g.add(vents);
    const vents2 = decal(0.62, 0.14, TEX.vents, 0.30, -0.21, -0.0475, 0, Math.PI, { alpha: false });
    g.add(vents2);
    const np = decal(0.11, 0.055, TEX.nameplate, -0.55, -0.30, -0.048, 0, Math.PI, { alpha: false });
    g.add(np);
    const lg = decal(0.20, 0.030, TEX.logo, 0.55, 0.32, -0.0065, 0, Math.PI);
    g.add(lg);
    addPart({
      id: 'tv-back', cn: '后壳', en: 'Back Cover', unit: 'tv', phase: '整机',
      explode: [0, 0.02, -0.20], fly: [0.2, 1.0, 0.7],
      blurb: '上半薄如画框,下半是装着全部电路的"双肩包"。散热格栅的位置正对电源板——夏天摸这里是温的,属于正常发挥。',
      spec: '工程塑料 · 上 8 mm / 下 52 mm',
    }, g);
  }

  // 15 底座立柱
  {
    const g = grp(0, -0.470, -0.012);
    const neck = mesh(new THREE.BoxGeometry(0.17, 0.115, 0.046), M.aluDark(), 0, 0, 0);
    neck.geometry = new RoundedBoxGeometry(0.17, 0.115, 0.046, 3, 0.008);
    g.add(neck);
    g.add(box(0.20, 0.010, 0.06, M.aluDark(), 0, -0.062, 0.004));
    addPart({
      id: 'tv-neck', cn: '底座立柱', en: 'Stand Neck', unit: 'tv', phase: '整机',
      explode: [0, -0.34, 0.28], fly: [0.3, 0.8, 0.8],
      blurb: '铝合金颈椎,以四颗 M6 螺丝托住 24 公斤的整机。壁挂党永远用不到它,底座党全指望它。',
      spec: '压铸铝 · M6 ×4',
    }, g);
  }

  // 16 底座底盘
  {
    const g = grp(0, -0.536, 0.0);
    g.add(rbox(0.38, 0.015, 0.25, 0.006, M.aluDark(), 0, 0, 0));
    for (const [px, pz] of [[-0.16, -0.10], [0.16, -0.10], [-0.16, 0.10], [0.16, 0.10]]) {
      g.add(cyl(0.014, 0.014, 0.004, M.graphite(), px, -0.009, pz, 'y', 10));
    }
    addPart({
      id: 'tv-base', cn: '底座底盘', en: 'Base Plate', unit: 'tv', phase: '整机',
      explode: [0, -0.52, 0.34], fly: [0.4, 0.7, 0.9],
      blurb: '一整块配重钢板,电视稳不稳全看它。底面四个防滑垫,顺手保护了柜面的漆。',
      spec: '钢板 4.2 kg · 防滑垫 ×4',
    }, g);
  }

  /* ============ 影音外设 ============ */

  // 17 回音壁
  {
    const g = grp(0, 0.472, 0.03);
    g.add(rbox(0.95, 0.062, 0.095, 0.02, new THREE.MeshStandardMaterial({ color: 0x24272c, roughness: 0.85 }), 0, 0, 0));
    g.add(cyl(0.031, 0.031, 0.012, M.aluDark(), -0.475, 0, 0, 'x', 18));
    g.add(cyl(0.031, 0.031, 0.012, M.aluDark(), 0.475, 0, 0, 'x', 18));
    // EQ 律动显示窗(动态画布)
    const ec = document.createElement('canvas');
    ec.width = 128; ec.height = 40;
    const eg = ec.getContext('2d');
    const etex = new THREE.CanvasTexture(ec);
    etex.colorSpace = THREE.SRGBColorSpace;
    const emat = new THREE.MeshBasicMaterial({ map: etex, toneMapped: false });
    const ew = mesh(new THREE.PlaneGeometry(0.13, 0.036), emat, 0.30, 0, 0.0478);
    ew.castShadow = false;
    g.add(ew);
    anim.soundbar = {
      draw(on, t, vol) {
        eg.fillStyle = '#0a0c0e'; eg.fillRect(0, 0, 128, 40);
        if (on) {
          eg.fillStyle = '#2fd6b5';
          for (let i = 0; i < 14; i++) {
            const h = 6 + Math.abs(Math.sin(t * 6 + i * 1.7)) * 24 * (0.3 + vol / 40);
            eg.fillRect(6 + i * 9, 40 - h - 4, 5, h);
          }
        } else {
          eg.fillStyle = 'rgba(140,160,170,0.35)';
          eg.fillRect(58, 18, 12, 4);
        }
        etex.needsUpdate = true;
      },
    };
    anim.soundbar.draw(false, 0, 12);
    addPart({
      id: 'av-soundbar', cn: '回音壁', en: 'Soundbar', unit: 'av', phase: '客厅',
      explode: [0, -0.14, 0.85],
      blurb: '电视自带喇叭的救兵:5 个单元朝着你,低音有独立腔体。电影感的一半,是声音给的。',
      spec: '2.1 声道 · 120 W · eARC',
    }, g);
  }

  // 18 游戏主机
  {
    const g = grp(0.42, 0.30, -0.20);
    const body = rbox(0.27, 0.062, 0.21, 0.012, new THREE.MeshStandardMaterial({ color: 0x25282e, roughness: 0.5 }), 0, 0, 0);
    body.rotation.y = 0.06;
    g.add(body);
    const slot = box(0.14, 0.004, 0.004, M.graphite(), -0.02, 0.008, 0.104);
    slot.rotation.y = 0.06;
    g.add(slot);
    const pled = box(0.02, 0.003, 0.003, new THREE.MeshStandardMaterial({ color: 0x0a2a24, emissive: 0x2fd6b5, emissiveIntensity: 1.2 }), 0.08, 0.014, 0.104);
    pled.rotation.y = 0.06;
    pled.castShadow = false;
    g.add(pled);
    anim.consoleLedMat = pled.material;
    addPart({
      id: 'av-console', cn: '游戏主机', en: 'Game Console', unit: 'av', phase: '客厅',
      explode: [0.30, -0.06, 0.72],
      blurb: '住在电视柜里的性能怪兽。HDMI 2.1 的 4K 120Hz + VRR,这台 OLED 的刷新率就是为它准备的。',
      spec: '4K 120 Hz · VRR · 1 TB',
    }, g);
  }

  // 19 HDMI 线
  {
    const g = grp(0, 0, 0);
    const t = tube([
      [0.50, 0.315, -0.30], [0.58, 0.33, -0.395], [0.615, 0.55, -0.40], [0.60, 0.74, -0.33], [0.545, 0.795, -0.235],
    ], 0.0042, M.darkPlastic(), 48);
    g.add(t);
    anim.hdmiCurve = t.userData.curve;
    g.add(box(0.016, 0.008, 0.03, M.darkShell(), 0.50, 0.315, -0.285));
    g.add(box(0.016, 0.008, 0.03, M.darkShell(), 0.545, 0.795, -0.222));
    addPart({
      id: 'av-hdmi', cn: 'HDMI 2.1 线', en: 'HDMI Cable', unit: 'av', phase: '客厅',
      explode: [0, 0, 0], noExplode: true,
      blurb: '48 Gbps 的高速公路,一秒钟搬运一部电影的数据量。买贵的不如买"认证"的。',
      spec: 'Ultra High Speed 认证 · 48 Gbps',
    }, g);
  }

  // 20 电源线
  {
    const g = grp(0, 0, 0);
    g.add(tube([
      [-0.50, 0.72, -0.24], [-0.60, 0.45, -0.38], [-0.75, 0.22, -0.40], [-0.90, 0.165, -0.415],
    ], 0.005, M.darkPlastic(), 40));
    const plug = rbox(0.032, 0.042, 0.022, 0.004, M.darkShell(), -0.945, 0.16, -0.408);
    g.add(plug);
    addPart({
      id: 'av-power', cn: '电源线', en: 'Power Cord', unit: 'av', phase: '客厅',
      explode: [0, 0, 0], noExplode: true,
      blurb: '380 W 峰值就靠这一根。藏进柜后走线槽,是客厅整洁度的最后一战。',
      spec: '3×1.0 mm² · 10 A',
    }, g);
  }

  // 21 遥控器
  {
    const g = grp(0.43, 0.442, 1.02);
    const body = rbox(0.049, 0.014, 0.165, 0.007, M.darkShell(), 0, 0, 0);
    g.add(body);
    const face = decal(0.042, 0.152, TEX.remote, 0, 0.0078, 0, -Math.PI / 2, 0, { alpha: false });
    face.rotation.z = Math.PI;
    g.add(face);
    g.rotation.y = -0.5;
    addPart({
      id: 'ex-remote', cn: '蓝牙遥控器', en: 'Remote Control', unit: 'extras', phase: '客厅',
      explode: [0.12, 0.38, 0.30],
      blurb: '不用对准电视也能按,因为走的是蓝牙;丢在沙发缝里也能找,因为电视会让它响。科技进步的方向十分明确。',
      spec: '蓝牙 5.2 · 语音键 · AAA ×2',
    }, g);
  }

  /* ---------- 后处理 ---------- */
  const rayTargets = [];
  parts.forEach((p, i) => {
    p.idx = i;
    p.mats = [];
    const seen = new Set();
    p.group.traverse((o) => {
      if (o.isMesh) {
        o.userData.partIdx = i;
        rayTargets.push(o);
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        ms.forEach(m => { if (!seen.has(m)) { seen.add(m); p.mats.push(m); } });
      }
    });
    const bb = new THREE.Box3().setFromObject(p.group);
    const c = bb.getCenter(new THREE.Vector3());
    const wp = p.group.getWorldPosition(new THREE.Vector3());
    p.anchorOff = c.sub(wp);
    p.radius = bb.getSize(new THREE.Vector3()).length() / 2;
  });

  return { root, parts, units, anim, env };
}
