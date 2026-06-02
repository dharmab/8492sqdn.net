// Internal model for the radar teaching tool.
// A snapshot in time: contacts do not move. State resets on page reload.

export const OWN_ALT_FT = 20000;
export const OWN_SPEED_KT = 350;
export const FT_PER_NMI = 6076.12;

export const AZ_OPTIONS = [20, 40, 60, 80, 140]; // total cone width, degrees
export const BARS_OPTIONS = [1, 2, 4, 6];
export const RANGE_OPTIONS = [5, 10, 20, 40, 80, 160]; // nmi
export const BAR_DEG = 3.75; // elevation degrees covered per bar (4B = 15° total, ±7.5°)
export const ELEV_LIMIT_DEG = 30; // max antenna tilt up/down
export const SCOPE_AZ_DEG = 70; // B-scope shows +/- this azimuth (fits the 140° max option)
export const MAX_DETECT_NMI = 80; // Hornet radar detection ceiling; contacts beyond this never paint

const N_HOSTILE = 2;
const N_FRIENDLY = 2;

function rand(min, max) {
  return min + Math.random() * (max - min);
}

function makeContact(id, hostile) {
  const rangeNmi = rand(8, MAX_DETECT_NMI - 2);
  const alt = rand(2000, 35000);
  return {
    id,
    hostile,
    azDeg: rand(-SCOPE_AZ_DEG + 5, SCOPE_AZ_DEG - 5), // bearing from nose, + right
    rangeNmi,
    altFt: alt,
    speedKt: rand(300, 600),
    headingDeg: rand(0, 360),
  };
}

export function createState() {
  const contacts = [];
  let id = 0;
  for (let i = 0; i < N_HOSTILE; i++) contacts.push(makeContact(id++, true));
  for (let i = 0; i < N_FRIENDLY; i++) contacts.push(makeContact(id++, false));

  // Default the SA scale to the smallest step that contains every contact, so
  // the SA page always shows the full picture as an overview/reference.
  const maxRange = Math.max(...contacts.map((c) => c.rangeNmi));
  let saIdx = RANGE_OPTIONS.findIndex((r) => r >= maxRange);
  if (saIdx === -1) saIdx = RANGE_OPTIONS.length - 1;

  return {
    ownship: {
      altFt: OWN_ALT_FT,
      speedKt: OWN_SPEED_KT,
      headingDeg: Math.floor(rand(0, 360)),
    },
    contacts,
    radar: {
      azIndex: AZ_OPTIONS.indexOf(140),
      scanCenterDeg: 0, // cone center azimuth; only slewed on TDC depress
      elevDeg: 0, // antenna tilt center
      barsIndex: BARS_OPTIONS.indexOf(4),
      rangeIndex: RANGE_OPTIONS.indexOf(40),
      declutter: false,
    },
    saRangeIndex: saIdx,
    // Cursor in normalized ATK RDR display coords: x 0..1 (left..right), y 0..1 (near..far)
    cursor: { x: 0.5, y: 0.5 },
    azBump: { edge: null, time: 0 }, // azimuth bump gesture state
    rangeBump: { edge: null, time: 0 }, // range bump gesture state
    tdcDepressed: false,
    lsId: null, // Launch & Steer designated contact
  };
}

// --- Derived radar geometry ---

export function azWidth(state) {
  return AZ_OPTIONS[state.radar.azIndex];
}

export function barSpan(state) {
  return BARS_OPTIONS[state.radar.barsIndex] * BAR_DEG;
}

export function displayRange(state) {
  return RANGE_OPTIONS[state.radar.rangeIndex];
}

export function saRange(state) {
  return RANGE_OPTIONS[state.saRangeIndex];
}

// Explicit cone center, clamped so the cone stays within the gimbal.
export function scanCenter(state) {
  const w = azWidth(state);
  if (w >= 180) return 0;
  const limit = SCOPE_AZ_DEG - w / 2;
  return Math.max(-limit, Math.min(limit, state.radar.scanCenterDeg));
}

