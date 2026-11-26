/* Lifestyle photo mode ('?photo'): put the exact 3D product into a room
   picture (e.g. made with an image AI) and render it like a photo.
   Loaded only when this mode is opened, so the simulator stays light.
   The product comes from the simulator's own builder; nothing about its
   shape or size is changed here (see photoRender.js).                 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  buildProductMesh,
  BUYER_TEMPLATES,
  BUYER_GROUPS,
  newBuyerProduct,
  SHELF_COLORS,
  buyerBrand,
  buyerShortName,
  tierChoices,
  fitTier,
} from './BoothSimulator.jsx';
import { QUALITY, renderLayers, composite, layerImages, analyseBackground, guessFloorLine, solveCamera } from './photoRender.js';

const PANEL = '#f7f7f5';
const DEF_CAL = { horizonY: 0.5, floorY: 0.78, refY: 0.54, refH: 0.914, hfov: 50, yaw: 0 };
const DEF_PLACE = { xFrac: 0.72, wallGap: 0.02, yaw: 0 };
const DEF_LIGHT = { azimuth: -65, elevation: 28, softness: 18, keyI: 0.55, skyI: 0.25, ambI: 0.02, hemiI: 0, envI: 0.45, windowI: 0.6, color: [1, 0.97, 0.92] };
const DEF_LOOK = { keyShare: 0.25, shadowK: 1, aoK: 0.4, aoFloorK: 0.85, shadowBlur: 2.5, exposure: 1, whiteBalance: [1, 1, 1], blur: 0.6, grain: 1.4, fade: 0.45 };

function Slider({ label, value, min, max, step, onChange, fmt }) {
  return (
    <label className="block mb-2">
      <div className="flex justify-between text-[11px] text-gray-600">
        <span>{label}</span>
        <span className="tabular-nums">{fmt ? fmt(value) : value}</span>
      </div>
      <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
    </label>
  );
}
function Box({ title, children }) {
  return (
    <div className="px-4 py-3 border-b border-gray-200">
      <div className="text-xs font-semibold text-gray-800 mb-2">{title}</div>
      {children}
    </div>
  );
}
const pct = (v) => `${Math.round(v * 1000) / 10}%`;

export default function PhotoStudio() {
  const [bg, setBg] = useState(null); // HTMLImageElement
  const [bgName, setBgName] = useState('');
  const [tplId, setTplId] = useState(BUYER_TEMPLATES[0].id);
  const tpl = BUYER_TEMPLATES.find((t) => t.id === tplId);
  const [p, setP] = useState(() => newBuyerProduct(BUYER_TEMPLATES[0]));
  const [cal, setCal] = useState(DEF_CAL);
  const [place, setPlace] = useState(DEF_PLACE);
  const [light, setLight] = useState(DEF_LIGHT);
  const [look, setLook] = useState(DEF_LOOK);
  const [wall, setWall] = useState(true);
  const [quality, setQuality] = useState('standard');
  const [outScale, setOutScale] = useState(1);
  const [guides, setGuides] = useState(true);
  const [busy, setBusy] = useState(0); // 0 idle, else progress 0..1
  const [result, setResult] = useState(null); // { canvas, layers, quality }
  const previewRef = useRef(null);
  const overlayRef = useRef(null);
  const lastLayers = useRef(null);
  const job = useRef(0);

  const product = useMemo(() => buildProductMesh(p, tpl), [p, tpl]);
  const upd = (set) => (patch) => set((o) => ({ ...o, ...patch }));
  const setCalP = upd(setCal),
    setPlaceP = upd(setPlace),
    setLightP = upd(setLight),
    setLookP = upd(setLook);
  const setProd = (patch) =>
    setP((o) => {
      const n = { ...o, ...patch };
      return { ...n, tier: fitTier(tpl, n) };
    });

  // a new background: read its light, guess the floor line
  const onFile = (file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const a = analyseBackground(img);
      const floorY = guessFloorLine(img);
      setBg(img);
      requestAnimationFrame(() => {
        const pc = previewRef.current;
        if (pc) {
          pc.width = img.width;
          pc.height = img.height;
          pc.getContext('2d').drawImage(img, 0, 0);
        }
      });
      setBgName(file.name.replace(/\.[^.]+$/, ''));
      setCal({ ...DEF_CAL, floorY, refY: Math.max(0.2, floorY - 0.25) });
      setLightP({ azimuth: Math.round(a.azimuth), color: a.whiteBalance.map((v) => Math.min(1, v)), skyColor: a.skyColor, wallColor: a.wallColor, groundColor: a.groundColor });
      setLookP({ whiteBalance: a.whiteBalance });
      setResult(null);
    };
    img.src = url;
  };

  // live draft preview
  const draw = useCallback(
    async (qual, scale) => {
      if (!bg) return null;
      const id = ++job.current;
      if (qual !== 'draft') setBusy(0.01);
      const layers = await renderLayers(product, bg, { cal, place, light, wall, quality: qual, outScale: scale }, (v) => qual !== 'draft' && setBusy(v));
      if (id !== job.current) return null;
      lastLayers.current = layers;
      const c = composite(bg, layers, look);
      setBusy(0);
      return { canvas: c, layers };
    },
    [bg, product, cal, place, light, wall, look]
  );
  useEffect(() => {
    if (!bg) return;
    const t = setTimeout(async () => {
      const r = await draw('draft', 1);
      if (!r || !previewRef.current) return;
      const pc = previewRef.current;
      pc.width = r.canvas.width;
      pc.height = r.canvas.height;
      pc.getContext('2d').drawImage(r.canvas, 0, 0);
      drawGuides();
    }, 250);
    return () => clearTimeout(t);
  }, [draw]); // eslint-disable-line react-hooks/exhaustive-deps

  // calibration guides over the preview
  const drawGuides = useCallback(() => {
    const o = overlayRef.current,
      pc = previewRef.current;
    if (!o || !bg) return;
    o.width = bg.width;
    o.height = bg.height;
    const x = o.getContext('2d');
    x.clearRect(0, 0, o.width, o.height);
    if (!guides) return;
    const line = (fy, color, label) => {
      const y = fy * o.height;
      x.strokeStyle = color;
      x.lineWidth = 2;
      x.setLineDash([10, 6]);
      x.beginPath();
      x.moveTo(0, y);
      x.lineTo(o.width, y);
      x.stroke();
      x.setLineDash([]);
      x.fillStyle = color;
      x.font = '600 14px system-ui';
      x.fillText(label, 8, y - 6);
    };
    line(cal.horizonY, '#2563eb', '눈높이 (수평선)');
    line(cal.floorY, '#dc2626', '벽-바닥 경계');
    line(cal.refY, '#d97706', `기준 높이 ${Math.round(cal.refH * 1000)}mm`);
  }, [cal, guides, bg]);
  useEffect(drawGuides, [drawGuides]);

  // drag a guide line, or click to place the product
  const drag = useRef(null);
  const onDown = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const fy = (e.clientY - r.top) / r.height,
      fx = (e.clientX - r.left) / r.width;
    const near = (v) => Math.abs(v - fy) * r.height < 10;
    if (guides && near(cal.horizonY)) drag.current = 'horizonY';
    else if (guides && near(cal.floorY)) drag.current = 'floorY';
    else if (guides && near(cal.refY)) drag.current = 'refY';
    else {
      drag.current = 'product';
      setPlaceP({ xFrac: fx });
    }
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e) => {
    if (!drag.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const fy = Math.min(0.99, Math.max(0.01, (e.clientY - r.top) / r.height)),
      fx = (e.clientX - r.left) / r.width;
    if (drag.current === 'product') setPlaceP({ xFrac: fx });
    else setCalP({ [drag.current]: fy });
  };
  const onUp = () => (drag.current = null);

  const sol = bg ? solveCamera(cal, bg.width, bg.height) : null;
  const finalRender = async () => {
    const r = await draw(quality, outScale);
    if (r) setResult({ ...r, quality });
  };
  const download = (canvas, name, type = 'image/png') => {
    const a = document.createElement('a');
    a.href = canvas.toDataURL(type, 0.95);
    a.download = name;
    a.click();
  };
  const base = `${bgName || 'scene'}_${tplId}_${p.width}x${p.depth}x${p.height}_${p.tier}t`;

  const sizes = tpl.sizeOptions;
  return (
    <div className="h-screen w-screen flex text-gray-900" style={{ backgroundColor: PANEL, fontFamily: 'system-ui, -apple-system, Segoe UI, sans-serif' }}>
      <aside className="w-80 shrink-0 h-full overflow-y-auto border-r border-gray-200 bg-white">
        <div className="px-4 pt-4 pb-3 border-b border-gray-200">
          <div className="text-sm font-semibold">라이프스타일 이미지 (사진 모드)</div>
          <div className="text-[11px] text-gray-500 mt-1">배경 사진 위에 실제 3D 제품을 그대로 렌더합니다. 제품 모양은 바뀌지 않습니다.</div>
        </div>
        <Box title="1. 배경 사진">
          <input type="file" accept="image/*" className="text-xs" onChange={(e) => onFile(e.target.files[0])} />
          {bg && <div className="text-[11px] text-gray-500 mt-1">{bg.width}×{bg.height}px</div>}
        </Box>
        <Box title="2. 제품">
          <select className="w-full text-xs border rounded px-2 py-1 mb-2" value={tplId} onChange={(e) => { const t = BUYER_TEMPLATES.find((x) => x.id === e.target.value); setTplId(t.id); setP(newBuyerProduct(t, p)); }}>
            {BUYER_GROUPS.map((g) => (
              <optgroup key={g} label={g}>
                {BUYER_TEMPLATES.filter((t) => buyerBrand(t) === g).map((t) => (
                  <option key={t.id} value={t.id}>{buyerShortName(t)}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-1 mb-2">
            {[['width', '폭'], ['depth', '깊이'], ['height', '높이']].map(([k, lab]) => (
              <label key={k} className="text-[11px] text-gray-600">{lab}
                <select className="w-full text-xs border rounded px-1 py-1" value={p[k]} onChange={(e) => setProd({ [k]: +e.target.value })}>
                  {(sizes[k] || [p[k]]).map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
            ))}
          </div>
          <div className="text-[11px] text-gray-600 mb-1">단수</div>
          <div className="flex flex-wrap gap-1 mb-2">
            {tierChoices(tpl, p).map((t) => (
              <button key={t} onClick={() => setProd({ tier: t })} className={'text-xs px-2 py-1 rounded border ' + (p.tier === t ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-300')}>{t}</button>
            ))}
          </div>
          <div className="text-[11px] text-gray-600 mb-1">프레임 색</div>
          <div className="flex flex-wrap gap-1 mb-2">
            {SHELF_COLORS.map(([k, name, hex]) => (
              <button key={k} title={name} onClick={() => setProd({ frameColor: k })} className={'w-6 h-6 rounded-full border ' + (p.frameColor === k ? 'ring-2 ring-gray-900' : 'border-gray-300')} style={{ backgroundColor: '#' + hex.toString(16).padStart(6, '0') }} />
            ))}
          </div>
          {tpl.boardColors && tpl.boardColors.length > 1 && (
            <>
              <div className="text-[11px] text-gray-600 mb-1">합판</div>
              <div className="flex gap-1">
                {tpl.boardColors.map((b) => (
                  <button key={b} onClick={() => setProd({ boardColor: b })} className={'text-xs px-2 py-1 rounded border ' + (p.boardColor === b ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-300')}>{b}</button>
                ))}
              </div>
            </>
          )}
        </Box>
        <Box title="3. 카메라 맞추기">
          <div className="text-[11px] text-gray-500 mb-2">미리보기의 선 3개를 드래그해 배경에 맞추세요. 기준 높이는 벽에 붙은 물건(조리대 914mm, 문 2030mm 등)으로 잡습니다.</div>
          <Slider label="눈높이 (파란 선)" value={cal.horizonY} min={0.2} max={0.8} step={0.001} fmt={pct} onChange={(v) => setCalP({ horizonY: v })} />
          <Slider label="벽-바닥 경계 (빨간 선)" value={cal.floorY} min={0.4} max={0.99} step={0.001} fmt={pct} onChange={(v) => setCalP({ floorY: v })} />
          <Slider label="기준선 (주황 선)" value={cal.refY} min={0.1} max={0.95} step={0.001} fmt={pct} onChange={(v) => setCalP({ refY: v })} />
          <Slider label="기준 높이" value={cal.refH} min={0.3} max={2.5} step={0.001} fmt={(v) => `${Math.round(v * 1000)}mm`} onChange={(v) => setCalP({ refH: v })} />
          <Slider label="화각 (가로)" value={cal.hfov} min={30} max={80} step={0.5} fmt={(v) => `${v}°`} onChange={(v) => setCalP({ hfov: v })} />
          <Slider label="카메라 좌우 회전" value={cal.yaw} min={-30} max={30} step={0.5} fmt={(v) => `${v}°`} onChange={(v) => setCalP({ yaw: v })} />
          {sol && <div className="text-[11px] text-gray-500">계산값: 카메라 높이 {sol.camH.toFixed(2)}m, 벽까지 {sol.dist.toFixed(2)}m</div>}
          <label className="flex items-center gap-2 text-xs mt-2"><input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} />보정선 보기</label>
        </Box>
        <Box title="4. 제품 배치">
          <div className="text-[11px] text-gray-500 mb-2">미리보기를 클릭하거나 드래그하면 그 위치로 옮깁니다.</div>
          <Slider label="좌우 위치" value={place.xFrac} min={0} max={1} step={0.001} fmt={pct} onChange={(v) => setPlaceP({ xFrac: v })} />
          <Slider label="벽과 간격" value={place.wallGap} min={0} max={1.5} step={0.01} fmt={(v) => `${Math.round(v * 1000)}mm`} onChange={(v) => setPlaceP({ wallGap: v })} />
          <Slider label="제품 회전" value={place.yaw} min={-60} max={60} step={1} fmt={(v) => `${v}°`} onChange={(v) => setPlaceP({ yaw: v })} />
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={wall} onChange={(e) => setWall(e.target.checked)} />뒤 벽에 그림자 받기</label>
        </Box>
        <Box title="5. 빛과 그림자">
          <div className="text-[11px] text-gray-500 mb-2">배경을 올리면 빛 방향과 색을 자동으로 맞춥니다. 필요하면 조정하세요.</div>
          <Slider label="빛 방향 (- 왼쪽 / + 오른쪽)" value={light.azimuth} min={-80} max={80} step={1} fmt={(v) => `${v}°`} onChange={(v) => setLightP({ azimuth: v })} />
          <Slider label="빛 높이" value={light.elevation} min={10} max={80} step={1} fmt={(v) => `${v}°`} onChange={(v) => setLightP({ elevation: v })} />
          <Slider label="빛 퍼짐 (그림자 부드러움)" value={light.softness} min={0} max={30} step={1} fmt={(v) => `${v}°`} onChange={(v) => setLightP({ softness: v })} />
          <Slider label="주광 세기" value={light.keyI} min={0} max={2} step={0.01} onChange={(v) => setLightP({ keyI: v })} />
          <Slider label="실내 반사광" value={light.skyI} min={0} max={1.5} step={0.01} onChange={(v) => setLightP({ skyI: v })} />
          <Slider label="방 환경광 (면별 명암·반사색)" value={light.envI} min={0} max={2} step={0.01} onChange={(v) => setLightP({ envI: v })} />
          <div className="text-[11px] text-gray-500 mt-2 mb-1">배경 벽에 더하는 그림자</div>
          <Slider label="창문 직사광 비율" value={look.keyShare} min={0} max={0.9} step={0.01} onChange={(v) => setLookP({ keyShare: v })} />
          <Slider label="그림자 진하기" value={look.shadowK} min={0} max={1.5} step={0.01} onChange={(v) => setLookP({ shadowK: v })} />
          <Slider label="그림자 범위 (제품 폭 대비)" value={look.fade} min={0.15} max={1.2} step={0.01} onChange={(v) => setLookP({ fade: v })} />
          <Slider label="그림자 번짐" value={look.shadowBlur} min={0} max={8} step={0.5} fmt={(v) => `${v}px`} onChange={(v) => setLookP({ shadowBlur: v })} />
          <Slider label="바닥 접촉 음영 (발끝)" value={look.aoFloorK} min={0} max={1} step={0.01} onChange={(v) => setLookP({ aoFloorK: v })} />
          <Slider label="벽 음영 (AO)" value={look.aoK} min={0} max={1} step={0.01} onChange={(v) => setLookP({ aoK: v })} />
          <Slider label="제품 노출" value={look.exposure} min={0.6} max={1.3} step={0.01} onChange={(v) => setLookP({ exposure: v })} />
          <Slider label="선명도 맞춤 (흐림)" value={look.blur} min={0} max={2} step={0.05} fmt={(v) => `${v}px`} onChange={(v) => setLookP({ blur: v })} />
          <Slider label="노이즈" value={look.grain} min={0} max={6} step={0.1} onChange={(v) => setLookP({ grain: v })} />
        </Box>
        <Box title="6. 렌더">
          <div className="flex gap-1 mb-2">
            {Object.entries(QUALITY).map(([k, q]) => (
              <button key={k} onClick={() => setQuality(k)} className={'flex-1 text-[11px] py-1 rounded border ' + (quality === k ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-300')}>{q.label}</button>
            ))}
          </div>
          <div className="flex gap-1 mb-2">
            {[1, 2].map((s) => (
              <button key={s} onClick={() => setOutScale(s)} className={'flex-1 text-[11px] py-1 rounded border ' + (outScale === s ? 'bg-gray-900 text-white border-gray-900' : 'bg-white border-gray-300')}>{bg ? `${bg.width * s}px` : `${s}x`}</button>
            ))}
          </div>
          <button disabled={!bg || busy > 0} onClick={finalRender} className="w-full text-sm py-2 rounded bg-gray-900 text-white disabled:opacity-40">
            {busy > 0 ? `렌더 중 ${Math.round(busy * 100)}%` : '렌더하기'}
          </button>
          {result && (
            <div className="mt-2 grid grid-cols-2 gap-1">
              <button className="text-[11px] py-1 rounded border bg-white" onClick={() => download(result.canvas, `${base}_${result.quality}.jpg`, 'image/jpeg')}>이미지 저장 (JPG)</button>
              <button className="text-[11px] py-1 rounded border bg-white" onClick={() => download(result.canvas, `${base}_${result.quality}.png`)}>이미지 저장 (PNG)</button>
              <button className="col-span-2 text-[11px] py-1 rounded border bg-white" onClick={() => { const L = layerImages(result.layers); Object.entries(L).forEach(([k, c]) => download(c, `${base}_${k}.png`)); }}>레이어 저장 (제품·마스크·그림자·AO)</button>
            </div>
          )}
        </Box>
      </aside>
      <main className="flex-1 h-full flex items-center justify-center p-6 overflow-hidden">
        {!bg ? (
          <div className="text-sm text-gray-500 text-center">왼쪽에서 배경 사진을 올려 주세요.<br />정면을 보고 찍은 실내 사진이 가장 잘 맞습니다.</div>
        ) : (
          <div className="relative max-h-full max-w-full" style={{ aspectRatio: `${bg.width} / ${bg.height}`, height: '100%' }}>
            <canvas ref={previewRef} className="absolute inset-0 w-full h-full rounded shadow" style={{ display: result ? 'none' : 'block' }} />
            {result && <img alt="render" src={result.canvas.toDataURL('image/jpeg', 0.92)} className="absolute inset-0 w-full h-full rounded shadow" />}
            <canvas
              ref={overlayRef}
              className="absolute inset-0 w-full h-full cursor-crosshair"
              onPointerDown={(e) => { setResult(null); onDown(e); }}
              onPointerMove={onMove}
              onPointerUp={onUp}
            />
          </div>
        )}
      </main>
    </div>
  );
}
