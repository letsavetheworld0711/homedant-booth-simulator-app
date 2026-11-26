/* Photo mode render engine (marketing / lifestyle images).

   The product is the SAME 3D model the simulator builds (buildProductMesh):
   geometry, sizes, holes and colours are never changed here. This module
   only decides how that model is photographed into a background picture:

   - camera: matched to the background (horizon, floor line, a reference
     height, field of view); level camera with lens shift, like a real
     interior photo, so verticals stay vertical
   - light: a soft key light (an area, sampled many times) plus sky light
     from the room for ambient occlusion; colour and strength read from
     the background
   - shadows: real shadows from the model, caught on an invisible floor
     and wall ("shadow catchers"), kept as separate layers
   - layers: beauty (product, true alpha), key shadow, ambient occlusion;
     all from the same camera at the same size, combined in 2D at the end

   It uses its own WebGL renderer, so the live 3D views stay as light as
   before.                                                              */
import * as THREE from 'three';

export const QUALITY = {
  draft: { label: 'Draft', keySamples: 1, skySamples: 0, ss: 1, shadowMap: 2048 },
  standard: { label: 'Standard', keySamples: 10, skySamples: 14, ss: 2, shadowMap: 2048 },
  photo: { label: 'Photo Realistic', keySamples: 24, skySamples: 40, ss: 2, shadowMap: 4096 },
};

/* ---------- camera from the background ----------
   cal (fractions of the image size unless noted):
     horizonY  eye level in the picture (camera height line)
     floorY    where the back wall meets the floor
     refY      a known height on the back wall (counter top, a door, ...)
     refH      that height in metres
     hfov      horizontal field of view in degrees
   From these: pixels per metre at the wall, camera height, distance to
   the wall and focal length in pixels.                                */
export function solveCamera(cal, W, H) {
  const f = W / 2 / Math.tan(((cal.hfov || 50) * Math.PI) / 360);
  const pxPerM = Math.max(1, ((cal.floorY - cal.refY) * H) / cal.refH);
  const camH = ((cal.floorY - cal.horizonY) * H) / pxPerM;
  const dist = f / pxPerM; // camera to the back wall
  return { f, pxPerM, camH, dist, cx: W / 2, cy: cal.horizonY * H };
}

function makeCamera(sol, W, H, yawDeg) {
  const near = 0.05,
    far = 60;
  const cam = new THREE.PerspectiveCamera(45, W / H, near, far);
  cam.position.set(0, sol.camH, 0);
  cam.rotation.set(0, ((yawDeg || 0) * Math.PI) / 180, 0);
  const { f, cx, cy } = sol;
  // off-centre projection: the horizon sits at cy, not necessarily mid-frame
  const l = (-cx / f) * near,
    r = ((W - cx) / f) * near,
    t = (cy / f) * near,
    b = (-(H - cy) / f) * near;
  cam.projectionMatrix.makePerspective(l, r, t, b, near, far);
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
  cam.updateMatrixWorld(true);
  return cam;
}

/* where a picture x (px) on the wall/floor line lands in the room */
export function wallXFromPixel(sol, xPx) {
  return ((xPx - sol.cx) / sol.f) * sol.dist;
}

