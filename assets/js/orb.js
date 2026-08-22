/**
 * Draggable 3D skill sphere.
 *
 * Each skill becomes a canvas-rendered text sprite placed on a Fibonacci
 * sphere, so labels stay evenly spaced instead of clumping at the poles.
 * Sprites always face the camera, so every label stays readable at any angle;
 * depth is conveyed by scale and opacity rather than rotation.
 */
import * as THREE from 'three';

export function createOrb(canvas, labels, { reducedMotion = false } = {}) {
  if (!labels || !labels.length) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.z = 15;

  const group = new THREE.Group();
  scene.add(group);

  const RADIUS = 5.2;
  const sprites = [];
  const golden = Math.PI * (3 - Math.sqrt(5));

  labels.forEach((label, i) => {
    // Fibonacci sphere: even coverage without clustering at the poles.
    const y = 1 - (i / Math.max(labels.length - 1, 1)) * 2;
    const r = Math.sqrt(Math.max(1 - y * y, 0));
    const theta = golden * i;

    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: makeLabelTexture(label, i),
        transparent: true,
        depthWrite: false,
      })
    );
    sprite.position.set(Math.cos(theta) * r * RADIUS, y * RADIUS, Math.sin(theta) * r * RADIUS);
    sprite.scale.set(3.4, 0.85, 1);
    group.add(sprite);
    sprites.push(sprite);
  });

  // Wireframe cage so the sphere reads as a volume even when labels are sparse.
  const cage = new THREE.Mesh(
    new THREE.IcosahedronGeometry(RADIUS * 0.98, 1),
    new THREE.MeshBasicMaterial({ color: 0x4de3ff, wireframe: true, transparent: true, opacity: 0.1 })
  );
  group.add(cage);

  /* ---------- interaction ---------- */

  const velocity = { x: 0.0016, y: 0.004 };
  let dragging = false;
  let last = { x: 0, y: 0 };
  let hovering = false;

  function pointerDown(e) {
    dragging = true;
    last = pointFrom(e);
    canvas.setPointerCapture?.(e.pointerId);
  }

  function pointerMove(e) {
    if (!dragging) return;
    const p = pointFrom(e);
    // Drag distance maps straight to angular velocity, which then decays.
    velocity.y = (p.x - last.x) * 0.0055;
    velocity.x = (p.y - last.y) * 0.0055;
    last = p;
  }

  function pointerUp(e) {
    dragging = false;
    canvas.releasePointerCapture?.(e.pointerId);
  }

  function pointFrom(e) {
    return { x: e.clientX, y: e.clientY };
  }

  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);
  canvas.addEventListener('pointerenter', () => { hovering = true; });
  canvas.addEventListener('pointerleave', () => { hovering = false; dragging = false; });

  /* ---------- loop ---------- */

  let frame = 0;
  let visible = true;

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const size = Math.max(rect.width, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, Math.max(rect.height, 1), false);
    camera.aspect = size / Math.max(rect.height, 1);
    camera.updateProjectionMatrix();
  }

  function render() {
    if (!dragging) {
      // Ease back to an idle spin; slow to a crawl while the cursor rests on it.
      const target = hovering ? 0.0008 : 0.004;
      velocity.y += (target - velocity.y) * 0.03;
      velocity.x += (0.0016 - velocity.x) * 0.03;
    }
    group.rotation.y += velocity.y;
    group.rotation.x = THREE.MathUtils.clamp(group.rotation.x + velocity.x, -0.9, 0.9);

    // Fade and shrink sprites on the far side to sell the depth.
    for (const sprite of sprites) {
      const world = sprite.getWorldPosition(new THREE.Vector3());
      const depth = (world.z / RADIUS + 1) / 2; // 0 = back, 1 = front
      sprite.material.opacity = 0.22 + depth * 0.78;
      const s = 0.7 + depth * 0.45;
      sprite.scale.set(3.4 * s, 0.85 * s, 1);
    }

    renderer.render(scene, camera);
  }

  function loop() {
    if (!visible) return;
    frame = requestAnimationFrame(loop);
    render();
  }

  resize();
  if (reducedMotion) {
    velocity.x = 0;
    velocity.y = 0;
    render();
  } else {
    loop();
  }

  return {
    resize,
    stop() { visible = false; cancelAnimationFrame(frame); frame = 0; },
    start() {
      if (reducedMotion || frame) return;
      visible = true;
      loop();
    },
  };
}

/** Renders one skill label to an offscreen canvas for use as a sprite texture. */
function makeLabelTexture(text, index) {
  const scale = Math.min(window.devicePixelRatio || 1, 2);
  const width = 512;
  const height = 128;
  const c = document.createElement('canvas');
  c.width = width * scale;
  c.height = height * scale;
  const ctx = c.getContext('2d');
  ctx.scale(scale, scale);

  const accents = ['#4de3ff', '#8b6dff', '#ff6ba8', '#7dffc0'];
  const color = accents[index % accents.length];

  ctx.font = '600 46px Sora, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = color;
  ctx.fillText(text, width / 2, height / 2);
  // Second pass without shadow keeps the glyph crisp on top of its own glow.
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#eaf2ff';
  ctx.fillText(text, width / 2, height / 2);

  const texture = new THREE.CanvasTexture(c);
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}
