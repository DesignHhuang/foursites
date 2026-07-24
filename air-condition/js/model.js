// 北极风空调 —— 全部零件用 three.js 基础几何体手工建模
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
  // 换热器翅片:竖直细密线条
  TEX.fin = canvasTex(256, 128, (g) => {
    g.fillStyle = '#b6bcc3'; g.fillRect(0, 0, 256, 128);
    for (let x = 0; x < 256; x += 2) {
      g.fillStyle = x % 4 ? '#a5acb4' : '#9aa1aa';
      g.fillRect(x, 0, 1, 128);
    }
    g.fillStyle = 'rgba(90,100,110,0.22)';
    for (let y = 20; y < 128; y += 44) g.fillRect(0, y, 256, 1.5);
  }, { repeat: [3, 1] });

  // 过滤网:细格网 + 边框(带透明)
  TEX.mesh = canvasTex(256, 128, (g) => {
    g.clearRect(0, 0, 256, 128);
    g.strokeStyle = 'rgba(235,238,242,0.95)'; g.lineWidth = 1.6;
    for (let x = 0; x <= 256; x += 10) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 128); g.stroke(); }
    for (let y = 0; y <= 128; y += 10) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
    g.strokeStyle = '#dfe3e8'; g.lineWidth = 10; g.strokeRect(0, 0, 256, 128);
  });

  // 室外机后网罩:方格钢丝
  TEX.wire = canvasTex(256, 160, (g) => {
    g.clearRect(0, 0, 256, 160);
    g.strokeStyle = 'rgba(52,57,63,0.98)'; g.lineWidth = 1.6;
    for (let x = 0; x <= 256; x += 16) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 160); g.stroke(); }
    for (let y = 0; y <= 160; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  }, { repeat: [2, 2] });

  // 侧板散热百叶
  TEX.slots = canvasTex(128, 256, (g) => {
    g.fillStyle = '#e6e4de'; g.fillRect(0, 0, 128, 256);
    g.fillStyle = '#b7b4ac';
    for (let y = 30; y < 226; y += 12) g.fillRect(18, y, 92, 5);
    g.fillStyle = 'rgba(90,88,82,0.5)';
    for (let y = 30; y < 226; y += 12) g.fillRect(18, y + 4, 92, 1.5);
  });

  // 挂板冲孔
  TEX.plate = canvasTex(256, 96, (g) => {
    g.fillStyle = '#b9c0c6'; g.fillRect(0, 0, 256, 96);
    g.fillStyle = '#8f979e';
    for (let x = 14; x < 256; x += 24) for (let y = 12; y < 96; y += 24) g.fillRect(x, y, 10, 5);
    g.strokeStyle = '#a2a9b0'; g.strokeRect(2, 2, 252, 92);
  });

  // 电路板
  TEX.pcb = canvasTex(256, 192, (g) => {
    g.fillStyle = '#175a2e'; g.fillRect(0, 0, 256, 192);
    g.strokeStyle = '#2e8a4f'; g.lineWidth = 2;
    for (let i = 0; i < 26; i++) {
      g.beginPath();
      const x = 10 + Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1) * 236;
      const y = 10 + Math.abs(Math.sin(i * 78.233) * 12543.123 % 1) * 172;
      g.moveTo(x, y); g.lineTo(x + 30, y); g.lineTo(x + 30, y + 22); g.stroke();
      g.fillStyle = '#c9a24a'; g.fillRect(x - 2, y - 2, 4, 4);
    }
    g.fillStyle = '#111';
    g.fillRect(30, 30, 52, 34); g.fillRect(150, 100, 64, 40); g.fillRect(100, 40, 30, 20);
    g.fillStyle = '#dfe3e8'; g.font = '11px Menlo,monospace';
    g.fillText('ARCTIC-DRV v2.1', 96, 178); g.fillText('R32', 34, 24);
    g.fillStyle = '#c0c6cd';
    for (let x = 40; x < 220; x += 14) g.fillRect(x, 148, 8, 10);
  });

  // 能效标识(风格化)
  TEX.energy = canvasTex(128, 176, (g) => {
    g.fillStyle = '#f6f7f8'; g.fillRect(0, 0, 128, 176);
    g.fillStyle = '#1663a8'; g.fillRect(0, 0, 128, 34);
    g.fillStyle = '#fff'; g.font = 'bold 13px "PingFang SC",sans-serif';
    g.fillText('中国能效标识', 24, 22);
    const cols = ['#009a44', '#54b948', '#bfd730', '#fdb913', '#e03a3e'];
    for (let i = 0; i < 5; i++) {
      g.fillStyle = cols[i];
      g.beginPath();
      const y = 44 + i * 17, w = 46 + i * 12;
      g.moveTo(12, y); g.lineTo(12 + w, y); g.lineTo(12 + w + 8, y + 6.5); g.lineTo(12 + w, y + 13); g.lineTo(12, y + 13);
      g.closePath(); g.fill();
      g.fillStyle = '#fff'; g.font = 'bold 10px sans-serif'; g.fillText(String(i + 1), 16, y + 11);
    }
    g.fillStyle = '#222'; g.beginPath();
    g.moveTo(118, 44); g.lineTo(96, 50.5); g.lineTo(118, 57); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 9px sans-serif'; g.fillText('1', 108, 54);
    g.fillStyle = '#333'; g.font = '9px "PingFang SC",sans-serif';
    g.fillText('全年能源消耗效率 APF 5.27', 12, 142);
    g.fillText('制冷季节耗电 512 kWh', 12, 155);
    g.fillText('GB 21455-2019', 12, 168);
    g.strokeStyle = '#888'; g.strokeRect(1, 1, 126, 174);
  });

  // 室外机铭牌
  TEX.nameplate = canvasTex(160, 110, (g) => {
    g.fillStyle = '#f2f3f4'; g.fillRect(0, 0, 160, 110);
    g.fillStyle = '#222'; g.font = 'bold 11px "PingFang SC",sans-serif';
    g.fillText('北极风 ARCTIC BREEZE', 10, 16);
    g.font = '8px "PingFang SC",sans-serif'; g.fillStyle = '#444';
    const lines = ['型号 KFR-35GW/BP3DN8Y-A1', '额定电压 220V~ 50Hz', '制冷量 3500W  输入 1010W', '制冷剂 R32 / 0.62kg', '防水等级 IPX4  GB 4706'];
    lines.forEach((s, i) => g.fillText(s, 10, 32 + i * 12));
    for (let x = 10; x < 96; x += 3) {
      g.fillStyle = '#111';
      if (Math.abs(Math.sin(x * 7.13)) > 0.4) g.fillRect(x, 92, 2, 12);
    }
    g.strokeStyle = '#c33'; g.lineWidth = 2; g.beginPath(); g.arc(134, 88, 14, 0, 6.29); g.stroke();
    g.fillStyle = '#c33'; g.font = 'bold 8px "PingFang SC",sans-serif'; g.fillText('合格', 126, 91);
    g.strokeStyle = '#999'; g.strokeRect(1, 1, 158, 108);
  });

  // 顶盖警示贴
  TEX.warn = canvasTex(140, 90, (g) => {
    g.fillStyle = '#f6c343'; g.fillRect(0, 0, 140, 90);
    g.strokeStyle = '#111'; g.lineWidth = 4; g.strokeRect(2, 2, 136, 86);
    g.fillStyle = '#111'; g.font = 'bold 16px "PingFang SC",sans-serif';
    g.fillText('⚠ 注意', 42, 30);
    g.font = 'bold 11px "PingFang SC",sans-serif';
    g.fillText('内有旋转风扇', 32, 52);
    g.fillText('维修前请断电', 32, 70);
  });

  // 品牌字(透明底)
  TEX.logo = canvasTex(512, 80, (g) => {
    g.clearRect(0, 0, 512, 80);
    g.fillStyle = 'rgba(112,118,126,0.9)';
    g.font = '600 34px "PingFang SC",sans-serif';
    g.fillText('北极风', 20, 52);
    g.fillStyle = 'rgba(112,118,126,0.65)';
    g.font = '300 24px "Helvetica Neue",sans-serif';
    g.fillText('A R C T I C  B R E E Z E', 150, 50);
  });

  // 遥控器面板
  TEX.remote = canvasTex(96, 256, (g) => {
    g.fillStyle = '#f4f4f2'; g.fillRect(0, 0, 96, 256);
    g.fillStyle = '#182028'; g.fillRect(12, 12, 72, 58);
    g.fillStyle = '#9fe6ff'; g.font = 'bold 30px Menlo,monospace'; g.fillText('26', 26, 52);
    g.font = '10px Menlo,monospace'; g.fillText('❄', 64, 30);
    const btn = (x, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, 6.29); g.fill(); };
    btn(48, 100, 13, '#e0402e');
    btn(26, 138, 10, '#c9ced4'); btn(70, 138, 10, '#c9ced4');
    btn(26, 172, 10, '#c9ced4'); btn(70, 172, 10, '#c9ced4'); btn(48, 155, 8, '#aab2ba');
    btn(26, 206, 10, '#c9ced4'); btn(70, 206, 10, '#c9ced4');
    g.fillStyle = '#666'; g.font = '8px "PingFang SC",sans-serif';
    g.fillText('开/关', 38, 122); g.fillText('模式', 18, 190); g.fillText('风速', 62, 190);
  });

  // 木地板
  TEX.wood = canvasTex(512, 256, (g) => {
    g.fillStyle = '#b0805a'; g.fillRect(0, 0, 512, 256);
    for (let y = 0; y < 256; y += 32) {
      for (let x = -64; x < 512; x += 128) {
        const off = (y / 32) % 2 ? 64 : 0;
        const h = Math.abs(Math.sin((x + y) * 3.7)) * 18;
        g.fillStyle = `rgb(${168 + h}, ${118 + h * 0.8}, ${80 + h * 0.6})`;
        g.fillRect(x + off, y, 126, 30);
      }
    }
    g.strokeStyle = 'rgba(90,60,40,0.5)'; g.lineWidth = 2;
    for (let y = 0; y <= 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  }, { repeat: [2, 2] });

  // 混凝土
  TEX.concrete = canvasTex(256, 256, (g) => {
    g.fillStyle = '#b7babd'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) {
      const x = (Math.sin(i * 12.9) * 43758.5) % 1 * 256, y = (Math.sin(i * 78.2) * 12543.1) % 1 * 256;
      const v = Math.abs(Math.sin(i * 3.3)) * 30;
      g.fillStyle = `rgba(${140 + v},${143 + v},${146 + v},0.5)`;
      g.fillRect(Math.abs(x), Math.abs(y), 2, 2);
    }
    g.strokeStyle = 'rgba(120,122,125,0.8)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.stroke();
    g.beginPath(); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
  }, { repeat: [3, 3] });

  // 排水波纹管
  TEX.corrug = canvasTex(64, 16, (g) => {
    g.fillStyle = '#b9bdc1'; g.fillRect(0, 0, 64, 16);
    g.fillStyle = '#a2a7ac';
    for (let x = 0; x < 64; x += 6) g.fillRect(x, 0, 2, 16);
  }, { repeat: [46, 1] });

  // 管线缠绕带(斜纹)
  TEX.tapeWrap = canvasTex(64, 64, (g) => {
    g.fillStyle = '#ecece7'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(202,202,194,0.7)'; g.lineWidth = 3;
    for (let i = -64; i < 128; i += 16) {
      g.beginPath(); g.moveTo(i, 64); g.lineTo(i + 64, 0); g.stroke();
    }
  }, { repeat: [24, 1] });

  // 墙上装饰画
  TEX.art = canvasTex(200, 260, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 260);
    grad.addColorStop(0, '#dfe9f2'); grad.addColorStop(1, '#f4efe6');
    g.fillStyle = grad; g.fillRect(0, 0, 200, 260);
    g.fillStyle = '#8fb0c9';
    g.beginPath(); g.moveTo(0, 210); g.lineTo(60, 120); g.lineTo(110, 190); g.lineTo(200, 210); g.closePath(); g.fill();
    g.fillStyle = '#6d8fa8';
    g.beginPath(); g.moveTo(70, 210); g.lineTo(140, 100); g.lineTo(200, 180); g.lineTo(200, 210); g.closePath(); g.fill();
    g.fillStyle = '#f2c96d'; g.beginPath(); g.arc(150, 60, 18, 0, 6.29); g.fill();
    g.fillStyle = '#e8e2d5'; g.fillRect(0, 210, 200, 50);
  });
}