/* ---------- read light and colour from the background ---------- */
export function analyseBackground(img) {
  const W = 160,
    H = Math.round((img.height / img.width) * 160);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, W, H);
  const d = x.getImageData(0, 0, W, H).data;
  const lum = (i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  let left = 0,
    right = 0,
    n = 0;
  const top = [0, 0, 0],
    bot = [0, 0, 0],
    mid = [0, 0, 0];
  let nt = 0,
    nb = 0,
    nm = 0;
  const lums = [];
  for (let yy = 0; yy < H; yy++)
    for (let xx = 0; xx < W; xx++) {
      const i = (yy * W + xx) * 4;
      const L = lum(i);
      lums.push([L, i]);
      if (yy < H * 0.6) {
        if (xx < W / 3) left += L;
        else if (xx > (2 * W) / 3) right += L;
        n++;
      }
      if (yy < H * 0.25) {
        top[0] += d[i];
        top[1] += d[i + 1];
        top[2] += d[i + 2];
        nt++;
      }
      if (yy > H * 0.3 && yy < H * 0.6) {
        mid[0] += d[i];
        mid[1] += d[i + 1];
        mid[2] += d[i + 2];
        nm++;
      }
      if (yy > H * 0.82) {
        bot[0] += d[i];
        bot[1] += d[i + 1];
        bot[2] += d[i + 2];
        nb++;
      }
    }
  lums.sort((a, b) => b[0] - a[0]);
  // white point: the brightest 3% that are not blown out
  const white = [0, 0, 0];
  let nw = 0;
  for (let k = 0; k < lums.length * 0.03; k++) {
    const i = lums[k][1];
    if (d[i] > 250 && d[i + 1] > 250 && d[i + 2] > 250) continue;
    white[0] += d[i];
    white[1] += d[i + 1];
    white[2] += d[i + 2];
    nw++;
  }
  const avg = (v, k) => v.map((a) => a / Math.max(1, k) / 255);
  const wp = avg(white, nw);
  const g = wp[1] || 1;
  const meanL = lums.reduce((s, a) => s + a[0], 0) / lums.length / 255;
  const lr = (left - right) / Math.max(1, left + right);
  return {
    // light comes from the brighter side; a small difference means frontal
    azimuth: Math.abs(lr) < 0.02 ? -30 : Math.sign(-lr) * Math.min(75, 45 + Math.abs(lr) * 300),
    elevation: 40,
    whiteBalance: [wp[0] / g, 1, wp[2] / g],
    skyColor: avg(top, nt),
    wallColor: avg(mid, nm),
    groundColor: avg(bot, nb),
    exposure: Math.max(0.75, Math.min(1.1, 0.55 + meanL * 0.6)),
  };
}

/* a first guess at the floor line: the strongest long horizontal edge in
   the lower part of the picture (the user can always correct it)      */
export function guessFloorLine(img) {
  const W = 256,
    H = Math.round((img.height / img.width) * 256);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.drawImage(img, 0, 0, W, H);
  const d = x.getImageData(0, 0, W, H).data;
  const L = (xx, yy) => {
    const i = (yy * W + xx) * 4;
    return d[i] + d[i + 1] + d[i + 2];
  };
  // counter tops and shelves also make strong lines; the floor line is the
  // lowest of the strong ones
  const score = [];
  let best = 0;
  for (let yy = Math.round(H * 0.5); yy < H * 0.95; yy++) {
    let s = 0;
    for (let xx = Math.round(W * 0.1); xx < W * 0.9; xx++) s += Math.abs(L(xx, yy + 1) - L(xx, yy - 1));
    score.push([yy, s]);
    best = Math.max(best, s);
  }
  let bestY = Math.round(H * 0.78);
  score.forEach(([yy, s]) => {
    if (s > best * 0.45) bestY = yy;
  });
  return bestY / H;
}

/* ---------- materials: same colours, managed correctly ----------
   The simulator works without colour management; for the photo the
   colours are converted to linear and the output is sRGB, so lighting
   adds up the way a camera sees it. The hue the customer sees on a lit
   face stays the product colour.                                      */
function photoMaterials(root) {
  const seen = new Map();
  const conv = (m) => {
    if (!m) return m;
    if (seen.has(m)) return seen.get(m);
    // userData can point back at the material itself (board.userData.faceMats),
    // which clone() would copy forever; the photo copy does not need it
    const ud = m.userData;
    m.userData = {};
    const n = m.clone();
    m.userData = ud;
    if (n.color) n.color.convertSRGBToLinear();
    if (n.emissive) n.emissive.convertSRGBToLinear();
    if (n.map) {
      n.map = n.map.clone();
      n.map.encoding = THREE.sRGBEncoding;
      n.map.needsUpdate = true;
    }
    seen.set(m, n);
    return n;
  };
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.material = Array.isArray(o.material) ? o.material.map(conv) : conv(o.material);
    o.castShadow = true;
    o.receiveShadow = true;
  });
}

