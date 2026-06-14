// MFD rendering: a shared bezel/OSB framework plus the three page renderers.

import {
  SCOPE_AZ_DEG,
  ELEV_LIMIT_DEG,
  azBounds,
  elBounds,
  scanCenter,
  azWidth,
  displayRange,
  saRange,
  contactElevation,
  isDetected,
  coneAltitudesAt,
  cursorRange,
  lsContact,
  contactUnderCursor,
  sweepGlow,
  hasBeenSwept,
} from "./model.js";

export const GREEN = "#33ff66";
const DIM = "#1a6b33";
const FAINT = "rgba(51,255,102,0.10)";
const GREY = "#555";

const RES = 380; // internal canvas resolution (square)
const BEZEL = 42; // margin reserved for OSB labels

// OSB positions by number (1–20, clockwise from bottom of left edge).
function osbAnchor(osb) {
  const inset = BEZEL;
  const span = RES - 2 * inset;
  let side, slot;
  if (osb <= 5)       { side = "left";   slot = osb - 1; }
  else if (osb <= 10) { side = "top";    slot = osb - 6; }
  else if (osb <= 15) { side = "right";  slot = osb - 11; }
  else                { side = "bottom"; slot = osb - 16; }
  const pos = inset + span * ((slot + 0.5) / 5);
  switch (side) {
    case "top":    return { x: pos,              y: inset * 0.5,       align: "center" };
    case "bottom": return { x: RES - pos,        y: RES - inset * 0.5, align: "center" };
    case "right":  return { x: RES - inset * 0.4, y: pos,             align: "right" };
    case "left":   return { x: inset * 0.4,      y: RES - pos,        align: "left" };
  }
}

export class MFD {
  constructor(canvas, config) {
    this.canvas = canvas;
    this.config = config; // { title, priorityKey, osbs(state)->[], drawDisplay(ctx, area, state) }
    this.osbRects = [];
    canvas.addEventListener("click", (e) => this.onClick(e));
  }

  get area() {
    return { x: BEZEL, y: BEZEL, w: RES - 2 * BEZEL, h: RES - 2 * BEZEL };
  }

