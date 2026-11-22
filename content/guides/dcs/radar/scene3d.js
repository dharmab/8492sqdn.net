// 3D view: ownship, contacts, and a live wireframe radar scan volume.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  FT_PER_NMI,
  BAR_DEG,
  SWEEP_BEAM_AZ_DEG,
  scanCenter,
  azWidth,
  barSpan,
  lsContact,
  isDetected,
  sweepBarCenterEl,
  sweepGlow,
  hasBeenSwept,
} from "./model.js";

const GREEN = 0x33ff66;
const DIM = 0x1a6b33;
const CONTACT = 0xcccccc;
const FAR = 80; // cone draw length, scene units (1 unit = 1 nmi)

const ARC = 24;
const NA = 16;
const NE = 6;
// Fixed point counts for pre-allocated cone geometry buffers:
//   Wireframe: 4 edge pairs (O→corner) + 4*ARC boundary segment pairs
const WIRE_PTS = 4 * 2 + 4 * ARC * 2; // 200
//   Cap: NA*NE quads × 2 triangles × 3 vertices
const CAP_PTS = NA * NE * 6; // 576

// Unit direction from azimuth/elevation in the ownship frame.
// forward = -Z, right = +X, up = +Y.
function dir(azDeg, elDeg) {
  const az = (azDeg * Math.PI) / 180;
  const el = (elDeg * Math.PI) / 180;
  return new THREE.Vector3(
    Math.sin(az) * Math.cos(el),
    Math.sin(el),
    -Math.cos(az) * Math.cos(el),
  );
}

// Point on the scan-volume cylinder (vertical axis, radius FAR) tilted around the
// X axis by tiltDeg (the antenna elevation setting).  az is world-space azimuth;
// elRel is elevation relative to the tilt center, mapping to height via FAR·tan(elRel).
function cylPt(azDeg, elRelDeg, tiltDeg) {
  const az  = azDeg    * Math.PI / 180;
  const el  = elRelDeg * Math.PI / 180;
  const til = tiltDeg  * Math.PI / 180;
  const cx =  FAR * Math.sin(az);
  const cy =  FAR * Math.tan(el);
  const cz = -FAR * Math.cos(az);
  return new THREE.Vector3(
    cx,
    cy * Math.cos(til) - cz * Math.sin(til),
    cy * Math.sin(til) + cz * Math.cos(til),
  );
}