/* ---------- colour space ----------
   three r128 has no colour management: by default nothing is converted.
   Photo mode decodes product colours to linear, renders with sRGB output,
   reads the picture back (sRGB), and decodes again so that averaging the
   light samples and darkening the background for shadows happen in linear
   light, like a camera. Only the final picture is encoded to sRGB.     */
const S2L = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  S2L[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
const l2s = (l) => (l <= 0.0031308 ? 12.92 * l : 1.055 * Math.pow(Math.max(0, l), 1 / 2.4) - 0.055);
const lin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

/* Light from the room as an environment: a simple panorama painted from
   the background's own colours (ceiling, walls, floor) with a soft bright
   patch where the window is. It gives faces that look towards the window
   more light than the others, and the floor colour bounces onto the
   undersides - the room's light instead of an even grey ambient.     */
function makeEnvironment(renderer, L) {
  const w = 128,
    h = 64;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const x = c.getContext('2d');
  const im = x.createImageData(w, h);
  const sky = L.skyColor || [0.95, 0.94, 0.92],
    wallC = L.wallColor || sky,
    ground = L.groundColor || [0.6, 0.5, 0.4];
  const lc = L.color || [1, 0.97, 0.92];
  const kd = dirFrom(L.azimuth != null ? L.azimuth : -40, L.elevation != null ? L.elevation : 30);
  const spread = ((L.windowSpread || 40) * Math.PI) / 180;
  for (let yy = 0; yy < h; yy++)
    for (let xx = 0; xx < w; xx++) {
      const u = (xx + 0.5) / w,
        v = 1 - (yy + 0.5) / h;
      const a = (u - 0.5) * 2 * Math.PI,
        el = (v - 0.5) * Math.PI;
      const d = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)];
      let col;
      if (d[1] >= 0) col = [0, 1, 2].map((k) => wallC[k] * (1 - d[1]) + sky[k] * d[1]);
      else col = [0, 1, 2].map((k) => wallC[k] * (1 + d[1]) * 0.85 + ground[k] * -d[1]);
      const ang = Math.acos(Math.max(-1, Math.min(1, d[0] * kd.x + d[1] * kd.y + d[2] * kd.z)));
      const win = (L.windowI != null ? L.windowI : 0.6) * Math.exp(-(ang * ang) / (spread * spread));
      const i = (yy * w + xx) * 4;
      for (let k = 0; k < 3; k++) im.data[i + k] = Math.min(255, (col[k] * (1 - win) + lc[k] * win) * 255);
      im.data[i + 3] = 255;
    }
  x.putImageData(im, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.encoding = THREE.sRGBEncoding;
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromEquirectangular(tex);
  pm.dispose();
  tex.dispose();
  return rt;
}

/* ---------- render ---------- */
let _renderer = null;
function getRenderer(w, h) {
  if (!_renderer) {
    _renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    _renderer.shadowMap.enabled = true;
    _renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    _renderer.outputEncoding = THREE.sRGBEncoding;
    _renderer.setClearColor(0x000000, 0);
  }
  _renderer.setPixelRatio(1);
  _renderer.setSize(w, h, false);
  return _renderer;
}

// low-discrepancy points for light sampling
function halton(i, b) {
  let f = 1,
    r = 0;
  while (i > 0) {
    f /= b;
    r += f * (i % b);
    i = Math.floor(i / b);
  }
  return r;
}
const dirFrom = (azDeg, elDeg) => {
  const az = (azDeg * Math.PI) / 180,
    el = (elDeg * Math.PI) / 180;
  // azimuth 0 = from the camera, negative = from the left
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
};

/**
 * product:  an Object3D from buildProductMesh (it is cloned, not changed)
 * bg:       the background image (HTMLImageElement / canvas)
 * opts: { cal, place:{xPx, wallGap, yaw}, light:{azimuth, elevation, softness,
 *         keyI, skyI, ambI, color}, look:{...}, quality, wall:true }
 * returns { W, H, beauty:Float32Array(premultiplied RGBA), shadow, ao, depthTop }
 */
