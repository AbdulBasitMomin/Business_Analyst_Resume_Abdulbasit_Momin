/**
 * The traceability matrix, in three dimensions.
 *
 * This is the one piece of 3D on the page that is not atmosphere. It draws
 * the real matrix: on the left, the twelve achievement bullets from the
 * resume, clustered by employer; on the right, the capabilities, arranged by
 * category; between them, an edge for every link that buildTrace() could
 * actually derive. Nothing is placed here that is not already in the resume,
 * and a capability with no supporting bullet is drawn floating and unlinked,
 * because that gap is true and worth seeing.
 *
 * Architecture follows the layered-separation pattern: the 3D layer owns the
 * scene and the render loop, the DOM owns every label and all the text, and
 * the two are joined by a small state bridge (select/hover). Labels are HTML
 * rather than 3D text -- crisper at any zoom, free to render, and readable by
 * a screen reader.
 *
 * Performance: nodes are one InstancedMesh, edges one LineSegments, and the
 * loop only runs while the section is on screen. Off-screen it renders a
 * single frame per state change, which is why a static graph costs nothing.
 */
import * as THREE from 'three';
import { CATEGORIES } from './evidence.js';

const COL = {
  bullet: 0x3987e5,   // an achievement from the resume
  cap: 0x9085e9,      // a capability it evidences
  gap: 0xd9a227,      // a capability nothing evidences
  dim: 0x2a3446,
};

/**
 * Lay the matrix out so the structure reads at a glance: achievements in one
 * column on the left, grouped by employer; capabilities fanning out to the
 * right on one spoke per category. Depth is kept small and deliberate -- an
 * earlier version spread the categories along the view axis, where they
 * projected into flat streaks and the graph became unreadable.
 */