  onClick(e) {
    const r = this.canvas.getBoundingClientRect();
    const sx = RES / r.width;
    const sy = RES / r.height;
    const x = (e.clientX - r.left) * sx;
    const y = (e.clientY - r.top) * sy;
    for (const o of this.osbRects) {
      if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) {
        if (!o.disabled && o.action) o.action();
        return;
      }
    }
  }

  draw(state) {
    const ctx = this.canvas.getContext("2d");
    // Backing store at devicePixelRatio for crispness.
    const r = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const px = Math.max(1, Math.round(r.width * dpr));
    if (this.canvas.width !== px) {
      this.canvas.width = px;
      this.canvas.height = px;
    }
    ctx.setTransform(this.canvas.width / RES, 0, 0, this.canvas.height / RES, 0, 0);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, RES, RES);

    const a = this.area;
    // Display border.
    ctx.strokeStyle = DIM;
    ctx.lineWidth = 1;
    ctx.strokeRect(a.x, a.y, a.w, a.h);

    // OSB labels.
    const osbs = this.config.osbs ? this.config.osbs(state) : [];
    this.osbRects = [];
    ctx.font = "13px monospace";
    ctx.textBaseline = "middle";
    for (const o of osbs) {
      const an = osbAnchor(o.osb);
      ctx.fillStyle = o.disabled ? GREY : GREEN;
      let rect;
      if (o.vertical) {
        ctx.font = "11px monospace";
        const lineH = 12;
        const cw = ctx.measureText("M").width;
        ctx.textAlign = "center";
        const words = o.label.split(" ");
        const rows = Math.max(...words.map(w => w.length));
        const totalH = rows * lineH;
        const totalW = words.length * cw + (words.length - 1) * 2;
        words.forEach((word, col) => {
          const cx = an.x - totalW / 2 + col * (cw + 2) + cw / 2;
          [...word].forEach((ch, row) => {
            ctx.fillText(ch, cx, an.y - totalH / 2 + row * lineH + lineH / 2);
          });
        });
        rect = { x: an.x - totalW / 2 - 2, y: an.y - totalH / 2, w: totalW + 4, h: totalH, action: o.action, disabled: o.disabled };
        ctx.font = "13px monospace";
      } else if (o.label.includes("\n")) {
        const lines = o.label.split("\n");
        const lineH = 14;
        const totalH = lines.length * lineH;
        ctx.textAlign = an.align;
        const maxW = Math.max(...lines.map(l => ctx.measureText(l).width));
        lines.forEach((line, i) => {
          ctx.fillText(line, an.x, an.y - totalH / 2 + i * lineH + lineH / 2);
        });
        let rx = an.x;
        if (an.align === "center") rx = an.x - maxW / 2;
        if (an.align === "right") rx = an.x - maxW;
        rect = { x: rx - 4, y: an.y - totalH / 2, w: maxW + 8, h: totalH, action: o.action, disabled: o.disabled };
      } else {
        ctx.textAlign = an.align;
        ctx.fillText(o.label, an.x, an.y);
        const tw = ctx.measureText(o.label).width;
        let rx = an.x;
        if (an.align === "center") rx = an.x - tw / 2;
        if (an.align === "right") rx = an.x - tw;
        rect = { x: rx - 4, y: an.y - 11, w: tw + 8, h: 22, action: o.action, disabled: o.disabled };
      }
      this.osbRects.push(rect);
      if (o.active) {
        ctx.strokeStyle = GREEN;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      }
    }

    // Title (top-left of display).
    if (this.config.title) {
      ctx.fillStyle = GREEN;
      ctx.font = "12px monospace";
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(this.config.title, a.x + 4, a.y + 4);
    }

    // TDC priority indicator: green diamond with center dot in top-right of display area.
    if (this.config.priorityKey && state.tdcPriority === this.config.priorityKey) {
      const dx = a.x + a.w - 10;
      const dy = a.y + 10;
      const r = 6;
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(dx, dy - r);
      ctx.lineTo(dx + r, dy);
      ctx.lineTo(dx, dy + r);
      ctx.lineTo(dx - r, dy);
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = GREEN;
      ctx.beginPath();
      ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Page content, clipped to display area.
    ctx.save();
    ctx.beginPath();
    ctx.rect(a.x, a.y, a.w, a.h);
    ctx.clip();
    this.config.drawDisplay(ctx, a, state);
    ctx.restore();
  }
}

// --- Shared helpers ---

function drawStar(ctx, x, y, r, color) {
  const ri = r * 0.382;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const ao = ((i * 72) - 90) * Math.PI / 180;
    const ai = ao + 36 * Math.PI / 180;
    if (i === 0) ctx.moveTo(x + r * Math.cos(ao), y + r * Math.sin(ao));
    else ctx.lineTo(x + r * Math.cos(ao), y + r * Math.sin(ao));
    ctx.lineTo(x + ri * Math.cos(ai), y + ri * Math.sin(ai));
  }
  ctx.closePath();
  ctx.fill();
}

function brick(ctx, x, y, isLS, glow = 0) {
  ctx.shadowColor = '#33ff66';
  ctx.shadowBlur = 22 * glow;
  // Brighten the brick toward white-green at peak, and draw twice to
  // accumulate shadow intensity (canvas shadow composites additively).
  const r = Math.round(51  + 200 * glow);
  const b = Math.round(102 + 150 * glow);
  ctx.fillStyle = glow > 0 ? `rgb(${r},255,${b})` : GREEN;
  ctx.fillRect(x - 5, y - 3, 10, 6);
  if (glow > 0) ctx.fillRect(x - 5, y - 3, 10, 6); // second pass doubles glow spread
  ctx.shadowBlur = 0;
  if (isLS) drawStar(ctx, x, y - 11, 5, GREEN);
}

