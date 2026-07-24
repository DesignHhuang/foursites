// 白夜五号游戏主机 —— 全部零件用 three.js 基础几何体手工建模
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
  TEX.floor = canvasTex(512, 256, (g) => {
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

  TEX.desk = canvasTex(256, 128, (g) => {
    g.fillStyle = '#5f4632'; g.fillRect(0, 0, 256, 128);
    for (let i = 0; i < 42; i++) {
      const y = i * 3.2 + Math.sin(i * 1.3) * 2;
      g.strokeStyle = `rgba(${74 + (i % 4) * 6},${52 + (i % 4) * 5},${36},0.4)`;
      g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(70, y + 2, 190, y - 2, 256, y + 1); g.stroke();
    }
  }, { repeat: [3, 1] });

  TEX.rug = canvasTex(512, 352, (g) => {
    g.fillStyle = '#2b2f38'; g.fillRect(0, 0, 512, 352);
    g.strokeStyle = '#6c8cff'; g.lineWidth = 4;
    g.strokeRect(14, 14, 484, 324);
    g.strokeStyle = 'rgba(120,130,155,0.28)'; g.lineWidth = 1.6;
    const r = 26;
    for (let y = 40; y < 330; y += 40) {
      for (let x = 40 + (y % 80 ? 22 : 0); x < 480; x += 46) {
        g.beginPath();
        for (let k = 0; k <= 6; k++) {
          const a = Math.PI / 3 * k + Math.PI / 6;
          const px = x + Math.cos(a) * r * 0.55, py = y + Math.sin(a) * r * 0.55;
          k ? g.lineTo(px, py) : g.moveTo(px, py);
        }
        g.stroke();
      }
    }
  });

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
    g.fillRect(96, 70, 60, 60); g.fillRect(30, 30, 40, 26); g.fillRect(180, 130, 44, 30);
    g.fillStyle = '#dfe3e8'; g.font = '11px Menlo,monospace';
    g.fillText('WN-5000 MAIN', 92, 178);
  });

  // 屏蔽罩冲孔
  TEX.holes = canvasTex(128, 128, (g) => {
    g.fillStyle = '#9aa1a8'; g.fillRect(0, 0, 128, 128);
    g.fillStyle = '#787f86';
    for (let y = 8; y < 128; y += 14) {
      for (let x = 8 + (y % 28 ? 7 : 0); x < 128; x += 14) {
        g.beginPath(); g.arc(x, y, 3.2, 0, 6.29); g.fill();
      }
    }
  }, { repeat: [3, 2] });

  // 散热鳍片
  TEX.fins = canvasTex(256, 128, (g) => {
    g.fillStyle = '#b0b6bd'; g.fillRect(0, 0, 256, 128);
    for (let x = 0; x < 256; x += 3) {
      g.fillStyle = x % 6 ? '#999fa7' : '#8b9199';
      g.fillRect(x, 0, 1.4, 128);
    }
  }, { repeat: [2, 1] });

  // 电源铭牌
  TEX.psu = canvasTex(200, 110, (g) => {
    g.fillStyle = '#c8cdd2'; g.fillRect(0, 0, 200, 110);
    g.fillStyle = '#222'; g.font = 'bold 12px "PingFang SC",sans-serif';
    g.fillText('白夜五号 电源单元', 12, 20);
    g.font = '9px Menlo,monospace'; g.fillStyle = '#444';
    ['MODEL WN-PSU-350', 'INPUT: 220V~ 50Hz 1.8A', 'OUTPUT: +12V ⎓ 29A  350W', '⚠ 内部无可维修部件'].forEach((s, i) => g.fillText(s, 12, 40 + i * 15));
    g.strokeStyle = '#888'; g.strokeRect(2, 2, 196, 106);
  });

  // 后接口
  TEX.ports = canvasTex(200, 220, (g) => {
    g.fillStyle = '#17191c'; g.fillRect(0, 0, 200, 220);
    g.fillStyle = '#000'; g.strokeStyle = '#3c424a'; g.lineWidth = 2;
    const port = (x, y, w, h) => { g.fillRect(x, y, w, h); g.strokeRect(x, y, w, h); };
    port(60, 20, 80, 26);   // HDMI
    port(60, 66, 80, 30);   // LAN
    port(70, 116, 60, 24);  // USB
    port(70, 160, 60, 24);  // USB
    g.fillStyle = '#8b93a1'; g.font = '11px Menlo';
    g.fillText('HDMI', 84, 60); g.fillText('LAN', 88, 110); g.fillText('USB', 88, 154);
  });

  // 键盘键帽
  TEX.keys = canvasTex(360, 128, (g) => {
    g.fillStyle = '#1d2025'; g.fillRect(0, 0, 360, 128);
    g.fillStyle = '#3a3f47';
    for (let y = 8; y < 96; y += 24) {
      for (let x = 8 + (y % 48 ? 6 : 0); x < 340; x += 24) g.fillRect(x, y, 19, 19);
    }
    g.fillRect(96, 100, 160, 20);
    g.fillStyle = '#6c8cff'; g.fillRect(8, 100, 40, 20);
  });

  // 鼠标垫
  TEX.pad = canvasTex(256, 128, (g) => {
    g.fillStyle = '#1a1d23'; g.fillRect(0, 0, 256, 128);
    g.strokeStyle = '#6c8cff'; g.lineWidth = 5;
    g.strokeRect(3, 3, 250, 122);
    g.fillStyle = 'rgba(108,140,255,0.25)'; g.font = 'bold 22px "Helvetica Neue"';
    g.fillText('WN', 204, 112);
  });

  // 海报
  TEX.poster = canvasTex(256, 384, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 384);
    grad.addColorStop(0, '#0c1024'); grad.addColorStop(1, '#251438');
    g.fillStyle = grad; g.fillRect(0, 0, 256, 384);
    g.strokeStyle = 'rgba(108,140,255,0.35)';
    for (let i = 0; i < 9; i++) {
      g.beginPath(); g.moveTo(128 + (i - 4) * 30, 384); g.lineTo(128 + (i - 4) * 80, 200); g.stroke();
    }
    for (let i = 0; i < 5; i++) {
      g.beginPath(); g.moveTo(0, 384 - i * i * 8); g.lineTo(256, 384 - i * i * 8); g.stroke();
    }
    g.fillStyle = '#f2b544'; g.beginPath(); g.arc(128, 150, 56, 0, 6.29); g.fill();
    g.fillStyle = '#0c1024'; g.font = 'bold 84px "PingFang SC",serif';
    g.textAlign = 'center'; g.fillText('五', 128, 180);
    g.fillStyle = '#dde5ff'; g.font = 'bold 20px "PingFang SC",sans-serif';
    g.fillText('白 夜 五 号', 128, 300);
    g.fillStyle = 'rgba(220,228,255,0.55)'; g.font = '11px "Helvetica Neue"';
    g.fillText('WHITE NIGHT V · PLAY HAS NO NIGHT', 128, 326);
    g.textAlign = 'left';
    g.strokeStyle = '#6c8cff'; g.lineWidth = 2; g.strokeRect(6, 6, 244, 372);
  });

  // 游戏光盘盘面
  TEX.disc = canvasTex(256, 256, (g) => {
    g.fillStyle = '#101426'; g.beginPath(); g.arc(128, 128, 128, 0, 6.29); g.fill();
    const grad = g.createRadialGradient(128, 128, 20, 128, 128, 126);
    grad.addColorStop(0, '#25172e'); grad.addColorStop(0.7, '#132043'); grad.addColorStop(1, '#0c1024');
    g.fillStyle = grad; g.beginPath(); g.arc(128, 128, 124, 0, 6.29); g.fill();
    g.fillStyle = '#f2b544'; g.beginPath(); g.arc(128, 96, 30, 0, 6.29); g.fill();
    g.fillStyle = '#101426'; g.font = 'bold 40px "PingFang SC",serif';
    g.textAlign = 'center'; g.fillText('五', 128, 110);
    g.fillStyle = '#dde5ff'; g.font = 'bold 16px "PingFang SC",sans-serif';
    g.fillText('白夜传说', 128, 168);
    g.fillStyle = 'rgba(220,228,255,0.5)'; g.font = '9px Menlo';
    g.fillText('WN-BD · 4K UHD · 100GB', 128, 190);
    g.textAlign = 'left';
    g.fillStyle = '#e8e9ea'; g.beginPath(); g.arc(128, 128, 17, 0, 6.29); g.fill();
    g.fillStyle = '#0a0c10'; g.beginPath(); g.arc(128, 128, 8, 0, 6.29); g.fill();
  });
}

