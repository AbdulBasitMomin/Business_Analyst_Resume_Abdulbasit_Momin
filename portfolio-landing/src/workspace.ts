/**
 * The background scene: the things a business analyst actually works with,
 * drawn as wireframe blueprints rather than solid props.
 *
 * This replaces a hotlinked stock video. Everything here is geometry generated
 * at runtime -- there is no asset to licence, nothing to 404 when someone
 * else's CDN moves, and it weighs a fraction of the video it replaces.
 *
 * It is atmosphere and it stays atmosphere. The rig sits right of centre,
 * clear of the headline in the lower left and the meta grid along the top, and
 * every line runs at an alpha low enough that white body copy over it still
 * clears contrast. If it ever competes with a line of text, the text wins.
 *
 * Cost: geometry and materials are built once and shared across every copy, so
 * the whole scene is a few dozen small draw calls with no textures and no
 * lights -- every material is unlit, which is also why it reads as a blueprint.
 */
import * as THREE from 'three';

/** Shared resources. Built once, reused everywhere, disposed together. */
function makeKit() {
  const line = (opacity: number) =>
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity, depthWrite: false });
  const fill = (opacity: number) =>
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

  const mat = {
    edge: line(0.34),
    edgeSoft: line(0.15),
    edgeFaint: line(0.075),
    plot: line(0.62),
    glass: fill(0.028),
    paper: fill(0.016),
    bar: fill(0.2),
    key: fill(0.05),
  };

  const geo = {
    lid: new THREE.EdgesGeometry(new THREE.BoxGeometry(6.6, 4.1, 0.16)),
    screen: new THREE.PlaneGeometry(6.1, 3.6),
    base: new THREE.EdgesGeometry(new THREE.BoxGeometry(6.6, 0.22, 4.3)),
    trackpad: new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.7, 1.1)),
    keycap: new THREE.PlaneGeometry(0.36, 0.26),
    page: new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.3, 3.0)),
    pageFace: new THREE.PlaneGeometry(2.3, 3.0),
    node: new THREE.OctahedronGeometry(0.17),
    tile: new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.72, 0.6)),
    // Anchored at its foot so a bar grows upward from the axis when scaled.
    barUnit: (() => {
      const g = new THREE.PlaneGeometry(0.42, 1);
      g.translate(0, 0.5, 0);
      return g;
    })(),
  };

  // Lines of text on a requirements page, as one small buffer.
  const rows: number[] = [];
  for (let i = 0; i < 7; i++) {
    const y = 1.15 - i * 0.33;
    const w = i === 0 ? 0.62 : 0.92 - (i % 3) * 0.17;
    rows.push(-1.02 * w, y, 0.01, 1.02 * w, y, 0.01);
  }
  const pageText = new THREE.BufferGeometry();
  pageText.setAttribute('position', new THREE.Float32BufferAttribute(rows, 3));

  // The delivery loop the process nodes sit on.
  const ring: number[] = [];
  const R = 2.6;
  for (let i = 0; i < 84; i++) {
    const a = (i / 84) * Math.PI * 2;
    const b = ((i + 1) / 84) * Math.PI * 2;
    ring.push(Math.cos(a) * R, Math.sin(a) * R, 0, Math.cos(b) * R, Math.sin(b) * R, 0);
  }
  const ringPath = new THREE.BufferGeometry();
  ringPath.setAttribute('position', new THREE.Float32BufferAttribute(ring, 3));

  return { mat, geo: { ...geo, pageText, ringPath, ringRadius: R } };
}

type Kit = ReturnType<typeof makeKit>;