function layout(trace, capabilities, narrow) {
  const nodes = [];
  // Standing labels, so the graph reads as a diagram rather than a dot field.
  const tags = [];

  // Left: one column, a blank slot between employers.
  const roles = [...new Set(trace.bullets.map((b) => b.company))];
  const slots = trace.bullets.length + Math.max(0, roles.length - 1);
  let slot = 0;
  roles.forEach((company, ri) => {
    if (ri) slot += 1;
    trace.bullets.filter((b) => b.company === company).forEach((b) => {
      const y = (0.5 - slot / (slots - 1)) * (narrow ? 26 : 18);
      nodes.push({
        kind: 'bullet', id: b.id, label: b.text, sub: `${b.role} · ${b.company}`,
        pos: new THREE.Vector3(narrow ? -7 : -24, y, (ri - (roles.length - 1) / 2) * 2.2),
      });
      slot += 1;
    });
    const shortName = trace.bullets.find((b) => b.company === company)?.short || company;
    tags.push({ text: shortName, side: 'left', pos: new THREE.Vector3(narrow ? -8.5 : -24, 0, (ri - (roles.length - 1) / 2) * 2.2), n: ri });
  });
  // Anchor each employer tag at its own cluster's midpoint.
  tags.forEach((tag, ti) => {
    const own = nodes.filter((n) => n.sub.endsWith(roles[ti]));
    if (own.length) tag.pos.y = own.reduce((a, n) => a + n.pos.y, 0) / own.length;
  });

  // Right: a fan, one spoke per category, members spaced along the spoke.
  // A wide canvas can afford a long, shallow fan; a phone needs a squarer
  // bounding box or the fit-to-frame below pushes every node to a dot.
  // A portrait canvas wants a tall, narrow fan; a wide one wants the
  // opposite. Both are the same graph, framed for the space available.
  const ARC = narrow ? 1.5 : 1.15;
  const R0 = narrow ? 3 : 5;
  const R1 = narrow ? 9 : 12;
  const AX = narrow ? 0 : 2;
  // The fan is an ellipse, not a circle: a circular fan on a 2.3:1 canvas
  // left half the width empty, because fit-to-frame is bound by whichever
  // axis is proportionally larger.
  const XS = narrow ? 0.85 : 1.9;
  const YS = narrow ? 1.5 : 0.85;
  capabilities.forEach((cap) => {
    const ci = Math.max(0, CATEGORIES.indexOf(cap.cat));
    const peers = capabilities.filter((c) => c.cat === cap.cat);
    const k = peers.indexOf(cap);
    const a = CATEGORIES.length > 1 ? -ARC + (ci / (CATEGORIES.length - 1)) * ARC * 2 : 0;
    const t = peers.length > 1 ? k / (peers.length - 1) : 0.5;
    const r = R0 + t * (R1 - R0);
    const traced = trace.byCapability.get(cap.name)?.traced;
    nodes.push({
      kind: traced ? 'cap' : 'gap', id: `c:${cap.name}`, label: cap.name,
      sub: traced ? cap.cat : `${cap.cat} · listed on the resume, no achievement bullet`,
      cap: cap.name,
      pos: new THREE.Vector3(AX + Math.cos(a) * r * XS, Math.sin(a) * r * YS,
        (k % 2 ? 1.5 : -1.5) + (ci - 2.5) * 0.7),
    });
  });

  // One tag per category, just beyond the far end of its spoke.
  CATEGORIES.forEach((cat, ci) => {
    const peers = capabilities.filter((c) => c.cat === cat);
    if (!peers.length) return;
    const a = CATEGORIES.length > 1 ? -ARC + (ci / (CATEGORIES.length - 1)) * ARC * 2 : 0;
    // Just beyond this spoke's outermost member. A category with a single
    // capability sits at the middle of the spoke, so a fixed radius left its
    // tag stranded in empty space.
    const far = peers.length > 1 ? R1 : (R0 + R1) / 2;
    const r = far + (narrow ? 1.5 : 2.2);
    tags.push({ text: cat, side: 'right', pos: new THREE.Vector3(AX + Math.cos(a) * r * XS, Math.sin(a) * r * YS, 0) });
  });

  const box = new THREE.Box3().setFromPoints([...nodes, ...tags].map((n) => n.pos));
  const centre = box.getCenter(new THREE.Vector3());
  [...nodes, ...tags].forEach((n) => n.pos.sub(centre));

  const index = new Map(nodes.map((n, i) => [n.id, i]));
  const edges = [];
  for (const [name, entry] of trace.byCapability) {
    for (const b of entry.bullets) {
      const a = index.get(b.id), z = index.get(`c:${name}`);
      if (a != null && z != null) edges.push({ a, z, cap: name, bullet: b.id });
    }
  }
  return { nodes, edges, index, tags, extent: box.getSize(new THREE.Vector3()) };
}