export async function renderLayers(product, bg, opts, onProgress) {
  const q = QUALITY[opts.quality] || QUALITY.draft;
  const outW = Math.round(bg.width * (opts.outScale || 1)),
    outH = Math.round(bg.height * (opts.outScale || 1));
  const W = outW * q.ss,
    H = outH * q.ss;
  const sol = solveCamera(opts.cal, W, H);
  const renderer = getRenderer(W, H);
  renderer.shadowMap.needsUpdate = true;

  const scene = new THREE.Scene();
  const cam = makeCamera(sol, W, H, opts.cal.yaw);

  // the product, placed against the back wall
  const obj = product.clone(true);
  photoMaterials(obj);
  const box0 = new THREE.Box3().setFromObject(obj);
  const depth = box0.max.z - box0.min.z;
  const pl = opts.place || {};
  const yaw = ((pl.yaw || 0) * Math.PI) / 180;
  obj.rotation.y = yaw;
  const wallZ = -sol.dist;
  const zc = wallZ + (pl.wallGap || 0.02) + depth / 2;
  const x = wallXFromPixel(sol, (pl.xFrac != null ? pl.xFrac : 0.7) * W) * ((sol.dist - (pl.wallGap || 0.02) - depth / 2) / sol.dist);
  obj.position.set(x, 0, zc);
  scene.add(obj);
  obj.updateMatrixWorld(true);
  const pbox = new THREE.Box3().setFromObject(obj);
  const psize = pbox.getSize(new THREE.Vector3());
  const pcen = pbox.getCenter(new THREE.Vector3());

  // shadow catchers: an invisible floor and back wall that only show shadow
  const catchMat = new THREE.ShadowMaterial({ opacity: 1 });
  const reach = (opts.shadowReach != null ? opts.shadowReach : 1.5) + Math.max(psize.x, psize.z) / 2;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(reach * 2, reach * 2), catchMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(pcen.x, 0, pcen.z);
  floor.receiveShadow = true;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(reach * 2, psize.y + 0.8), catchMat);
  wall.position.set(pcen.x, (psize.y + 0.8) / 2, wallZ);
  wall.receiveShadow = true;
  wall.visible = opts.wall !== false;
  scene.add(floor, wall);

  // lights
  const L = opts.light || {};
  const lc = new THREE.Color().setRGB(...(L.color || [1, 0.97, 0.92]));
  const envRT = makeEnvironment(renderer, L);
  scene.environment = envRT.texture;
  obj.traverse((o) => {
    if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.envMapIntensity = L.envI != null ? L.envI : 0.9));
  });
  const amb = new THREE.AmbientLight(0xffffff, L.ambI != null ? L.ambI : 0.03);
  const hemi = new THREE.HemisphereLight(
    new THREE.Color().setRGB(...(L.skyColor || [0.95, 0.95, 0.95])),
    new THREE.Color().setRGB(...(L.groundColor || [0.6, 0.5, 0.4])),
    L.hemiI != null ? L.hemiI : 0
  );
  scene.add(amb, hemi);
  const key = new THREE.DirectionalLight(lc, 1);
  const sky = new THREE.DirectionalLight(0xffffff, 1);
  [key, sky].forEach((dl) => {
    dl.castShadow = true;
    dl.target.position.copy(pcen);
    // the shadow area is the product and the room right around it
    const r = Math.max(psize.x, psize.y, psize.z) * 0.9 + 1.2;
    const sc = dl.shadow.camera;
    sc.left = -r;
    sc.right = r;
    sc.top = r;
    sc.bottom = -r;
    sc.near = 0.1;
    sc.far = 30;
    sc.updateProjectionMatrix();
    dl.shadow.mapSize.set(q.shadowMap, q.shadowMap);
    dl.shadow.bias = -0.00015;
    dl.shadow.normalBias = 0.004;
    dl.shadow.radius = 1.5;
    scene.add(dl, dl.target);
  });

  const nK = q.keySamples,
    nS = q.skySamples,
    N = nK + nS;
  const keyI = L.keyI != null ? L.keyI : 0.95,
    skyI = L.skyI != null ? L.skyI : 0.45;
  const soft = L.softness != null ? L.softness : 14; // degrees of light spread
  const base = dirFrom(L.azimuth || -40, L.elevation || 40);

  const beauty = new Float32Array(W * H * 4);
  const shadow = new Float32Array(W * H);
  const ao = new Float32Array(W * H);
  const grab = document.createElement('canvas');
  grab.width = W;
  grab.height = H;
  const gx = grab.getContext('2d', { willReadFrequently: true });
  const read = () => {
    gx.clearRect(0, 0, W, H);
    gx.drawImage(renderer.domElement, 0, 0);
    return gx.getImageData(0, 0, W, H).data;
  };
  // product materials, to hide the product in the shadow pass but keep it casting
  const mats = [];
  obj.traverse((o) => {
    if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.push(m));
  });
  const hideProduct = (h) =>
    mats.forEach((m) => {
      m.colorWrite = !h;
      m.depthWrite = !h;
    });

  // which pixels see the floor and which the back wall: light is weighted by
  // how squarely it hits that surface (light grazing a wall barely lights it)
  const idMatF = new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    idMatW = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  floor.material = idMatF;
  wall.material = idMatW;
  hideProduct(true);
  key.visible = sky.visible = false;
  renderer.render(scene, cam);
  const idp = read();
  const rid = new Uint8Array(W * H); // 0 none, 1 floor, 2 wall
  for (let j = 0, i = 0; j < W * H; j++, i += 4) rid[j] = idp[i + 3] < 128 ? 0 : idp[i] > idp[i + 1] ? 1 : 2;
  floor.material = catchMat;
  wall.material = catchMat;
  hideProduct(false);
  const wKey = [0, 0, 0],
    wSky = [0, 0, 0];

  for (let s = 0; s < N; s++) {
    const isKey = s < nK;
    let dir;
    if (isKey) {
      // a point on the window: jitter around the key direction
      const u = halton(s + 1, 2),
        v = halton(s + 1, 3);
      const a = 2 * Math.PI * u,
        rr = Math.sqrt(v) * soft;
      dir = dirFrom((L.azimuth || -40) + Math.cos(a) * rr * 1.6, (L.elevation || 40) + Math.sin(a) * rr);
    } else {
      // light from the room: sky directions above, mostly from the front
      const u = halton(s + 1, 2),
        v = halton(s + 1, 3);
      // every direction the room can send light from: above the floor and
      // in front of the wall, low angles included (most of the light that
      // reaches a wall behind an open shelf comes in nearly level)
      // (below level too: light bouncing off the floor reaches the wall)
      dir = dirFrom(-85 + u * 170, -35 + v * 120);
    }
    const lp = pcen.clone().add(dir.clone().multiplyScalar(12));
    key.visible = isKey;
    sky.visible = !isKey;
    (isKey ? key : sky).position.copy(lp);
    key.intensity = nK ? (keyI * N) / nK : 0;
    sky.intensity = nS ? (skyI * N) / nS : 0;
    if (!nS) amb.intensity = (L.ambI != null ? L.ambI : 0.03) + skyI * 0.6; // draft: no sky samples
    renderer.shadowMap.needsUpdate = true;

    // beauty pass: product only, transparent background
    floor.visible = false;
    wall.visible = false;
    hideProduct(false);
    renderer.render(scene, cam);
    let p = read();
    for (let i = 0, j = 0; j < W * H; i += 4, j++) {
      const a = p[i + 3] / 255;
      beauty[i] += S2L[p[i]] * a; // linear light, premultiplied
      beauty[i + 1] += S2L[p[i + 1]] * a;
      beauty[i + 2] += S2L[p[i + 2]] * a;
      beauty[i + 3] += a;
    }
    // shadow pass: only what the invisible floor and wall catch
    floor.visible = true;
    wall.visible = opts.wall !== false;
    hideProduct(true);
    renderer.render(scene, cam);
    p = read();
    const tgt = isKey ? shadow : ao;
    // floor faces up, wall faces the room; bounce light from below is weaker
    const wts = [0, Math.max(0, dir.y), Math.max(0, dir.z) * (dir.y < 0 ? 0.55 : 1)];
    const acc = isKey ? wKey : wSky;
    acc[1] += wts[1];
    acc[2] += wts[2];
    for (let i = 3, j = 0; j < W * H; i += 4, j++) if (rid[j]) tgt[j] += (p[i] / 255) * wts[rid[j]];
    hideProduct(false);
    if (onProgress) onProgress((s + 1) / N);
    if (s % 2 === 1) await new Promise((r) => setTimeout(r, 0)); // keep the page responsive
  }
  for (let i = 0; i < beauty.length; i++) beauty[i] /= N;
  envRT.dispose();
  for (let j = 0; j < W * H; j++) {
    const r = rid[j];
    shadow[j] = r ? shadow[j] / Math.max(1e-6, wKey[r]) : 0;
    ao[j] = r ? ao[j] / Math.max(1e-6, wSky[r]) : 0;
  }
  // where the product's feet are, in picture pixels (for the UI guides)
  const foot = new THREE.Vector3(pcen.x, 0, pbox.max.z).project(cam);
  return {
    W,
    H,
    outW,
    outH,
    ss: q.ss,
    beauty,
    shadow,
    ao,
    hasAO: nS > 0,
    rid,
    sol,
    footPx: [((foot.x + 1) / 2) * outW, ((1 - foot.y) / 2) * outH],
  };
}

