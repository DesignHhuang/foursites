import * as THREE from 'three';
import { RoundedBoxGeometry } from '../vendor/RoundedBoxGeometry.js';

function canvasTex(w, h, draw, opts = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  draw(canvas.getContext('2d'), w, h);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  if (opts.repeat) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(...opts.repeat);
  }
  return texture;
}

const TEX = {};

function buildTextures() {
  TEX.logo = canvasTex(512, 128, (g) => {
    g.clearRect(0, 0, 512, 128);
    g.fillStyle = '#30363a';
    g.font = '700 38px "Helvetica Neue", Arial, sans-serif';
    g.fillText('WATTSONIC', 122, 78);
    g.strokeStyle = '#30363a';
    g.lineWidth = 8;
    g.beginPath();
    g.moveTo(58, 74);
    g.lineTo(86, 52);
    g.lineTo(111, 74);
    g.stroke();
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(70, 73);
    g.lineTo(86, 62);
    g.lineTo(101, 73);
    g.stroke();
  });

  TEX.screen = canvasTex(512, 220, (g) => {
    const grd = g.createLinearGradient(0, 0, 512, 220);
    grd.addColorStop(0, '#182128');
    grd.addColorStop(1, '#050708');
    g.fillStyle = grd;
    g.fillRect(0, 0, 512, 220);
    g.fillStyle = '#dce6e8';
    g.font = '700 18px Menlo, monospace';
    g.fillText('WATTMATIC AIO', 22, 35);
    g.font = '13px Menlo, monospace';
    g.fillText('PV  18.2 kW', 24, 75);
    g.fillText('BAT 34.5 kWh', 24, 108);
    g.fillText('LOAD 12.8 kW', 24, 141);
    g.fillText('BACKUP <20 ms', 24, 174);
    g.strokeStyle = '#5cf267';
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(182, 58);
    g.lineTo(260, 58);
    g.lineTo(260, 138);
    g.lineTo(344, 138);
    g.stroke();
    g.fillStyle = '#5cf267';
    [[182, 58], [260, 58], [260, 138], [344, 138], [250, 92]].forEach(([x, y]) => {
      g.beginPath();
      g.arc(x, y, 8, 0, Math.PI * 2);
      g.fill();
    });
    const bars = [0.25, 0.48, 0.74, 0.62];
    bars.forEach((v, i) => {
      const y = 54 + i * 36;
      g.strokeStyle = '#58646b';
      g.strokeRect(376, y, 92, 13);
      g.fillStyle = i === 3 ? '#57c7ff' : '#9eff7a';
      g.fillRect(378, y + 2, 88 * v, 9);
    });
    g.strokeStyle = '#6f7a82';
    g.lineWidth = 2;
    g.strokeRect(1, 1, 510, 218);
  });

  TEX.pcb = canvasTex(512, 320, (g) => {
    g.fillStyle = '#124826';
    g.fillRect(0, 0, 512, 320);
    g.strokeStyle = '#2c8a4a';
    g.lineWidth = 2;
    for (let i = 0; i < 34; i++) {
      const x = 28 + Math.abs(Math.sin(i * 11.7) * 901.3 % 1) * 446;
      const y = 30 + Math.abs(Math.sin(i * 19.3) * 613.5 % 1) * 260;
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 42, y);
      g.lineTo(x + 42, y + 24);
      g.stroke();
      g.fillStyle = '#d1b35c';
      g.fillRect(x - 3, y - 3, 6, 6);
    }
    g.fillStyle = '#111417';
    g.fillRect(46, 54, 92, 66);
    g.fillRect(198, 76, 132, 86);
    g.fillRect(362, 50, 74, 44);
    g.fillStyle = '#c8d1d6';
    for (let x = 48; x < 470; x += 28) g.fillRect(x, 258, 14, 20);
    g.fillStyle = '#dce6e8';
    g.font = '16px Menlo, monospace';
    g.fillText('AI DISPATCH / 15 MIN', 42, 300);
  });

  TEX.bms = canvasTex(420, 220, (g) => {
    g.fillStyle = '#173d34';
    g.fillRect(0, 0, 420, 220);
    g.fillStyle = '#101416';
    for (let i = 0; i < 5; i++) g.fillRect(38 + i * 70, 58, 46, 82);
    g.strokeStyle = '#6eea61';
    g.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      g.moveTo(61 + i * 70, 42);
      g.lineTo(61 + i * 70, 160);
      g.lineTo(350, 160);
      g.stroke();
    }
    g.fillStyle = '#cbd3d6';
    g.font = '16px Menlo, monospace';
    g.fillText('BMS AutoSync CAN', 34, 194);
  });

  TEX.cells = canvasTex(420, 180, (g) => {
    g.fillStyle = '#181d20';
    g.fillRect(0, 0, 420, 180);
    for (let y = 16; y < 170; y += 38) {
      for (let x = 16; x < 408; x += 38) {
        const grd = g.createLinearGradient(x, y, x + 30, y + 22);
        grd.addColorStop(0, '#30393d');
        grd.addColorStop(1, '#111517');
        g.fillStyle = grd;
        g.fillRect(x, y, 28, 22);
        g.strokeStyle = '#4b565c';
        g.strokeRect(x, y, 28, 22);
      }
    }
    g.fillStyle = '#6eea61';
    g.font = '14px Menlo, monospace';
    g.fillText('LFP 10yr / 8000cy', 22, 165);
  });

  TEX.heatsink = canvasTex(256, 256, (g) => {
    const grd = g.createLinearGradient(0, 0, 256, 0);
    grd.addColorStop(0, '#565b60');
    grd.addColorStop(0.5, '#1d2125');
    grd.addColorStop(1, '#61686d');
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#889095';
    for (let x = 20; x < 256; x += 22) {
      g.lineWidth = x % 44 === 0 ? 3 : 2;
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 256);
      g.stroke();
    }
  }, { repeat: [1, 2] });

  TEX.floor = canvasTex(512, 512, (g) => {
    g.fillStyle = '#d4d9da';
    g.fillRect(0, 0, 512, 512);
    g.strokeStyle = 'rgba(118,128,132,0.35)';
    g.lineWidth = 2;
    for (let x = 0; x <= 512; x += 64) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 512);
      g.stroke();
    }
    for (let y = 0; y <= 512; y += 64) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(512, y);
      g.stroke();
    }
  }, { repeat: [8, 8] });
}