export function azBounds(state) {
  const c = scanCenter(state);
  const w = azWidth(state);
  return { lo: c - w / 2, hi: c + w / 2 };
}

export function elBounds(state) {
  const s = barSpan(state);
  return { lo: state.radar.elevDeg - s / 2, hi: state.radar.elevDeg + s / 2 };
}

// Cursor mapped to azimuth degrees across the fixed scope width.
export function cursorAz(state) {
  return -SCOPE_AZ_DEG + state.cursor.x * 2 * SCOPE_AZ_DEG;
}

// Cursor mapped to range in nmi.
export function cursorRange(state) {
  return state.cursor.y * displayRange(state);
}

// Elevation angle (deg) of a contact relative to ownship horizontal.
export function contactElevation(state, contact) {
  const dAlt = contact.altFt - state.ownship.altFt;
  const horiz = contact.rangeNmi * FT_PER_NMI;
  return (Math.atan2(dAlt, horiz) * 180) / Math.PI;
}

export function inAzCone(state, contact) {
  const { lo, hi } = azBounds(state);
  return contact.azDeg >= lo && contact.azDeg <= hi;
}

export function inElCone(state, contact) {
  const { lo, hi } = elBounds(state);
  const el = contactElevation(state, contact);
  return el >= lo && el <= hi;
}

// A contact is within the scanned az x el volume.
export function inScanVolume(state, contact) {
  return inAzCone(state, contact) && inElCone(state, contact);
}

// A contact paints when it's in the scan volume and within radar detection range.
export function isDetected(state, contact) {
  return inScanVolume(state, contact) && contact.rangeNmi <= MAX_DETECT_NMI;
}

// Altitude (ft) of the top/bottom of the scan cone at a given range.
export function coneAltitudesAt(state, rangeNmi) {
  const { lo, hi } = elBounds(state);
  const horiz = rangeNmi * FT_PER_NMI;
  return {
    bottomFt: state.ownship.altFt + Math.tan((lo * Math.PI) / 180) * horiz,
    topFt: state.ownship.altFt + Math.tan((hi * Math.PI) / 180) * horiz,
  };
}

// --- Mutations ---

export function cycleAz(state) {
  state.radar.azIndex = (state.radar.azIndex + 1) % AZ_OPTIONS.length;
}

export function cycleBars(state) {
  state.radar.barsIndex = (state.radar.barsIndex + 1) % BARS_OPTIONS.length;
}

export function rangeUp(state) {
  if (state.radar.rangeIndex < RANGE_OPTIONS.length - 1) state.radar.rangeIndex++;
}

export function rangeDown(state) {
  if (state.radar.rangeIndex > 0) state.radar.rangeIndex--;
}

export function saRangeUp(state) {
  if (state.saRangeIndex < RANGE_OPTIONS.length - 1) state.saRangeIndex++;
}

export function saRangeDown(state) {
  if (state.saRangeIndex > 0) state.saRangeIndex--;
}

// Slew antenna elevation by a (possibly fractional) delta, clamped to the gimbal.
export function slewElev(state, deltaDeg) {
  state.radar.elevDeg = Math.max(
    -ELEV_LIMIT_DEG,
    Math.min(ELEV_LIMIT_DEG, state.radar.elevDeg + deltaDeg),
  );
}

export function toggleDeclutter(state) {
  state.radar.declutter = !state.radar.declutter;
}

