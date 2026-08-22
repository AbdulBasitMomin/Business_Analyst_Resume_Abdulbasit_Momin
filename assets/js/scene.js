/**
 * Fixed WebGL backdrop: a requirements traceability network.
 *
 * Business need -> requirement -> user story -> acceptance criteria -> test
 * case, laid out as five layers along X. Edges only ever run between adjacent
 * layers, and glowing pulses travel along them left to right, so the scene
 * reads as traceability flowing downstream -- the artefact a BA actually
 * maintains, rather than a generic starfield.
 *
 * The camera dollies along the chain as the visitor scrolls and parallaxes
 * toward the pointer, so moving down the page moves through the graph.
 */
import * as THREE from 'three';

/**
 * Layer hues are the first five slots of the validated categorical order
 * (dark-surface steps), taken contiguously -- the ordering is what guarantees
 * colour-vision separation, so skipping a slot breaks it. A chain only ever
 * puts layer N beside N+-1, which is the adjacent pairlist the palette is
 * validated against. Never cycled, never generated.
 */
const LAYERS = [
  { label: 'Business need', color: 0x3987e5, count: 3 },
  { label: 'Requirement', color: 0xd95926, count: 6 },
  { label: 'User story', color: 0x199e70, count: 9 },
  { label: 'Acceptance criteria', color: 0xc98500, count: 9 },
  { label: 'Test case', color: 0xd55181, count: 7 },
];

const LAYER_GAP = 11;
const SPREAD_Y = 9;
const SPREAD_Z = 7;

export function createScene(canvas, { reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070f, 0.013);

  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 300);

  const isSmall = window.innerWidth < 760;
  const graph = buildGraph(isSmall);
  scene.add(graph.group);

  const dust = buildDust(isSmall ? 500 : 1400);
  scene.add(dust);

  scene.add(new THREE.AmbientLight(0x2a3a60, 1.4));
  const key = new THREE.PointLight(0x9fd8ff, 120, 120);
  key.position.set(18, 16, 22);
  scene.add(key);

  const pointer = new THREE.Vector2();
  const smoothed = new THREE.Vector2();
  let scrollTarget = 0;
  let scroll = 0;
  const clock = new THREE.Clock();
  let frame = 0;
  let running = false;
  let lastDim = -1;

  // Travel from just before the first layer to just past the last.
  const chainStart = -((LAYERS.length - 1) * LAYER_GAP) / 2;
  const chainEnd = -chainStart;

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function onPointerMove(x, y) {
    pointer.set((x / window.innerWidth) * 2 - 1, -((y / window.innerHeight) * 2 - 1));
  }

  function setScroll(p) {
    scrollTarget = p;
  }

  function render() {
    const t = clock.getElapsedTime();
    const lerp = reducedMotion ? 1 : 0.08;
    smoothed.lerp(pointer, lerp);
    scroll += (scrollTarget - scroll) * lerp;

    // Ride alongside the chain, looking slightly ahead down the flow.
    const along = chainStart - 14 + scroll * (chainEnd - chainStart + 26);
    camera.position.set(
      along + smoothed.x * 3,
      smoothed.y * 3 + 2.5,
      26 - Math.sin(scroll * Math.PI) * 8
    );
    camera.lookAt(along + 9, 0, 0);

    if (!reducedMotion) {
      graph.update(t);
      dust.rotation.y = t * 0.008;
    }

    // The backdrop owns the hero; past it, it has to get out of the way of
    // body copy. Fading the canvas element is cheaper than touching every
    // material, and it dims edges, nodes and pulses together.
    const dim = 1 - Math.min(scroll / 0.1, 1) * 0.76;
    if (Math.abs(dim - lastDim) > 0.005) {
      canvas.style.opacity = dim.toFixed(3);
      lastDim = dim;
    }

    renderer.render(scene, camera);
  }

  function loop() {
    if (!running) return;
    frame = requestAnimationFrame(loop);
    render();
  }

  function start() {
    if (running) return;
    running = true;
    loop();
  }

  function stop() {
    running = false;
    cancelAnimationFrame(frame);
    frame = 0;
  }

  resize();
  start();

  return { resize, onPointerMove, setScroll, start, stop, renderer };
}

/* ---------- the graph ---------- */

