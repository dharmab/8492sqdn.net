import {
  createState,
  azWidth,
  saRange,
  cycleAz,
  cycleBars,
  rangeUp,
  rangeDown,
  cycleSaScale,
  toggleSaCenter,
  pruneLS,
  pruneGlowTimes,
  tickSweep,
  exitSTT,
  BARS_OPTIONS,
} from "./model.js";
import { MFD, drawAtkRdr, drawAzEl, drawSa } from "./mfd.js";
import { Scene3D } from "./scene3d.js";
import { setupHotas, setupScs } from "./hotas.js";

const state = createState();

function bars(state) {
  return BARS_OPTIONS[state.radar.barsIndex];
}

const azel = new MFD(document.getElementById("mfd-azel"), {
  title: "AZ/EL",
  priorityKey: 'azel',
  drawDisplay: drawAzEl,
});

const sa = new MFD(document.getElementById("mfd-sa"), {
  title: "SA",
  priorityKey: 'sa',
  osbs: (s) => [
    { osb: 2,  label: "PLID",              disabled: true, vertical: true },
    { osb: 5,  label: "SENSOR",            disabled: true, vertical: true },
    { osb: 6,  label: "MAP",               disabled: true },
    { osb: 7,  label: "DCLTR",             disabled: true },
    { osb: 8,  label: `SCL/${saRange(s)}`, action: () => change(() => cycleSaScale(s)) },
    { osb: 9,  label: "MK1",               disabled: true },
    { osb: 10, label: "DCNTR",             action: () => change(() => toggleSaCenter(s)) },
    { osb: 11, label: "WYPT",              disabled: true, vertical: true },
    { osb: 12, label: "↑",                 disabled: true },
    { osb: 13, label: "↓",                 disabled: true },
    { osb: 14, label: "WPDSG",             disabled: true, vertical: true },
    { osb: 15, label: "SEQ1",              disabled: true, vertical: true },
    { osb: 16, label: "AUTO",              disabled: true },
    { osb: 17, label: "TXDSG",             disabled: true },
    { osb: 19, label: "STEP",              disabled: true },
    { osb: 20, label: "EXP",               disabled: true },
  ],
  drawDisplay: drawSa,
});

const atk = new MFD(document.getElementById("mfd-atk"), {
  title: "ATK RDR",
  priorityKey: 'atk',
  osbs: (s) => [
    { osb: 1,  label: "INTL",           disabled: true },
    { osb: 2,  label: "RDR PRI",        disabled: true, vertical: true },
    s.radar.mode === 'STT'
      ? { osb: 5, label: "RTS\nRWS", action: () => change(() => exitSTT(s)) }
      : { osb: 5, label: "RWS", disabled: true },
    { osb: 6,  label: `${bars(s)}B`,    action: () => change(() => cycleBars(s)) },
    { osb: 7,  label: "SIL",            disabled: true },
    { osb: 8,  label: "ERASE",          disabled: true },
    { osb: 11, label: "↑",              action: () => change(() => rangeUp(s)) },
    { osb: 12, label: "↓",              action: () => change(() => rangeDown(s)) },
    { osb: 13, label: "SET",            disabled: true, vertical: true },
    { osb: 14, label: "RSET",           disabled: true, vertical: true },
    { osb: 15, label: "NCTR",           disabled: true, vertical: true },
    { osb: 16, label: "DATA",           disabled: true },
    { osb: 17, label: "CHAN",           disabled: true },
    { osb: 19, label: `${azWidth(s)}°`, action: () => change(() => cycleAz(s)) },
    { osb: 20, label: "MODE",           disabled: true },
  ],
  drawDisplay: drawAtkRdr,
});

const scene = new Scene3D(document.getElementById("scene3d"));

function render() {
  azel.draw(state);
  sa.draw(state);
  atk.draw(state);
  scene.update(state);
}

function change(mutate) {
  mutate();
  pruneLS(state);
  pruneGlowTimes(state);
  render();
}

document.getElementById("assist-3d").addEventListener("change", (e) => {
  state.assists.show3dVolume = e.target.checked;
  render();
});
document.getElementById("assist-ltws").addEventListener("change", (e) => {
  state.assists.ltws = e.target.checked;
  render();
});

// Sync model with browser-restored checkbox state before first render.
state.assists.show3dVolume = document.getElementById("assist-3d").checked;
state.assists.ltws         = document.getElementById("assist-ltws").checked;

setupHotas(state, () => { pruneLS(state); pruneGlowTimes(state); render(); });
setupScs(state, () => { pruneLS(state); pruneGlowTimes(state); render(); });
render(); // initial paint

// Continuous animation loop: advance sweep and re-render every frame.
let lastTs = null;
function loop(ts) {
  const dt = lastTs == null ? 0 : (ts - lastTs) / 1000;
  lastTs = ts;
  tickSweep(state, Math.min(dt, 0.1)); // cap dt so a backgrounded tab doesn't jump
  pruneLS(state);
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