function mat(opts) {
  const material = new THREE.MeshStandardMaterial(opts);
  if (opts.transparent) material.transparent = true;
  return material;
}

function labelMat(title, subtitle, opts = {}) {
  const texture = canvasTex(320, 88, (g, w, h) => {
    g.fillStyle = opts.bg ?? '#11171a';
    g.fillRect(0, 0, w, h);
    g.strokeStyle = opts.accent ?? '#6eea61';
    g.lineWidth = 4;
    g.strokeRect(2, 2, w - 4, h - 4);
    g.fillStyle = opts.accent ?? '#6eea61';
    g.font = '700 28px Menlo, monospace';
    g.fillText(title, 18, 38);
    g.fillStyle = opts.fg ?? '#dce6e8';
    g.font = '14px Menlo, monospace';
    g.fillText(subtitle, 20, 66);
  });
  return mat({ color: 0xffffff, roughness: 0.36, metalness: 0.04, map: texture, side: THREE.DoubleSide });
}

function roundedMesh(name, size, material, radius = 0.04, segments = 5) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(size.x, size.y, size.z, segments, radius), material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function box(name, size, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function cyl(name, radius, depth, material, radial = 48) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, depth, radial), material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function panelShape(points, depth, material) {
  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: 0.014, bevelThickness: 0.012, bevelSegments: 5 });
  geo.center();
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addPart(parts, cfg) {
  cfg.group.userData.part = cfg;
  cfg.group.traverse((obj) => {
    if (obj.isMesh) {
      obj.userData.part = cfg;
      obj.castShadow = true;
      obj.receiveShadow = true;
    }
  });
  cfg.home = cfg.group.position.clone();
  cfg.homeQuat = cfg.group.quaternion.clone();
  cfg.materials = [];
  cfg.group.traverse((obj) => {
    if (obj.material) {
      const list = Array.isArray(obj.material) ? obj.material : [obj.material];
      list.forEach((m) => {
        if (!cfg.materials.includes(m)) {
          m.userData.baseOpacity = m.opacity;
          m.userData.baseTransparent = m.transparent;
          m.userData.baseDepthWrite = m.depthWrite;
          cfg.materials.push(m);
        }
      });
    }
  });
  parts.push(cfg);
  return cfg.group;
}

