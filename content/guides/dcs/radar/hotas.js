// On-screen HOTAS: TDC slew pad, TDC depress, antenna elevation rocker, undesignate, SCS.

import { slewCursor, slewCursorAzel, slewCursorSa, slewElev, tdcDepress, stepLS, setTdcPriority } from "./model.js";

const SLEW_RATE = 1.08; // normalized cursor units per second at full deflection
const ELEV_RATE = 21;   // antenna elevation degrees per second while held

export function setupHotas(state, onChange) {
  const pad = document.getElementById("tdc-pad");
  const knob = document.getElementById("tdc-knob");

  let active = false;
  let offX = 0; // -1..1 deflection from pad center
  let offY = 0;

  function setOffsetFromEvent(e) {
    const r = pad.getBoundingClientRect();
    const nx = ((e.clientX - r.left) / r.width) * 2 - 1;
    const ny = ((e.clientY - r.top) / r.height) * 2 - 1;
    offX = Math.max(-1, Math.min(1, nx));
    offY = Math.max(-1, Math.min(1, ny));
    knob.style.left = `${50 + offX * 38}%`;
    knob.style.top = `${50 + offY * 38}%`;
  }

  function recenterKnob() {
    knob.style.left = "50%";
    knob.style.top = "50%";
  }

  pad.addEventListener("pointerdown", (e) => {
    active = true;
    pad.setPointerCapture(e.pointerId);
    setOffsetFromEvent(e);
  });
  pad.addEventListener("pointermove", (e) => {
    if (active) setOffsetFromEvent(e);
  });
  function endSlew(e) {
    if (!active) return;
    active = false;
    offX = offY = 0;
    recenterKnob();
  }
  pad.addEventListener("pointerup", endSlew);
  pad.addEventListener("pointercancel", endSlew);

  let elevDir = 0; // -1 down, +1 up, 0 idle; set while the rocker is held
  let lastTime = null;

  function tick(now) {
    const dt = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.1);
    lastTime = now;
    let changed = false;
    if (active && (offX !== 0 || offY !== 0)) {
      const dx = offX * SLEW_RATE * dt;
      const dy = offY * SLEW_RATE * dt;
      if (state.tdcPriority === 'azel') {
        slewCursorAzel(state, dx, dy);
      } else if (state.tdcPriority === 'sa') {
        slewCursorSa(state, dx, dy);
      } else {
        // Pad up (negative screen Y) moves the ATK cursor toward greater range (up).
        slewCursor(state, dx, -dy);
      }
      changed = true;
    }
    if (elevDir !== 0) {
      slewElev(state, elevDir * ELEV_RATE * dt);
      changed = true;
    }
    if (changed) onChange();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  bindHold("tdc-depress",
    () => {
      state.tdcDepressed = true;
      if (state.tdcPriority === 'atk') tdcDepress(state);
      onChange();
    },
    () => { state.tdcDepressed = false; onChange(); }
  );
  bindHold("elev-up", () => (elevDir = 1), () => (elevDir = 0));
  bindHold("elev-dn", () => (elevDir = -1), () => (elevDir = 0));
  bindButton("undesig", () => {
    stepLS(state);
    onChange();
  });
}

function bindButton(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener("click", fn);
}

export function setupScs(state, onChange) {
  const SCS_MAP = { 'scs-left': 'azel', 'scs-down': 'sa', 'scs-right': 'atk' };
  for (const [id, target] of Object.entries(SCS_MAP)) {
    bindButton(id, () => {
      if (setTdcPriority(state, target)) onChange();
      // If already priority: context-sensitive action — deferred to future session.
    });
  }
  // scs-up: no-op placeholder for future context-sensitive action.
}

// Press-and-hold: onDown while pressed, onUp when released/cancelled or pointer leaves.
function bindHold(id, onDown, onUp) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    onDown();
  });
  const stop = () => onUp();
  el.addEventListener("pointerup", stop);
  el.addEventListener("pointercancel", stop);
  el.addEventListener("pointerleave", stop);
}