/* ---------------- materials ---------------- */

const M = {
  glossWhite: () => new THREE.MeshPhysicalMaterial({ color: 0xf4f4f2, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
  glossBlack: () => new THREE.MeshPhysicalMaterial({ color: 0x0c0d10, roughness: 0.18, clearcoat: 0.9, clearcoatRoughness: 0.1 }),
  matteBlack: () => new THREE.MeshStandardMaterial({ color: 0x1b1d21, roughness: 0.7 }),
  darkPlastic: () => new THREE.MeshStandardMaterial({ color: 0x2c2f34, roughness: 0.6 }),
  alu: () => new THREE.MeshStandardMaterial({ color: 0xcfd4d9, roughness: 0.35, metalness: 0.85 }),
  aluDark: () => new THREE.MeshStandardMaterial({ color: 0x6f767e, roughness: 0.4, metalness: 0.8 }),
  steel: () => new THREE.MeshStandardMaterial({ color: 0x9299a1, roughness: 0.45, metalness: 0.75 }),
  copper: () => new THREE.MeshStandardMaterial({ color: 0xc47a45, roughness: 0.3, metalness: 1.0 }),
  liquidMetal: () => new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.05, metalness: 1.0 }),
  fabric: (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 }),
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

// 二次贝塞尔采样
function q(p0, c, p1, n = 10) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]);
  }
  return out;
}

/* ================= WORLD ================= */

