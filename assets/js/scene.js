/**
 * Fixed WebGL backdrop.
 *
 * Three layers, all driven by one clock:
 *   1. a depth starfield of additive points that twinkles and drifts
 *   2. a displaced icosahedron "core" that breathes on a noise field
 *   3. satellite octahedra orbiting the core on tilted rings
 *
 * The camera dollies on scroll progress and parallaxes toward the pointer, so
 * moving down the page reads as travelling through the scene.
 */
import * as THREE from 'three';

const PALETTE = {
  cyan: new THREE.Color('#4de3ff'),
  violet: new THREE.Color('#8b6dff'),
  rose: new THREE.Color('#ff6ba8'),
};

export function createScene(canvas, { reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x05070f, 0.028);

  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 200);
  camera.position.set(0, 0, 26);

  // Mobile carries a much lighter particle budget.
  const isSmall = window.innerWidth < 760;
  const STAR_COUNT = isSmall ? 1600 : 4200;

  scene.add(buildStarfield(STAR_COUNT));
  const core = buildCore();
  scene.add(core.group);
  const satellites = buildSatellites(isSmall ? 5 : 9);
  scene.add(satellites.group);

  // Rim lights give the solid satellite faces something to catch.
  scene.add(new THREE.AmbientLight(0x223055, 1.1));
  const keyLight = new THREE.PointLight(PALETTE.cyan, 90, 60);
  keyLight.position.set(12, 10, 14);
  scene.add(keyLight);
  const fillLight = new THREE.PointLight(PALETTE.violet, 70, 60);
  fillLight.position.set(-14, -8, 8);
  scene.add(fillLight);

  const stars = scene.children[0];
  const pointer = new THREE.Vector2(0, 0);
  const smoothed = new THREE.Vector2(0, 0);
  let scrollProgress = 0;
  let smoothedScroll = 0;
  const clock = new THREE.Clock();
  let running = true;
  let frame = 0;

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Cap DPR at 2: beyond that the fill cost buys nothing visible.
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function onPointerMove(x, y) {
    pointer.set((x / window.innerWidth) * 2 - 1, -((y / window.innerHeight) * 2 - 1));
  }

  function setScroll(progress) {
    scrollProgress = progress;
  }

  function render() {
    const t = clock.getElapsedTime();
    const damp = reducedMotion ? 1 : 0.045;

    smoothed.lerp(pointer, damp * 2);
    smoothedScroll += (scrollProgress - smoothedScroll) * damp * 2;

    // Travel forward through the field, drifting sideways as we go.
    camera.position.z = 26 - smoothedScroll * 16;
    camera.position.x = smoothed.x * 2.6 + Math.sin(smoothedScroll * Math.PI) * 3;
    camera.position.y = smoothed.y * 1.8 - smoothedScroll * 2.5;
    camera.lookAt(0, smoothedScroll * -1.5, 0);

    if (!reducedMotion) {
      stars.rotation.y = t * 0.012;
      stars.rotation.x = Math.sin(t * 0.05) * 0.05;
      stars.material.uniforms.uTime.value = t;

      core.update(t, smoothedScroll);
      satellites.update(t);
    }

    // Shift the accent hue as the visitor moves down the page.
    const hue = new THREE.Color().lerpColors(PALETTE.cyan, PALETTE.rose, smoothedScroll);
    keyLight.color.copy(hue);
    stars.material.uniforms.uTint.value.copy(hue);

    renderer.render(scene, camera);
  }

  function loop() {
    if (!running) return;
    frame = requestAnimationFrame(loop);
    render();
  }

  function start() {
    if (running && frame) return;
    running = true;
    clock.start();
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

/* ---------- layers ---------- */

function buildStarfield(count) {
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const scales = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    // Sample a shell rather than a cube so density stays even around the camera.
    const radius = 14 + Math.random() * 46;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.7;
    positions[i * 3 + 2] = radius * Math.cos(phi);
    seeds[i] = Math.random() * Math.PI * 2;
    scales[i] = 0.5 + Math.random() * 2.2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uTint: { value: PALETTE.cyan.clone() },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      attribute float aScale;
      uniform float uTime;
      uniform float uPixelRatio;
      varying float vTwinkle;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vTwinkle = 0.45 + 0.55 * sin(uTime * 1.4 + aSeed);
        gl_Position = projectionMatrix * mv;
        // Clamped: without a ceiling, stars near the camera balloon into smudges.
        gl_PointSize = min(aScale * uPixelRatio * (150.0 / -mv.z), 5.0 * uPixelRatio);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uTint;
      varying float vTwinkle;
      void main() {
        // Soft radial falloff -- avoids the hard square of a default point.
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        float alpha = smoothstep(0.5, 0.0, d) * vTwinkle;
        gl_FragColor = vec4(mix(vec3(1.0), uTint, 0.55), alpha * 0.85);
      }
    `,
  });

  return new THREE.Points(geometry, material);
}

function buildCore() {
  const group = new THREE.Group();

  const uniforms = {
    uTime: { value: 0 },
    uAmp: { value: 0.55 },
    uColorA: { value: PALETTE.cyan.clone() },
    uColorB: { value: PALETTE.violet.clone() },
    uOpacity: { value: 0.3 },
  };

  const geometry = new THREE.IcosahedronGeometry(5.4, 6);
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    wireframe: true,
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uAmp;
      varying float vDisp;

      // Cheap value noise -- enough texture for a breathing surface.
      vec3 hash3(vec3 p) {
        p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
                 dot(p, vec3(269.5, 183.3, 246.1)),
                 dot(p, vec3(113.5, 271.9, 124.6)));
        return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
      }
      float noise(vec3 p) {
        vec3 i = floor(p), f = fract(p);
        vec3 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(dot(hash3(i + vec3(0,0,0)), f - vec3(0,0,0)),
                           dot(hash3(i + vec3(1,0,0)), f - vec3(1,0,0)), u.x),
                       mix(dot(hash3(i + vec3(0,1,0)), f - vec3(0,1,0)),
                           dot(hash3(i + vec3(1,1,0)), f - vec3(1,1,0)), u.x), u.y),
                   mix(mix(dot(hash3(i + vec3(0,0,1)), f - vec3(0,0,1)),
                           dot(hash3(i + vec3(1,0,1)), f - vec3(1,0,1)), u.x),
                       mix(dot(hash3(i + vec3(0,1,1)), f - vec3(0,1,1)),
                           dot(hash3(i + vec3(1,1,1)), f - vec3(1,1,1)), u.x), u.y), u.z);
      }

      void main() {
        float n = noise(normal * 1.6 + uTime * 0.22);
        vDisp = n;
        vec3 displaced = position + normal * n * uAmp;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uOpacity;
      varying float vDisp;
      void main() {
        vec3 c = mix(uColorA, uColorB, smoothstep(-1.0, 1.0, vDisp));
        gl_FragColor = vec4(c, uOpacity);
      }
    `,
  });

  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);

  // Faint solid inner shell to keep the wireframe from reading as flat.
  const shellMaterial = new THREE.MeshBasicMaterial({
    color: 0x0a1330,
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });
  const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(5.0, 3), shellMaterial);
  group.add(shell);

  // Sit the core off-axis and behind the content plane so hero copy stays legible.
  group.position.set(7.2, 0.8, -7);

  return {
    group,
    update(t, scroll) {
      uniforms.uTime.value = t;
      uniforms.uAmp.value = 0.55 + Math.sin(t * 0.6) * 0.18;
      group.rotation.y = t * 0.1;
      group.rotation.x = Math.sin(t * 0.15) * 0.2;

      // The core belongs to the hero. Past the fold it shrinks and dissolves so
      // it never sits behind body copy or the skill sphere.
      const fade = Math.max(0, 1 - scroll * 4.5);
      uniforms.uOpacity.value = 0.3 * fade;
      shellMaterial.opacity = 0.22 * fade;
      group.visible = fade > 0.01;
      group.scale.setScalar(1 - scroll * 0.5);
    },
  };
}