/** A laptop running a dashboard: the BA's actual instrument. */
function makeLaptop(kit: Kit) {
  const g = new THREE.Group();
  const { mat, geo } = kit;

  const base = new THREE.LineSegments(geo.base, mat.edge);
  base.position.y = -2.05;
  g.add(base);

  // Keys, as one instanced plane rather than 60 meshes.
  const keys = new THREE.InstancedMesh(geo.keycap, mat.key, 60);
  const m = new THREE.Matrix4();
  for (let r = 0, i = 0; r < 5; r++) {
    for (let c = 0; c < 12; c++, i++) {
      m.makeRotationX(-Math.PI / 2);
      m.setPosition(-2.5 + c * 0.45, -1.92, -0.9 + r * 0.42);
      keys.setMatrixAt(i, m);
    }
  }
  keys.instanceMatrix.needsUpdate = true;
  g.add(keys);

  const trackpad = new THREE.LineSegments(geo.trackpad, mat.edgeFaint);
  trackpad.rotation.x = -Math.PI / 2;
  trackpad.position.set(0, -1.92, 1.35);
  g.add(trackpad);

  // The lid, hinged back off vertical the way an open laptop actually sits.
  const lid = new THREE.Group();
  lid.position.set(0, -2.05, -2.1);
  lid.rotation.x = -0.19;
  g.add(lid);

  const shell = new THREE.LineSegments(geo.lid, mat.edge);
  shell.position.y = 2.05;
  lid.add(shell);

  const glass = new THREE.Mesh(geo.screen, mat.glass);
  glass.position.set(0, 2.05, 0.09);
  lid.add(glass);

  return { group: g, lid };
}

/** What is on the screen: a bar series, a trend line, and three KPI tiles. */
function makeDashboard(kit: Kit) {
  const g = new THREE.Group();
  const { mat, geo } = kit;
  g.position.set(0, 2.05, 0.11);

  const tiles: THREE.LineSegments[] = [];
  for (let i = 0; i < 3; i++) {
    const t = new THREE.LineSegments(geo.tile, mat.edgeSoft);
    t.position.set(-1.86 + i * 1.86, 1.28, 0);
    g.add(t);
    tiles.push(t);
  }

  // Bar series. Heights animate; the axis they stand on does not.
  const BARS = 9;
  const bars: THREE.Mesh[] = [];
  for (let i = 0; i < BARS; i++) {
    const b = new THREE.Mesh(geo.barUnit, mat.bar);
    b.position.set(-2.4 + i * 0.6, -0.42, 0);
    b.scale.y = 0.5;
    g.add(b);
    bars.push(b);
  }

  const axis = new THREE.BufferGeometry();
  axis.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([-2.75, -0.42, 0, 2.75, -0.42, 0], 3),
  );
  g.add(new THREE.LineSegments(axis, mat.edgeSoft));

  // Trend line over the bars, redrawn every frame.
  const POINTS = 40;
  const trendPos = new Float32Array(POINTS * 3);
  const trend = new THREE.BufferGeometry();
  trend.setAttribute('position', new THREE.BufferAttribute(trendPos, 3));
  g.add(new THREE.Line(trend, mat.plot));

  return { group: g, bars, tiles, trend, trendPos, POINTS, axisGeo: axis };
}

/** Requirements documents, drifting. */
function makePages(kit: Kit) {
  const { mat, geo } = kit;
  const specs = [
    { p: [-5.6, 1.2, -3.2], r: [0.1, 0.5, -0.09], s: 0.85 },
    { p: [5.9, -0.2, -3.0], r: [-0.06, -0.5, 0.11], s: 0.8 },
    { p: [4.2, -1.6, -5.4], r: [0.13, -0.36, -0.15], s: 0.62 },
  ];
  return specs.map(({ p, r, s }) => {
    const g = new THREE.Group();
    g.position.set(p[0], p[1], p[2]);
    g.rotation.set(r[0], r[1], r[2]);
    g.scale.setScalar(s);
    g.add(new THREE.LineSegments(geo.page, mat.edgeSoft));
    g.add(new THREE.Mesh(geo.pageFace, mat.paper));
    g.add(new THREE.LineSegments(geo.pageText, mat.edgeFaint));
    return g;
  });
}

/** The delivery loop, with a marker running the circuit. */
function makeFlow(kit: Kit) {
  const { mat, geo } = kit;
  const g = new THREE.Group();
  // Set well behind the laptop rather than out to one side. Every side of the
  // frame is claimed by copy; the depth behind the hero object is the only
  // space in the composition that is genuinely free.
  g.position.set(-0.9, 1.3, -9.5);
  g.rotation.set(0.3, 0.62, 0.12);
  g.scale.setScalar(0.82);
  g.add(new THREE.LineSegments(geo.ringPath, mat.edgeFaint));

  // Five stages: elicit, analyse, specify, validate, optimise.
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const n = new THREE.Mesh(geo.node, mat.bar);
    n.position.set(Math.cos(a) * geo.ringRadius, Math.sin(a) * geo.ringRadius, 0);
    g.add(n);
  }

  const marker = new THREE.Mesh(geo.node, kit.mat.plot as unknown as THREE.Material);
  marker.scale.setScalar(0.7);
  g.add(marker);

  return { group: g, marker, radius: geo.ringRadius };
}

