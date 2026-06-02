// 3D view: ownship, contacts, and a live wireframe radar scan volume.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
  FT_PER_NMI,
  scanCenter,
  azWidth,
  barSpan,
  lsContact,
  isDetected,
} from "./model.js";

const GREEN = 0x33ff66;
const DIM = 0x1a6b33;
const CONTACT = 0xcccccc;
const FAR = 80; // cone draw length, scene units (1 unit = 1 nmi)

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

    this.coneGroup = new THREE.Group();
    this.scene.add(this.coneGroup);

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

  resize() {
    const r = this.canvas.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    this.renderer.setSize(r.width, r.height, false);
    this.camera.aspect = r.width / r.height;
    this.camera.updateProjectionMatrix();
  }

  update(state) {
    // Contacts.
    this.contactGroup.clear();
    const ls = lsContact(state);
    for (const c of state.contacts) {
      const horiz = c.rangeNmi;
      const az = (c.azDeg * Math.PI) / 180;
      const pos = new THREE.Vector3(
        Math.sin(az) * horiz,
        (c.altFt - state.ownship.altFt) / FT_PER_NMI,
        -Math.cos(az) * horiz,
      );
      const inside = isDetected(state, c);
      const geo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
      const mat = new THREE.MeshStandardMaterial({
        color: inside ? GREEN : CONTACT,
        emissive: inside ? GREEN : 0x000000,
        emissiveIntensity: inside ? 0.4 : 0,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      this.contactGroup.add(mesh);

      if (ls && c.id === ls.id) {
        const r = 4;
        const crossGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(-r, 0, 0), new THREE.Vector3(r, 0, 0),
          new THREE.Vector3(0, -r, 0), new THREE.Vector3(0, r, 0),
          new THREE.Vector3(0, 0, -r), new THREE.Vector3(0, 0, r),
        ]);
        const cross = new THREE.LineSegments(
          crossGeo,
          new THREE.LineBasicMaterial({ color: GREEN }),
        );
        cross.position.copy(pos);
        this.contactGroup.add(cross);
      }
    }

    this.buildCone(state);
  }

  buildCone(state) {
    this.coneGroup.clear();
    const azC = scanCenter(state);
    const elC = state.radar.elevDeg;
    const azH = azWidth(state) / 2;
    const elH = barSpan(state) / 2;

    // Build the az x el raster around forward (-Z), then rotate it to point along
    // the antenna boresight. The scan volume tilts as a rigid panel, so its far
    // rim stays on the 80 nmi sphere and curves down at the edges when tilted.
    const boresight = dir(azC, elC);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, -1),
      boresight,
    );
    const far = (a, e) => dir(a, e).applyQuaternion(q).multiplyScalar(FAR);

    // Edges from origin to the four corners.
    const pts = [];
    const O = new THREE.Vector3(0, 0, 0);
    for (const [a, e] of [
      [-azH, -elH],
      [azH, -elH],
      [azH, elH],
      [-azH, elH],
    ]) {
      pts.push(O.clone(), far(a, e));
    }

    // Curved far boundary: each point sits exactly FAR (80 nmi) from ownship,
    // so the cone reaches its full range across the whole arc, not just the corners.
    const ARC = 24;
    const boundary = [];
    const sweep = (a0, e0, a1, e1) => {
      for (let i = 0; i < ARC; i++) {
        const t = i / ARC;
        boundary.push(far(a0 + (a1 - a0) * t, e0 + (e1 - e0) * t));
      }
    };
    sweep(-azH, -elH, azH, -elH);
    sweep(azH, -elH, azH, elH);
    sweep(azH, elH, -azH, elH);
    sweep(-azH, elH, -azH, -elH);
    for (let i = 0; i < boundary.length; i++) {
      pts.push(boundary[i].clone(), boundary[(i + 1) % boundary.length].clone());
    }

    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ color: GREEN, transparent: true, opacity: 0.7 });
    this.coneGroup.add(new THREE.LineSegments(geo, mat));

    // Faint translucent far cap, triangulated over the az x el patch at radius FAR.
    const NA = 16;
    const NE = 6;
    const tri = [];
    const at = (ai, ei) =>
      far(-azH + (2 * azH * ai) / NA, -elH + (2 * elH * ei) / NE);
    for (let ai = 0; ai < NA; ai++) {
      for (let ei = 0; ei < NE; ei++) {
        const a = at(ai, ei);
        const b = at(ai + 1, ei);
        const c = at(ai + 1, ei + 1);
        const d = at(ai, ei + 1);
        tri.push(a, b, c, a, c, d);
      }
    }
    const capGeo = new THREE.BufferGeometry().setFromPoints(tri);
    const capMat = new THREE.MeshBasicMaterial({
      color: GREEN,
      transparent: true,
      opacity: 0.06,
      side: THREE.DoubleSide,
    });
    this.coneGroup.add(new THREE.Mesh(capGeo, capMat));
  }

  animate() {
    this.resize();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}