/* ---------- 2D finish: put the layers onto the background ----------
   All in linear light. The background wall gets two kinds of light: the
   window's direct light (share keyShare) and the room's soft light (the
   rest). The key shadow takes away only the first, ambient occlusion only
   a part of the second - so they never darken the same light twice.
   look: { keyShare, shadowK, aoK, exposure, whiteBalance[3], blur,
           shadowBlur, grain, fade }                                    */
const DEF_LOOK = { keyShare: 0.25, shadowK: 1, aoK: 0.4, aoFloorK: 0.85, exposure: 1, whiteBalance: [1, 1, 1], blur: 0.6, shadowBlur: 2.5, grain: 1.4, fade: 0.45 };

// box-average a layer from render size down to output size
function downsample(src, W, H, ss, ch) {
  const w = W / ss,
    h = H / ss,
    out = new Float32Array(w * h * ch),
    k = 1 / (ss * ss);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < ch; c++) {
        let v = 0;
        for (let dy = 0; dy < ss; dy++) for (let dx = 0; dx < ss; dx++) v += src[((y * ss + dy) * W + x * ss + dx) * ch + c];
        out[(y * w + x) * ch + c] = v * k;
      }
  return out;
}
// gaussian blur in place (separable), any number of channels
function blur(a, w, h, ch, sigma) {
  if (!(sigma > 0.05)) return a;
  const r = Math.ceil(sigma * 3),
    ker = [];
  let sum = 0;
  for (let i = -r; i <= r; i++) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    ker.push(v);
    sum += v;
  }
  ker.forEach((v, i) => (ker[i] = v / sum));
  const tmp = new Float32Array(a.length);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < ch; c++) {
        let v = 0;
        for (let i = -r; i <= r; i++) v += a[(y * w + Math.min(w - 1, Math.max(0, x + i))) * ch + c] * ker[i + r];
        tmp[(y * w + x) * ch + c] = v;
      }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      for (let c = 0; c < ch; c++) {
        let v = 0;
        for (let i = -r; i <= r; i++) v += tmp[(Math.min(h - 1, Math.max(0, y + i)) * w + x) * ch + c] * ker[i + r];
        a[(y * w + x) * ch + c] = v;
      }
  return a;
}

