import {
  createState,
  azWidth,
  displayRange,
  saRange,
  cycleAz,
  cycleBars,
  rangeUp,
  rangeDown,
  saRangeUp,
  saRangeDown,
  toggleDeclutter,
  lsContact,
  BARS_OPTIONS,
} from "./model.js";
import { MFD, drawAtkRdr, drawAzEl, drawSa } from "./mfd.js";
import { Scene3D } from "./scene3d.js";
import { setupHotas } from "./hotas.js";

const state = createState();

function bars(state) {
  return BARS_OPTIONS[state.radar.barsIndex];
}

const azel = new MFD(document.getElementById("mfd-azel"), {
  title: "AZ/EL",
  osbs: (s) => [
    { osb: 5, label: `${bars(s)}B`, action: () => change(() => cycleBars(s)) },
  ],
  drawDisplay: drawAzEl,
});

const sa = new MFD(document.getElementById("mfd-sa"), {
  title: "SA",
  osbs: (s) => [
    { osb: 15, label: "RNG↑", action: () => change(() => saRangeUp(s)) },
    { osb: 18, label: "RNG↓", action: () => change(() => saRangeDown(s)) },
  ],
  drawDisplay: drawSa,
});

const atk = new MFD(document.getElementById("mfd-atk"), {
  title: "ATK RDR",
  osbs: (s) => [
    { osb: 7,  label: "DCLT", active: s.radar.declutter, action: () => change(() => toggleDeclutter(s)) },
    { osb: 10, label: "AACQ", disabled: true },
    { osb: 11, label: "RNG↑", action: () => change(() => rangeUp(s)) },
    { osb: 12, label: "RNG↓", action: () => change(() => rangeDown(s)) },
    { osb: 13, label: "FRNG", disabled: true },
    { osb: 15, label: "RAID", disabled: true },
    { osb: 4,  label: `AZ${azWidth(s)}`, action: () => change(() => cycleAz(s)) },
    { osb: 5,  label: `${bars(s)}B`, action: () => change(() => cycleBars(s)) },
  ],
  drawDisplay: drawAtkRdr,
});

const scene = new Scene3D(document.getElementById("scene3d"));

function render() {
  azel.draw(state);
  sa.draw(state);
  atk.draw(state);
  scene.update(state);
  updateStatus();
}

function change(mutate) {
  mutate();
  render();
}

function updateStatus() {
  const ls = lsContact(state);
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent =
    `AZ ${azWidth(state)}°   ${bars(state)}BAR   ` +
    `RNG ${displayRange(state)} nmi   SA ${saRange(state)} nmi   ` +
    `ELEV ${state.radar.elevDeg >= 0 ? "+" : ""}${Math.round(state.radar.elevDeg)}°   ` +
    `L&S ${ls ? "DESIGNATED" : "—"}`;
}

setupHotas(state, render);
render();