export function createTraceGraph(canvas, trace, capabilities, { reducedMotion = false, onPick, onTags } = {}) {
  const narrow = (canvas.clientWidth || window.innerWidth) < 720;
  const { nodes, edges, tags, extent } = layout(trace, capabilities, narrow);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 200);
  camera.position.set(1, 0, 40);

  const world = new THREE.Group();
  scene.add(world);

  // ---- nodes: one InstancedMesh, coloured per instance ----
  const geo = new THREE.SphereGeometry(narrow ? 0.4 : 0.42, 16, 12);
  const mat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95 });
  const mesh = new THREE.InstancedMesh(geo, mat, nodes.length);
  const m4 = new THREE.Matrix4();
  const col = new THREE.Color();
  nodes.forEach((n, i) => {
    const s = n.kind === 'bullet' ? 1.5 : 1;
    m4.makeScale(s, s, s).setPosition(n.pos);
    mesh.setMatrixAt(i, m4);
    mesh.setColorAt(i, col.setHex(COL[n.kind]));
  });
  mesh.instanceMatrix.needsUpdate = true;
  world.add(mesh);

  // ---- edges: one LineSegments, two vertices per edge ----
  const pos = new Float32Array(edges.length * 6);
  const vcol = new Float32Array(edges.length * 6);
  edges.forEach((e, i) => {
    nodes[e.a].pos.toArray(pos, i * 6);
    nodes[e.z].pos.toArray(pos, i * 6 + 3);
  });
  const eg = new THREE.BufferGeometry();
  eg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  eg.setAttribute('color', new THREE.BufferAttribute(vcol, 3));
  const lines = new THREE.LineSegments(eg, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.55,
  }));
  world.add(lines);

  // ---- state ----
  const ray = new THREE.Raycaster();
  ray.params.Mesh = { threshold: 0 };
  const ndc = new THREE.Vector2();
  let hover = -1;
  let selected = null;      // capability name, mirrored from the DOM
  let spin = 0;
  let t = 0;
  let drag = null;
  let tilt = { x: 0, y: 0 };
  let running = false;
  // World units set aside on the x axis for the HTML tags. Seeded with an
  // estimate and then corrected from their measured width -- a guess that
  // works at 1440px clips a long employer name at 320px.
  let reserve = narrow ? 14 : 13;
  let dirty = true;
  const clock = new THREE.Clock();

  /** Repaint edge and node colours for the current selection/hover. */
  function paint() {
    const litCap = selected || (hover >= 0 ? nodes[hover].cap : null);
    const litBullet = hover >= 0 && nodes[hover].kind === 'bullet' ? nodes[hover].id : null;
    const focused = litCap || litBullet;

    edges.forEach((e, i) => {
      const on = !focused || e.cap === litCap || e.bullet === litBullet;
      col.setHex(on ? (e.cap === litCap || e.bullet === litBullet ? COL.cap : COL.bullet) : COL.dim);
      const f = on ? 1 : 0.35;
      for (let v = 0; v < 2; v++) {
        vcol[i * 6 + v * 3] = col.r * f;
        vcol[i * 6 + v * 3 + 1] = col.g * f;
        vcol[i * 6 + v * 3 + 2] = col.b * f;
      }
    });
    eg.attributes.color.needsUpdate = true;

    // A node stays lit if it is the focus, or sits on an edge to the focus.
    const near = new Set();
    if (focused) {
      edges.forEach((e) => {
        if (e.cap === litCap || e.bullet === litBullet) { near.add(e.a); near.add(e.z); }
      });
    }
    nodes.forEach((n, i) => {
      const on = !focused || near.has(i) || i === hover;
      col.setHex(COL[n.kind]);
      if (!on) col.lerp(new THREE.Color(COL.dim), 0.72);
      mesh.setColorAt(i, col);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    dirty = true;
  }
  paint();

  /**
   * Frame the whole graph, whatever the canvas shape. Derived from the real
   * bounding box rather than a hand-tuned distance, which was leaving two
   * thirds of a wide canvas empty. The sway rotates about Y, so the width to
   * fit is the XZ diagonal, not x alone.
   */
  function resize() {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    const halfV = Math.tan((camera.fov * Math.PI) / 360);
    // The tags are HTML, so their width is invisible to a bounding box built
    // from anchor points -- without this reserve the employer names on the
    // left ran off the canvas.
    const wide = Math.hypot(extent.x + reserve, extent.z) / 2;
    const tall = extent.y / 2;
    const pad = 1.1;   // room for the hover label and the outermost node
    camera.position.z = Math.max(tall / halfV, wide / (halfV * camera.aspect)) * pad
      + extent.z / 2;
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    dirty = true;
  }

  const _v = new THREE.Vector3();

  /** Project a world point to canvas pixels, for the HTML label layer. */
  function toScreen(v) {
    const p = _v.copy(v).applyMatrix4(world.matrixWorld).project(camera);
    return {
      x: (p.x * 0.5 + 0.5) * canvas.clientWidth,
      y: (-p.y * 0.5 + 0.5) * canvas.clientHeight,
      behind: p.z > 1,
    };
  }

  /** Screen position of a node, for the HTML label overlay. */
  function project(i) {
    const p = nodes[i].pos.clone().applyMatrix4(world.matrixWorld).project(camera);
    return {
      x: (p.x * 0.5 + 0.5) * canvas.clientWidth,
      y: (-p.y * 0.5 + 0.5) * canvas.clientHeight,
      behind: p.z > 1,
    };
  }

  function pick(cx, cy) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(mesh, false)[0];
    return hit?.instanceId ?? -1;
  }

  function setHover(i) {
    if (i === hover) return;
    hover = i;
    canvas.style.cursor = i >= 0 ? 'pointer' : 'grab';
    paint();
    onPick?.({ type: 'hover', node: i >= 0 ? nodes[i] : null, at: i >= 0 ? project(i) : null });
  }

  function frame() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    // A slow sway, not a spin: rotating past 90 degrees would fold the two
    // sides of the matrix onto each other and destroy the reading order.
    if (!reducedMotion && !drag && hover < 0) { t += dt; spin = Math.sin(t * 0.24) * 0.3; }
    const ty = spin + tilt.y;
    if (Math.abs(world.rotation.y - ty) > 1e-4 || Math.abs(world.rotation.x - tilt.x) > 1e-4) dirty = true;
    world.rotation.y += (ty - world.rotation.y) * 0.08;
    world.rotation.x += (tilt.x - world.rotation.x) * 0.08;
    if (dirty) {
      world.updateMatrixWorld();
      renderer.render(scene, camera);
      dirty = false;
      onTags?.(tags.map((t) => ({ ...t, at: toScreen(t.pos) })));
      if (hover >= 0) onPick?.({ type: 'move', node: nodes[hover], at: project(hover) });
    }
    requestAnimationFrame(frame);
  }

  // ---- pointer: drag to turn, click to select ----
  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY, y0: tilt.y, x0: tilt.x, moved: 0 };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', (e) => {
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
      tilt.y = Math.max(-1.1, Math.min(1.1, drag.y0 + dx * 0.006));
      tilt.x = Math.max(-0.6, Math.min(0.6, drag.x0 + dy * 0.004));
      dirty = true;
      return;
    }
    setHover(pick(e.clientX, e.clientY));
  });
  canvas.addEventListener('pointerup', (e) => {
    const wasDrag = drag && drag.moved > 6;
    drag = null;
    canvas.style.cursor = 'grab';
    if (wasDrag) return;
    const i = pick(e.clientX, e.clientY);
    if (i >= 0) onPick?.({ type: 'select', node: nodes[i] });
  });
  canvas.addEventListener('pointerleave', () => { drag = null; setHover(-1); });

  /** World units per canvas pixel, at the plane the graph sits on. */
  const unitsPerPixel = () =>
    (2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360) * camera.aspect)
    / (canvas.clientWidth || 1);

  return {
    resize,
    /**
     * Told the real pixel width of the widest tag on each side, reframe so
     * they fit. Converges in one pass: the font size does not depend on the
     * camera, so the measurement does not move when the frame does.
     */
    setTextReserve(px) {
      const want = px * unitsPerPixel();
      if (!Number.isFinite(want) || Math.abs(want - reserve) < 0.5) return;
      reserve = want;
      resize();
    },
    start() { if (!running) { running = true; clock.getDelta(); dirty = true; frame(); } },
    stop() { running = false; },
    /** Mirror the DOM's selection into the scene. */
    select(capabilityName) {
      selected = capabilityName || null;
      paint();
      if (!running) {
        world.updateMatrixWorld();
        renderer.render(scene, camera);
        onTags?.(tags.map((t) => ({ ...t, at: toScreen(t.pos) })));
      }
    },
    counts: { bullets: nodes.filter((n) => n.kind === 'bullet').length, caps: nodes.filter((n) => n.kind !== 'bullet').length, gaps: nodes.filter((n) => n.kind === 'gap').length, links: edges.length },
    dispose() {
      running = false;
      geo.dispose(); mat.dispose(); eg.dispose(); lines.material.dispose();
      renderer.dispose();
    },
  };
}
