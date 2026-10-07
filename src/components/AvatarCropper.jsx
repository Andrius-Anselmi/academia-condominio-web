import { useEffect, useRef, useState } from "react";

const OUT = 400; // lado da imagem final, em px
const MAX_ZOOM = 4;

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Enquadramento estilo WhatsApp: arraste para posicionar, pinça/slider/scroll para zoom.
export default function AvatarCropper({ file, onCancel, onConfirm }) {
  const [src, setSrc] = useState("");
  const [nat, setNat] = useState(null); // tamanho original { w, h }
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [stage, setStage] = useState(300);

  const imgRef = useRef(null);
  const stageRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef({});

  const circle = stage - 40; // diâmetro da área recortada

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const measure = () => {
      if (stageRef.current) setStage(stageRef.current.clientWidth);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Escala que faz a menor lado da foto preencher o círculo
  const base = nat ? circle / Math.min(nat.w, nat.h) : 1;

  function limit(p, z) {
    if (!nat) return p;
    const maxX = Math.max(0, (nat.w * base * z - circle) / 2);
    const maxY = Math.max(0, (nat.h * base * z - circle) / 2);
    return { x: clamp(p.x, -maxX, maxX), y: clamp(p.y, -maxY, maxY) };
  }

  function changeZoom(z) {
    const next = clamp(z, 1, MAX_ZOOM);
    setZoom(next);
    setPos((p) => limit(p, next));
  }

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current = {
      startPos: pos,
      startZoom: zoom,
      startDist: null,
      origin: { x: e.clientX, y: e.clientY },
    };
  }

  function onPointerMove(e) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    const g = gesture.current;

    if (pts.length >= 2) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      if (!g.startDist) g.startDist = dist;
      changeZoom(g.startZoom * (dist / g.startDist));
    } else {
      const next = {
        x: g.startPos.x + (e.clientX - g.origin.x),
        y: g.startPos.y + (e.clientY - g.origin.y),
      };
      setPos(limit(next, zoom));
    }
  }

  function onPointerUp(e) {
    pointers.current.delete(e.pointerId);
    // Reinicia o gesto com o dedo que sobrou, sem "pular" a imagem
    const left = [...pointers.current.values()][0];
    gesture.current = {
      startPos: pos,
      startZoom: zoom,
      startDist: null,
      origin: left ? { x: left.x, y: left.y } : { x: 0, y: 0 },
    };
  }

  function confirm() {
    const img = imgRef.current;
    if (!img || !nat) return;
    const s = base * zoom;
    const k = OUT / circle;
    const canvas = document.createElement("canvas");
    canvas.width = OUT;
    canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    const left = (pos.x - (nat.w * s) / 2 + circle / 2) * k;
    const top = (pos.y - (nat.h * s) / 2 + circle / 2) * k;
    ctx.drawImage(img, left, top, nat.w * s * k, nat.h * s * k);
    onConfirm(canvas.toDataURL("image/jpeg", 0.85));
  }

  return (
    <div
      className="crop-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Ajustar foto de perfil"
    >
      <div className="crop-sheet">
        <h3 className="crop-title">Ajustar foto</h3>

        <div
          ref={stageRef}
          className="crop-stage"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={(e) => changeZoom(zoom - e.deltaY * 0.002)}
        >
          {src && (
            <img
              ref={imgRef}
              src={src}
              alt=""
              draggable={false}
              onLoad={(e) =>
                setNat({ w: e.target.naturalWidth, h: e.target.naturalHeight })
              }
              style={
                nat
                  ? {
                      width: nat.w,
                      height: nat.h,
                      transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${base * zoom})`,
                    }
                  : { visibility: "hidden" }
              }
            />
          )}
          <div
            className="crop-circle"
            style={{ width: circle, height: circle }}
          />
        </div>

        <input
          className="crop-zoom"
          type="range"
          min="1"
          max={MAX_ZOOM}
          step="0.01"
          value={zoom}
          onChange={(e) => changeZoom(Number(e.target.value))}
          aria-label="Zoom"
        />

        <div className="pf-editor-actions">
          <button type="button" className="pf-btn" onClick={onCancel}>
            Cancelar
          </button>
          <button
            type="button"
            className="pf-btn pf-btn-primary"
            onClick={confirm}
          >
            Usar foto
          </button>
        </div>
      </div>
    </div>
  );
}