export interface Workspace {
  resize(w: number, h: number): void;
  frame(t: number): void;
  point(x: number, y: number): void;
  dispose(): void;
}

/**
 * Builds the scene against an existing canvas. Returns null when WebGL is
 * unavailable, so the caller can simply leave the background black rather than
 * handling an exception -- the page reads perfectly well without this layer.
 */
export function createWorkspace(canvas: HTMLCanvasElement): Workspace | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return null;
  }
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0.4, 15.5);

  const kit = makeKit();

  // rig carries the parallax; drift carries the idle motion. Keeping them
  // separate means pointer movement never fights the animation.
  const rig = new THREE.Group();
  const drift = new THREE.Group();
  rig.add(drift);
  scene.add(rig);

  const laptop = makeLaptop(kit);
  const dash = makeDashboard(kit);
  laptop.lid.add(dash.group);
  drift.add(laptop.group);

  const pages = makePages(kit);
  pages.forEach((p) => drift.add(p));

  const flow = makeFlow(kit);
  drift.add(flow.group);

  const target = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };

  function resize(w: number, h: number) {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();

    // Below lg the composition stacks and the copy claims the full width, so
    // the rig pulls back and centres rather than sitting under the headline.
    // Right of centre on wide screens, clear of the headline; centred and
    // pulled back below lg, where the copy claims the full width.
    const wide = w >= 1024;
    rig.position.x = wide ? 2.9 : 0;
    // Below lg there is no side to sit on -- the copy claims the full width --
    // so the rig drops into the one gap the stacked layout leaves, between the
    // meta grid and the headline, and shrinks to stay inside it.
    rig.position.y = wide ? 0.72 : -0.25;
    const fit = Math.min(1, w / 1600);
    rig.scale.setScalar(wide ? 0.62 + fit * 0.16 : 0.42);
  }

  function frame(t: number) {
    // Bars breathe on their own phases so the series never pulses in unison.
    for (let i = 0; i < dash.bars.length; i++) {
      const a = 0.55 + 0.42 * Math.sin(t * 0.7 + i * 0.85);
      const b = 0.2 * Math.sin(t * 0.31 + i * 1.9);
      dash.bars[i].scale.y = Math.max(0.08, a + b);
    }

    for (let i = 0; i < dash.POINTS; i++) {
      const x = -2.6 + (i / (dash.POINTS - 1)) * 5.2;
      const y = 0.62 + 0.3 * Math.sin(i * 0.34 + t * 1.1) + 0.14 * Math.sin(i * 0.9 - t * 0.6);
      dash.trendPos[i * 3] = x;
      dash.trendPos[i * 3 + 1] = y;
      dash.trendPos[i * 3 + 2] = 0;
    }
    dash.trend.attributes.position.needsUpdate = true;

    const a = t * 0.42;
    flow.marker.position.set(Math.cos(a) * flow.radius, Math.sin(a) * flow.radius, 0);

    pages.forEach((p, i) => {
      p.position.y += Math.sin(t * 0.5 + i * 2.1) * 0.0016;
      p.rotation.z += Math.sin(t * 0.32 + i) * 0.00035;
    });

    drift.rotation.y = Math.sin(t * 0.17) * 0.16;
    drift.rotation.x = Math.sin(t * 0.13) * 0.055;
    drift.position.y = Math.sin(t * 0.24) * 0.16;

    eased.x += (target.x - eased.x) * 0.045;
    eased.y += (target.y - eased.y) * 0.045;
    rig.rotation.y = eased.x * 0.2;
    rig.rotation.x = eased.y * 0.13;

    renderer.render(scene, camera);
  }

  function point(x: number, y: number) {
    target.x = x;
    target.y = y;
  }

  function dispose() {
    Object.values(kit.mat).forEach((m) => m.dispose());
    Object.values(kit.geo).forEach((g) => {
      if (g instanceof THREE.BufferGeometry) g.dispose();
    });
    dash.trend.dispose();
    dash.axisGeo.dispose();
    renderer.dispose();
  }

  return { resize, frame, point, dispose };
}