// Move the cursor by a normalized delta.
// Azimuth bumping: push TDC into a horizontal edge, then reverse within 1s to
// step the azimuth scan width down (left edge) or up (right edge).
// Range bumping: push TDC into a vertical edge, then reverse within 1s to
// step the display range up (top edge) or down (bottom edge).
export function slewCursor(state, dx, dy) {
  const prevX = state.cursor.x;
  const prevY = state.cursor.y;

  if (prevX > 0 && prevX + dx <= 0) {
    state.azBump = { edge: 'left', time: Date.now() };
  } else if (prevX < 1 && prevX + dx >= 1) {
    state.azBump = { edge: 'right', time: Date.now() };
  }

  if (prevY < 1 && prevY + dy >= 1) {
    state.rangeBump = { edge: 'top', time: Date.now() };
  } else if (prevY > 0 && prevY + dy <= 0) {
    state.rangeBump = { edge: 'bottom', time: Date.now() };
  }

  state.cursor.x = Math.max(0, Math.min(1, prevX + dx));

  const azElapsed = Date.now() - state.azBump.time;
  if (azElapsed > 1000) {
    state.azBump = { edge: null, time: 0 };
  } else if (state.azBump.edge === 'left' && dx > 0) {
    state.radar.azIndex = (state.radar.azIndex - 1 + AZ_OPTIONS.length) % AZ_OPTIONS.length;
    state.azBump = { edge: null, time: 0 };
  } else if (state.azBump.edge === 'right' && dx < 0) {
    state.radar.azIndex = (state.radar.azIndex + 1) % AZ_OPTIONS.length;
    state.azBump = { edge: null, time: 0 };
  }

  const rangeElapsed = Date.now() - state.rangeBump.time;
  if (rangeElapsed > 1000) {
    state.rangeBump = { edge: null, time: 0 };
  } else if (state.rangeBump.edge === 'top' && dy < 0) {
    rangeUp(state);
    state.rangeBump = { edge: null, time: 0 };
  } else if (state.rangeBump.edge === 'bottom' && dy > 0) {
    rangeDown(state);
    state.rangeBump = { edge: null, time: 0 };
  }

  state.cursor.y = Math.max(0, Math.min(1, prevY + dy));
}

// TDC depress: over a contact, designate it as the Launch & Steer target.
// Over empty space, slew the cone center to the cursor azimuth.
export function tdcDepress(state) {
  const target = contactUnderCursor(state);
  if (target) {
    state.lsId = target.id;
    return;
  }
  const w = azWidth(state);
  if (w >= 180) {
    state.radar.scanCenterDeg = 0;
  } else {
    const limit = SCOPE_AZ_DEG - w / 2;
    state.radar.scanCenterDeg = Math.max(-limit, Math.min(limit, cursorAz(state)));
  }
}

// Step the L&S designation to the next contact in the radar cone (Undesignate
// button). Candidates need not be on screen; the display range is bumped up if
// the next contact lies beyond the current range so it becomes visible.
export function stepLS(state) {
  const detected = state.contacts
    .filter((c) => isDetected(state, c))
    .sort((a, b) => a.rangeNmi - b.rangeNmi);
  if (detected.length === 0) return;
  let idx = state.lsId !== null ? detected.findIndex((c) => c.id === state.lsId) : -1;
  const next = detected[(idx + 1) % detected.length];
  state.lsId = next.id;
  while (
    next.rangeNmi > displayRange(state) &&
    state.radar.rangeIndex < RANGE_OPTIONS.length - 1
  ) {
    state.radar.rangeIndex++;
  }
  state.cursor.x = (next.azDeg + SCOPE_AZ_DEG) / (2 * SCOPE_AZ_DEG);
  state.cursor.y = next.rangeNmi / displayRange(state);
}

// Find the detected contact nearest the cursor, within a small pick radius.
export function contactUnderCursor(state) {
  const range = displayRange(state);
  let best = null;
  let bestD = Infinity;
  for (const c of state.contacts) {
    if (!isDetected(state, c) || c.rangeNmi > range) continue;
    const cx = (c.azDeg + SCOPE_AZ_DEG) / (2 * SCOPE_AZ_DEG);
    const cy = c.rangeNmi / range;
    const d = Math.hypot(cx - state.cursor.x, cy - state.cursor.y);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  return bestD <= 0.06 ? best : null;
}

export function lsContact(state) {
  if (state.lsId === null) return null;
  return state.contacts.find((c) => c.id === state.lsId) || null;
}
