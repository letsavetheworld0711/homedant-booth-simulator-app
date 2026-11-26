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
  standard: { label: 'Standard', keySamples: 10, skySamples: 6, ss: 2, shadowMap: 2048 },
  photo: { label: 'Photo Realistic', keySamples: 24, skySamples: 16, ss: 2, shadowMap: 4096 },
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
    bot = [0, 0, 0];
  let nt = 0,
    nb = 0;
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
    azimuth: Math.max(-70, Math.min(70, -lr * 400)),
    elevation: 40,
    whiteBalance: [wp[0] / g, 1, wp[2] / g],
    skyColor: avg(top, nt),
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
  const reach = (opts.shadowReach != null ? opts.shadowReach : 0.6) + Math.max(psize.x, psize.z) / 2;
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
  const amb = new THREE.AmbientLight(0xffffff, L.ambI != null ? L.ambI : 0.18);
  const hemi = new THREE.HemisphereLight(
    new THREE.Color().setRGB(...(L.skyColor || [0.95, 0.95, 0.95])),
    new THREE.Color().setRGB(...(L.groundColor || [0.6, 0.5, 0.4])),
    L.hemiI != null ? L.hemiI : 0.45
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
      dir = dirFrom(-55 + u * 110, 45 + v * 40);
    }
    const lp = pcen.clone().add(dir.clone().multiplyScalar(12));
    key.visible = isKey;
    sky.visible = !isKey;
    (isKey ? key : sky).position.copy(lp);
    key.intensity = nK ? (keyI * N) / nK : 0;
    sky.intensity = nS ? (skyI * N) / nS : 0;
    if (!nS) amb.intensity = (L.ambI != null ? L.ambI : 0.18) + skyI * 0.6; // draft: no sky samples
    renderer.shadowMap.needsUpdate = true;

    // beauty pass: product only, transparent background
    floor.visible = false;
    wall.visible = false;
    hideProduct(false);
    renderer.render(scene, cam);
    let p = read();
    for (let i = 0, j = 0; j < W * H; i += 4, j++) {
      const a = p[i + 3] / 255;
      beauty[i] += (p[i] / 255) * a;
      beauty[i + 1] += (p[i + 1] / 255) * a;
      beauty[i + 2] += (p[i + 2] / 255) * a;
      beauty[i + 3] += a;
    }
    // shadow pass: only what the invisible floor and wall catch
    floor.visible = true;
    wall.visible = opts.wall !== false;
    hideProduct(true);
    renderer.render(scene, cam);
    p = read();
    const tgt = isKey ? shadow : ao;
    for (let i = 3, j = 0; j < W * H; i += 4, j++) tgt[j] += p[i] / 255;
    hideProduct(false);
    if (onProgress) onProgress((s + 1) / N);
    if (s % 2 === 1) await new Promise((r) => setTimeout(r, 0)); // keep the page responsive
  }
  for (let i = 0; i < beauty.length; i++) beauty[i] /= N;
  for (let j = 0; j < W * H; j++) {
    shadow[j] /= Math.max(1, nK);
    ao[j] /= Math.max(1, nS);
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
    sol,
    footPx: [((foot.x + 1) / 2) * outW, ((1 - foot.y) / 2) * outH],
  };
}

/* ---------- 2D finish: put the layers onto the background ----------
   look: { shadowK, aoK, exposure, whiteBalance[3], warmth, blur, grain }  */