// HAFU half-shape path builders. Each adds its half to the current path.
// (x, y) is the midline center; shapes extend s px above or below it.
const HAFU_S = 5;
function halfTopSquare(ctx, x, y) {
  ctx.moveTo(x - HAFU_S, y);
  ctx.lineTo(x - HAFU_S, y - HAFU_S);
  ctx.lineTo(x + HAFU_S, y - HAFU_S);
  ctx.lineTo(x + HAFU_S, y);
}
function halfBottomSquare(ctx, x, y) {
  ctx.moveTo(x - HAFU_S, y);
  ctx.lineTo(x - HAFU_S, y + HAFU_S);
  ctx.lineTo(x + HAFU_S, y + HAFU_S);
  ctx.lineTo(x + HAFU_S, y);
}
function halfTopDiamond(ctx, x, y) {
  ctx.moveTo(x - HAFU_S, y);
  ctx.lineTo(x, y - HAFU_S);
  ctx.lineTo(x + HAFU_S, y);
}
function halfBottomDiamond(ctx, x, y) {
  ctx.moveTo(x - HAFU_S, y);
  ctx.lineTo(x, y + HAFU_S);
  ctx.lineTo(x + HAFU_S, y);
}
function halfTopCircle(ctx, x, y) {
  ctx.moveTo(x - HAFU_S, y);
  ctx.arc(x, y, HAFU_S, Math.PI, 0, false); // clockwise: left → top → right
}
function halfBottomCircle(ctx, x, y) {
  ctx.moveTo(x - HAFU_S, y);
  ctx.arc(x, y, HAFU_S, Math.PI, 0, true);  // anticlockwise: left → bottom → right
}
const HAFU_TOP    = { square: halfTopSquare,    diamond: halfTopDiamond,    circle: halfTopCircle    };
const HAFU_BOTTOM = { square: halfBottomSquare, diamond: halfBottomDiamond, circle: halfBottomCircle };

const YELLOW = "#ffff00";
const RED    = "#ff4444";

// Draw a HAFU symbol at (x, y). top/bottom are 'square'|'diamond'|'circle'|null.
// color is GREEN, YELLOW, or RED.
function hafu(ctx, x, y, top, bottom, isLS, color = GREEN) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (top    && HAFU_TOP[top])       HAFU_TOP[top](ctx, x, y);
  if (bottom && HAFU_BOTTOM[bottom]) HAFU_BOTTOM[bottom](ctx, x, y);
  ctx.stroke();
  if (isLS) drawStar(ctx, x, y, 4, color);
}

// Map azimuth (deg) to display X across the fixed +/- scope.
function azToX(a, azDeg) {
  return a.x + ((azDeg + SCOPE_AZ_DEG) / (2 * SCOPE_AZ_DEG)) * a.w;
}

function k(ft) {
  return Math.round(ft / 1000);
}

// ISA speed of sound in knots at a given altitude (ft).
function speedOfSound(altFt) {
  const T = Math.max(216.65, 288.15 - 0.001981 * altFt);
  return 661.5 * Math.sqrt(T / 288.15);
}

// --- ATK RDR (B-scope: azimuth x range) ---