export function composite(bg, layers, look) {
  const { W, H, outW, outH, ss } = layers;
  const lk = Object.assign({}, DEF_LOOK, look || {});
  const prod = blur(downsample(layers.beauty, W, H, ss, 4), outW, outH, 4, lk.blur);
  const sh = blur(downsample(layers.shadow, W, H, ss, 1), outW, outH, 1, lk.shadowBlur);
  const ao = layers.hasAO ? blur(downsample(layers.ao, W, H, ss, 1), outW, outH, 1, lk.shadowBlur * 0.6) : null;
  // floor or wall under each pixel: the floor right under furniture reads
  // darker (contact shadow) than a wall behind it
  const fl = new Float32Array(W * H);
  if (layers.rid) for (let j = 0; j < W * H; j++) fl[j] = layers.rid[j] === 1 ? 1 : 0;
  const floorFrac = blur(downsample(fl, W, H, ss, 1), outW, outH, 1, 1);
  // shadows fade out softly around the product instead of stopping at the
  // edge of the area they were calculated for
  let bx0 = outW,
    bx1 = 0,
    by0 = outH,
    by1 = 0;
  for (let y = 0; y < outH; y++)
    for (let x = 0; x < outW; x++)
      if (prod[(y * outW + x) * 4 + 3] > 0.05) {
        if (x < bx0) bx0 = x;
        if (x > bx1) bx1 = x;
        if (y < by0) by0 = y;
        if (y > by1) by1 = y;
      }
  const span = Math.max(20, bx1 - bx0) * lk.fade;
  const c = document.createElement('canvas');
  c.width = outW;
  c.height = outH;
  const x = c.getContext('2d');
  x.drawImage(bg, 0, 0, outW, outH);
  const im = x.getImageData(0, 0, outW, outH);
  const d = im.data;
  const wb = lk.whiteBalance;
  const tint = [1.0, 0.97, 0.9]; // shadows keep a little more blue (cooler)
  let seed = 12345;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 2;
  const keyS = lk.keyShare * lk.shadowK;
  for (let y = 0; y < outH; y++)
    for (let xx = 0; xx < outW; xx++) {
      const j = y * outW + xx,
        i = j * 4;
      const dx = Math.max(bx0 - xx, 0, xx - bx1),
        dy = Math.max(by0 - y, 0, y - by1);
      const dist = Math.sqrt(dx * dx + dy * dy);
      const t = Math.min(1, Math.max(0, (dist - span) / span));
      const wgt = 1 - t * t * (3 - 2 * t);
      const aoS = (1 - lk.keyShare) * (lk.aoK + (lk.aoFloorK - lk.aoK) * floorFrac[j]);
      const loss = (keyS * sh[j] + (ao ? aoS * ao[j] : 0)) * wgt;
      const a = prod[i + 3];
      const n = lk.grain * rnd();
      for (let k = 0; k < 3; k++) {
        const bgl = S2L[d[i + k]] * Math.max(0.12, 1 - loss * tint[k]);
        const v = bgl * (1 - a) + prod[i + k] * wb[k] * lk.exposure;
        d[i + k] = Math.max(0, Math.min(255, l2s(v) * 255 + n));
      }
    }
  x.putImageData(im, 0, 0);
  return c;
}