function buildGraph(isSmall) {
  const group = new THREE.Group();
  const layers = [];

  // Nodes, laid out layer by layer along X.
  LAYERS.forEach((layer, li) => {
    const count = isSmall ? Math.max(2, Math.round(layer.count * 0.6)) : layer.count;
    const x = chainX(li);
    const nodes = [];

    const geometry = new THREE.IcosahedronGeometry(0.42, 1);
    const material = new THREE.MeshStandardMaterial({
      color: layer.color,
      emissive: layer.color,
      emissiveIntensity: 0.5,
      roughness: 0.35,
      metalness: 0.4,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let i = 0; i < count; i++) {
      // Spread nodes on a jittered vertical lattice so layers read as columns.
      const frac = count === 1 ? 0.5 : i / (count - 1);
      nodes.push({
        base: new THREE.Vector3(
          x,
          (frac - 0.5) * SPREAD_Y + (Math.random() - 0.5) * 1.2,
          (Math.random() - 0.5) * SPREAD_Z
        ),
        phase: Math.random() * Math.PI * 2,
      });
    }

    layers.push({ ...layer, nodes, mesh });
    group.add(mesh);
  });

  // Edges: every node links to 1-2 nodes in the next layer only. Traceability
  // is a chain, so a link that skips a layer would be a lie.
  const edges = [];
  for (let li = 0; li < layers.length - 1; li++) {
    const from = layers[li].nodes;
    const to = layers[li + 1].nodes;
    from.forEach((node, i) => {
      const fanOut = 1 + (i % 2);
      for (let k = 0; k < fanOut; k++) {
        const target = to[(i * 2 + k * 3 + li) % to.length];
        edges.push({ a: node, b: target, color: layers[li].color });
      }
    });
  }

  const edgeGeometry = new THREE.BufferGeometry();
  const edgePositions = new Float32Array(edges.length * 6);
  const edgeColors = new Float32Array(edges.length * 6);
  edges.forEach((edge, i) => {
    edge.a.base.toArray(edgePositions, i * 6);
    edge.b.base.toArray(edgePositions, i * 6 + 3);
    const c = new THREE.Color(edge.color);
    // Fade each edge toward its downstream end so flow direction is legible.
    c.toArray(edgeColors, i * 6);
    c.clone().multiplyScalar(0.25).toArray(edgeColors, i * 6 + 3);
  });
  edgeGeometry.setAttribute('position', new THREE.BufferAttribute(edgePositions, 3));
  edgeGeometry.setAttribute('color', new THREE.BufferAttribute(edgeColors, 3));
  const edgeLines = new THREE.LineSegments(
    edgeGeometry,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  group.add(edgeLines);

  // Pulses: one travelling marker per edge, staggered, restarting at the top.
  const pulseCount = edges.length;
  const pulseGeometry = new THREE.BufferGeometry();
  const pulsePositions = new Float32Array(pulseCount * 3);
  const pulseColors = new Float32Array(pulseCount * 3);
  edges.forEach((edge, i) => new THREE.Color(edge.color).toArray(pulseColors, i * 3));
  pulseGeometry.setAttribute('position', new THREE.BufferAttribute(pulsePositions, 3));
  pulseGeometry.setAttribute('color', new THREE.BufferAttribute(pulseColors, 3));
  const pulses = new THREE.Points(
    pulseGeometry,
    new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
  );
  group.add(pulses);

  const offsets = edges.map(() => Math.random());
  const matrix = new THREE.Matrix4();
  const scaleVec = new THREE.Vector3();

  return {
    group,
    update(t) {
      // Nodes breathe gently in place.
      for (const layer of layers) {
        layer.nodes.forEach((node, i) => {
          const s = 0.85 + Math.sin(t * 1.1 + node.phase) * 0.15;
          scaleVec.setScalar(s);
          matrix.makeScale(scaleVec.x, scaleVec.y, scaleVec.z);
          matrix.setPosition(
            node.base.x,
            node.base.y + Math.sin(t * 0.5 + node.phase) * 0.25,
            node.base.z
          );
          layer.mesh.setMatrixAt(i, matrix);
        });
        layer.mesh.instanceMatrix.needsUpdate = true;
      }

      // Pulses advance along their edge, wrapping back to the source.
      const pos = pulseGeometry.attributes.position.array;
      for (let i = 0; i < edges.length; i++) {
        const p = (offsets[i] + t * 0.16) % 1;
        const { a, b } = edges[i];
        pos[i * 3] = a.base.x + (b.base.x - a.base.x) * p;
        pos[i * 3 + 1] = a.base.y + (b.base.y - a.base.y) * p;
        pos[i * 3 + 2] = a.base.z + (b.base.z - a.base.z) * p;
      }
      pulseGeometry.attributes.position.needsUpdate = true;
    },
  };
}

function chainX(index) {
  return index * LAYER_GAP - ((LAYERS.length - 1) * LAYER_GAP) / 2;
}

/** Faint depth particles, so the space around the graph is not empty. */
function buildDust(count) {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 130;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0x7fa8d8,
      size: 0.12,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
  );
}
