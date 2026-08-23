/**
 * Background artefacts.
 *
 * The things a business analyst actually works with, drifting behind the page:
 * workstations, documents, and the delivery loop itself. Drawn as wireframe
 * blueprints rather than solid props, because at the opacity this layer runs
 * at a solid model turns into a grey smudge while an outline stays legible.
 *
 * This is atmosphere and it stays atmosphere. Everything sits out at the sides
 * and behind the reading column, the whole layer fades to a quarter once the
 * reader is past the masthead, and nothing here carries information that is
 * not also written in the page. If it ever competes with a line of text, the
 * text wins.
 *
 * Cost: geometry and materials are built once and shared across every copy,
 * so the whole set is a handful of small draw calls.
 */
import * as THREE from 'three';

const BLUE = 0x5590d8;
const VIOLET = 0x9085e9;
const PALE = 0x93a8c6;

/** Shared resources. Built once, reused by every artefact, disposed together. */
function makeKit() {
  const line = (color, opacity) => new THREE.LineBasicMaterial({
    color, transparent: true, opacity, depthWrite: false,
  });
  const fill = (color, opacity) => new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide,
  });

  const kit = {
    // Re-weighted when the theme gained ambient light: the room is brighter
    // now, so the same alpha read stronger against the text than it did
    // against a flat near-black page.
    mat: {
      edge: line(PALE, 0.115),
      edgeBlue: line(BLUE, 0.135),
      edgeViolet: line(VIOLET, 0.13),
      glass: fill(BLUE, 0.022),
      paper: fill(PALE, 0.014),
      node: fill(VIOLET, 0.11),
    },
    geo: {
      // A monitor: screen box, stand, and the plane that catches the glow.
      screen: new THREE.EdgesGeometry(new THREE.BoxGeometry(4.4, 2.9, 0.22)),
      screenFace: new THREE.PlaneGeometry(4.1, 2.6),
      stand: new THREE.EdgesGeometry(new THREE.BoxGeometry(1.5, 0.16, 0.9)),
      neck: new THREE.EdgesGeometry(new THREE.BoxGeometry(0.28, 0.8, 0.28)),
      // A document: page outline, the page itself, and lines of text on it.
      page: new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.4, 3.1)),
      pageFace: new THREE.PlaneGeometry(2.4, 3.1),
      // The delivery loop.
      ringNode: new THREE.OctahedronGeometry(0.26),
    },
  };

  // Text rows on a document, as one small line buffer.
  const rows = [];
  for (let i = 0; i < 6; i++) {
    const y = 1.05 - i * 0.36;
    const w = i === 0 ? 0.7 : 0.9 - (i % 3) * 0.16;
    rows.push(-1.0 * w, y, 0.01, 1.0 * w, y, 0.01);
  }
  kit.geo.pageText = new THREE.BufferGeometry();
  kit.geo.pageText.setAttribute('position', new THREE.Float32BufferAttribute(rows, 3));

  // The loop: a closed circle the six stage markers sit on.
  const ring = [];
  const R = 3.1;
  const SEG = 72;
  for (let i = 0; i < SEG; i++) {
    const a = (i / SEG) * Math.PI * 2;
    const b = ((i + 1) / SEG) * Math.PI * 2;
    ring.push(Math.cos(a) * R, Math.sin(a) * R, 0, Math.cos(b) * R, Math.sin(b) * R, 0);
  }
  kit.geo.ringPath = new THREE.BufferGeometry();
  kit.geo.ringPath.setAttribute('position', new THREE.Float32BufferAttribute(ring, 3));

  return kit;
}

function makeMonitor(kit) {
  const g = new THREE.Group();
  g.add(new THREE.LineSegments(kit.geo.screen, kit.mat.edgeBlue));
  g.add(new THREE.Mesh(kit.geo.screenFace, kit.mat.glass));
  const neck = new THREE.LineSegments(kit.geo.neck, kit.mat.edge);
  neck.position.y = -1.85;
  g.add(neck);
  const base = new THREE.LineSegments(kit.geo.stand, kit.mat.edge);
  base.position.y = -2.3;
  g.add(base);
  return g;
}