export function buildWorld() {
  buildTextures();

  const root = new THREE.Group();
  const product = new THREE.Group();
  root.add(product);
  const parts = [];
  const flowObjects = [];
  const ledObjects = [];

  const silver = mat({ color: 0xbfc6c7, roughness: 0.45, metalness: 0.35 });
  const silverDark = mat({ color: 0x91999c, roughness: 0.42, metalness: 0.38 });
  const trim = mat({ color: 0x7d878b, roughness: 0.34, metalness: 0.5 });
  const dark = mat({ color: 0x202428, roughness: 0.45, metalness: 0.28 });
  const blackGlass = mat({ color: 0x030506, roughness: 0.18, metalness: 0.15, transparent: true, opacity: 0.92 });
  const glass = mat({ color: 0x06100c, roughness: 0.08, metalness: 0.05, transparent: true, opacity: 0.72, emissive: 0x0c3813, emissiveIntensity: 0.16 });
  const green = mat({ color: 0x6eea61, emissive: 0x6eea61, emissiveIntensity: 1.7, roughness: 0.3 });
  const blue = mat({ color: 0x57c7ff, emissive: 0x57c7ff, emissiveIntensity: 1.2, roughness: 0.25 });
  const copper = mat({ color: 0xb46f39, roughness: 0.33, metalness: 0.65 });
  const orange = mat({ color: 0xf18b37, emissive: 0x4a1600, emissiveIntensity: 0.12, roughness: 0.36 });
  const rubber = mat({ color: 0x14171a, roughness: 0.62, metalness: 0.1 });
  const pcbMat = mat({ color: 0xffffff, roughness: 0.62, metalness: 0.05, map: TEX.pcb });
  const bmsMat = mat({ color: 0xffffff, roughness: 0.6, metalness: 0.05, map: TEX.bms });
  const cellMat = mat({ color: 0xffffff, roughness: 0.55, metalness: 0.15, map: TEX.cells });
  const screenMat = mat({ color: 0xffffff, roughness: 0.28, metalness: 0.04, emissive: 0x11331d, emissiveIntensity: 0.25, map: TEX.screen });
  const logoMat = mat({ color: 0xffffff, roughness: 0.55, metalness: 0.08, transparent: true, map: TEX.logo });
  const sinkMat = mat({ color: 0xffffff, roughness: 0.38, metalness: 0.55, map: TEX.heatsink });
  const mpptMat = labelMat('4 MPPT', 'PV INPUTS', { accent: '#f18b37' });
  const afciMat = labelMat('AFCI', 'OPTIONAL ARC', { accent: '#57c7ff' });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), mat({ color: 0xffffff, roughness: 0.72, metalness: 0, map: TEX.floor }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.01;
  floor.receiveShadow = true;
  root.add(floor);

  const wall = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.2), mat({ color: 0xdde3e4, roughness: 0.75, metalness: 0.02 }));
  wall.position.set(0, 2.12, -1.08);
  wall.receiveShadow = true;
  root.add(wall);

  const shadowBase = new THREE.Mesh(new THREE.CircleGeometry(1.95, 64), mat({ color: 0x7b8588, roughness: 1, transparent: true, opacity: 0.18 }));
  shadowBase.rotation.x = -Math.PI / 2;
  shadowBase.position.set(0.04, 0.004, 0.1);
  root.add(shadowBase);

  // Battery tower
  const batteryY = 0.26;
  const stackHeights = [0.38, 0.38, 0.38, 0.38, 0.38];
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group();
    const body = roundedMesh(`battery-module-${i + 1}`, new THREE.Vector3(1.38, stackHeights[i], 0.78), silver, 0.045, 7);
    body.position.y = 0;
    g.add(body);
    const seam = box('module-front-seam', new THREE.Vector3(1.30, 0.012, 0.014), trim);
    seam.position.set(0, 0.185, 0.398);
    g.add(seam);
    const inner = box('lfp-cell-pack', new THREE.Vector3(1.16, 0.24, 0.055), cellMat);
    inner.position.set(0, 0, 0.434);
    g.add(inner);
    const handleL = roundedMesh('side-grip-l', new THREE.Vector3(0.04, 0.16, 0.24), silverDark, 0.018, 4);
    handleL.position.set(-0.725, 0, 0.02);
    const handleR = handleL.clone();
    handleR.position.x = 0.725;
    g.add(handleL, handleR);
    g.position.set(0, batteryY + i * 0.385, 0);
    product.add(addPart(parts, {
      id: `bat-${i + 1}`,
      group: g,
      name: `电池模块 ${i + 1}`,
      en: `LFP Battery Module ${i + 1}`,
      phase: 'BATTERY STACK',
      blurb: '独立磷酸铁锂电池抽屉，对应 WattMatic 的可扩展储能架构；后续加装模块时由 BMS AutoSync 自动重新均衡。',
      spec: ['可扩展容量', 'BMS AutoSync', '10 年 / 8000 次'],
      explode: new THREE.Vector3(i % 2 ? 0.95 : -0.95, 0.18 + i * 0.04, 0.65),
      tag: new THREE.Vector3(0.0, 0, 0.48),
      cutaway: false,
      batteryShell: true
    }));
  }

  const base = new THREE.Group();
  const baseBody = roundedMesh('battery-foot-base', new THREE.Vector3(1.46, 0.23, 0.82), silverDark, 0.045, 7);
  baseBody.position.y = 0.115;
  const footL = box('front-foot-left', new THREE.Vector3(0.26, 0.10, 0.18), silver);
  footL.position.set(-0.54, 0.02, 0.33);
  const footR = footL.clone();
  footR.position.x = 0.54;
  base.add(baseBody, footL, footR);
  product.add(addPart(parts, {
    id: 'base',
    group: base,
    name: '底座与防倾脚',
    en: 'Base & Anti-Tip Feet',
    phase: 'BATTERY STACK',
    blurb: '支撑整套一体式储能塔，预留调平与搬运空间，配合预工程化套件缩短现场安装时间。',
    spec: ['落地安装', '预工程化套件', '低占地面积'],
    explode: new THREE.Vector3(0, -0.22, 0.75),
    tag: new THREE.Vector3(0, 0.16, 0.47),
    batteryShell: true
  }));

  const topCap = new THREE.Group();
  const cap = roundedMesh('sloped-top-cap', new THREE.Vector3(1.46, 0.34, 0.86), silverDark, 0.055, 7);
  cap.position.y = 2.34;
  cap.rotation.x = -0.22;
  const logo = box('tower-logo', new THREE.Vector3(0.72, 0.002, 0.18), logoMat);
  logo.position.set(0, 2.44, 0.438);
  logo.rotation.x = Math.PI / 2 - 0.22;
  const status = cyl('battery-status-led', 0.018, 0.01, green, 24);
  status.position.set(0, 2.12, 0.444);
  status.rotation.x = Math.PI / 2;
  ledObjects.push(status);
  const socket = cyl('side-breaker-port', 0.035, 0.17, dark, 28);
  socket.rotation.z = Math.PI / 2;
  socket.position.set(-0.82, 2.24, 0.02);
  const lug = cyl('earth-lug', 0.025, 0.18, copper, 20);
  lug.rotation.z = Math.PI / 2;
  lug.position.set(-0.88, 2.18, 0.16);
  topCap.add(cap, logo, status, socket, lug);
  product.add(addPart(parts, {
    id: 'top-cap',
    group: topCap,
    name: '电池塔斜面顶盖',
    en: 'Sloped Battery Tower Cover',
    phase: 'BATTERY STACK',
    blurb: '电池塔与上部混合逆变器之间的斜面过渡件，保留 WattMatic 家电化造型与整机状态灯。',
    spec: ['AIO 视觉过渡', '绿色状态灯', '侧向维护接口'],
    explode: new THREE.Vector3(-0.55, 0.35, 0.72),
    tag: new THREE.Vector3(0.0, 2.42, 0.50),
    batteryShell: true
  }));

  const bms = new THREE.Group();
  const bmsBoard = box('bms-board', new THREE.Vector3(1.05, 0.02, 0.46), bmsMat);
  bmsBoard.position.set(0, 2.12, 0.456);
  bmsBoard.rotation.x = Math.PI / 2;
  const bmsCover = roundedMesh('bms-cover', new THREE.Vector3(1.16, 0.11, 0.52), dark, 0.018, 4);
  bmsCover.position.set(0, 2.11, 0.40);
  bms.add(bmsBoard, bmsCover);
  product.add(addPart(parts, {
    id: 'bms',
    group: bms,
    name: 'BMS 管理板',
    en: 'Battery Management System',
    phase: 'CONTROL',
    blurb: 'BMS AutoSync™ 管理新旧电池模块的同步与均衡，扩容时减少手动校准，并持续向逆变器主控上报充放电边界。',
    spec: ['BMS AutoSync™', 'CAN / RS485', '<1% 偏差目标'],
    explode: new THREE.Vector3(0.85, 0.28, 0.78),
    tag: new THREE.Vector3(0, 2.14, 0.52),
    batteryInner: true
  }));

  // Inverter body
  const bracket = new THREE.Group();
  const backPlate = roundedMesh('wall-mount-plate', new THREE.Vector3(1.42, 0.95, 0.08), trim, 0.035, 5);
  backPlate.position.set(0, 3.22, -0.47);
  const hook1 = box('top-hook-l', new THREE.Vector3(0.26, 0.05, 0.16), dark);
  hook1.position.set(-0.44, 3.72, -0.38);
  const hook2 = hook1.clone();
  hook2.position.x = 0.44;
  bracket.add(backPlate, hook1, hook2);
  product.add(addPart(parts, {
    id: 'mount',
    group: bracket,
    name: '壁挂安装背板',
    en: 'Wall Mounting Bracket',
    phase: 'INVERTER',
    blurb: '隐藏在逆变器背面的金属挂板，承重、定位和离墙散热一步完成，便于室内或遮蔽户外快速安装。',
    spec: ['快速定位', '上挂下锁', '遮蔽户外安装'],
    explode: new THREE.Vector3(0, 0.08, -1.0),
    tag: new THREE.Vector3(0, 3.35, -0.39)
  }));

  const heatSink = new THREE.Group();
  const sink = roundedMesh('rear-heat-sink', new THREE.Vector3(1.42, 0.92, 0.32), sinkMat, 0.045, 6);
  sink.position.set(0, 3.21, -0.28);
  for (let x = -0.55; x <= 0.55; x += 0.18) {
    const fin = box('vertical-cooling-fin', new THREE.Vector3(0.035, 0.80, 0.22), dark);
    fin.position.set(x, 3.22, -0.49);
    heatSink.add(fin);
  }
  heatSink.add(sink);
  product.add(addPart(parts, {
    id: 'heatsink',
    group: heatSink,
    name: '背部散热器',
    en: 'Rear Heat Sink',
    phase: 'INVERTER',
    blurb: '背部铝挤散热器贴合功率器件，配合温控策略覆盖 -20 ℃ 到 55 ℃ 的户外运行区间。',
    spec: ['铝挤型材', '自然对流', '-20 ℃ 到 55 ℃'],
    explode: new THREE.Vector3(0.72, 0.08, -0.75),
    tag: new THREE.Vector3(0.45, 3.42, -0.58)
  }));

  const innerFrame = new THREE.Group();
  const chassis = roundedMesh('inverter-chassis', new THREE.Vector3(1.56, 1.02, 0.36), dark, 0.05, 6);
  chassis.position.set(0, 3.22, -0.12);
  const railTop = box('top-seal-gasket', new THREE.Vector3(1.34, 0.03, 0.04), rubber);
  railTop.position.set(0, 3.76, 0.10);
  const railBot = railTop.clone();
  railBot.position.y = 2.68;
  innerFrame.add(chassis, railTop, railBot);
  product.add(addPart(parts, {
    id: 'chassis',
    group: innerFrame,
    name: '逆变器内骨架',
    en: 'Inverter Structural Chassis',
    phase: 'INVERTER',
    blurb: '黑色内骨架形成 IP65 密封腔体，承载功率板、继电器、端子和前盖，抵御粉尘与喷水。',
    spec: ['IP65 防尘防喷水', '压铸骨架', '双密封圈'],
    explode: new THREE.Vector3(-0.74, 0.0, -0.38),
    tag: new THREE.Vector3(-0.58, 3.15, 0.08),
    inverterInner: true
  }));

  const front = new THREE.Group();
  const cover = roundedMesh('silver-front-cover', new THREE.Vector3(1.42, 0.86, 0.075), silver, 0.06, 8);
  cover.position.set(-0.06, 3.38, 0.095);
  cover.rotation.z = 0.015;
  const rimL = roundedMesh('left-rounded-rim', new THREE.Vector3(0.06, 0.88, 0.105), trim, 0.03, 5);
  rimL.position.set(-0.80, 3.37, 0.085);
  const rimR = rimL.clone();
  rimR.position.x = 0.62;
  const topRim = roundedMesh('top-rounded-rim', new THREE.Vector3(1.25, 0.055, 0.105), trim, 0.025, 5);
  topRim.position.set(-0.06, 3.82, 0.09);
  front.add(cover, rimL, rimR, topRim);
  product.add(addPart(parts, {
    id: 'front-cover',
    group: front,
    name: '银色前盖',
    en: 'Silver Front Cover',
    phase: 'INVERTER',
    blurb: '大面积银灰前盖采用圆角边框，贴近 WattMatic AIO Home 的整洁家电化视觉语言。',
    spec: ['WattMatic AIO Home', '喷粉银灰', '圆角边框'],
    explode: new THREE.Vector3(-0.95, 0.38, 0.95),
    tag: new THREE.Vector3(-0.22, 3.63, 0.18),
    cover: true
  }));

  const glassPanel = new THREE.Group();
  const blackPoly = panelShape([[-0.55, -0.31], [0.58, -0.31], [0.58, 0.22], [0.10, 0.13], [-0.55, -0.18]], 0.045, blackGlass);
  blackPoly.position.set(0.18, 3.13, 0.158);
  blackPoly.rotation.y = 0;
  const screen = box('display-screen', new THREE.Vector3(0.48, 0.006, 0.20), screenMat);
  screen.position.set(0.15, 3.06, 0.185);
  screen.rotation.x = Math.PI / 2;
  const knob = cyl('rotary-disconnect-knob', 0.065, 0.045, trim, 36);
  knob.position.set(0.67, 3.08, 0.19);
  knob.rotation.x = Math.PI / 2;
  glassPanel.add(blackPoly, screen, knob);
  for (let i = 0; i < 8; i++) {
    const led = cyl('diagonal-led', 0.014, 0.009, green, 18);
    led.rotation.x = Math.PI / 2;
    led.position.set(-0.13 + i * 0.09, 3.22 + i * 0.037, 0.192);
    glassPanel.add(led);
    ledObjects.push(led);
  }
  product.add(addPart(parts, {
    id: 'glass',
    group: glassPanel,
    name: '斜切黑色控制面板',
    en: 'Diagonal Control Glass',
    phase: 'INVERTER',
    blurb: '斜向黑色玻璃面板显示 <20 ms 备电、34.5 kWh 容量与 AI 电价调度状态，是整机的视觉识别点。',
    spec: ['<20 ms 切换', '34.5 kWh', 'AI 电价调度'],
    explode: new THREE.Vector3(0.8, 0.42, 1.0),
    tag: new THREE.Vector3(0.28, 3.20, 0.24),
    cover: true
  }));

  const powerBoard = new THREE.Group();
  const board = box('main-power-board', new THREE.Vector3(1.08, 0.03, 0.50), pcbMat);
  board.position.set(0, 3.28, 0.11);
  board.rotation.x = Math.PI / 2;
  powerBoard.add(board);
  for (let i = 0; i < 5; i++) {
    const cap = cyl('dc-link-capacitor', 0.055, 0.17, mat({ color: 0x151a1d, roughness: 0.28, metalness: 0.35 }), 36);
    cap.rotation.z = Math.PI / 2;
    cap.position.set(-0.42 + i * 0.21, 3.33, 0.18);
    powerBoard.add(cap);
  }
  for (let i = 0; i < 4; i++) {
    const block = roundedMesh('igbt-power-module', new THREE.Vector3(0.15, 0.07, 0.12), dark, 0.012, 3);
    block.position.set(-0.36 + i * 0.24, 3.12, 0.19);
    powerBoard.add(block);
  }
  product.add(addPart(parts, {
    id: 'power-board',
    group: powerBoard,
    name: '主功率板',
    en: 'Main Power Board',
    phase: 'CONTROL',
    blurb: '承载 DC/DC、DC/AC 功率器件、母线电容和 AI 调度控制，完成光伏、电池、电网与全屋负载之间的能量转换。',
    spec: ['最高 25 kW', '15 min 调度刷新', '三相逆变桥'],
    explode: new THREE.Vector3(0.0, 0.62, 0.98),
    tag: new THREE.Vector3(0, 3.32, 0.30),
    inverterInner: true
  }));

  const terminals = new THREE.Group();
  const rail = roundedMesh('terminal-rail', new THREE.Vector3(1.10, 0.13, 0.16), rubber, 0.02, 4);
  rail.position.set(0, 2.72, 0.06);
  terminals.add(rail);
  const colors = [orange, orange, green, blue, copper, copper];
  for (let i = 0; i < 6; i++) {
    const t = cyl('terminal-gland', 0.045, 0.09, colors[i], 28);
    t.rotation.x = Math.PI / 2;
    t.position.set(-0.45 + i * 0.18, 2.72, 0.19);
    terminals.add(t);
  }
  const mpptLabel = box('mppt-label', new THREE.Vector3(0.36, 0.006, 0.10), mpptMat);
  mpptLabel.position.set(-0.30, 2.88, 0.195);
  mpptLabel.rotation.x = Math.PI / 2;
  terminals.add(mpptLabel);
  product.add(addPart(parts, {
    id: 'terminals',
    group: terminals,
    name: '底部接线端子',
    en: 'Bottom Terminal Glands',
    phase: 'WIRING',
    blurb: '光伏、电池、电网、EPS 负载和通讯线都从底部密封端子进入；四路 MPPT 支持更灵活的屋顶阵列。',
    spec: ['4 MPPT', 'GRID / EPS', 'IP65 密封'],
    explode: new THREE.Vector3(0.0, -0.48, 0.90),
    tag: new THREE.Vector3(0, 2.72, 0.28),
    inverterInner: true
  }));

  const connectors = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const gland = cyl('top-cable-gland', 0.035, 0.16, dark, 24);
    gland.position.set(-0.42 + i * 0.28, 3.90, -0.05);
    gland.rotation.x = Math.PI / 2;
    connectors.add(gland);
  }
  const antenna = cyl('wifi-antenna', 0.012, 0.38, rubber, 16);
  antenna.position.set(0.72, 3.86, -0.04);
  antenna.rotation.z = 0.34;
  connectors.add(antenna);
  product.add(addPart(parts, {
    id: 'top-io',
    group: connectors,
    name: '顶部通讯与线缆接口',
    en: 'Top IO & Cable Glands',
    phase: 'WIRING',
    blurb: '包含 Wi-Fi 天线、通讯孔和防水堵头，为云端监控、AI 电价策略、CT 与计量表提供接入。',
    spec: ['云端监控', 'AI 电价引擎', 'CT 采样'],
    explode: new THREE.Vector3(0.62, 0.72, 0.25),
    tag: new THREE.Vector3(0.34, 3.92, 0.05)
  }));

  const sideSwitch = new THREE.Group();
  const switchBox = roundedMesh('dc-switch-box', new THREE.Vector3(0.24, 0.42, 0.25), dark, 0.025, 4);
  switchBox.position.set(-0.88, 3.18, -0.08);
  const handle = cyl('dc-switch-handle', 0.052, 0.08, trim, 28);
  handle.rotation.z = Math.PI / 2;
  handle.position.set(-1.03, 3.18, 0.08);
  const afciLabel = box('afci-label', new THREE.Vector3(0.22, 0.006, 0.07), afciMat);
  afciLabel.position.set(-1.01, 3.36, 0.09);
  afciLabel.rotation.x = Math.PI / 2;
  sideSwitch.add(switchBox, handle, afciLabel);
  product.add(addPart(parts, {
    id: 'dc-switch',
    group: sideSwitch,
    name: '侧面 DC 隔离开关',
    en: 'Side DC Isolator',
    phase: 'SAFETY',
    blurb: '现场维护时切断光伏直流侧输入，旋钮外露方便紧急操作；可选 AFCI 保护提升直流侧安全。',
    spec: ['DC 隔离', 'AFCI 可选保护', '外露旋钮'],
    explode: new THREE.Vector3(-0.95, 0.1, 0.32),
    tag: new THREE.Vector3(-1.04, 3.18, 0.14)
  }));

  const flow = new THREE.Group();
  const flowMat = mat({ color: 0x6eea61, emissive: 0x6eea61, emissiveIntensity: 1.8, roughness: 0.25, transparent: true, opacity: 0.78 });
  const lineDefs = [
    [-0.56, 2.70, 0.26, -0.10, 3.05, 0.26],
    [0.00, 2.34, 0.47, 0.00, 2.70, 0.26],
    [0.36, 2.70, 0.26, 0.50, 3.05, 0.26],
    [-0.22, 3.50, 0.23, 0.30, 3.25, 0.23]
  ];
  lineDefs.forEach(([x1, y1, z1, x2, y2, z2], index) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x1, y1, z1),
      new THREE.Vector3((x1 + x2) / 2, (y1 + y2) / 2 + 0.08, z1 + 0.04),
      new THREE.Vector3(x2, y2, z2)
    ]);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.01, 8, false), flowMat.clone());
    tube.name = `energy-flow-${index}`;
    tube.userData.flowIndex = index;
    flow.add(tube);
    flowObjects.push(tube);
  });
  product.add(flow);

  const labels = new THREE.Group();
  const unitTag = box('floating-unit-label', new THREE.Vector3(0.001, 0.001, 0.001), mat({ color: 0xffffff, transparent: true, opacity: 0 }));
  unitTag.position.set(0, 3.96, 0.30);
  labels.add(unitTag);
  product.add(labels);

  product.position.set(0, 0.02, 0);
  product.scale.setScalar(0.88);

  return {
    root,
    product,
    parts,
    flowObjects,
    ledObjects,
    env: { floor, wall },
    unitTags: [{ name: 'WattMatic AIO Home', en: 'WHOLE-HOME ESS', point: unitTag.position }]
  };
}