/* ---------------- materials ---------------- */

const M = {
  glossWhite: () => new THREE.MeshPhysicalMaterial({ color: 0xf5f5f1, roughness: 0.32, clearcoat: 0.55, clearcoatRoughness: 0.3 }),
  shell: () => new THREE.MeshStandardMaterial({ color: 0xe4e5e7, roughness: 0.55 }),
  shellDark: () => new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.6 }),
  paint: () => new THREE.MeshStandardMaterial({ color: 0xe9e7e1, roughness: 0.45, metalness: 0.15 }),
  paintEdge: () => new THREE.MeshStandardMaterial({ color: 0xcfccc4, roughness: 0.5, metalness: 0.15 }),
  galv: () => new THREE.MeshStandardMaterial({ color: 0xb7bec4, roughness: 0.42, metalness: 0.65 }),
  steelDark: () => new THREE.MeshStandardMaterial({ color: 0x40454c, roughness: 0.45, metalness: 0.7 }),
  copper: () => new THREE.MeshStandardMaterial({ color: 0xc47a45, roughness: 0.3, metalness: 1.0 }),
  brass: () => new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 1.0 }),
  blackMetal: () => new THREE.MeshStandardMaterial({ color: 0x1d1f22, roughness: 0.5, metalness: 0.4 }),
  darkPlastic: () => new THREE.MeshStandardMaterial({ color: 0x2c2f34, roughness: 0.6 }),
  rubber: () => new THREE.MeshStandardMaterial({ color: 0x17181a, roughness: 0.92 }),
  alu: () => new THREE.MeshStandardMaterial({ color: 0xcfd4d9, roughness: 0.35, metalness: 0.85 }),
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