export function drawAtkRdr(ctx, a, state) {
  const range = displayRange(state);
  const { lo, hi } = azBounds(state);

  // Scanned azimuth sector band.
  const xl = azToX(a, lo);
  const xr = azToX(a, hi);
  ctx.fillStyle = FAINT;
  ctx.fillRect(xl, a.y, xr - xl, a.h);
  ctx.strokeStyle = DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(xl, a.y);
  ctx.lineTo(xl, a.y + a.h);
  ctx.moveTo(xr, a.y);
  ctx.lineTo(xr, a.y + a.h);
  ctx.stroke();

  // Boresight (nose) reference line.
  const xc = azToX(a, 0);
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(xc, a.y);
  ctx.lineTo(xc, a.y + a.h);
  ctx.stroke();
  ctx.setLineDash([]);

  // Sweep azimuth line — solid vertical line tracking the current beam position.
  const sweepX = azToX(a, state.sweep.azDeg);
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(sweepX, a.y);
  ctx.lineTo(sweepX, a.y + a.h);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Azimuth tick marks at 0°, ±30°, ±60° along top and bottom inner edges.
  ctx.strokeStyle = DIM;
  ctx.lineWidth = 1;
  const tickLen = 18;
  ctx.beginPath();
  for (const az of [-60, -30, 0, 30, 60]) {
    const xt = azToX(a, az);
    ctx.moveTo(xt, a.y);
    ctx.lineTo(xt, a.y + tickLen);
    ctx.moveTo(xt, a.y + a.h);
    ctx.lineTo(xt, a.y + a.h - tickLen);
  }
  // Range tick marks at 1/4, 1/2, 3/4 along left and right inner edges.
  for (const frac of [0.25, 0.5, 0.75]) {
    const yt = a.y + frac * a.h;
    ctx.moveTo(a.x, yt);
    ctx.lineTo(a.x + tickLen, yt);
    ctx.moveTo(a.x + a.w, yt);
    ctx.lineTo(a.x + a.w - tickLen, yt);
  }
  ctx.stroke();

  // Elevation caret (<) on the left inner edge.
  // Neutral (0°) → midpoint; fully raised → 3/4 tick; fully lowered → 1/4 tick.
  const elevFrac = 0.5 - 0.25 * (state.radar.elevDeg / ELEV_LIMIT_DEG);
  const caretY = a.y + elevFrac * a.h;
  const cs = 7; // caret arm half-size
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(a.x + cs, caretY - cs);
  ctx.lineTo(a.x, caretY);
  ctx.lineTo(a.x + cs, caretY + cs);
  ctx.stroke();

  if (!state.radar.declutter) {
    // Range scale label (top-right).
    ctx.fillStyle = GREEN;
    ctx.font = "12px monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(range + "", a.x + a.w - 4, a.y + 18);

    // Elevation readout: cone top/bottom altitude at cursor range.
    const { topFt, bottomFt } = coneAltitudesAt(state, cursorRange(state));
    ctx.textAlign = "left";
    ctx.fillText(k(topFt) + "↑", a.x + 4, a.y + 20);
    ctx.textBaseline = "bottom";
    ctx.fillText(k(bottomFt) + "↓", a.x + 4, a.y + a.h - 4);
  }

  // Contacts within the scan volume and display range.
  const ls = lsContact(state);
  const tuc = contactUnderCursor(state);
  for (const c of state.contacts) {
    if (!isDetected(state, c) || c.rangeNmi > range || !hasBeenSwept(state, c)) continue;
    const x = azToX(a, c.azDeg);
    const y = a.y + a.h - (c.rangeNmi / range) * a.h;
    const isLs = ls && c.id === ls.id;
    const isTuc = tuc && c.id === tuc.id;
    if (state.assists.ltws && (isLs || isTuc)) {
      hafu(ctx, x, y, 'square', 'diamond', isLs, YELLOW);
      const machStr = (c.speedKt / speedOfSound(c.altFt)).toFixed(2).replace(/^0/, '');
      const angelsStr = String(Math.round(c.altFt / 1000)).padStart(2, '0');
      ctx.fillStyle = YELLOW;
      ctx.font = '10px monospace';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'right';
      ctx.fillText(machStr, x - HAFU_S - 4, y);
      ctx.textAlign = 'left';
      ctx.fillText(angelsStr, x + HAFU_S + 4, y);
    } else {
      brick(ctx, x, y, isLs, sweepGlow(state, c.id));
    }
  }

  // Radar cursor — only visible when ATK has TDC priority.
  if (state.tdcPriority === 'atk') {
    const cx = a.x + state.cursorAtk.x * a.w;
    const cy = a.y + a.h - state.cursorAtk.y * a.h;
    const { topFt, bottomFt } = coneAltitudesAt(state, cursorRange(state));
    drawCursor(ctx, cx, cy, topFt, bottomFt);
  }
}

function drawSimpleCursor(ctx, cx, cy) {
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 1.5;
  const vg = 5;
  const vs = 8;
  ctx.beginPath();
  ctx.moveTo(cx - vg, cy - vs);
  ctx.lineTo(cx - vg, cy + vs);
  ctx.moveTo(cx + vg, cy - vs);
  ctx.lineTo(cx + vg, cy + vs);
  ctx.stroke();
}