function buildSatellites(count) {
  const group = new THREE.Group();
  const bodies = [];
  const geometries = [
    new THREE.OctahedronGeometry(0.42),
    new THREE.TetrahedronGeometry(0.46),
    new THREE.IcosahedronGeometry(0.36),
  ];

  for (let i = 0; i < count; i++) {
    const material = new THREE.MeshStandardMaterial({
      color: i % 2 ? PALETTE.violet : PALETTE.cyan,
      roughness: 0.25,
      metalness: 0.7,
      transparent: true,
      opacity: 0.9,
    });
    const mesh = new THREE.Mesh(geometries[i % geometries.length], material);
    const orbit = {
      radius: 7.5 + Math.random() * 5.5,
      speed: 0.12 + Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2,
      tilt: (Math.random() - 0.5) * 1.1,
      wobble: 0.6 + Math.random(),
    };
    bodies.push({ mesh, orbit });
    group.add(mesh);
  }

  return {
    group,
    update(t) {
      for (const { mesh, orbit } of bodies) {
        const a = orbit.phase + t * orbit.speed;
        mesh.position.set(
          Math.cos(a) * orbit.radius,
          Math.sin(a * orbit.wobble) * orbit.radius * 0.35 + Math.sin(orbit.tilt) * 2,
          Math.sin(a) * orbit.radius
        );
        mesh.rotation.x += 0.01;
        mesh.rotation.y += 0.014;
      }
    },
  };
}
