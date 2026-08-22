/**
 * Draggable 3D skill graph.
 *
 * Rather than one undifferentiated cloud, skills cluster by discipline:
 * each group gets a hub node placed on a Fibonacci sphere, its skills orbit
 * that hub, and spokes join them. So the shape itself says "four disciplines"
 * before a single label is read.
 *
 * Labels are camera-facing sprites, so every one stays readable at any angle;
 * depth is carried by scale and opacity instead of rotation.
 */
import * as THREE from 'three';

/**
 * One hue, deliberately.
 *
 * The clusters float in 3D, so any two can end up side by side -- the
 * all-pairs case. Four categorical hues fail there: the validator puts yellow
 * against orange at normal-vision deltaE 10.6, below the 15 floor. Identity
 * here is carried by each cluster's named hub and its position, not by colour,
 * so a categorical palette would add risk and no information.
 */
const GRAPH_HUE = '#3987e5';

export function createOrb(canvas, groups, { reducedMotion = false } = {}) {
  if (!canvas || !groups?.length) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);

  const root = new THREE.Group();
  scene.add(root);

  const HUB_RADIUS = 4.3;
  const LEAF_RADIUS = 2.5;
  const golden = Math.PI * (3 - Math.sqrt(5));
  const sprites = [];
  const spokePoints = [];

  groups.forEach((group, gi) => {
    const color = GRAPH_HUE;

    // Hub direction: Fibonacci sphere over the group count, so hubs never clump.
    const y = groups.length === 1 ? 0 : 1 - (gi / (groups.length - 1)) * 2;
    const r = Math.sqrt(Math.max(1 - y * y, 0));
    const theta = golden * gi;
    const hub = new THREE.Vector3(
      Math.cos(theta) * r * HUB_RADIUS,
      y * HUB_RADIUS,
      Math.sin(theta) * r * HUB_RADIUS
    );

    // Hub marker plus its group label, larger than the leaves.
    const hubDot = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.17, 1),
      new THREE.MeshBasicMaterial({ color })
    );
    hubDot.position.copy(hub);
    root.add(hubDot);

    const hubLabel = makeSprite(group.group, color, true);
    hubLabel.position.copy(hub).multiplyScalar(1.2);
    root.add(hubLabel);
    sprites.push({ sprite: hubLabel, base: 1.2, hub: true, aspect: hubLabel.userData.aspect });

    // Leaves ring the hub on the plane perpendicular to its direction.
    const items = group.items || [];
    const axis = hub.clone().normalize();
    const sideA = new THREE.Vector3(0, 1, 0).cross(axis);
    if (sideA.lengthSq() < 0.001) sideA.set(1, 0, 0);
    sideA.normalize();
    const sideB = axis.clone().cross(sideA).normalize();

    items.forEach((item, ii) => {
      const angle = (ii / Math.max(items.length, 1)) * Math.PI * 2;
      const wobble = 0.72 + ((ii % 3) * 0.3);
      const pos = hub
        .clone()
        .add(sideA.clone().multiplyScalar(Math.cos(angle) * LEAF_RADIUS * wobble))
        .add(sideB.clone().multiplyScalar(Math.sin(angle) * LEAF_RADIUS * wobble))
        .add(axis.clone().multiplyScalar(0.6));

      const sprite = makeSprite(shortLabel(item.name || item), color, false);
      sprite.position.copy(pos);
      root.add(sprite);
      sprites.push({ sprite, base: 1, hub: false, aspect: sprite.userData.aspect });

      spokePoints.push(hub.clone(), pos);
    });
  });

  root.add(
    new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(spokePoints),
      new THREE.LineBasicMaterial({
        color: 0x7ea0dc,
        transparent: true,
        opacity: 0.16,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    )
  );

  /* ---------- interaction ---------- */

  const velocity = { x: 0.0012, y: 0.0032 };
  let dragging = false;
  let last = { x: 0, y: 0 };
  let hovering = false;

  canvas.addEventListener('pointerdown', (e) => {
    dragging = true;
    last = { x: e.clientX, y: e.clientY };
    canvas.setPointerCapture?.(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    velocity.y = (e.clientX - last.x) * 0.005;
    velocity.x = (e.clientY - last.y) * 0.005;
    last = { x: e.clientX, y: e.clientY };
  });
  const release = (e) => {
    dragging = false;
    canvas.releasePointerCapture?.(e.pointerId);
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerenter', () => { hovering = true; });
  canvas.addEventListener('pointerleave', () => { hovering = false; dragging = false; });

  /* ---------- loop ---------- */

  let frame = 0;
  let running = false;
  const world = new THREE.Vector3();

  // Half-extent of the graph plus room for the widest label overhanging a
  // node, so nothing clips at the canvas edge.
  const CONTENT_HALF = HUB_RADIUS + LEAF_RADIUS + 1.5;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(rect.width, 1);
    const h = Math.max(rect.height, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    const halfFov = THREE.MathUtils.degToRad(camera.fov) / 2;
    const distV = CONTENT_HALF / Math.tan(halfFov);
    const distH = CONTENT_HALF / (Math.tan(halfFov) * camera.aspect);
    camera.position.z = Math.max(distV, distH);
    camera.updateProjectionMatrix();
  }

  function render() {
    if (!dragging) {
      // Ease back to an idle spin; nearly stop while the cursor rests on it.
      const target = hovering ? 0.0006 : 0.0032;
      velocity.y += (target - velocity.y) * 0.03;
      velocity.x += (0.0012 - velocity.x) * 0.03;
    }
    root.rotation.y += velocity.y;
    root.rotation.x = THREE.MathUtils.clamp(root.rotation.x + velocity.x, -0.85, 0.85);

    for (const entry of sprites) {
      entry.sprite.getWorldPosition(world);
      const depth = (world.z / (HUB_RADIUS + LEAF_RADIUS) + 1) / 2; // 0 back, 1 front
      entry.sprite.material.opacity = (entry.hub ? 0.5 : 0.2) + depth * 0.78;
      // Height is uniform; width follows the label's own aspect so text is
      // never stretched or squeezed to fit a fixed box.
      const h = (0.62 + depth * 0.38) * entry.base;
      entry.sprite.scale.set(h * entry.aspect, h, 1);
    }

    renderer.render(scene, camera);
  }

  function loop() {
    if (!running) return;
    frame = requestAnimationFrame(loop);
    render();
  }

  resize();
  if (reducedMotion) {
    velocity.x = 0;
    velocity.y = 0;
    render();
  } else {
    running = true;
    loop();
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
      loop();
    },
  };
}

/**
 * Graph labels have to stay short or the clusters become unreadable. The full
 * skill names live in the meters next to the canvas, so trimming to the head
 * of the phrase loses nothing: "Data Privacy, Consent & Compliance" reads as
 * "Data Privacy" on a node.
 */
function shortLabel(text) {
  let out = String(text).split(/\s*[,(]|\s+&\s+/)[0].trim();
  const words = out.split(/\s+/);
  if (out.length > 20 && words.length > 2) out = words.slice(0, 2).join(' ');
  return out;
}

/** Renders a label to an offscreen canvas for use as a sprite texture. */
function makeSprite(text, color, isHub) {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const font = `${isHub ? '700 44px' : '500 38px'} Sora, system-ui, sans-serif`;
  const height = 96;

  // Measure first, then size the canvas to the text. A fixed-width texture
  // clipped long labels and squashed the glyphs.
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const pad = 28;
  const width = Math.ceil(probe.measureText(text).width) + pad * 2;

  const c = document.createElement('canvas');
  c.width = width * scale;
  c.height = height * scale;
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);

  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Glow pass in the group colour, then the glyph in near-white so the text
  // itself stays legible -- colour carries identity, ink carries the reading.
  ctx.shadowColor = color;
  ctx.shadowBlur = isHub ? 22 : 14;
  ctx.fillStyle = color;
  ctx.fillText(text, width / 2, height / 2);
  ctx.shadowBlur = 0;
  ctx.fillStyle = isHub ? '#ffffff' : '#dce8fb';
  ctx.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(c);
  texture.anisotropy = 4;

  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false })
  );
  sprite.userData.aspect = width / height;
  return sprite;
}