function drawCursor(ctx, cx, cy, topFt, bottomFt) {
  drawSimpleCursor(ctx, cx, cy);
  const vg = 5;
  const vs = 8;
  const clamp = ft => Math.max(0, Math.min(99, Math.round(ft / 1000)));
  const fmt = n => String(n).padStart(2, '0');
  ctx.fillStyle = GREEN;
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText(fmt(clamp(topFt)), cx, cy - vs - 2);
  ctx.textBaseline = 'top';
  ctx.fillText(fmt(clamp(bottomFt)), cx, cy + vs + 2);
}

// --- AZ/EL (front view: azimuth x elevation) ---

// Fixed vertical scale for the AZ/EL view: display spans +/- this elevation, so
// the scanned band visibly grows/shrinks with bars and slides with antenna tilt.
const VIEW_EL_DEG = 45;

export function drawAzEl(ctx, a, state) {
  const { lo: azLo, hi: azHi } = azBounds(state);
  const { lo: elLo, hi: elHi } = elBounds(state);
  const elToY = (el) => a.y + a.h - ((el + VIEW_EL_DEG) / (2 * VIEW_EL_DEG)) * a.h;

  // Scanned volume: azimuth width x elevation band, on a fixed elevation scale.
  const xl = azToX(a, azLo);
  const xr = azToX(a, azHi);
  const yt = elToY(elHi);
  const yb = elToY(elLo);
  ctx.fillStyle = FAINT;
  ctx.fillRect(xl, yt, xr - xl, yb - yt);
  ctx.strokeStyle = DIM;
  ctx.strokeRect(xl, yt, xr - xl, yb - yt);

  // Horizon line (elevation 0) with azimuth tick marks at ±30° and ±60°.
  const yh = elToY(0);
  const tickLen = 8;
  ctx.strokeStyle = DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(a.x, yh);
  ctx.lineTo(a.x + a.w, yh);
  for (const az of [-60, -30, 30, 60]) {
    const xt = azToX(a, az);
    ctx.moveTo(xt, yh - tickLen);
    ctx.lineTo(xt, yh + tickLen);
  }
  ctx.stroke();

  // Boresight vertical.
  const xc = azToX(a, 0);
  ctx.beginPath();
  ctx.moveTo(xc, a.y);
  ctx.lineTo(xc, a.y + a.h);
  ctx.stroke();

  // Sweep azimuth line.
  const sweepX = azToX(a, state.sweep.azDeg);
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.moveTo(sweepX, a.y);
  ctx.lineTo(sweepX, a.y + a.h);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Contacts in the scan volume.
  const ls = lsContact(state);
  for (const c of state.contacts) {
    if (!isDetected(state, c) || !hasBeenSwept(state, c)) continue;
    const x = azToX(a, c.azDeg);
    const y = elToY(contactElevation(state, c));
    brick(ctx, x, y, ls && c.id === ls.id, sweepGlow(state, c.id));
  }

  if (state.tdcPriority === 'azel') {
    const cx = a.x + state.cursorAzel.x * a.w;
    const cy = a.y + state.cursorAzel.y * a.h;
    drawSimpleCursor(ctx, cx, cy);
  }
}

// --- SA (top-down) ---

const COMPASS_LABELS = {
  0: 'N', 30: '3', 60: '6', 90: 'E', 120: '12',
  150: '15', 180: 'S', 210: '21', 240: '24', 270: 'W', 300: '30', 330: '33',
};