/* single layers as pictures (render size), for checking or retouching */
export function layerImages(layers) {
  const { W, H } = layers;
  const mk = (fill) => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    const im = x.createImageData(W, H);
    fill(im.data);
    x.putImageData(im, 0, 0);
    return c;
  };
  const gray = (d, j, v) => {
    d[j * 4] = d[j * 4 + 1] = d[j * 4 + 2] = v;
    d[j * 4 + 3] = 255;
  };
  return {
    beauty: mk((d) => {
      const b = layers.beauty;
      for (let i = 0; i < b.length; i += 4) {
        const a = b[i + 3];
        for (let k = 0; k < 3; k++) d[i + k] = a > 0 ? l2s(b[i + k] / a) * 255 : 0;
        d[i + 3] = a * 255;
      }
    }),
    alpha: mk((d) => {
      for (let j = 0; j < W * H; j++) gray(d, j, layers.beauty[j * 4 + 3] * 255);
    }),
    shadow: mk((d) => {
      for (let j = 0; j < W * H; j++) gray(d, j, 255 - layers.shadow[j] * 255);
    }),
    ao: mk((d) => {
      for (let j = 0; j < W * H; j++) gray(d, j, 255 - (layers.hasAO ? layers.ao[j] : 0) * 255);
    }),
  };
}