export class Scene3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio || 1);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x05080a);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
    this.camera.position.set(0, 30, 70);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.enableZoom = false;
    this.controls.target.set(0, 0, -25);

    this.scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dl = new THREE.DirectionalLight(0xffffff, 0.6);
    dl.position.set(20, 40, 20);
    this.scene.add(dl);

    // Horizon reference grid at ownship altitude.
    const grid = new THREE.GridHelper(300, 30, DIM, 0x0c1c12);
    grid.material.opacity = 0.4;
    grid.material.transparent = true;
    this.scene.add(grid);

    this.buildOwnship();

    this.contactGroup = new THREE.Group();
    this.scene.add(this.contactGroup);
    this._contactPool = null; // lazily initialized on first update()

    this.coneGroup = new THREE.Group();
    this.scene.add(this.coneGroup);
    this._initCone(); // main cone + sweep sub-cone

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  buildOwnship() {
    // Simple dart: a cone pointing forward (-Z).
    const geo = new THREE.ConeGeometry(2, 8, 4);
    geo.rotateX(-Math.PI / 2); // point along -Z
    const mat = new THREE.MeshStandardMaterial({ color: 0x88aaff, flatShading: true });
    this.scene.add(new THREE.Mesh(geo, mat));
  }

  // Pre-allocate cone geometry with fixed-size buffers so buildCone() can
  // write positions in-place without touching the GPU allocator each frame.
  _initCone() {
    const wireGeo = new THREE.BufferGeometry();
    wireGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(WIRE_PTS * 3), 3),
    );
    this._coneLines = new THREE.LineSegments(
      wireGeo,
      new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: 0.7 }),
    );
    this.coneGroup.add(this._coneLines);

    const capGeo = new THREE.BufferGeometry();
    capGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(CAP_PTS * 3), 3),
    );
    this._coneCap = new THREE.Mesh(
      capGeo,
      new THREE.MeshBasicMaterial({
        color: GREEN,
        transparent: true,
        opacity: 0.06,
        side: THREE.DoubleSide,
        depthWrite: false, // don't occlude geometry behind a semi-transparent face
      }),
    );
    this.coneGroup.add(this._coneCap);

    // Sweep sub-cone: narrower wireframe that moves through the full cone volume.
    const sweepGeo = new THREE.BufferGeometry();
    sweepGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(WIRE_PTS * 3), 3),
    );
    this._sweepLines = new THREE.LineSegments(
      sweepGeo,
      new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: 1.0 }),
    );
    this.coneGroup.add(this._sweepLines);
  }

  // Create one mesh per contact (contacts never move) and one shared L&S cross.
  // Called once on the first update(); each contact gets its own material so
  // emissive intensity can be varied independently for sweep glow.
  _initContactPool(state) {
    const geo = new THREE.ConeGeometry(1.5, 5, 3);
    geo.rotateX(-Math.PI / 2); // tip points along -Z (forward)

    this._contactPool = state.contacts.map(c => {
      const az = (c.azDeg * Math.PI) / 180;
      const mat = new THREE.MeshStandardMaterial({
        color: CONTACT, emissive: 0x000000, emissiveIntensity: 0, flatShading: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(
        Math.sin(az) * c.rangeNmi,
        (c.altFt - state.ownship.altFt) / FT_PER_NMI,
        -Math.cos(az) * c.rangeNmi,
      );
      mesh.rotation.y = ((c.headingDeg - state.ownship.headingDeg) * Math.PI) / 180;
      this.contactGroup.add(mesh);
      return { id: c.id, mesh, mat };
    });

    const r = 4;
    const crossGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-r, 0, 0), new THREE.Vector3(r, 0, 0),
      new THREE.Vector3(0, -r, 0), new THREE.Vector3(0, r, 0),
      new THREE.Vector3(0, 0, -r), new THREE.Vector3(0, 0, r),
    ]);
    this._lsCross = new THREE.LineSegments(
      crossGeo,
      new THREE.LineBasicMaterial({ color: GREEN }),
    );
    this._lsCross.visible = false;
    this.contactGroup.add(this._lsCross);
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    this.renderer.setSize(r.width, r.height, false);
    this.camera.aspect = r.width / r.height;
    this.camera.updateProjectionMatrix();
  }

  update(state) {
    if (!this._contactPool) this._initContactPool(state);

    const showVolume = state.assists.show3dVolume;
    this.coneGroup.visible = showVolume;

    // Contacts don't move; update each contact's individual material so glow
    // intensity can vary per-contact as the sweep beam passes over them.
    const ls = lsContact(state);
    for (const entry of this._contactPool) {
      const c = state.contacts.find(c => c.id === entry.id);
      const detected = showVolume && isDetected(state, c) && hasBeenSwept(state, c);
      const glow = sweepGlow(state, c.id);
      if (detected) {
        entry.mat.color.setHex(GREEN);
        entry.mat.emissive.setHex(GREEN);
        entry.mat.emissiveIntensity = 0.4 + glow * 1.6; // 0.4 baseline → 2.0 peak
      } else {
        entry.mat.color.setHex(CONTACT);
        entry.mat.emissive.setHex(0x000000);
        entry.mat.emissiveIntensity = 0;
      }
    }

    if (ls) {
      const entry = this._contactPool.find(e => e.id === ls.id);
      this._lsCross.position.copy(entry.mesh.position);
      this._lsCross.visible = true;
    } else {
      this._lsCross.visible = false;
    }

    this.buildCone(state);
    this.buildSweepCone(state);
  }

  buildCone(state) {
    const azC = scanCenter(state);
    const elC = state.radar.elevDeg;
    const azH = azWidth(state) / 2;
    const elH = barSpan(state) / 2;
    const pt = (az, elRel) => cylPt(az, elRel, elC);

    const wireArr = this._coneLines.geometry.attributes.position.array;
    let wi = 0;
    const wv = v => { wireArr[wi++] = v.x; wireArr[wi++] = v.y; wireArr[wi++] = v.z; };
    const O = new THREE.Vector3(0, 0, 0);
    for (const [a, e] of [[azC-azH,-elH],[azC+azH,-elH],[azC+azH,elH],[azC-azH,elH]]) {
      wv(O); wv(pt(a, e));
    }
    const boundary = [];
    const arc = (az0, el0, az1, el1) => {
      for (let i = 0; i < ARC; i++) {
        const t = i / ARC;
        boundary.push(pt(az0 + (az1 - az0) * t, el0 + (el1 - el0) * t));
      }
    };
    arc(azC-azH, -elH, azC+azH, -elH);
    arc(azC+azH, -elH, azC+azH,  elH);
    arc(azC+azH,  elH, azC-azH,  elH);
    arc(azC-azH,  elH, azC-azH, -elH);
    for (let i = 0; i < boundary.length; i++) {
      wv(boundary[i]); wv(boundary[(i + 1) % boundary.length]);
    }
    this._coneLines.geometry.attributes.position.needsUpdate = true;

    const capArr = this._coneCap.geometry.attributes.position.array;
    let ci = 0;
    const cv = v => { capArr[ci++] = v.x; capArr[ci++] = v.y; capArr[ci++] = v.z; };
    const at = (ai, ei) => pt(azC - azH + (2 * azH * ai) / NA, -elH + (2 * elH * ei) / NE);
    for (let ai = 0; ai < NA; ai++) {
      for (let ei = 0; ei < NE; ei++) {
        const a = at(ai, ei), b = at(ai + 1, ei), c = at(ai + 1, ei + 1), d = at(ai, ei + 1);
        cv(a); cv(b); cv(c);
        cv(a); cv(c); cv(d);
      }
    }
    this._coneCap.geometry.attributes.position.needsUpdate = true;
  }

  buildSweepCone(state) {
    const fullAzLo = scanCenter(state) - azWidth(state) / 2;
    const fullAzHi = scanCenter(state) + azWidth(state) / 2;
    const beamAzLo = Math.max(fullAzLo, state.sweep.azDeg - SWEEP_BEAM_AZ_DEG / 2);
    const beamAzHi = Math.min(fullAzHi, state.sweep.azDeg + SWEEP_BEAM_AZ_DEG / 2);

    const elC = state.radar.elevDeg;
    const fullElLo = elC - barSpan(state) / 2;
    const fullElHi = elC + barSpan(state) / 2;
    const elCbar = sweepBarCenterEl(state, state.sweep.barIdx);
    const beamElLo = Math.max(fullElLo, elCbar - BAR_DEG / 2);
    const beamElHi = Math.min(fullElHi, elCbar + BAR_DEG / 2);
    // Convert absolute elevations to relative (cylinder is centered on elC).
    const elLoRel = beamElLo - elC;
    const elHiRel = beamElHi - elC;

    const pt = (az, elRel) => cylPt(az, elRel, elC);

    const wireArr = this._sweepLines.geometry.attributes.position.array;
    let wi = 0;
    const wv = v => { wireArr[wi++] = v.x; wireArr[wi++] = v.y; wireArr[wi++] = v.z; };
    const O = new THREE.Vector3(0, 0, 0);
    for (const [a, e] of [[beamAzLo,elLoRel],[beamAzHi,elLoRel],[beamAzHi,elHiRel],[beamAzLo,elHiRel]]) {
      wv(O); wv(pt(a, e));
    }
    const boundary = [];
    const arc = (az0, el0, az1, el1) => {
      for (let i = 0; i < ARC; i++) {
        const t = i / ARC;
        boundary.push(pt(az0 + (az1 - az0) * t, el0 + (el1 - el0) * t));
      }
    };
    arc(beamAzLo, elLoRel, beamAzHi, elLoRel);
    arc(beamAzHi, elLoRel, beamAzHi, elHiRel);
    arc(beamAzHi, elHiRel, beamAzLo, elHiRel);
    arc(beamAzLo, elHiRel, beamAzLo, elLoRel);
    for (let i = 0; i < boundary.length; i++) {
      wv(boundary[i]); wv(boundary[(i + 1) % boundary.length]);
    }
    this._sweepLines.geometry.attributes.position.needsUpdate = true;
  }

  animate() {
    this.resize();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}