export function buildWorld() {
  buildTextures();
  const root = new THREE.Group();
  const parts = [];
  const anim = { ledMats: [], rgbMats: [] };
  const env = { furnitureMats: [] };

  const CON_POS = new THREE.Vector3(0.56, 0.965, -0.02);
  const conG = grp(CON_POS.x, CON_POS.y, CON_POS.z);
  conG.rotation.y = -0.30;
  const setupG = grp(0, 0, 0);
  root.add(conG, setupG);

  const units = {
    console: { group: conG, base: CON_POS.clone(), vec: new THREE.Vector3(0.18, 0.52, 0.42) },
    setup: { group: setupG, base: new THREE.Vector3(), vec: new THREE.Vector3(0, 0, 0) },
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

  /* ============ 环境:游戏房书桌 ============ */
  {
    const base = rbox(4.0, 0.12, 3.2, 0.035, new THREE.MeshStandardMaterial({ color: 0x25282d, roughness: 0.7 }), 0, -0.061, 0.55);
    root.add(base);
    root.add(box(3.7, 0.024, 2.6, new THREE.MeshStandardMaterial({ map: TEX.floor, roughness: 0.6 }), 0, 0.012, 0.72));

    // 墙 + 踢脚线
    const wall = box(3.9, 2.4, 0.14, new THREE.MeshStandardMaterial({ color: 0xd9d5cd, roughness: 0.9 }), 0, 1.2, -0.55);
    root.add(wall);
    root.add(box(3.9, 0.08, 0.014, M.white(), 0, 0.064, -0.472));

    // 地毯
    root.add(mesh(new RoundedBoxGeometry(2.0, 0.012, 1.35, 3, 0.006),
      new THREE.MeshStandardMaterial({ map: TEX.rug, roughness: 0.95 }), -0.05, 0.03, 0.95));

    // 书桌
    const desk = grp(0, 0, -0.08);
    desk.add(rbox(1.72, 0.035, 0.72, 0.008, new THREE.MeshStandardMaterial({ map: TEX.desk, roughness: 0.55 }), 0, 0.74, 0));
    for (const sx of [-0.80, 0.80]) {
      desk.add(box(0.05, 0.71, 0.05, M.matteBlack(), sx, 0.365, -0.28));
      desk.add(box(0.05, 0.71, 0.05, M.matteBlack(), sx, 0.365, 0.26));
      desk.add(box(0.05, 0.04, 0.56, M.matteBlack(), sx, 0.05, -0.01));
    }
    desk.add(box(1.5, 0.06, 0.12, M.matteBlack(), 0, 0.63, -0.30));
    root.add(desk);

    // 显示器(动态屏幕)
    const mon = grp(-0.26, 0, -0.34);
    mon.add(rbox(0.27, 0.014, 0.17, 0.004, M.matteBlack(), 0, 0.765, 0.02));
    mon.add(box(0.026, 0.20, 0.05, M.matteBlack(), 0, 0.87, 0));
    mon.add(rbox(0.625, 0.375, 0.032, 0.006, M.matteBlack(), 0, 1.135, 0.02));
    const sc = document.createElement('canvas');
    sc.width = 880; sc.height = 495;
    const sg = sc.getContext('2d');
    const stex = new THREE.CanvasTexture(sc);
    stex.colorSpace = THREE.SRGBColorSpace;
    stex.anisotropy = 8;
    const smat = new THREE.MeshBasicMaterial({ map: stex, toneMapped: false });
    const screen = mesh(new THREE.PlaneGeometry(0.595, 0.345), smat, 0, 1.135, 0.038);
    screen.castShadow = false;
    mon.add(screen);
    root.add(mon);
    env.monScreenPos = new THREE.Vector3(-0.26, 1.135, -0.30);

    const fpsHist = new Array(60).fill(118);
    anim.screen = {
      brightness: 0.35,
      draw(on, source, t) {
        const W = 880, H = 495;
        if (!on) {
          sg.fillStyle = '#040507'; sg.fillRect(0, 0, W, H);
          const sheen = sg.createLinearGradient(0, 0, W, H);
          sheen.addColorStop(0.35, 'rgba(255,255,255,0)');
          sheen.addColorStop(0.5, 'rgba(170,190,220,0.05)');
          sheen.addColorStop(0.65, 'rgba(255,255,255,0)');
          sg.fillStyle = sheen; sg.fillRect(0, 0, W, H);
          stex.needsUpdate = true;
          return;
        }
        if (source === 'home') {
          const grad = sg.createLinearGradient(0, 0, W, H);
          grad.addColorStop(0, '#111a3a'); grad.addColorStop(1, '#1c1030');
          sg.fillStyle = grad; sg.fillRect(0, 0, W, H);
          for (let i = 0; i < 40; i++) {
            const x = Math.abs(Math.sin(i * 12.9)) % 1 * W, y = Math.abs(Math.sin(i * 5.3)) % 1 * H;
            sg.fillStyle = `rgba(150,170,255,${0.05 + 0.1 * Math.abs(Math.sin(t + i))})`;
            sg.fillRect(x, y, 2.5, 2.5);
          }
          sg.fillStyle = 'rgba(230,236,255,0.9)'; sg.font = '300 26px "Helvetica Neue"';
          sg.fillText('21:47', 790, 44);
          sg.fillStyle = '#8fa2c8'; sg.font = '15px "PingFang SC",sans-serif';
          sg.fillText('玩家_White', 60, 42);
          sg.beginPath(); sg.arc(40, 36, 14, 0, 6.29); sg.fillStyle = '#6c8cff'; sg.fill();
          const tiles = ['#f2b544', '#4c6cff', '#58e0a8', '#c96cff', '#ff7a5c', '#3a4158'];
          tiles.forEach((c, i) => {
            const x = 60 + i * 128, y = 170, s = i === 0 ? 108 : 92;
            sg.fillStyle = c;
            sg.beginPath(); sg.roundRect(x, y + (i ? 10 : 0), s, s, 14); sg.fill();
            if (i === 0) {
              sg.strokeStyle = '#fff'; sg.lineWidth = 3;
              sg.beginPath(); sg.roundRect(x - 4, y - 4, s + 8, s + 8, 17); sg.stroke();
              sg.fillStyle = '#101426'; sg.font = 'bold 40px "PingFang SC",serif'; sg.fillText('五', x + 38, y + 68);
            }
          });
          sg.fillStyle = '#e8ecff'; sg.font = 'bold 21px "PingFang SC",sans-serif';
          sg.fillText('白夜传说 · 继续游戏', 60, 330);
          sg.fillStyle = '#8fa2c8'; sg.font = '14px "PingFang SC",sans-serif';
          sg.fillText('游戏时长 42 小时 · 奖杯 31/54', 60, 358);
          sg.fillText('⨯ 进入      ○ 返回      ☰ 菜单', 60, 452);
          this.brightness = 0.45;
        } else if (source === 'race') {
          const sky = sg.createLinearGradient(0, 0, 0, 240);
          sky.addColorStop(0, '#2a1d4e'); sky.addColorStop(1, '#c9584a');
          sg.fillStyle = sky; sg.fillRect(0, 0, W, 240);
          sg.fillStyle = '#f2b544'; sg.beginPath(); sg.arc(620, 225, 46, Math.PI, 0); sg.fill();
          sg.fillStyle = '#171225';
          sg.beginPath(); sg.moveTo(0, 240); sg.lineTo(160, 168); sg.lineTo(330, 240); sg.closePath(); sg.fill();
          sg.beginPath(); sg.moveTo(300, 240); sg.lineTo(520, 150); sg.lineTo(780, 240); sg.lineTo(880, 205); sg.lineTo(880, 240); sg.closePath(); sg.fill();
          sg.fillStyle = '#1e232e'; sg.fillRect(0, 240, W, H - 240);
          sg.fillStyle = '#3a4152';
          sg.beginPath(); sg.moveTo(340, 240); sg.lineTo(540, 240); sg.lineTo(760, H); sg.lineTo(120, H); sg.closePath(); sg.fill();
          sg.strokeStyle = '#f2e544'; sg.lineWidth = 6; sg.setLineDash([34, 30]);
          sg.lineDashOffset = -((t * 260) % 64);
          sg.beginPath(); sg.moveTo(440, 240); sg.lineTo(440, H); sg.stroke();
          sg.setLineDash([]);
          for (let i = 0; i < 6; i++) {
            const k = ((i / 6 + (t * 0.55) % (1 / 6)) % 1);
            const y = 240 + k * k * (H - 240), s = 4 + k * 22;
            sg.fillStyle = '#c8cdd6';
            sg.fillRect(340 - k * 210 - s, y, s * 0.5, s * 2.4);
            sg.fillRect(540 + k * 210, y, s * 0.5, s * 2.4);
          }
          const bob = Math.sin(t * 9) * 3;
          sg.fillStyle = '#6c8cff';
          sg.beginPath(); sg.roundRect(392, 386 + bob, 96, 54, 12); sg.fill();
          sg.fillStyle = '#101426';
          sg.beginPath(); sg.roundRect(408, 396 + bob, 64, 20, 8); sg.fill();
          sg.fillStyle = '#14161c';
          sg.beginPath(); sg.roundRect(384, 428 + bob, 22, 16, 5); sg.fill();
          sg.beginPath(); sg.roundRect(474, 428 + bob, 22, 16, 5); sg.fill();
          sg.fillStyle = '#fff'; sg.font = 'bold 44px Menlo';
          sg.fillText(String(206 + Math.round(Math.sin(t * 1.4) * 9)), 700, 440);
          sg.font = '15px Menlo'; sg.fillText('km/h', 706, 462);
          sg.fillText('LAP 2/3', 60, 440);
          sg.fillStyle = '#f2b544'; sg.fillText("02'18\"44", 60, 462);
          this.brightness = 0.5;
        } else {
          sg.fillStyle = '#0b0d12'; sg.fillRect(0, 0, W, H);
          fpsHist.shift();
          fpsHist.push(114 + Math.sin(t * 2.1) * 5 + Math.sin(t * 7.3) * 3);
          sg.fillStyle = '#dde5ff'; sg.font = 'bold 19px "PingFang SC",sans-serif';
          sg.fillText('性能面板 PERFORMANCE', 40, 46);
          sg.strokeStyle = '#2a3040'; sg.lineWidth = 1;
          for (let y = 90; y <= 250; y += 40) { sg.beginPath(); sg.moveTo(40, y); sg.lineTo(560, y); sg.stroke(); }
          sg.strokeStyle = '#58e0a8'; sg.lineWidth = 3;
          sg.beginPath();
          fpsHist.forEach((v, i) => {
            const x = 40 + i * (520 / 59), y = 250 - (v - 60) * 1.6;
            i ? sg.lineTo(x, y) : sg.moveTo(x, y);
          });
          sg.stroke();
          sg.fillStyle = '#58e0a8'; sg.font = 'bold 34px Menlo';
          sg.fillText(Math.round(fpsHist[59]) + ' FPS', 600, 130);
          sg.fillStyle = '#8fa2c8'; sg.font = '14px Menlo';
          sg.fillText('frame 8.4 ms', 600, 158);
          const bar = (label, v, y, col) => {
            sg.fillStyle = '#8fa2c8'; sg.font = '13px Menlo'; sg.fillText(label, 40, y + 13);
            sg.fillStyle = '#1c2230'; sg.fillRect(120, y, 380, 16);
            sg.fillStyle = col; sg.fillRect(120, y, 380 * v, 16);
            sg.fillStyle = '#dde5ff'; sg.fillText(Math.round(v * 100) + '%', 512, y + 13);
          };
          bar('GPU', 0.91 + Math.sin(t * 1.3) * 0.04, 300, '#6c8cff');
          bar('CPU', 0.58 + Math.sin(t * 0.9 + 2) * 0.06, 330, '#58e0a8');
          bar('MEM', 0.74, 360, '#c96cff');
          sg.fillStyle = '#8fa2c8'; sg.font = '14px Menlo';
          sg.fillText('SoC 68℃ · 液金良好 · SSD 5.4 GB/s · 风扇工况正常', 40, 430);
          this.brightness = 0.3;
        }
        stex.needsUpdate = true;
      },
    };
    anim.screen.draw(false, 'home', 0);

    // 键盘 / 鼠标 / 鼠标垫
    const pad = box(0.62, 0.004, 0.30, new THREE.MeshStandardMaterial({ map: TEX.pad, roughness: 0.9 }), -0.24, 0.760, 0.06);
    root.add(pad);
    const kb = box(0.365, 0.014, 0.128, new THREE.MeshStandardMaterial({ map: TEX.keys, roughness: 0.6 }), -0.30, 0.767, 0.05);
    kb.rotation.y = 0.02;
    root.add(kb);
    const mouse = mesh(new RoundedBoxGeometry(0.062, 0.032, 0.10, 4, 0.014), M.matteBlack(), -0.02, 0.774, 0.08);
    mouse.rotation.y = -0.2;
    root.add(mouse);

    // 耳机架 + 耳机
    const hs = grp(-0.72, 0, -0.30);
    hs.add(cyl(0.055, 0.065, 0.014, M.matteBlack(), 0, 0.765, 0));
    hs.add(cyl(0.009, 0.009, 0.26, M.matteBlack(), 0, 0.90, 0));
    hs.add(box(0.02, 0.012, 0.09, M.matteBlack(), 0, 1.03, 0.03));
    const band = mesh(new THREE.TorusGeometry(0.072, 0.009, 10, 24, Math.PI), M.matteBlack(), 0, 0.97, 0.045);
    band.rotation.z = 0;
    hs.add(band);
    for (const sx of [-0.072, 0.072]) {
      const cup = cyl(0.036, 0.036, 0.026, M.matteBlack(), sx, 0.955, 0.045, 'x', 18);
      hs.add(cup);
      hs.add(cyl(0.030, 0.030, 0.008, new THREE.MeshStandardMaterial({ color: 0x4a5160, roughness: 0.9 }), sx * 1.16, 0.955, 0.045, 'x', 18));
    }
    root.add(hs);

    // 置物架 + 游戏盒
    const shelf = grp(0.42, 0, -0.46);
    shelf.add(box(0.92, 0.024, 0.15, new THREE.MeshStandardMaterial({ map: TEX.desk, roughness: 0.6 }), 0, 1.56, 0.075));
    const caseCols = [0x4c6cff, 0xc0574f, 0x58e0a8, 0xf2b544, 0xc96cff, 0x8b93a1];
    caseCols.forEach((c, i) => {
      const b = box(0.015, 0.172, 0.136, new THREE.MeshStandardMaterial({ color: c, roughness: 0.5 }), -0.36 + i * 0.032, 1.658, 0.07);
      if (i === 5) b.rotation.z = -0.16;
      shelf.add(b);
      shelf.add(box(0.016, 0.03, 0.11, M.white(), -0.36 + i * 0.032, 1.70, 0.07));
    });
    // 小机器人手办
    const bot = grp(0.28, 1.572, 0.07);
    bot.add(mesh(new RoundedBoxGeometry(0.045, 0.06, 0.035, 4, 0.014), M.white(), 0, 0.032, 0));
    bot.add(mesh(new THREE.SphereGeometry(0.026, 14, 12), M.white(), 0, 0.085, 0));
    bot.add(box(0.028, 0.007, 0.004, M.matteBlack(), 0, 0.088, 0.024));
    shelf.add(bot);
    root.add(shelf);

    // 海报
    const poster = grp(-0.78, 1.55, -0.475);
    poster.add(box(0.45, 0.65, 0.014, M.matteBlack(), 0, 0, 0));
    poster.add(decal(0.41, 0.61, TEX.poster, 0, 0, 0.0085, 0, 0, { alpha: false }));
    root.add(poster);

    // RGB 氛围灯带(墙上 + 桌下)
    const rgbMat = new THREE.MeshStandardMaterial({ color: 0x101318, emissive: 0x6c8cff, emissiveIntensity: 0 });
    const strip1 = box(2.6, 0.012, 0.012, rgbMat, 0.1, 2.02, -0.472);
    const strip2 = box(1.5, 0.008, 0.008, rgbMat, 0, 0.722, 0.27);
    strip1.castShadow = false; strip2.castShadow = false;
    root.add(strip1, strip2);
    anim.rgbMats.push(rgbMat);

    // 地面排插 + 墙面插座
    const strip = grp(0.56, 0, -0.30);
    strip.add(rbox(0.22, 0.036, 0.062, 0.008, M.white(), 0, 0.048, 0));
    for (let i = 0; i < 3; i++) strip.add(cyl(0.006, 0.006, 0.004, M.matteBlack(), -0.06 + i * 0.06, 0.068, 0.012, 'y', 10));
    const sw = box(0.02, 0.008, 0.014, new THREE.MeshStandardMaterial({ color: 0x5c0f0a, emissive: 0xff3a2a, emissiveIntensity: 0.8 }), 0.085, 0.062, 0);
    sw.castShadow = false;
    strip.add(sw);
    strip.add(tube([[0.06, 0.045, -0.02], [0.4, 0.05, -0.12], [0.62, 0.12, -0.16]], 0.004, M.white(), 24));
    root.add(strip);
    root.add(rbox(0.075, 0.075, 0.016, 0.004, M.white(), 0.68, 0.15, -0.472));

    // HDMI 线(主机 → 显示器,桌后走线)
    const hdmi = tube([
      [0.585, 0.86, -0.16], [0.46, 0.76, -0.34], [0.18, 0.70, -0.40], [-0.12, 0.86, -0.40], [-0.26, 1.02, -0.345],
    ], 0.0038, M.matteBlack(), 48);
    root.add(hdmi);
    env.hdmiCurve = hdmi.userData.curve;
    env.furnitureMats.push(hdmi.material);

    // 桌上小多肉
    const cact = grp(0.06, 0.7575, -0.36);
    cact.add(cyl(0.028, 0.022, 0.036, new THREE.MeshStandardMaterial({ color: 0xa85f3f, roughness: 0.8 }), 0, 0.018, 0));
    cact.add(mesh(new THREE.SphereGeometry(0.022, 10, 8), M.fabric(0x4a7c59), 0, 0.052, 0));
    cact.add(mesh(new THREE.SphereGeometry(0.012, 8, 6), M.fabric(0x58a06b), 0.014, 0.066, 0.004));
    root.add(cact);

    // 电竞椅(简化)
    const chair = grp(-0.18, 0, 0.78);
    chair.rotation.y = 0.4;
    chair.add(mesh(new RoundedBoxGeometry(0.44, 0.07, 0.42, 4, 0.03), M.fabric(0x23262d), 0, 0.46, 0));
    const backC = mesh(new RoundedBoxGeometry(0.42, 0.58, 0.07, 4, 0.03), M.fabric(0x23262d), 0, 0.80, 0.22);
    backC.rotation.x = 0.12;
    chair.add(backC);
    chair.add(box(0.30, 0.05, 0.05, M.fabric(0x6c8cff), 0, 1.02, 0.185));
    chair.add(cyl(0.024, 0.024, 0.24, M.aluDark(), 0, 0.33, 0));
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2;
      const leg = box(0.22, 0.018, 0.03, M.matteBlack(), Math.cos(a) * 0.11, 0.05, Math.sin(a) * 0.11);
      leg.rotation.y = -a;
      chair.add(leg);
      chair.add(mesh(new THREE.SphereGeometry(0.02, 10, 8), M.matteBlack(), Math.cos(a) * 0.20, 0.028, Math.sin(a) * 0.20));
    }
    root.add(chair);

    [mon, pad, kb, mouse, hs, shelf, poster, cact, chair].forEach(o => collectMats(o, env.furnitureMats));
  }

  /* ============ 主机零件(组内坐标 = 主机中心,竖放) ============ */

  // 01 内部骨架
  {
    const g = grp(0, 0, -0.004);
    g.add(box(0.064, 0.355, 0.226, new THREE.MeshStandardMaterial({ color: 0x282b30, roughness: 0.75 }), 0, 0, 0));
    g.add(box(0.068, 0.02, 0.23, M.matteBlack(), 0, 0.115, 0));
    g.add(box(0.068, 0.02, 0.23, M.matteBlack(), 0, -0.115, 0));
    addPart({
      id: 'c-frame', cn: '内部骨架', en: 'Internal Frame', unit: 'console', phase: '核心',
      explode: [0, 0, -0.02],
      blurb: '工程塑料骨架,机器的承重墙:主板、电源、光驱、风扇全都卡在它身上,再一起塞进外壳。拆机拆到这一层,零件才真正开始"散架"。',
      spec: 'PC+ABS · 一体注塑',
    }, g);
  }

  // 02 主板
  {
    const g = grp(0.004, 0.01, -0.01);
    const bMat = new THREE.MeshStandardMaterial({ map: TEX.pcb, roughness: 0.55 });
    g.add(box(0.004, 0.29, 0.19, bMat, 0, 0, 0));
    // SoC + GDDR6 ×8(+x 面)
    g.add(box(0.005, 0.032, 0.032, M.matteBlack(), 0.0045, 0.03, 0.0));
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      g.add(box(0.003, 0.013, 0.018, M.matteBlack(), 0.0038, 0.03 + Math.cos(a) * 0.052, Math.sin(a) * 0.055));
    }
    g.add(box(0.006, 0.02, 0.08, M.alu(), 0.005, -0.10, 0.02));
    addPart({
      id: 'c-board', cn: '主板', en: 'Mainboard', unit: 'console', phase: '核心',
      explode: [0.15, 0.02, -0.05],
      blurb: '8 核 CPU 和 10.3 TFLOPS GPU 焊死在同一颗 SoC 里,十六颗 GDDR6 围着它站岗;825 GB 定制固态直接铺在板上,5.5 GB/s 的读取速度让"读条"成为历史名词。',
      spec: 'SoC 7nm · GDDR6 16 GB · 板载 SSD 825 GB',
    }, g);
  }

  // 03 液态金属
  {
    const g = grp(0.012, 0.04, -0.01);
    g.add(box(0.0012, 0.034, 0.034, M.liquidMetal(), 0, 0, 0));
    addPart({
      id: 'c-lm', cn: '液态金属导热层', en: 'Liquid Metal TIM', unit: 'console', phase: '核心',
      explode: [0.30, 0.05, -0.05],
      blurb: '一层亮闪闪的镓铟合金,替代传统硅脂,把 SoC 的热量无损交给散热器。导电又会流动,所以四周围着海绵堤坝——这是全机最"危险"也最优雅的一克重量。',
      spec: '镓铟合金 · 导热 ≈73 W/m·K',
    }, g);
  }

  // 04 均热散热器
  {
    const g = grp(0.019, 0.02, -0.01);
    g.add(box(0.030, 0.20, 0.15, new THREE.MeshStandardMaterial({ map: TEX.fins, roughness: 0.45, metalness: 0.6 }), 0, 0, 0));
    g.add(box(0.006, 0.05, 0.05, M.copper(), -0.017, 0.02, 0.0));
    g.add(tube([[-0.013, 0.08, 0.05], [0.004, 0.095, 0.05], [0.012, 0.08, 0.035], [0.013, 0.02, -0.05], [0.004, -0.06, -0.06], [-0.008, -0.088, -0.038]], 0.005, M.copper(), 40));
    g.add(tube([[-0.013, 0.06, 0.058], [0.006, 0.072, 0.058], [0.014, 0.028, 0.045], [0.014, -0.05, -0.018], [0.001, -0.09, -0.05]], 0.005, M.copper(), 40));
    addPart({
      id: 'c-sink', cn: '均热散热器', en: 'Heatsink', unit: 'console', phase: '核心',
      explode: [0.46, 0.07, -0.05],
      blurb: '铜底吸热、热管疏运、铝鳍片撒热,一套完整的"热量物流系统"。它的体积比很多整机还大——安静,是用金属堆出来的。',
      spec: '铝鳍片 + 热管 ×2 · 铜底座',
    }, g);
  }

  // 05 屏蔽罩
  {
    const g = grp(0.018, -0.02, 0.0);
    g.add(box(0.0016, 0.27, 0.175, new THREE.MeshStandardMaterial({ map: TEX.holes, roughness: 0.5, metalness: 0.7 }), 0, 0, 0));
    addPart({
      id: 'c-shield', cn: 'EMI 屏蔽罩', en: 'EMI Shield', unit: 'console', phase: '核心',
      explode: [0.22, -0.14, 0.06],
      blurb: '满身冲孔的钢板,罩住主板:电磁波出不去,别人的干扰也进不来。孔是给气流留的——屏蔽与散热,一板两吃。',
      spec: '镀锌钢板 0.3 mm · 冲孔率 ≈40%',
    }, g);
  }

  // 06 M.2 扩展仓盖
  {
    const g = grp(0.017, -0.115, 0.055);
    g.add(box(0.0025, 0.055, 0.09, M.aluDark(), 0, 0, 0));
    g.add(cyl(0.004, 0.004, 0.003, M.steel(), 0.002, 0.02, 0.035, 'x', 10));
    addPart({
      id: 'c-m2', cn: 'M.2 扩展仓盖', en: 'M.2 Bay Cover', unit: 'console', phase: '核心',
      explode: [0.38, -0.20, 0.12],
      blurb: '唯一官方允许玩家自己动手的舱门:拧一颗螺丝,就能加装一条 PCIe 4.0 固态。游戏越买越多,这块小盖板迟早会被你打开。',
      spec: '一颗螺丝 · 支持 PCIe 4.0 ×4',
    }, g);
  }

  // 07 电源单元
  {
    const g = grp(-0.024, -0.05, -0.055);
    g.add(box(0.044, 0.18, 0.082, new THREE.MeshStandardMaterial({ color: 0x8f959c, roughness: 0.4, metalness: 0.7 }), 0, 0, 0));
    g.add(decal(0.062, 0.036, TEX.psu, -0.0225, 0.02, 0, 0, -Math.PI / 2, { alpha: false }));
    g.add(box(0.02, 0.026, 0.016, M.matteBlack(), 0, -0.08, -0.038));
    addPart({
      id: 'c-psu', cn: '电源单元', en: 'Power Supply', unit: 'console', phase: '散热与电源',
      explode: [-0.34, -0.07, 0.05], fly: [-0.5, 0.8, 0.8],
      blurb: '350 W 内置电源,直接输出单路 12 V。装在整机最角落,把重量和热量都揽在自己身上——主机不需要外置电源砖,是它的功劳。',
      spec: '350 W · 单路 +12 V · 内置式',
    }, g);
  }

  // 08 双侧进风风扇
  {
    const g = grp(0, 0.125, 0.045);
    const ring = mesh(new THREE.TorusGeometry(0.061, 0.007, 10, 32), M.matteBlack(), 0, 0, 0);
    ring.rotation.y = Math.PI / 2;
    g.add(ring);
    const fanCore = new THREE.Group();
    fanCore.add(cyl(0.022, 0.022, 0.044, M.darkPlastic(), 0, 0, 0, 'x', 18));
    const bladeGeo = new THREE.BoxGeometry(0.040, 0.0022, 0.028);
    const bladeMat = M.darkPlastic();
    for (let i = 0; i < 11; i++) {
      const a = i / 11 * Math.PI * 2;
      const b = mesh(bladeGeo, bladeMat, 0, Math.cos(a) * 0.040, Math.sin(a) * 0.040);
      b.rotation.x = a + 0.7;
      fanCore.add(b);
    }
    g.add(fanCore);
    anim.fan = fanCore;
    addPart({
      id: 'c-fan', cn: '双侧进风风扇', en: 'Twin-Intake Fan', unit: 'console', phase: '散热与电源',
      explode: [0, 0.50, 0.12],
      blurb: '直径 120 mm、厚 45 mm 的离心风扇,两面同时吸气,一台风扇伺候整机。转速由固件根据液金温度实时调度——夜里你听到的那一点点风声,就是它。',
      spec: 'Ø120 × 45 mm · 双侧进风 · 液压轴承',
    }, g);
  }

  // 09 集尘器 ×2
  {
    const g = grp(0.0, 0.135, -0.075);
    for (const [sy, sz] of [[0.02, 0.01], [-0.015, -0.02]]) {
      g.add(mesh(new THREE.CylinderGeometry(0.006, 0.014, 0.022, 12), M.darkPlastic(), 0.01, sy, sz));
    }
    addPart({
      id: 'c-dust', cn: '集尘器 ×2', en: 'Dust Catchers', unit: 'console', phase: '散热与电源',
      explode: [0.03, 0.36, -0.20],
      blurb: '气流里的灰尘被离心力甩进这两个小漏斗里囤着;拆下侧板,拿吸尘器对着孔一吸就干净。给灰尘修专用车位,工业设计的浪漫莫过于此。',
      spec: '漏斗式 ×2 · 免工具清灰',
    }, g);
  }

  // 10 蓝光光驱
  {
    const g = grp(-0.022, 0.0, 0.048);
    g.add(box(0.038, 0.158, 0.125, new THREE.MeshStandardMaterial({ color: 0x84898f, roughness: 0.45, metalness: 0.7 }), 0, 0, 0));
    g.add(box(0.030, 0.0025, 0.09, M.matteBlack(), 0, 0.081, 0.01));
    addPart({
      id: 'c-bd', cn: '蓝光光驱', en: 'Blu-ray Drive', unit: 'console', phase: '驱动与接口',
      explode: [-0.48, 0.03, 0.12], fly: [-0.5, 0.7, 0.9],
      blurb: '4K 蓝光驱动器,整个泡在钢板壳里再垫上橡胶——不是防摔,是防它自己转起来的噪音和震动。数字版主机砍掉的就是这一整块。',
      spec: '4K UHD BD · 100 GB · 全包裹屏蔽',
    }, g);
  }

  // 11 前 IO 板
  {
    const g = grp(0.0, -0.05, 0.112);
    g.add(box(0.012, 0.13, 0.008, new THREE.MeshStandardMaterial({ map: TEX.pcb, roughness: 0.55 }), 0, 0, 0));
    g.add(box(0.013, 0.014, 0.006, M.matteBlack(), 0, 0.045, 0.004));
    g.add(cyl(0.0035, 0.0035, 0.005, M.matteBlack(), 0, 0.015, 0.005, 'z', 10));
    addPart({
      id: 'c-fio', cn: '前 IO 板', en: 'Front I/O Board', unit: 'console', phase: '驱动与接口',
      explode: [0, -0.13, 0.52],
      blurb: '前脸的 USB-A、USB-C 和那颗你每天摸的电源键都焊在这条小板上。开机"哔"的一声,也是它旁边的小蜂鸣器喊的。',
      spec: 'USB-C 10 Gbps + USB-A · 触控开关',
    }, g);
  }

  // 12 后接口板
  {
    const g = grp(0, 0.02, -0.114);
    g.add(box(0.048, 0.14, 0.006, new THREE.MeshStandardMaterial({ map: TEX.ports, roughness: 0.5 }), 0, 0, 0));
    addPart({
      id: 'c-rio', cn: '后接口组', en: 'Rear I/O', unit: 'console', phase: '驱动与接口',
      explode: [0, 0.05, -0.38], fly: [0.3, 0.9, 0.5],
      blurb: 'HDMI 2.1、千兆网口、两个 USB——通向电视和世界的全部航线,都从这块小小的登机口出发。',
      spec: 'HDMI 2.1 · 1 GbE · USB-A ×2',
    }, g);
  }

  // 13 黑色中壳
  {
    const g = grp(0, 0, 0);
    g.add(rbox(0.082, 0.372, 0.242, 0.014, M.glossBlack(), 0, 0, 0));
    g.add(box(0.084, 0.006, 0.20, M.matteBlack(), 0, -0.14, 0.0));
    addPart({
      id: 'c-body', cn: '黑色中壳', en: 'Core Body', unit: 'console', phase: '外壳',
      explode: [0, -0.03, 0.68], fly: [0.3, 0.9, 0.8],
      blurb: '钢琴黑的机身核心,USB 和光驱吸入口都开在它身上。指纹收集能力一流,官方建议:少摸,多玩。',
      spec: 'ABS 钢琴烤漆 · 防尘网格',
    }, g);
  }

  // 14 氛围灯带
  {
    const g = grp(0, 0.02, 0.0);
    const ledMat = new THREE.MeshStandardMaterial({ color: 0x9fb4e8, emissive: 0xbcd0ff, emissiveIntensity: 0 });
    for (const sx of [-0.0435, 0.0435]) {
      const s = box(0.0035, 0.34, 0.008, ledMat, sx, 0, 0.096);
      s.castShadow = false;
      g.add(s);
    }
    anim.ledMats.push(ledMat);
    addPart({
      id: 'c-led', cn: '氛围灯带', en: 'Light Bars', unit: 'console', phase: '外壳',
      explode: [0, 0.45, 0.22],
      blurb: '藏在侧板与中壳夹缝里的两条 LED:待机琥珀色,开机白蓝色。夜里那一线幽光,就是主机在呼吸。',
      spec: 'LED 导光条 ×2 · 固件调色',
    }, g);
  }

  // 15/16 白色侧板(带曲线轮廓)
  function makePlate(sign, id, cn, en, exX, fly) {
    let pts = [[0.040, -0.200]];
    pts = pts.concat(q([0.040, -0.200], [0.064, -0.02], [0.056, 0.09]));
    pts = pts.concat(q([0.056, 0.09], [0.050, 0.165], [0.074, 0.206]));
    pts.push([0.068, 0.209]);
    pts = pts.concat(q([0.068, 0.209], [0.045, 0.165], [0.051, 0.09]));
    pts = pts.concat(q([0.051, 0.09], [0.059, -0.02], [0.035, -0.198]));
    if (sign < 0) {
      pts = pts.map(p => [-p[0], p[1]]).reverse();
    }
    const shape = new THREE.Shape();
    shape.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1]);
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.25, bevelEnabled: true, bevelThickness: 0.003, bevelSize: 0.003, bevelSegments: 2, curveSegments: 12 });
    geo.translate(0, 0, -0.125);
    const g = grp(0, 0.004, 0);
    g.add(mesh(geo, M.glossWhite(), 0, 0, 0));
    addPart({
      id, cn, en, unit: 'console', phase: '外壳',
      explode: [exX, 0.05, 0.08], fly,
      blurb: sign > 0
        ? '标志性的白色弧面侧板,整机气质担当。无需工具,提一下、滑一下就能卸,官方鼓励你拆——毕竟集尘器就藏在它下面。'
        : '另一片白色羽翼。第三方厂商靠给它做替换配色活成了一个产业:午夜黑、火山红、迷彩绿……主机界的手机壳经济。',
      spec: sign > 0 ? 'PC 材质 · 免工具拆装' : 'PC 材质 · 可替换配色',
    }, g);
  }
  makePlate(1, 'c-plateL', '白色侧板(右舷)', 'Side Plate R', 0.64, null);
  makePlate(-1, 'c-plateR', '白色侧板(左舷)', 'Side Plate L', -0.64, [-0.45, 0.8, 0.85]);

  // 17 底座
  {
    const g = grp(0, -0.212, 0.0);
    g.add(cyl(0.098, 0.098, 0.011, M.glossBlack(), 0, 0, 0, 'y', 32));
    g.add(box(0.024, 0.022, 0.05, M.matteBlack(), 0, 0.015, 0));
    addPart({
      id: 'c-stand', cn: '底座', en: 'Stand', unit: 'console', phase: '外壳',
      explode: [0, -0.42, 0.15], fly: [0.4, 0.7, 0.9],
      blurb: '一个圆盘,两种姿势:竖放拧进底部螺孔,横放卡住机身曲线。这台机器没有平整的面,离开底座它站都站不稳——设计师的任性,底座来买单。',
      spec: '横竖两用 · 附赠螺丝 ×1',
    }, g);
  }

  // 18 游戏光盘
  {
    const g = grp(-0.021, 0.05, 0.048);
    const disc = cyl(0.059, 0.059, 0.0014, new THREE.MeshStandardMaterial({ map: TEX.disc, roughness: 0.35, metalness: 0.3 }), 0, 0, 0, 'x', 40);
    g.add(disc);
    addPart({
      id: 'c-disc', cn: '游戏光盘《白夜传说》', en: 'Game Disc', unit: 'console', phase: '桌面',
      explode: [-0.08, 0.18, 0.62],
      blurb: '一张 100 GB 的 4K 蓝光盘。在全数字时代仍坚持买盘的玩家,买的从来不只是数据,是"这游戏是我的"这四个字。',
      spec: 'BD-XL 100 GB · 4K UHD',
    }, g);
  }

  // 19 无线手柄
  {
    const g = grp(0.18, 0.777, 0.24);
    g.rotation.y = 0.55;
    const top = new THREE.Group();
    top.add(mesh(new RoundedBoxGeometry(0.148, 0.026, 0.075, 4, 0.012), M.glossWhite(), 0, 0.006, 0));
    top.add(mesh(new RoundedBoxGeometry(0.145, 0.022, 0.072, 4, 0.011), M.matteBlack(), 0, -0.006, 0.002));
    for (const sx of [-1, 1]) {
      const grip = mesh(new THREE.SphereGeometry(0.026, 14, 12), M.glossWhite(), sx * 0.062, -0.002, 0.035);
      grip.scale.set(1, 0.75, 1.7);
      grip.rotation.y = -sx * 0.4;
      top.add(grip);
    }
    const padMat = new THREE.MeshStandardMaterial({ color: 0x2c2f34, roughness: 0.5 });
    top.add(mesh(new RoundedBoxGeometry(0.052, 0.008, 0.032, 3, 0.004), padMat, 0, 0.018, -0.012));
    const lbMat = new THREE.MeshStandardMaterial({ color: 0x223, emissive: 0x4c6cff, emissiveIntensity: 0 });
    const lb1 = box(0.003, 0.006, 0.028, lbMat, -0.028, 0.018, -0.012);
    const lb2 = box(0.003, 0.006, 0.028, lbMat, 0.028, 0.018, -0.012);
    lb1.castShadow = false; lb2.castShadow = false;
    top.add(lb1, lb2);
    anim.padLedMat = lbMat;
    for (const sx of [-0.026, 0.026]) {
      top.add(cyl(0.0115, 0.013, 0.01, M.matteBlack(), sx, 0.018, 0.022, 'y', 14));
      top.add(cyl(0.0095, 0.0095, 0.004, M.darkPlastic(), sx, 0.026, 0.022, 'y', 14));
    }
    top.add(box(0.022, 0.006, 0.007, M.matteBlack(), -0.058, 0.016, -0.006));
    top.add(box(0.007, 0.006, 0.022, M.matteBlack(), -0.058, 0.016, -0.006));
    for (let i = 0; i < 4; i++) {
      const a = i / 4 * Math.PI * 2;
      top.add(cyl(0.0045, 0.0045, 0.005, M.darkPlastic(), 0.058 + Math.cos(a) * 0.012, 0.017, -0.006 + Math.sin(a) * 0.012, 'y', 10));
    }
    for (const sx of [-0.045, 0.045]) {
      const tr = box(0.03, 0.012, 0.014, M.glossWhite(), sx, 0.008, -0.036);
      tr.rotation.x = -0.5;
      top.add(tr);
    }
    g.add(top);
    addPart({
      id: 's-pad', cn: '无线手柄', en: 'Wireless Controller', unit: 'setup', phase: '桌面',
      explode: [0.12, 0.34, 0.28],
      blurb: '自适应扳机会顶你的手指,线性马达会学雨点敲手心。全世界最贵的手柄之一,也是坏得最心疼的一只。',
      spec: '自适应扳机 · 触觉反馈 · 触摸板',
    }, g);
  }

  // 20 电源线
  {
    const g = grp(0, 0, 0);
    g.add(tube([
      [0.60, 0.845, -0.135], [0.66, 0.62, -0.22], [0.70, 0.25, -0.27], [0.64, 0.075, -0.29], [0.60, 0.062, -0.295],
    ], 0.0045, M.matteBlack(), 40));
    addPart({
      id: 's-cord', cn: '电源线', en: 'Power Cord', unit: 'setup', phase: '桌面',
      explode: [0, 0, 0], noExplode: true,
      blurb: '8 字口梅花线,350 W 全靠它。主机世代换了五代,这根线的接口一次都没变过——游戏机行业最长情的标准。',
      spec: 'IEC C7 · 2×0.75 mm²',
    }, g);
  }

  /* ---------- 后处理 ---------- */
  parts.forEach((p, i) => {
    p.idx = i;
    p.mats = [];
    const seen = new Set();
    p.group.traverse((o) => {
      if (o.isMesh) {
        o.userData.partIdx = i;
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