function makeDocument(kit) {
  const g = new THREE.Group();
  g.add(new THREE.LineSegments(kit.geo.page, kit.mat.edge));
  g.add(new THREE.Mesh(kit.geo.pageFace, kit.mat.paper));
  g.add(new THREE.LineSegments(kit.geo.pageText, kit.mat.edgeBlue));
  return g;
}

/**
 * The delivery loop: six markers on a closed path. Six because that is the
 * shape of the lifecycle the page already sets out in the Journey section
 * (requirements through to improvement) and it comes back around.
 */
function makeLoop(kit) {
  const g = new THREE.Group();
  g.add(new THREE.LineSegments(kit.geo.ringPath, kit.mat.edgeViolet));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const node = new THREE.Mesh(kit.geo.ringNode, kit.mat.node);
    node.position.set(Math.cos(a) * 3.1, Math.sin(a) * 3.1, 0);
    g.add(node);
  }
  return g;
}

/**
 * Place the set. Everything is pushed out past the reading column and spread
 * down the scroll, so an artefact drifts into view as the camera descends
 * rather than all of them sitting in the masthead.
 */
export function buildArtifacts({ small = false } = {}) {
  const kit = makeKit();
  const group = new THREE.Group();
  const items = [];

  // x is signed and pushed past the reading column; y walks down the scroll;
  // z is deep, so nothing sits in the reader's plane. The masthead band
  // (y above about -6) is left to the widest, furthest items only, because
  // that is the one place this layer runs at full opacity.
  const PLAN = small
    ? [
        ['monitor', -34, 6, -62], ['doc', 30, -10, -58], ['loop', -30, -26, -70],
        ['monitor', 33, -42, -60], ['doc', -31, -58, -66],
      ]
    : [
        ['monitor', -52, 12, -78], ['doc', 50, 6, -74],
        ['doc', 40, -10, -60], ['loop', -42, -14, -66],
        ['monitor', 44, -30, -58], ['doc', -46, -34, -70],
        ['monitor', -38, -50, -62], ['loop', 41, -56, -72],
        ['doc', 36, -70, -58], ['doc', -40, -76, -68],
      ];

  for (const [kind, x, y, z] of PLAN) {
    const node = kind === 'monitor' ? makeMonitor(kit)
      : kind === 'doc' ? makeDocument(kit)
      : makeLoop(kit);
    node.position.set(x, y, z);
    // Angled towards the reading column, so a monitor reads as a monitor
    // rather than as an edge-on rectangle.
    node.rotation.set(
      (Math.random() - 0.5) * 0.3,
      (x > 0 ? -0.5 : 0.5) + (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.14,
    );
    // Scaled up to hold apparent size against the extra distance.
    const scale = (kind === 'doc' ? 2.4 : 2.8) * (small ? 0.85 : 1);
    node.scale.setScalar(scale);
    group.add(node);
    items.push({
      node, kind,
      baseY: y,
      baseRotY: node.rotation.y,
      // Distinct rates, so the set never falls into visible lockstep.
      bob: 0.12 + Math.random() * 0.1,
      bobPhase: Math.random() * Math.PI * 2,
      turn: (Math.random() < 0.5 ? -1 : 1) * (0.02 + Math.random() * 0.03),
      spin: kind === 'loop' ? 0.06 + Math.random() * 0.04 : 0,
    });
  }

  return {
    group,
    /** Drift. Slow on purpose: this is behind text a reader is trying to read. */
    update(t) {
      for (const it of items) {
        it.node.position.y = it.baseY + Math.sin(t * it.bob + it.bobPhase) * 2.2;
        it.node.rotation.y = it.baseRotY + Math.sin(t * it.turn * 3) * 0.28;
        if (it.spin) it.node.rotation.z = t * it.spin;
      }
    },
    dispose() {
      Object.values(kit.geo).forEach((g) => g.dispose());
      Object.values(kit.mat).forEach((m) => m.dispose());
    },
  };
}