function drawCompass(ctx, a) {
  const cx = a.x + a.w / 2;
  const cy = a.y + a.h / 2;
  const R = Math.min(a.w, a.h) / 2 - 32;
  ctx.fillStyle = GREEN;
  ctx.shadowColor = GREEN;
  ctx.shadowBlur = 6;
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let deg = 0; deg < 360; deg += 10) {
    const ang = (deg - 90) * Math.PI / 180;
    const label = COMPASS_LABELS[deg];
    if (label) {
      ctx.fillText(label, cx + Math.cos(ang) * R, cy + Math.sin(ang) * R);
    } else {
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
}

function drawCompassArc(ctx, cx, oy, compassR) {
  ctx.fillStyle = GREEN;
  ctx.shadowColor = GREEN;
  ctx.shadowBlur = 6;
  ctx.font = '9px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (let deg = 0; deg < 360; deg += 10) {
    const relativeDeg = deg <= 180 ? deg : deg - 360;
    if (Math.abs(relativeDeg) > 45) continue;
    const ang = (deg - 90) * Math.PI / 180;
    const label = COMPASS_LABELS[deg];
    if (label) {
      ctx.fillText(label, cx + Math.cos(ang) * compassR, oy + Math.sin(ang) * compassR);
    } else {
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * compassR, oy + Math.sin(ang) * compassR, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
}

export function drawSa(ctx, a, state) {
  const cx = a.x + a.w / 2;
  const centered = state.saCentered !== false;
  const oy = centered ? a.y + a.h / 2 : a.y + a.h * 3 / 4;
  const R = centered ? Math.min(a.w, a.h) / 2 - 6 : a.h * 3 / 4;
  const range = saRange(state);

  const compassR = centered ? Math.min(a.w, a.h) / 2 - 32 : a.h * 3 / 4 - 16;

  if (centered) {
    drawCompass(ctx, a);

    // Azimuth scan arc on the compass ring.
    const { lo, hi } = azBounds(state);
    ctx.strokeStyle = GREEN;
    ctx.shadowColor = GREEN;
    ctx.shadowBlur = 6;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, oy, compassR + 5, (lo - 90) * Math.PI / 180, (hi - 90) * Math.PI / 180);
    ctx.stroke();

    // ±70° radial indicator lines from just outside the compass to the display edge.
    ctx.lineWidth = 1;
    for (const azDeg of [-70, 70]) {
      const ang = (azDeg - 90) * Math.PI / 180;
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);
      const ts = [];
      if (Math.abs(cos) > 1e-9) ts.push(cos > 0 ? (a.x + a.w - cx) / cos : (a.x - cx) / cos);
      if (Math.abs(sin) > 1e-9) ts.push(sin > 0 ? (a.y + a.h - oy) / sin : (a.y - oy) / sin);
      const edgeR = Math.min(...ts.filter(t => t > 0));
      ctx.beginPath();
      const startR = compassR + 5;
      const endR = startR + (edgeR - startR) * 0.9;
      ctx.moveTo(cx + cos * startR, oy + sin * startR);
      ctx.lineTo(cx + cos * endR, oy + sin * endR);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  } else {
    drawCompassArc(ctx, cx, oy, compassR);

    // Two range rings: first touches the display midpoint, second touches the 3/4-up point.
    ctx.strokeStyle = GREEN;
    ctx.shadowColor = GREEN;
    ctx.shadowBlur = 4;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, oy, a.h / 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, oy, a.h / 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // Ownship chevron (nose up).
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, oy - 9);
  ctx.lineTo(cx - 7, oy + 7);
  ctx.moveTo(cx, oy - 9);
  ctx.lineTo(cx + 7, oy + 7);
  ctx.stroke();

  // Contacts the radar currently detects (in the scan volume, within range).
  const ls = lsContact(state);
  for (const c of state.contacts) {
    if (!isDetected(state, c) || c.rangeNmi > range || !hasBeenSwept(state, c)) continue;
    const ang = ((c.azDeg - 90) * Math.PI) / 180;
    const d = (c.rangeNmi / range) * R;
    const x = cx + Math.cos(ang) * d;
    const y = oy + Math.sin(ang) * d;
    hafu(ctx, x, y, 'square', 'diamond', false, YELLOW);
  }

  if (state.tdcPriority === 'sa') {
    const scx = a.x + state.cursorSa.x * a.w;
    const scy = a.y + state.cursorSa.y * a.h;
    drawSimpleCursor(ctx, scx, scy);
  }
}
