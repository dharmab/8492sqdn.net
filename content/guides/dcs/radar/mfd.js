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
    this.config = config; // { title, osbs(state)->[], drawDisplay(ctx, area, state) }
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

function brick(ctx, x, y, isLS) {
  ctx.fillStyle = GREEN;
  ctx.fillRect(x - 5, y - 3, 10, 6);
  if (isLS) {
    ctx.strokeStyle = GREEN;
    ctx.lineWidth = 1.5;
    const r = 11;
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.lineTo(x + r, y);
    ctx.moveTo(x, y - r);
    ctx.lineTo(x, y + r);
    ctx.stroke();
  }
}

// Map azimuth (deg) to display X across the fixed +/- scope.
function azToX(a, azDeg) {
  return a.x + ((azDeg + SCOPE_AZ_DEG) / (2 * SCOPE_AZ_DEG)) * a.w;
}

function k(ft) {
  return Math.round(ft / 1000);
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
    ctx.fillText(range + "", a.x + a.w - 4, a.y + 4);

    // Elevation readout: cone top/bottom altitude at cursor range.
    const { topFt, bottomFt } = coneAltitudesAt(state, cursorRange(state));
    ctx.textAlign = "left";
    ctx.fillText(k(topFt) + "↑", a.x + 4, a.y + 20);
    ctx.textBaseline = "bottom";
    ctx.fillText(k(bottomFt) + "↓", a.x + 4, a.y + a.h - 4);
  }

  // Contacts within the scan volume and display range.
  const ls = lsContact(state);
  for (const c of state.contacts) {
    if (!isDetected(state, c) || c.rangeNmi > range) continue;
    const x = azToX(a, c.azDeg);
    const y = a.y + a.h - (c.rangeNmi / range) * a.h; // near at bottom
    brick(ctx, x, y, ls && c.id === ls.id);
  }

  // L&S designation indicator.
  if (ls) {
    ctx.fillStyle = GREEN;
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("L&S", a.x + a.w / 2, a.y + 4);
  }

  // Radar cursor.
  const cx = a.x + state.cursor.x * a.w;
  const cy = a.y + a.h - state.cursor.y * a.h;
  const { topFt, bottomFt } = coneAltitudesAt(state, cursorRange(state));
  drawCursor(ctx, cx, cy, state.tdcDepressed, topFt, bottomFt);
}

function drawCursor(ctx, cx, cy, depressed, topFt, bottomFt) {
  ctx.strokeStyle = GREEN;
  ctx.lineWidth = 1.5;
  const s = 16;
  const g = 2;
  const vg = 5;
  const vs = 8;
  ctx.beginPath();
  if (depressed) {
    ctx.moveTo(cx - s, cy);
    ctx.lineTo(cx - g, cy);
    ctx.moveTo(cx + g, cy);
    ctx.lineTo(cx + s, cy);
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx, cy - g);
    ctx.moveTo(cx, cy + g);
    ctx.lineTo(cx, cy + s);
  } else {
    ctx.moveTo(cx - vg, cy - vs);
    ctx.lineTo(cx - vg, cy + vs);
    ctx.moveTo(cx + vg, cy - vs);
    ctx.lineTo(cx + vg, cy + vs);
  }
  ctx.stroke();

  if (!depressed) {
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

  // Horizon line (elevation 0).
  const yh = elToY(0);
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(a.x, yh);
  ctx.lineTo(a.x + a.w, yh);
  ctx.stroke();

  // Boresight vertical.
  const xc = azToX(a, 0);
  ctx.beginPath();
  ctx.moveTo(xc, a.y);
  ctx.lineTo(xc, a.y + a.h);
  ctx.stroke();
  ctx.setLineDash([]);

  // Contacts in the scan volume.
  const ls = lsContact(state);
  for (const c of state.contacts) {
    if (!isDetected(state, c)) continue;
    const x = azToX(a, c.azDeg);
    const y = elToY(contactElevation(state, c));
    brick(ctx, x, y, ls && c.id === ls.id);
  }
}

// --- SA (top-down) ---

export function drawSa(ctx, a, state) {
  const cx = a.x + a.w / 2;
  const centered = state.saCentered !== false;
  const oy = centered ? a.y + a.h / 2 : a.y + a.h - 12;
  const R = centered ? Math.min(a.w, a.h) / 2 - 6 : a.h - 14;
  const range = saRange(state);

  // Radar cone wedge (azimuth sector, always 80 nmi deep).
  const { lo, hi } = azBounds(state);
  const coneR = (80 / range) * R;
  const a0 = ((lo - 90) * Math.PI) / 180; // up = nose; screen angle offset
  const a1 = ((hi - 90) * Math.PI) / 180;
  ctx.fillStyle = FAINT;
  ctx.beginPath();
  ctx.moveTo(cx, oy);
  ctx.arc(cx, oy, coneR, a0, a1);
  ctx.closePath();
  ctx.fill();

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
    if (!isDetected(state, c) || c.rangeNmi > range) continue;
    const ang = ((c.azDeg - 90) * Math.PI) / 180;
    const d = (c.rangeNmi / range) * R;
    const x = cx + Math.cos(ang) * d;
    const y = oy + Math.sin(ang) * d;
    brick(ctx, x, y, ls && c.id === ls.id);
  }
}