export function composite(bg, layers, look) {
  const { W, H, outW, outH, ss } = layers;
  const lk = Object.assign({ shadowK: 0.55, aoK: 0.5, exposure: 0.97, whiteBalance: [1, 1, 1], blur: 0.5, grain: 1.6 }, look || {});
  // layers at render size -> output size (supersampled, so edges come out smooth)
  const toCanvas = (fill, blurPx) => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const x = c.getContext('2d');
    const im = x.createImageData(W, H);
    fill(im.data);
    x.putImageData(im, 0, 0);
    const o = document.createElement('canvas');
    o.width = outW;
    o.height = outH;
    const ox = o.getContext('2d');
    ox.imageSmoothingQuality = 'high';
    const bp = blurPx != null ? blurPx : lk.blur;
    if (bp > 0) ox.filter = `blur(${bp}px)`;
    ox.drawImage(c, 0, 0, outW, outH);
    return ox.getImageData(0, 0, outW, outH).data;
  };
  const prod = toCanvas((d) => {
    const b = layers.beauty;
    for (let i = 0; i < b.length; i += 4) {
      const a = b[i + 3];
      d[i] = a > 0 ? Math.min(255, (b[i] / a) * 255) : 0;
      d[i + 1] = a > 0 ? Math.min(255, (b[i + 1] / a) * 255) : 0;
      d[i + 2] = a > 0 ? Math.min(255, (b[i + 2] / a) * 255) : 0;
      d[i + 3] = a * 255;
    }
  });
  const sh = toCanvas((d) => {
    for (let j = 0; j < W * H; j++) {
      d[j * 4] = layers.shadow[j] * 255;
      d[j * 4 + 1] = layers.hasAO ? layers.ao[j] * 255 : 0;
      d[j * 4 + 3] = 255;
    }
  }, lk.shadowBlur != null ? lk.shadowBlur : 2);
  const c = document.createElement('canvas');
  c.width = outW;
  c.height = outH;
  const x = c.getContext('2d');
  x.drawImage(bg, 0, 0, outW, outH);
  const im = x.getImageData(0, 0, outW, outH);
  const d = im.data;
  const wb = lk.whiteBalance;
  // shadows in a lit room are a little cooler than the light
  const tint = [1.0, 1.02, 1.06];
  let seed = 12345;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 2;
  for (let i = 0; i < d.length; i += 4) {
    const s = sh[i] / 255,
      o = sh[i + 1] / 255;
    const shade = (1 - lk.shadowK * s) * (1 - lk.aoK * o);
    const a = prod[i + 3] / 255;
    const n = lk.grain * rnd();
    for (let k = 0; k < 3; k++) {
      const bgv = d[i + k] * Math.min(1, shade * (shade < 1 ? tint[k] : 1));
      const pv = prod[i + k] * wb[k] * lk.exposure;
      d[i + k] = Math.max(0, Math.min(255, bgv * (1 - a) + pv * a + n));
    }
  }
  x.putImageData(im, 0, 0);
  return c;
}

/* single layers as pictures, for checking or for retouching elsewhere */
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
  return {
    beauty: mk((d) => {
      const b = layers.beauty;
      for (let i = 0; i < b.length; i += 4) {
        const a = b[i + 3];
        d[i] = a > 0 ? (b[i] / a) * 255 : 0;
        d[i + 1] = a > 0 ? (b[i + 1] / a) * 255 : 0;
        d[i + 2] = a > 0 ? (b[i + 2] / a) * 255 : 0;
        d[i + 3] = a * 255;
      }
    }),
    alpha: mk((d) => {
      for (let j = 0; j < W * H; j++) {
        const v = layers.beauty[j * 4 + 3] * 255;
        d[j * 4] = d[j * 4 + 1] = d[j * 4 + 2] = v;
        d[j * 4 + 3] = 255;
      }
    }),
    shadow: mk((d) => {
      for (let j = 0; j < W * H; j++) {
        const v = 255 - layers.shadow[j] * 255;
        d[j * 4] = d[j * 4 + 1] = d[j * 4 + 2] = v;
        d[j * 4 + 3] = 255;
      }
    }),
    ao: mk((d) => {
      for (let j = 0; j < W * H; j++) {
        const v = 255 - (layers.hasAO ? layers.ao[j] : 0) * 255;
        d[j * 4] = d[j * 4 + 1] = d[j * 4 + 2] = v;
        d[j * 4 + 3] = 255;
      }
    }),
  };
}
