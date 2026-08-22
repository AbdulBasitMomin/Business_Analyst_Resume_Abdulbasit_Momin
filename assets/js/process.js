/**
 * 3D BA process flow: Elicit -> Analyse -> Specify -> Validate -> Optimise.
 *
 * Stages sit as beveled 3D plates along a gentle arc, joined by connector
 * lines. A token travels the chain, pausing on each stage; the active stage
 * lifts, brightens, and reports itself so the DOM cards beside the canvas can
 * highlight in sync. Optimise loops back to Elicit, because the BA lifecycle
 * is a loop, not a line.
 */
import * as THREE from 'three';

// First five categorical slots, contiguous, same palette as the backdrop. The
// flow is a chain, so the adjacent pairlist applies -- validated as passing.
const STAGE_COLORS = [0x3987e5, 0xd95926, 0x199e70, 0xc98500, 0xd55181];

const DWELL = 1.15; // seconds parked on a stage
const TRAVEL = 0.85; // seconds moving between stages

export function createProcess(canvas, stages, { reducedMotion = false, onStage } = {}) {
  if (!canvas || !stages?.length) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 100);

  scene.add(new THREE.AmbientLight(0x33456e, 1.6));
  const key = new THREE.DirectionalLight(0xcfe4ff, 2.1);
  key.position.set(4, 8, 10);
  scene.add(key);

  const group = new THREE.Group();
  scene.add(group);

  const SPAN = 11;
  const nodes = stages.map((stage, i) => {
    const frac = stages.length === 1 ? 0.5 : i / (stages.length - 1);
    const x = (frac - 0.5) * SPAN;
    // Arc the chain slightly toward the viewer at the centre.
    const z = -Math.sin(frac * Math.PI) * 1.8;
    const color = STAGE_COLORS[i % STAGE_COLORS.length];

    // Two levels: the pivot turns the hexagon's face toward the camera, the
    // disc spins about its own axis inside it. Stacking both rotations on one
    // mesh made the plates tumble instead of spinning in plane.
    const pivot = new THREE.Group();
    pivot.rotation.x = Math.PI / 2;
    pivot.position.set(x, 0, z);

    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.92, 0.92, 0.3, 6),
      new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity: 0.25,
        roughness: 0.35,
        metalness: 0.45,
        transparent: true,
        opacity: 0.92,
      })
    );
    pivot.add(disc);

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(1.05, 1.16, 6),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      })
    );
    halo.position.set(x, 0, z);

    group.add(pivot, halo);
    return { pivot, disc, halo, color, home: pivot.position.clone(), index: i };
  });

  // Connectors between consecutive stages.
  const connectorPoints = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    connectorPoints.push(nodes[i].home.clone(), nodes[i + 1].home.clone());
  }
  group.add(
    new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(connectorPoints),
      new THREE.LineBasicMaterial({ color: 0x6f8fc0, transparent: true, opacity: 0.4 })
    )
  );

  // Feedback loop: Optimise back to Elicit, drawn as a dipped curve underneath.
  const loop = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      new THREE.CubicBezierCurve3(
        nodes[nodes.length - 1].home.clone(),
        new THREE.Vector3(SPAN * 0.35, -4.2, 1),
        new THREE.Vector3(-SPAN * 0.35, -4.2, 1),
        nodes[0].home.clone()
      ).getPoints(48)
    ),
    new THREE.LineDashedMaterial({
      color: 0x8fb6e8,
      transparent: true,
      opacity: 0.45,
      dashSize: 0.35,
      gapSize: 0.28,
    })
  );
  loop.computeLineDistances();
  group.add(loop);

  // The travelling token.
  const token = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.3, 2),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  group.add(token);
  const tokenGlow = new THREE.PointLight(0xffffff, 22, 9);
  group.add(tokenGlow);

  let active = -1;
  const clock = new THREE.Clock();
  let frame = 0;
  let running = false;

  function announce(index) {
    if (index === active) return;
    active = index;
    onStage?.(index);
  }

  // Content spans the chain horizontally and the feedback loop's dip
  // vertically; frame both rather than trusting a fixed camera distance,
  // since the panel is very wide on desktop and nearly square on mobile.
  const CONTENT_HALF_W = SPAN / 2 + 1.6;
  const CONTENT_CENTER_Y = -1.6;
  const CONTENT_HALF_H = 3.4;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 1);
    const h = Math.max(rect.height, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    const halfFov = THREE.MathUtils.degToRad(camera.fov) / 2;
    const distForWidth = CONTENT_HALF_W / (Math.tan(halfFov) * camera.aspect);
    const distForHeight = CONTENT_HALF_H / Math.tan(halfFov);
    camera.position.set(0, CONTENT_CENTER_Y + 1.1, Math.max(distForWidth, distForHeight));
    camera.lookAt(0, CONTENT_CENTER_Y, 0);
    camera.updateProjectionMatrix();
  }

  function render() {
    const t = clock.getElapsedTime();

    // Where is the token in the cycle?
    const cycle = stages.length * (DWELL + TRAVEL);
    const local = t % cycle;
    const slot = Math.floor(local / (DWELL + TRAVEL));
    const withinSlot = local - slot * (DWELL + TRAVEL);
    const from = nodes[slot];
    const to = nodes[(slot + 1) % nodes.length];

    if (withinSlot < DWELL) {
      token.position.copy(from.home);
      announce(slot);
    } else {
      const p = (withinSlot - DWELL) / TRAVEL;
      const eased = p * p * (3 - 2 * p);
      token.position.lerpVectors(from.home, to.home, eased);
      // Arc the return leg under the chain, following the feedback curve.
      if (slot === nodes.length - 1) token.position.y -= Math.sin(eased * Math.PI) * 4.2;
      else token.position.y += Math.sin(eased * Math.PI) * 0.75;
    }
    tokenGlow.position.copy(token.position);

    nodes.forEach((node, i) => {
      const isActive = i === active;
      const lift = isActive ? 0.55 : 0;
      node.pivot.position.y += (node.home.y + lift - node.pivot.position.y) * 0.12;
      node.halo.position.y = node.pivot.position.y;

      const targetEmissive = isActive ? 1.15 : 0.25;
      node.disc.material.emissiveIntensity +=
        (targetEmissive - node.disc.material.emissiveIntensity) * 0.12;
      const targetHalo = isActive ? 0.85 : 0.22;
      node.halo.material.opacity += (targetHalo - node.halo.material.opacity) * 0.12;
      node.halo.scale.setScalar(isActive ? 1 + Math.sin(t * 3) * 0.05 : 1);
      // In-plane spin about the hexagon's own axis.
      node.disc.rotation.y = t * 0.35 + i;
    });

    group.rotation.y = Math.sin(t * 0.15) * 0.06;
    renderer.render(scene, camera);
  }

  function loopFrame() {
    if (!running) return;
    frame = requestAnimationFrame(loopFrame);
    render();
  }

  resize();
  if (reducedMotion) {
    // Hold on the first stage; no animation loop at all.
    token.position.copy(nodes[0].home);
    tokenGlow.position.copy(token.position);
    announce(0);
    render();
  } else {
    running = true;
    loopFrame();
  }

  return {
    resize,
    stop() {
      running = false;
      cancelAnimationFrame(frame);
      frame = 0;
    },
    start() {
      if (reducedMotion || running) return;
      running = true;
      loopFrame();
    },
  };
}
