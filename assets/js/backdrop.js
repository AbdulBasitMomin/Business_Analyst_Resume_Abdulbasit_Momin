/**
 * Backdrop.
 *
 * A slow particle field plus a drifting set of blueprint artefacts -- the
 * workstations, documents and delivery loop a business analyst works with. It
 * parallaxes with the pointer and recedes once the reader is into the resume.
 *
 * It once carried a solid 3D "BA ecosystem" object in the centre of the
 * masthead, and that was a mistake: it collided with the SVG diagram that says
 * the same thing more legibly. The rule that came out of it still holds and
 * artifacts.js is built to it -- the 3D lives out at the sides, behind the
 * reading column, and fades away as soon as there is text to read.
 */
import * as THREE from 'three';
import { buildArtifacts } from './artifacts.js';

export function createBackdrop(canvas, { reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);

  const small = window.innerWidth < 1000;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 400);
  camera.position.set(0, 0, 46);

  const field = buildField(small ? 500 : 1600);
  scene.add(field);

  const artifacts = buildArtifacts({ small });
  scene.add(artifacts.group);

  const pointer = new THREE.Vector2();
  const smooth = new THREE.Vector2();
  let target = 0;
  let progress = 0;
  let lastDim = -1;
  const clock = new THREE.Clock();
  let frame = 0;
  let running = false;

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const onPointerMove = (x, y) =>
    pointer.set((x / window.innerWidth) * 2 - 1, -((y / window.innerHeight) * 2 - 1));

  const setScroll = (p) => { target = THREE.MathUtils.clamp(p, 0, 1); };

  function render() {
    const t = clock.getElapsedTime();
    const lerp = reducedMotion ? 1 : 0.06;
    smooth.lerp(pointer, lerp);
    progress += (target - progress) * lerp;

    camera.position.set(smooth.x * 3, smooth.y * 2 - progress * 12, 46);
    camera.lookAt(0, -progress * 9, 0);
    if (!reducedMotion) {
      field.rotation.y = t * 0.012;
      // Counter-rotated against the particles, so the two layers separate in
      // depth instead of moving as one sheet.
      artifacts.group.rotation.y = -t * 0.006;
      artifacts.update(t);
    }

    // Recede once the reader is past the masthead.
    const dim = 1 - Math.min(progress / 0.09, 1) * 0.75;
    if (Math.abs(dim - lastDim) > 0.004) {
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

  resize();
  if (reducedMotion) render();
  else { running = true; loop(); }

  return {
    resize, onPointerMove, setScroll,
    stop() { running = false; cancelAnimationFrame(frame); frame = 0; },
    start() { if (reducedMotion || running) return; running = true; loop(); },
    dispose() { running = false; cancelAnimationFrame(frame); artifacts.dispose(); renderer.dispose(); },
  };
}

/** Depth particles on a shell, so density stays even around the camera. */
function buildField(count) {
  const pos = new Float32Array(count * 3);
  const scale = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = 26 + Math.random() * 90;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.75;
    pos[i * 3 + 2] = r * Math.cos(phi);
    scale[i] = 0.4 + Math.random() * 1.2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aScale', new THREE.BufferAttribute(scale, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) } },
    vertexShader: /* glsl */ `
      attribute float aScale;
      uniform float uPixelRatio;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        // Clamped: unclamped, near particles bloom into smudges.
        gl_PointSize = min(aScale * uPixelRatio * (90.0 / -mv.z), 3.2 * uPixelRatio);
      }
    `,
    fragmentShader: /* glsl */ `
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        gl_FragColor = vec4(vec3(0.72, 0.82, 0.95), smoothstep(0.5, 0.0, d) * 0.55);
      }
    `,
  });
  return new THREE.Points(geo, material);
}