function torus(r, tube, mat, x, y, z, arc = Math.PI * 2, seg = 20) {
  return mesh(new THREE.TorusGeometry(r, tube, 10, seg, arc), mat, x, y, z);
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
    polygonOffset: true, polygonOffsetFactor: -1, side: opts.side || THREE.FrontSide,
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
  const anim = { vanes: [], displays: [] };

  const IN_POS = new THREE.Vector3(-0.52, 1.97, 0.215);
  const OUT_POS = new THREE.Vector3(0.55, 0.98, -0.28);

  const indoorG = grp(IN_POS.x, IN_POS.y, IN_POS.z);
  const outdoorG = grp(OUT_POS.x, OUT_POS.y, OUT_POS.z);
  const mountG = grp(0, 0, 0);
  const linesG = grp(0, 0, 0);
  const extrasG = grp(0, 0, 0);
  root.add(indoorG, outdoorG, mountG, linesG, extrasG);

  const units = {
    indoor:  { group: indoorG,  base: IN_POS.clone(),  vec: new THREE.Vector3(-0.16, 0.34, 0.80) },
    outdoor: { group: outdoorG, base: OUT_POS.clone(), vec: new THREE.Vector3(0.52, -0.04, -0.82) },
    mount:   { group: mountG,   base: new THREE.Vector3(), vec: new THREE.Vector3(0, 0, 0) },
    lines:   { group: linesG,   base: new THREE.Vector3(), vec: new THREE.Vector3(0, 0, 0) },
    extras:  { group: extrasG,  base: new THREE.Vector3(), vec: new THREE.Vector3(0, 0, 0) },
  };

  function addPart(def, group) {
    group.userData.isPart = true;
    def.group = group;
    def.home = group.position.clone();
    def.explode = new THREE.Vector3(...def.explode);
    units[def.unit].group.add(group);
    parts.push(def);
    return def;
  }

  /* ============ 环境 ============ */
  const env = {};
  {
    // 展台底座
    const base = rbox(5.0, 0.12, 3.5, 0.035, new THREE.MeshStandardMaterial({ color: 0x25282d, roughness: 0.7 }), 0.15, -0.061, 0);
    base.receiveShadow = true;
    root.add(base);

    // 室内木地板 / 室外混凝土
    const wood = box(4.7, 0.024, 1.5, new THREE.MeshStandardMaterial({ map: TEX.wood, roughness: 0.65 }), 0.15, 0.012, 0.87);
    const conc = box(4.7, 0.024, 1.5, new THREE.MeshStandardMaterial({ map: TEX.concrete, roughness: 0.85 }), 0.15, 0.012, -0.87);
    root.add(wood, conc);

    // 墙(带穿墙孔)
    const ws = new THREE.Shape();
    ws.moveTo(-1.05, 0); ws.lineTo(1.05, 0); ws.lineTo(1.05, 2.45); ws.lineTo(-1.05, 2.45); ws.closePath();
    const hole = new THREE.Path();
    hole.absarc(-0.18, 1.90, 0.042, 0, Math.PI * 2, true);
    ws.holes.push(hole);
    const wallGeo = new THREE.ExtrudeGeometry(ws, { depth: 0.22, bevelEnabled: false });
    wallGeo.translate(0, 0, -0.11);
    const wallFace = new THREE.MeshStandardMaterial({ color: 0xe7e3da, roughness: 0.85 });
    const wallCut = new THREE.MeshStandardMaterial({ color: 0xb9b2a6, roughness: 0.9 });
    const wall = new THREE.Mesh(wallGeo, [wallFace, wallCut]);
    wall.castShadow = true; wall.receiveShadow = true;
    root.add(wall);
    env.wallMats = [wallFace, wallCut];

    // 踢脚线
    const skirt = box(2.1, 0.085, 0.016, M.white(), 0, 0.066, 0.119);
    root.add(skirt);
    env.wallMats.push(skirt.material);

    // 装饰画
    const frame = box(0.30, 0.38, 0.018, new THREE.MeshStandardMaterial({ color: 0x4a3c30, roughness: 0.6 }), 0.64, 1.20, 0.121);
    const art = decal(0.26, 0.34, TEX.art, 0.64, 1.20, 0.1315, 0, 0, { alpha: false });
    root.add(frame, art);
    env.wallMats.push(frame.material, art.material);

    // 电源插座(16A)
    const outlet = grp(0.35, 1.62, 0.122,
      rbox(0.078, 0.078, 0.018, 0.004, M.white(), 0, 0, 0),
      cyl(0.004, 0.004, 0.004, M.darkPlastic(), 0, 0.012, 0.010, 'z', 12),
      cyl(0.004, 0.004, 0.004, M.darkPlastic(), -0.013, -0.008, 0.010, 'z', 12),
      cyl(0.004, 0.004, 0.004, M.darkPlastic(), 0.013, -0.008, 0.010, 'z', 12),
    );
    root.add(outlet);
    env.outlet = outlet;

    // 绿植
    const plant = grp(1.85, 0.024, 0.78);
    plant.add(cyl(0.075, 0.055, 0.15, new THREE.MeshStandardMaterial({ color: 0xa85f3f, roughness: 0.8 }), 0, 0.075, 0));
    plant.add(cyl(0.012, 0.016, 0.22, new THREE.MeshStandardMaterial({ color: 0x6b5138, roughness: 0.9 }), 0, 0.25, 0));
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x3f7d4e, roughness: 0.75 });
    [[0, 0.44, 0, 0.13], [-0.09, 0.36, 0.03, 0.09], [0.08, 0.35, -0.04, 0.10], [0.02, 0.52, 0.05, 0.08]].forEach(([x, y, z, r]) => {
      const s = mesh(new THREE.SphereGeometry(r, 12, 10), leafMat, x, y, z);
      s.scale.y = 0.82; plant.add(s);
    });
    root.add(plant);

    // 室外:排水积水 + 碎石
    const puddle = mesh(new THREE.CircleGeometry(0.14, 24),
      new THREE.MeshStandardMaterial({ color: 0x6d7e8a, roughness: 0.12, metalness: 0.5, transparent: true, opacity: 0.35 }),
      1.30, 0.0255, -0.62);
    puddle.rotation.x = -Math.PI / 2; puddle.scale.x = 1.35; puddle.castShadow = false;
    root.add(puddle);
    const pebMat = new THREE.MeshStandardMaterial({ color: 0x8e9296, roughness: 0.9 });
    root.add(mesh(new THREE.DodecahedronGeometry(0.028), pebMat, 1.6, 0.045, -0.35));
    root.add(mesh(new THREE.DodecahedronGeometry(0.02), pebMat, 1.48, 0.04, -0.72));
  }

  /* ============ 室外机零件 ============ */

  // 01 安装支架 ×2
  {
    const g = grp(0.55, 0.727, -0.28);
    for (const sx of [-0.29, 0.29]) {
      const one = grp(sx, 0, 0);
      one.add(box(0.05, 0.28, 0.010, M.steelDark(), 0, -0.03, 0.165));
      one.add(box(0.055, 0.010, 0.34, M.steelDark(), 0, -0.034, 0));
      const strut = box(0.045, 0.008, 0.30, M.steelDark(), 0, -0.09, -0.01);
      strut.rotation.x = 0.36;
      one.add(strut);
      one.add(cyl(0.009, 0.009, 0.016, M.steelDark(), 0, 0.03, 0.172, 'z', 14));
      one.add(cyl(0.009, 0.009, 0.016, M.steelDark(), 0, -0.10, 0.172, 'z', 14));
      g.add(one);
    }
    addPart({
      id: 'ou-bracket', cn: '安装支架 ×2', en: 'Wall Brackets', unit: 'mount', phase: '室外机',
      explode: [0, -0.55, -0.42],
      blurb: '热浸镀锌角钢支架,单只承重 ≥60 kg。整台室外机的体重都压在这两条手臂上,靠四颗 M10 膨胀螺栓咬进墙体。',
      spec: '镀锌钢 · M10 膨胀螺栓 ×4 · 承重 120 kg',
    }, g);
  }

  // 02 底盘
  {
    const g = grp(0, -0.26, 0);
    g.add(box(0.80, 0.016, 0.30, M.galv(), 0, -0.007, 0));
    g.add(box(0.80, 0.032, 0.012, M.galv(), 0, 0.006, -0.144));
    g.add(box(0.80, 0.032, 0.012, M.galv(), 0, 0.006, 0.144));
    g.add(box(0.06, 0.034, 0.28, M.rubber(), -0.30, -0.031, 0));
    g.add(box(0.06, 0.034, 0.28, M.rubber(), 0.30, -0.031, 0));
    g.add(cyl(0.008, 0.008, 0.012, M.darkPlastic(), 0.1, -0.02, 0.05, 'y', 12));
    addPart({
      id: 'ou-base', cn: '底盘', en: 'Base Pan', unit: 'outdoor', phase: '室外机',
      explode: [0, -0.42, -0.16],
      blurb: '冲压镀锌钢底盘,兜住所有零件;冬天制热化霜的水也从这里的排水孔流走。底下两条橡胶脚垫负责吸掉振动。',
      spec: '镀锌钢板 1.2 mm · 含减震脚垫 ×2',
    }, g);
  }

  // 03 压缩机
  {
    const g = grp(0.22, -0.115, 0.02);
    const prof = [[0.001, -0.125], [0.062, -0.125], [0.075, -0.118], [0.083, -0.10], [0.084, -0.02],
      [0.084, 0.055], [0.079, 0.085], [0.060, 0.108], [0.034, 0.122], [0.001, 0.126]]
      .map(p => new THREE.Vector2(p[0], p[1]));
    const body = mesh(new THREE.LatheGeometry(prof, 28), M.blackMetal(), 0, 0, 0);
    g.add(body);
    g.add(torus(0.0848, 0.0022, M.blackMetal(), 0, 0.02, 0, Math.PI * 2, 28).rotateX(Math.PI / 2));
    g.add(torus(0.0848, 0.0022, M.blackMetal(), 0, -0.06, 0, Math.PI * 2, 28).rotateX(Math.PI / 2));
    // 储液器
    g.add(cyl(0.030, 0.030, 0.135, M.alu(), -0.105, 0.015, 0.07, 'y', 20));
    g.add(mesh(new THREE.SphereGeometry(0.030, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), M.alu(), -0.105, 0.083, 0.07));
    // 吸气管
    g.add(tube([[-0.105, -0.053, 0.07], [-0.105, -0.085, 0.062], [-0.06, -0.09, 0.045], [-0.015, -0.075, 0.03]], 0.0048, M.copper(), 24));
    // 排气立管
    g.add(cyl(0.0042, 0.0042, 0.035, M.copper(), 0.0, 0.14, 0, 'y', 10));
    // 接线盒
    const tb = box(0.05, 0.038, 0.02, M.rubber(), 0.055, -0.02, -0.062);
    tb.rotation.y = -0.6; g.add(tb);
    // 减震脚钉
    for (const a of [0.5, 2.6, 4.7]) {
      g.add(cyl(0.012, 0.012, 0.015, M.rubber(), Math.cos(a) * 0.062, -0.133, Math.sin(a) * 0.062, 'y', 10));
    }
    anim.compressor = g;
    addPart({
      id: 'ou-comp', cn: '压缩机', en: 'Rotary Compressor', unit: 'outdoor', phase: '室外机',
      explode: [0.10, 0.46, -0.30],
      blurb: '空调的心脏。转子式压缩机把低压 R32 蒸气压成高温高压气体,一刻不停地把热量从屋里搬到屋外。旁边的银色罐子是储液器,防止液体冷媒呛进气缸。',
      spec: '转子式 · 排量 9.6 cm³/rev · 约 8.2 kg',
    }, g);
  }

  // 04 冷凝器
  {
    const g = grp(-0.01, 0.005, 0);
    const finMat = () => new THREE.MeshStandardMaterial({ map: TEX.fin, roughness: 0.5, metalness: 0.45 });
    g.add(box(0.74, 0.44, 0.025, finMat(), 0, 0, 0.128));
    g.add(box(0.025, 0.44, 0.20, finMat(), -0.365, 0, 0.03));
    g.add(box(0.006, 0.44, 0.027, M.galv(), 0.372, 0, 0.128));
    g.add(box(0.027, 0.44, 0.006, M.galv(), -0.365, 0, -0.072));
    // 铜管 U 弯
    for (let i = 0; i < 5; i++) {
      const u = torus(0.011, 0.0028, M.copper(), 0.377, -0.16 + i * 0.08, 0.128, Math.PI, 12);
      u.rotation.y = Math.PI / 2; u.rotation.z = Math.PI / 2;
      g.add(u);
    }
    for (let i = 0; i < 4; i++) {
      const u = torus(0.011, 0.0028, M.copper(), -0.365, -0.12 + i * 0.08, -0.077, Math.PI, 12);
      u.rotation.z = Math.PI / 2;
      g.add(u);
    }
    // 顶部集管
    g.add(tube([[-0.34, 0.228, 0.128], [0.0, 0.232, 0.128], [0.34, 0.228, 0.128]], 0.0042, M.copper(), 16));
    addPart({
      id: 'ou-cond', cn: '冷凝器', en: 'Condenser Coil', unit: 'outdoor', phase: '室外机',
      explode: [-0.34, 0.10, 0.55],
      blurb: 'L 形翅片式换热器:内螺纹铜管穿过上百片亲水铝箔。制冷时高温冷媒在这里放热冷凝成液体——你在室外闻到的那股热风就是它交出来的。',
      spec: '铜管铝翅片 · 2 排 U 型管 · 面积 ≈0.42 m²',
    }, g);
  }

  // 05 隔板
  {
    const g = grp(0.075, -0.005, -0.012);
    g.add(box(0.010, 0.50, 0.26, M.galv(), 0, 0, 0));
    g.add(box(0.036, 0.010, 0.26, M.galv(), 0.013, 0.25, 0));
    addPart({
      id: 'ou-part', cn: '隔板', en: 'Partition Plate', unit: 'outdoor', phase: '室外机',
      explode: [0.06, 0.58, -0.28],
      blurb: '一块镀锌钢板,把机箱分成风机腔和压缩机腔:风走风的路,电走电的路,互不打扰。',
      spec: '镀锌钢板 1.0 mm',
    }, g);
  }

  // 06 四通阀
  {
    const g = grp(0.20, 0.145, 0.06);
    g.add(cyl(0.0155, 0.0155, 0.088, M.brass(), 0, 0, 0, 'x', 18));
    g.add(cyl(0.0085, 0.0085, 0.03, M.steelDark(), 0.01, 0.024, 0, 'x', 12));
    g.add(cyl(0.005, 0.005, 0.02, M.copper(), 0, 0.023, 0, 'y', 10));
    for (const sx of [-0.026, 0, 0.026]) g.add(cyl(0.005, 0.005, 0.02, M.copper(), sx, -0.023, 0, 'y', 10));
    // 连接铜管(局部坐标 = 相对本组)
    const P = (x, y, z) => [x - 0.20, y - 0.145, z - 0.06];
    g.add(tube([P(0.22, 0.028, 0.02), P(0.228, 0.10, 0.033), P(0.215, 0.165, 0.045), P(0.202, 0.185, 0.058), P(0.20, 0.172, 0.06)], 0.0042, M.copper(), 32));
    g.add(tube([P(0.174, 0.128, 0.06), P(0.16, 0.10, 0.075), P(0.05, 0.19, 0.11), P(-0.05, 0.237, 0.118)], 0.0042, M.copper(), 32));
    g.add(tube([P(0.20, 0.126, 0.06), P(0.185, 0.05, 0.08), P(0.14, -0.055, 0.09), P(0.115, -0.088, 0.09)], 0.0048, M.copper(), 32));
    g.add(tube([P(0.226, 0.128, 0.06), P(0.30, 0.05, 0.03), P(0.375, -0.08, -0.01), P(0.392, -0.125, -0.032)], 0.0048, M.copper(), 32));
    addPart({
      id: 'ou-4way', cn: '四通换向阀', en: 'Four-Way Valve', unit: 'outdoor', phase: '室外机',
      explode: [0.16, 0.68, 0.12],
      blurb: '冷暖切换的道岔。顶上的电磁先导阀一通电,阀芯滑动,冷媒流向整体反转——蒸发器变冷凝器,制冷变制热。冬天听到室外机"咔哒"一声,就是它在换向化霜。',
      spec: '黄铜阀体 · 电磁先导 · 连接铜管 ×4',
    }, g);
  }

  // 07 风扇电机(外)
  {
    const g = grp(-0.155, 0.02, 0.05);
    g.add(cyl(0.041, 0.041, 0.08, M.steelDark(), 0, 0, 0, 'z', 22));
    g.add(cyl(0.0055, 0.0055, 0.08, M.alu(), 0, 0, -0.06, 'z', 10));
    g.add(box(0.028, 0.40, 0.010, M.galv(), 0, -0.22, 0.028));
    g.add(torus(0.044, 0.005, M.galv(), 0, 0, 0.02, Math.PI * 2, 20));
    addPart({
      id: 'ou-fanmotor', cn: '外风扇电机', en: 'Fan Motor', unit: 'outdoor', phase: '室外机',
      explode: [-0.10, 0.06, -0.38],
      blurb: '六极单相异步电机,直驱轴流风扇。整年风吹日晒雨淋,所以绕组灌胶、轴承密封,是全机最皮实的零件之一。',
      spec: '35 W · 850 rpm · IPX4',
    }, g);
  }

  // 08 轴流风扇
  {
    const g = grp(-0.155, 0.02, -0.06);
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0x23262b, roughness: 0.45 });
    const s = new THREE.Shape();
    s.moveTo(0.042, 0.018);
    s.quadraticCurveTo(0.10, 0.052, 0.148, 0.058);
    s.quadraticCurveTo(0.175, 0.012, 0.162, -0.030);
    s.quadraticCurveTo(0.10, -0.068, 0.044, -0.050);
    s.closePath();
    const bladeGeo = new THREE.ExtrudeGeometry(s, { depth: 0.0035, bevelEnabled: true, bevelThickness: 0.001, bevelSize: 0.0015, bevelSegments: 1 });
    bladeGeo.rotateX(0.55);
    for (let i = 0; i < 3; i++) {
      const b = mesh(bladeGeo, bladeMat, 0, 0, 0);
      b.rotation.z = i * Math.PI * 2 / 3;
      g.add(b);
    }
    g.add(cyl(0.042, 0.042, 0.035, bladeMat, 0, 0, 0.004, 'z', 20));
    g.add(mesh(new THREE.SphereGeometry(0.024, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), bladeMat, 0, 0, -0.013).rotateX(-Math.PI / 2));
    anim.axialFan = g;
    addPart({
      id: 'ou-fan', cn: '轴流风扇', en: 'Axial Fan', unit: 'outdoor', phase: '室外机',
      explode: [-0.10, 0.0, -0.68],
      blurb: '三片镰刀形叶片,把穿过冷凝器的热风推向街对面。叶型顺着气流扭转,转得快还不吵——理论上。',
      spec: 'Ø330 mm · 3 叶 · AS 工程塑料',
    }, g);
  }

  // 09 变频电控板
  {
    const g = grp(0.26, 0.185, -0.045);
    g.add(box(0.135, 0.115, 0.004, M.alu(), 0, 0, 0.022));
    const pcb = decal(0.125, 0.10, TEX.pcb, 0, 0, 0.016, 0, Math.PI, { alpha: false });
    pcb.castShadow = false; g.add(pcb);
    g.add(cyl(0.013, 0.013, 0.034, M.blackMetal(), -0.036, 0.022, -0.002, 'z', 14));
    g.add(cyl(0.010, 0.010, 0.026, M.blackMetal(), -0.008, 0.028, 0.0, 'z', 12));
    for (let i = 0; i < 5; i++) g.add(box(0.0025, 0.05, 0.03, M.alu(), 0.028 + i * 0.008, -0.018, -0.004));
    addPart({
      id: 'ou-pcb', cn: '变频驱动板', en: 'Inverter Board', unit: 'outdoor', phase: '室外机',
      explode: [0.28, 0.85, -0.06],
      blurb: '把 50 Hz 市电整流再逆变,让压缩机在 15–120 rps 之间无级变速。夏天它比谁都怕热,所以紧紧贴着散热片、蹭着风道吹风。',
      spec: 'IPM 模块 · 电解电容 ×2 · 15–120 rps',
    }, g);
  }

  // 10 后网罩
  {
    const g = grp(-0.01, 0.005, 0.155);
    const guard = mesh(new THREE.PlaneGeometry(0.76, 0.46),
      new THREE.MeshStandardMaterial({ map: TEX.wire, transparent: true, alphaTest: 0.25, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.6 }));
    guard.castShadow = false;
    g.add(guard);
    addPart({
      id: 'ou-guard', cn: '后网罩', en: 'Wire Guard', unit: 'outdoor', phase: '室外机',
      explode: [-0.05, 0.08, 0.92],
      blurb: '一张点焊钢丝网,拦住树叶、塑料袋和好奇的手指,同时尽量不挡风。',
      spec: '镀锌钢丝 Ø2 mm · 网格 16 mm',
    }, g);
  }

  // 11 前面板(外)
  {
    const g = grp(0, 0, -0.158);
    const s = new THREE.Shape();
    s.moveTo(-0.40, -0.275); s.lineTo(0.40, -0.275); s.lineTo(0.40, 0.275); s.lineTo(-0.40, 0.275); s.closePath();
    const holePath = new THREE.Path();
    holePath.absarc(-0.155, 0.02, 0.185, 0, Math.PI * 2, true);
    s.holes.push(holePath);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.010, bevelEnabled: false });
    geo.translate(0, 0, -0.005);
    const panel = new THREE.Mesh(geo, [M.paint(), M.paintEdge()]);
    panel.castShadow = true; panel.receiveShadow = true;
    g.add(panel);
    const np = decal(0.078, 0.055, TEX.nameplate, 0.27, -0.16, -0.007, 0, Math.PI, { alpha: false });
    g.add(np);
    const lg = decal(0.16, 0.025, TEX.logo, 0.24, 0.22, -0.007, 0, Math.PI);
    g.add(lg);
    addPart({
      id: 'ou-front', cn: '前面板(外)', en: 'Front Cabinet', unit: 'outdoor', phase: '室外机',
      explode: [-0.05, 0.0, -1.05],
      blurb: '喷涂冷轧钢板,中央开出风口。右下角的铭牌写着这台机器的全部身份信息——查参数不用拆机,先看铭牌。',
      spec: '冷轧钢板 0.8 mm · 静电喷涂',
    }, g);
  }

  // 12 出风格栅
  {
    const g = grp(-0.155, 0.02, -0.168);
    const gm = M.darkPlastic();
    for (const r of [0.055, 0.092, 0.130, 0.168]) g.add(torus(r, 0.0032, gm, 0, 0, 0, Math.PI * 2, 40));
    for (let i = 0; i < 4; i++) {
      const sp = box(0.006, 0.336, 0.005, gm, 0, 0, 0);
      sp.rotation.z = i * Math.PI / 4;
      g.add(sp);
    }
    g.add(cyl(0.034, 0.034, 0.007, gm, 0, 0, 0, 'z', 20));
    addPart({
      id: 'ou-grille', cn: '出风格栅', en: 'Fan Grille', unit: 'outdoor', phase: '室外机',
      explode: [-0.05, 0.02, -1.32],
      blurb: '同心圆导流格栅:整理出风气流降低噪音,顺便挡住正在旋转的叶片。',
      spec: 'PP 注塑 · 一体成型',
    }, g);
  }

  // 13 右侧板
  {
    const g = grp(0.394, 0, 0);
    const side = box(0.012, 0.55, 0.30, new THREE.MeshStandardMaterial({ map: TEX.slots, roughness: 0.45, metalness: 0.15 }), 0, 0, 0);
    g.add(side);
    addPart({
      id: 'ou-side', cn: '右侧检修板', en: 'Side Panel', unit: 'outdoor', phase: '室外机',
      explode: [0.85, 0.05, -0.12],
      blurb: '开着散热百叶的检修板。卸两颗螺丝,阀门、接线端子就都露出来了——安装师傅每次上门都从这里下手。',
      spec: '冷轧钢板 · 百叶散热孔',
    }, g);
  }

  // 14 顶盖(外)
  {
    const g = grp(0, 0.283, 0);
    g.add(rbox(0.81, 0.015, 0.31, 0.005, M.paint(), 0, 0, 0));
    g.add(box(0.81, 0.03, 0.012, M.paint(), 0, -0.018, -0.15));
    const warn = decal(0.07, 0.05, TEX.warn, 0.24, 0.0085, -0.05, -Math.PI / 2, 0, { alpha: false });
    g.add(warn);
    addPart({
      id: 'ou-top', cn: '顶盖(外)', en: 'Top Cover', unit: 'outdoor', phase: '室外机',
      explode: [0.02, 0.82, 0],
      blurb: '带折边的顶盖,防雨防尘。黄色贴纸提醒:里面有旋转的风扇和 400 V 的电容,动手前先拔电。',
      spec: '冷轧钢板 · 防雨折边',
    }, g);
  }

  // 15 截止阀组
  {
    const g = grp(0.408, -0.155, -0.055);
    g.add(box(0.006, 0.10, 0.078, M.galv(), 0, 0, 0));
    // 液阀(细)
    g.add(cyl(0.0115, 0.0115, 0.02, M.brass(), 0.013, 0.024, 0.01, 'x', 6));
    g.add(cyl(0.008, 0.008, 0.012, M.brass(), 0.026, 0.024, 0.01, 'x', 6));
    g.add(cyl(0.0035, 0.0035, 0.032, M.copper(), 0.008, 0.024, 0.032, 'z', 8));
    // 气阀(粗)
    g.add(cyl(0.0145, 0.0145, 0.024, M.brass(), 0.014, -0.026, 0.01, 'x', 6));
    g.add(cyl(0.009, 0.009, 0.013, M.brass(), 0.030, -0.026, 0.01, 'x', 6));
    g.add(cyl(0.005, 0.005, 0.032, M.copper(), 0.008, -0.026, 0.032, 'z', 8));
    g.add(cyl(0.005, 0.005, 0.014, M.brass(), 0.014, -0.043, 0.01, 'y', 6));
    // 液管(来自冷凝器底部)
    const P = (x, y, z) => [x - 0.408, y + 0.155, z + 0.055];
    g.add(tube([P(0.30, -0.21, 0.12), P(0.36, -0.21, 0.07), P(0.395, -0.185, 0.0), P(0.40, -0.135, -0.04)], 0.003, M.copper(), 24));
    addPart({
      id: 'ou-valves', cn: '截止阀组', en: 'Service Valves', unit: 'outdoor', phase: '室外机',
      explode: [0.95, -0.24, -0.34],
      blurb: '细的是液阀,粗的是气阀(三通带针阀)。抽真空、充冷媒、测压力全从这里进行;搬家收氟,也是拧这两颗阀芯。',
      spec: '黄铜 · 1/4″ & 1/2″ 喇叭口',
    }, g);
  }

  /* ============ 穿墙 ============ */

  // 16 穿墙套管
  {
    const g = grp(-0.18, 1.90, 0);
    g.add(cyl(0.037, 0.037, 0.25, M.white(), 0, 0, 0, 'z', 20));
    g.add(torus(0.041, 0.005, M.white(), 0, 0, 0.118, Math.PI * 2, 24));
    addPart({
      id: 'mt-sleeve', cn: '穿墙套管', en: 'Wall Sleeve', unit: 'mount', phase: '穿墙',
      explode: [0.12, 0.30, 0.85],
      blurb: 'PVC 套管衬在 Ø75 墙洞里,保护管线不被水泥毛边割伤。安装时略向室外倾斜,雨水才不会顺管爬进屋。',
      spec: 'PVC · Ø75 mm · 外倾 5°',
    }, g);
  }

  /* ============ 室内机零件 ============ */

  // 17 安装挂板
  {
    const g = grp(0, 0.005, -0.099);
    const pl = box(0.74, 0.25, 0.008, new THREE.MeshStandardMaterial({ map: TEX.plate, roughness: 0.45, metalness: 0.55 }), 0, 0, 0);
    g.add(pl);
    g.add(box(0.06, 0.018, 0.014, M.galv(), -0.27, 0.126, 0.006));
    g.add(box(0.06, 0.018, 0.014, M.galv(), 0.27, 0.126, 0.006));
    g.add(box(0.05, 0.014, 0.012, M.galv(), -0.2, -0.126, 0.005));
    g.add(box(0.05, 0.014, 0.012, M.galv(), 0.2, -0.126, 0.005));
    addPart({
      id: 'in-plate', cn: '安装挂板', en: 'Mounting Plate', unit: 'indoor', phase: '室内机',
      explode: [0, 0.04, -0.55],
      blurb: '冲孔镀锌挂板。安装师傅用水平仪校平、打上膨胀螺栓,室内机往上一挂、往下一扣就位——挂歪了冷凝水会从右边溢出来。',
      spec: '镀锌钢板 · 水平安装 · 螺栓 ×6',
    }, g);
  }

  // 18 底壳骨架
  {
    const g = grp(0, 0, -0.055);
    g.add(rbox(0.855, 0.295, 0.075, 0.012, M.shell(), 0, 0, 0));
    const scroll = cyl(0.058, 0.058, 0.66, new THREE.MeshStandardMaterial({ color: 0x55595e, roughness: 0.7, side: THREE.DoubleSide }),
      -0.045, -0.030, 0.008, 'x', 24, { open: true, t0: 2.6, tl: 2.4 });
    scroll.castShadow = false;
    g.add(scroll);
    addPart({
      id: 'in-chassis', cn: '底壳骨架', en: 'Chassis', unit: 'indoor', phase: '室内机',
      explode: [0, 0, -0.30],
      blurb: '工程塑料底壳,集成了风道蜗壳和所有零件的卡位。设计得好不好,直接决定这台机器吵不吵。',
      spec: 'ABS+GF · 一体注塑',
    }, g);
  }

  // 19 接水盘
  {
    const g = grp(-0.03, -0.112, 0.048);
    g.add(box(0.71, 0.024, 0.055, M.shell(), 0, 0, 0));
    const inner = box(0.68, 0.006, 0.042, new THREE.MeshStandardMaterial({ color: 0xb9c9d2, roughness: 0.3 }), 0, 0.010, 0);
    inner.castShadow = false;
    g.add(inner);
    const spout = cyl(0.009, 0.009, 0.05, M.shell(), 0.345, -0.004, -0.01, 'x', 10);
    spout.rotation.z = 0.3;
    g.add(spout);
    addPart({
      id: 'in-drainpan', cn: '接水盘', en: 'Drain Pan', unit: 'indoor', phase: '室内机',
      explode: [0.02, -0.34, 0.30],
      blurb: '蒸发器凝出的每一滴水都落进这里,再顺着排水管流走。空调滴水进屋,九成是它脏堵了或者装歪了。',
      spec: 'PP · 带坡度导流',
    }, g);
  }

  // 20 蒸发器
  {
    const g = grp(-0.02, 0.02, 0);
    const finMat = () => new THREE.MeshStandardMaterial({ map: TEX.fin, roughness: 0.5, metalness: 0.45 });
    const front = new THREE.Group();
    front.add(box(0.70, 0.20, 0.024, finMat(), 0, 0, 0));
    front.add(box(0.005, 0.20, 0.026, M.galv(), 0.353, 0, 0));
    front.add(box(0.005, 0.20, 0.026, M.galv(), -0.353, 0, 0));
    for (let i = 0; i < 4; i++) {
      const u = torus(0.010, 0.0026, M.copper(), 0.356, -0.07 + i * 0.045, 0, Math.PI, 10);
      u.rotation.y = Math.PI / 2;
      front.add(u);
    }
    front.rotation.x = -0.42;
    front.position.set(0, 0.012, 0.045);
    const rear = new THREE.Group();
    rear.add(box(0.70, 0.155, 0.024, finMat(), 0, 0, 0));
    rear.add(box(0.005, 0.155, 0.026, M.galv(), 0.353, 0, 0));
    rear.add(box(0.005, 0.155, 0.026, M.galv(), -0.353, 0, 0));
    for (let i = 0; i < 3; i++) {
      const u = torus(0.010, 0.0026, M.copper(), 0.356, -0.05 + i * 0.045, 0, Math.PI, 10);
      u.rotation.y = Math.PI / 2;
      rear.add(u);
    }
    rear.rotation.x = 0.62;
    rear.position.set(0, 0.035, -0.052);
    g.add(front, rear);
    // 分液器
    g.add(cyl(0.008, 0.008, 0.03, M.copper(), 0.34, -0.06, -0.02, 'y', 10));
    g.add(tube([[0.34, -0.045, -0.02], [0.35, -0.01, 0.0], [0.35, 0.02, 0.03]], 0.0022, M.copper(), 16));
    g.add(tube([[0.34, -0.045, -0.02], [0.36, -0.005, -0.02], [0.355, 0.03, -0.045]], 0.0022, M.copper(), 16));
    addPart({
      id: 'in-evap', cn: '蒸发器', en: 'Evaporator Coil', unit: 'indoor', phase: '室内机',
      explode: [-0.05, 0.46, 0.14],
      blurb: '两折的铜管铝翅片换热器,像帐篷一样罩住风轮。制冷时冷媒在管里沸腾吸热,把穿过来的空气降到 12 ℃ 左右;翅片是亲水铝箔,冷凝水会乖乖滑进接水盘。',
      spec: '亲水铝箔 · Ø7 内螺纹铜管 · 2 折',
    }, g);
  }

  // 21 贯流风轮
  {
    const g = grp(-0.045, -0.028, 0.004);
    const dark = new THREE.MeshStandardMaterial({ color: 0x2e3236, roughness: 0.55 });
    g.add(cyl(0.017, 0.017, 0.66, dark, 0, 0, 0, 'x', 12));
    for (let i = 0; i <= 8; i++) {
      const ring = torus(0.0455, 0.0018, dark, -0.33 + i * 0.0825, 0, 0, Math.PI * 2, 24);
      ring.rotation.y = Math.PI / 2;
      g.add(ring);
    }
    const bladeGeo = new THREE.BoxGeometry(0.655, 0.0022, 0.0125);
    const inst = new THREE.InstancedMesh(bladeGeo, dark, 30);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), eu = new THREE.Euler();
    for (let i = 0; i < 30; i++) {
      const a = i / 30 * Math.PI * 2;
      eu.set(a + 0.6, 0, 0);
      q.setFromEuler(eu);
      m4.compose(new THREE.Vector3(0, Math.cos(a) * 0.040, Math.sin(a) * 0.040), q, new THREE.Vector3(1, 1, 1));
      inst.setMatrixAt(i, m4);
    }
    inst.castShadow = true;
    g.add(inst);
    anim.crossflow = g;
    addPart({
      id: 'in-fan', cn: '贯流风轮', en: 'Cross-Flow Fan', unit: 'indoor', phase: '室内机',
      explode: [-0.05, 0.10, 0.46],
      blurb: '细长的笼形风扇,空气从蒸发器进、贴着蜗壳走、再从下面的出风口出——风幕又宽又匀又安静,壁挂空调不呼啸的秘密全在它。',
      spec: 'Ø92 × 660 mm · 约 1200 rpm · 30 叶',
    }, g);
  }

  // 22 内风机电机
  {
    const g = grp(0.335, -0.028, 0.004);
    g.add(cyl(0.031, 0.031, 0.072, new THREE.MeshStandardMaterial({ color: 0xd9dadc, roughness: 0.5 }), 0, 0, 0, 'x', 20));
    g.add(cyl(0.033, 0.033, 0.012, M.darkPlastic(), 0.042, 0, 0, 'x', 20));
    g.add(cyl(0.005, 0.005, 0.03, M.alu(), -0.048, 0, 0, 'x', 8));
    g.add(tube([[0.04, 0.02, 0.01], [0.05, 0.06, 0.02], [0.04, 0.10, 0.01]], 0.0028, M.rubber(), 12));
    addPart({
      id: 'in-fanmotor', cn: '内风机电机', en: 'DC Fan Motor', unit: 'indoor', phase: '室内机',
      explode: [0.44, 0.06, 0.34],
      blurb: 'DC 无刷电机,12 档无级调速。深夜最低档时转速不到 500 rpm,声音比冰箱还小。',
      spec: 'DC 310 V · 30 W · 无刷',
    }, g);
  }

  // 23 电控盒
  {
    const g = grp(0.362, 0, 0.008);
    g.add(rbox(0.09, 0.19, 0.12, 0.006, M.white(), 0, 0, 0));
    const pcb = decal(0.075, 0.16, TEX.pcb, 0, 0.0, 0.0605, 0, 0, { alpha: false });
    pcb.rotation.z = Math.PI / 2;
    g.add(pcb);
    for (let i = 0; i < 4; i++) g.add(box(0.012, 0.01, 0.008, M.darkPlastic(), -0.025 + i * 0.017, -0.085, 0.062));
    addPart({
      id: 'in-ctrl', cn: '电控盒', en: 'Control Box', unit: 'indoor', phase: '室内机',
      explode: [0.48, 0.02, 0.40],
      blurb: '室内机的大脑:主控板、接线端子、环温和管温传感器都住在右侧这个小盒子里。遥控器每一声"滴",都是它在应答。',
      spec: '主控板 · 传感器 ×2 · 端子排',
    }, g);
  }

  // 24 竖导风叶
  {
    const g = grp(-0.03, -0.118, 0.052);
    const vm = M.darkPlastic();
    for (let i = 0; i < 9; i++) {
      const v = box(0.007, 0.042, 0.026, vm, -0.30 + i * 0.075, 0, 0);
      v.rotation.y = 0.12;
      anim.vanes.push(v);
      g.add(v);
    }
    g.add(box(0.62, 0.005, 0.006, vm, 0, -0.014, 0.010));
    addPart({
      id: 'in-vanes', cn: '竖导风叶', en: 'Vertical Vanes', unit: 'indoor', phase: '室内机',
      explode: [0.02, -0.26, 0.46],
      blurb: '九片小叶子被一根连杆牵着,同步左右摆头,决定风往客厅哪个角落吹。',
      spec: 'ABS · 连杆联动 ×9',
    }, g);
  }

  // 25 导风板
  {
    const g = grp(-0.03, -0.128, 0.048);
    const pivot = new THREE.Group();
    pivot.add(rbox(0.70, 0.004, 0.078, 0.002, M.glossWhite(), 0, -0.004, 0.034));
    g.add(pivot);
    anim.louver = pivot;
    addPart({
      id: 'in-louver', cn: '导风板', en: 'Air Louver', unit: 'indoor', phase: '室内机',
      explode: [0.02, -0.42, 0.60],
      blurb: '出风口的这扇门开多大、朝哪开,全看模式:制冷平吹,凉风贴着天花板铺满房间;制热下压,把暖风送到脚边。',
      spec: 'ABS · 步进电机驱动 · ±60°',
    }, g);
  }

  // 26 空气过滤网 ×2
  {
    const g = grp(0, 0.02, 0);
    const fm = () => new THREE.MeshStandardMaterial({
      map: TEX.mesh, transparent: true, alphaTest: 0.15, side: THREE.DoubleSide, roughness: 0.7, color: 0xeff2f5,
    });
    const sub = [];
    for (const sx of [-1, 1]) {
      const f = cyl(0.40, 0.40, 0.335, fm(), sx * 0.173, -0.28, -0.005, 'x', 24, { open: true, t0: Math.PI / 2 - 0.28, tl: 0.56 });
      f.castShadow = false;
      g.add(f);
      sub.push({ obj: f, vec: new THREE.Vector3(sx * 0.055, sx > 0 ? 0.10 : 0.05, sx > 0 ? 0.06 : 0.02) });
    }
    addPart({
      id: 'in-filter', cn: '空气过滤网 ×2', en: 'Air Filters', unit: 'indoor', phase: '室内机',
      explode: [0, 0.38, 0.48], sub,
      blurb: '两张可水洗尼龙滤网,拦住灰尘毛絮,保护蒸发器不长"毛衣"。两周冲一次水,风量、噪音和电费都会感谢你。',
      spec: '尼龙网 · 可水洗 · 免工具抽取',
    }, g);
  }

  // 27 前面板总成
  {
    const g = grp(0, 0, 0);
    const s = new THREE.Shape();
    s.moveTo(0.010, 0.150);
    s.lineTo(0.048, 0.150);
    s.quadraticCurveTo(0.092, 0.146, 0.104, 0.10);
    s.quadraticCurveTo(0.117, 0.04, 0.108, -0.02);
    s.quadraticCurveTo(0.098, -0.085, 0.062, -0.132);
    s.lineTo(0.052, -0.124);
    s.quadraticCurveTo(0.087, -0.082, 0.097, -0.02);
    s.quadraticCurveTo(0.105, 0.038, 0.093, 0.094);
    s.quadraticCurveTo(0.082, 0.138, 0.044, 0.140);
    s.lineTo(0.010, 0.140);
    s.closePath();
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.87, bevelEnabled: false, curveSegments: 24 });
    // rotateY(-π/2):挤出方向 +z → -x,截面 x → +z(保号)
    geo.rotateY(-Math.PI / 2);
    geo.translate(0.435, 0, 0);
    const panel = mesh(geo, M.glossWhite(), 0, 0, 0);
    g.add(panel);
    const lg = decal(0.22, 0.034, TEX.logo, -0.10, 0.055, 0.108, -0.28, 0);
    g.add(lg);
    // 顶部进风格栅条
    const slatMat = M.shell();
    for (let i = 0; i < 6; i++) {
      g.add(box(0.72, 0.0045, 0.010, slatMat, -0.01, 0.152, -0.030 + i * 0.016));
    }
    addPart({
      id: 'in-front', cn: '前面板总成', en: 'Front Panel', unit: 'indoor', phase: '室内机',
      explode: [0, 0.08, 0.80],
      blurb: '一整块曲面 ABS,钢琴烤漆。向上掀开就能抽滤网——设计师管这叫"零学习成本",你妈管这叫"哦,原来这里能开"。',
      spec: 'ABS 注塑 · 钢琴烤漆 · 可掀起',
    }, g);
  }

  // 28 显示与接收窗
  {
    const g = grp(0.255, -0.052, 0.098);
    g.rotation.x = -0.42;
    g.add(rbox(0.098, 0.042, 0.008, 0.003, new THREE.MeshPhysicalMaterial({ color: 0x0e1216, roughness: 0.15, clearcoat: 0.8 }), 0, 0, 0));
    // 动态显示屏
    const dc = document.createElement('canvas');
    dc.width = 192; dc.height = 80;
    const dg = dc.getContext('2d');
    const dtex = new THREE.CanvasTexture(dc);
    dtex.colorSpace = THREE.SRGBColorSpace;
    const dmat = new THREE.MeshBasicMaterial({ map: dtex, transparent: true, opacity: 0.96 });
    const dpl = mesh(new THREE.PlaneGeometry(0.086, 0.032), dmat, 0, 0, 0.0045);
    dpl.castShadow = false;
    g.add(dpl);
    const displayApi = {
      draw(on, mode, temp) {
        dg.clearRect(0, 0, 192, 80);
        if (on) {
          dg.fillStyle = mode === 'heat' ? '#ffb283' : '#8fe0ff';
          dg.font = 'bold 54px "Helvetica Neue",Menlo,sans-serif';
          dg.textAlign = 'center';
          dg.fillText(String(temp), 108, 60);
          dg.font = '26px sans-serif';
          dg.fillText(mode === 'heat' ? '☀' : '❄', 34, 52);
        } else {
          dg.fillStyle = 'rgba(150,190,210,0.5)';
          dg.beginPath(); dg.arc(96, 40, 5, 0, 6.29); dg.fill();
        }
        dtex.needsUpdate = true;
      },
      mat: dmat,
    };
    displayApi.draw(false, 'cool', 26);
    anim.display = displayApi;
    addPart({
      id: 'in-display', cn: '显示与接收窗', en: 'Display & IR Eye', unit: 'indoor', phase: '室内机',
      explode: [0.26, -0.10, 1.05],
      blurb: '藏在黑色亚克力后面的 LED 数码管和红外接收头。你按遥控器,它"滴"一声亮出 26——人机对话到此为止,简洁。',
      spec: 'LED 数码管 · 红外 38 kHz',
    }, g);
  }

  // 29 能效标识
  {
    const g = grp(-0.315, 0.012, 0.1075);
    g.rotation.x = -0.16;
    const lab = decal(0.052, 0.072, TEX.energy, 0, 0, 0, 0, 0, { alpha: false });
    lab.castShadow = false;
    g.add(lab);
    addPart({
      id: 'in-energy', cn: '能效标识', en: 'Energy Label', unit: 'indoor', phase: '室内机',
      explode: [-0.34, 0.06, 1.0],
      blurb: 'APF 5.27,一级能效。撕不撕随你,能效不会变;但验收和晒朋友圈的时候,它得在。',
      spec: '不干胶 · GB 21455-2019',
    }, g);
  }

  /* ============ 管线 ============ */

  // 30 冷媒连接管
  {
    const g = grp(0, 0, 0);
    const pts = [
      [-0.30, 1.925, 0.17], [-0.21, 1.905, 0.09], [-0.18, 1.90, -0.02], [-0.18, 1.885, -0.15],
      [-0.10, 1.58, -0.155], [0.12, 1.22, -0.165], [0.55, 0.94, -0.175], [0.88, 0.86, -0.23], [0.955, 0.815, -0.315],
    ];
    const insMat = new THREE.MeshStandardMaterial({ map: TEX.tapeWrap, roughness: 0.85 });
    const t = tube(pts, 0.0245, insMat, 96);
    g.add(t);
    const curve = t.userData.curve;
    // 扎带
    const strapMat = M.darkPlastic();
    for (const u of [0.30, 0.48, 0.66, 0.82]) {
      const p = curve.getPointAt(u), tan = curve.getTangentAt(u);
      const strap = torus(0.027, 0.004, strapMat, p.x, p.y, p.z, Math.PI * 2, 18);
      strap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tan);
      g.add(strap);
    }
    // 两端铜喇叭口
    g.add(cyl(0.005, 0.005, 0.05, M.copper(), -0.315, 1.928, 0.185, 'x', 8));
    g.add(cyl(0.0035, 0.0035, 0.05, M.copper(), -0.315, 1.912, 0.165, 'x', 8));
    g.add(cyl(0.005, 0.005, 0.04, M.copper(), 0.958, 0.80, -0.33, 'z', 8));
    addPart({
      id: 'ln-pipes', cn: '冷媒连接管', en: 'Refrigerant Lines', unit: 'lines', phase: '管线',
      explode: [0, 0, 0], noExplode: true, pipeCurve: curve,
      blurb: '室内外机的任督二脉:细管走高压液体,粗管走低压气体,一起裹在保温棉和白色缠绕带里。铜管每一个喇叭口,都是安装师傅手工扩出来的。',
      spec: '铜管 Ø6/Ø12 · 保温棉 · 标配 3 m',
    }, g);
  }

  // 31 排水管
  {
    const g = grp(0, 0, 0);
    const t = tube([
      [-0.14, 1.885, -0.15], [-0.02, 1.66, -0.19], [0.35, 1.10, -0.23],
      [0.82, 0.45, -0.38], [1.18, 0.10, -0.55], [1.30, 0.035, -0.62],
    ], 0.0115, new THREE.MeshStandardMaterial({ map: TEX.corrug, roughness: 0.8 }), 64);
    g.add(t);
    addPart({
      id: 'ln-drain', cn: '排水管', en: 'Drain Hose', unit: 'lines', phase: '管线',
      explode: [0, 0, 0], noExplode: true,
      blurb: '波纹软管,靠重力把冷凝水送到楼下。一台 1.5 匹空调在梅雨天一天能凝出十几升水——楼下住户对此深有体会。',
      spec: 'PE 波纹管 · Ø16 · 全程放坡',
    }, g);
  }

  // 32 电源线与插头
  {
    const g = grp(0, 0, 0);
    g.add(tube([
      [-0.115, 1.832, 0.30], [0.0, 1.735, 0.365], [0.17, 1.665, 0.30], [0.30, 1.648, 0.21], [0.345, 1.626, 0.148],
    ], 0.0052, M.white(), 48));
    const plug = rbox(0.034, 0.045, 0.024, 0.004, M.white(), 0.35, 1.615, 0.145);
    plug.rotation.x = 0.25;
    g.add(plug);
    addPart({
      id: 'ln-cord', cn: '电源线与插头', en: 'Power Cord', unit: 'lines', phase: '管线',
      explode: [0, 0, 0], noExplode: true,
      blurb: '3×2.5 mm² 铜芯线配 16 A 插头。空调必须独享一个专用插座——和电磁炉抢排插,是烧插座的经典开局。',
      spec: '3×2.5 mm² · 16 A 三脚插头',
    }, g);
  }

  /* ============ 收尾 ============ */

  // 33 遥控器
  {
    const g = grp(0.30, 1.46, 0.129);
    g.add(box(0.056, 0.05, 0.012, M.white(), 0, -0.055, -0.006));
    g.add(box(0.056, 0.008, 0.022, M.white(), 0, -0.078, -0.001));
    const body = rbox(0.048, 0.155, 0.014, 0.006, M.white(), 0, 0, 0.004);
    body.rotation.x = 0.05;
    g.add(body);
    const face = decal(0.042, 0.145, TEX.remote, 0, 0.0008, 0.0118, 0.05, 0, { alpha: false });
    face.castShadow = false;
    g.add(face);
    addPart({
      id: 'ex-remote', cn: '红外遥控器', en: 'Remote Control', unit: 'extras', phase: '收尾',
      explode: [0.32, -0.10, 0.62],
      blurb: '两节七号电池驱动的最后一块拼图。26 ℃,是空调师傅、电网和电费单共同推荐的温度。',
      spec: '红外 38 kHz · AAA ×2 · 挂座含在附件包',
    }, g);
  }

  /* ---------- 后处理:收集材质 / 包围盒 / 射线目标 ---------- */
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
    // 标签锚点偏移(建造姿态下的包围盒中心相对组原点)
    const bb = new THREE.Box3().setFromObject(p.group);
    const c = bb.getCenter(new THREE.Vector3());
    const wp = p.group.getWorldPosition(new THREE.Vector3());
    p.anchorOff = c.sub(wp);
    p.radius = bb.getSize(new THREE.Vector3()).length() / 2;
  });

  // 粒子发射源
  const emitters = {
    indoor: { obj: indoorG, a: new THREE.Vector3(-0.36, -0.155, 0.10), b: new THREE.Vector3(0.30, -0.155, 0.10) },
    outdoor: { obj: outdoorG, c: new THREE.Vector3(-0.155, 0.02, -0.19), r: 0.15 },
    pipeCurve: parts.find(p => p.id === 'ln-pipes').pipeCurve,
  };

  return { root, parts, units, anim, env, emitters };
}
