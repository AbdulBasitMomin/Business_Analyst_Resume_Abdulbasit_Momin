/**
 * The journey: one WebGL world the visitor travels through as they scroll.
 *
 * Eight stations sit on a wide arc. Scroll drives a camera along a spline that
 * passes each one; the station nearest the camera gets "focus", which is what
 * drives its assembly animation -- chaos converging, requirements snapping into
 * a stack, cards crossing a board. At the very end the camera pulls back far
 * enough to see every station at once, which is the point: the parts connect.
 *
 * Everything is built from primitives and instanced/pointed geometry -- no
 * external models, no textures to download.
 *
 * Colour: the eight station hues are the documented categorical order taken
 * contiguously, validated on the adjacent pairlist (a journey only ever puts
 * station N beside N+-1). Station identity is also carried by its DOM heading,
 * so colour is never the only cue.
 */
import * as THREE from 'three';

const HUES = [
  0x3987e5, // 01 problem
  0xd95926, // 02 stakeholders
  0x199e70, // 03 requirements
  0xc98500, // 04 delivery
  0xd55181, // 05 data
  0x008300, // 06 ai
  0x9085e9, // 07 validation
  0xe66767, // 08 impact
];

export const STATION_KEYS = [
  'problem', 'stakeholders', 'requirements', 'agile', 'data', 'ai', 'uat', 'impact',
];

export function createJourney(canvas, { reducedMotion = false, onStation } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, powerPreference: 'high-performance',
  });
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x06080f, 0.0032);

  const camera = new THREE.PerspectiveCamera(52, 1, 0.5, 900);

  const small = window.innerWidth < 760;
  const density = small ? 0.5 : 1;

  // Stations on a wide, gently rising arc: a straight line would look like a
  // corridor from the finale vantage, an arc reads as a system. The radius has
  // to keep neighbours further apart than the camera's stand-off distance, or
  // the station behind bleeds over the one being viewed.
  const RADIUS = 300;
  const ARC_CENTER = new THREE.Vector3(0, 0, -RADIUS);
  const stations = STATION_KEYS.map((key, i) => {
    const a = (i / (STATION_KEYS.length - 1)) * Math.PI * 1.12 - Math.PI * 0.06;
    const center = new THREE.Vector3(
      Math.cos(a) * RADIUS,
      (i - (STATION_KEYS.length - 1) / 2) * 7,
      Math.sin(a) * RADIUS - RADIUS
    );
    const built = BUILDERS[key](HUES[i], density);
    built.group.position.copy(center);
    scene.add(built.group);
    return { key, center, hue: HUES[i], ...built };
  });

  // Thin connectors between consecutive stations -- visible mainly in the
  // finale, where they are the whole message.
  const linkPts = [];
  for (let i = 0; i < stations.length - 1; i++) {
    const curve = new THREE.CatmullRomCurve3([
      stations[i].center,
      stations[i].center.clone().lerp(stations[i + 1].center, 0.5).add(new THREE.Vector3(0, 12, 0)),
      stations[i + 1].center,
    ]);
    curve.getPoints(24).forEach((p, k, arr) => {
      if (k < arr.length - 1) linkPts.push(p, arr[k + 1]);
    });
  }
  const links = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(linkPts),
    new THREE.LineBasicMaterial({ color: 0x6d8ab8, transparent: true, opacity: 0.0, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  scene.add(links);

  /**
   * Stand-off point for a station: straight out from the ARC's centre, not the
   * world origin. Normalising the raw position pointed partly back along the
   * arc, which parked the camera inside the neighbouring station.
   */
  function standOff(center, distance) {
    const outward = center.clone().sub(ARC_CENTER).setY(0).normalize();
    return center.clone().add(outward.multiplyScalar(distance)).add(new THREE.Vector3(0, 9, 0));
  }

  const rail = new THREE.CatmullRomCurve3(stations.map((s) => standOff(s.center, 52)));

  /**
   * The hero opens on an establishing shot: far enough back to stay calm, and
   * framed so the first station sits beside the copy rather than behind it.
   * The lookAt is pushed back along the direction of travel, which slides the
   * station off-centre without moving the camera off its own rail.
   */
  const heroPose = standOff(stations[0].center, 84).add(new THREE.Vector3(0, 14, 0));
  // Shift the look target along the camera's own left, which slides the
  // subject to the right of frame -- guessing at the arc tangent's sign put it
  // on the wrong side.
  const heroLook = (() => {
    const forward = stations[0].center.clone().sub(heroPose).normalize();
    const right = new THREE.Vector3(0, 1, 0).cross(forward).normalize();
    return stations[0].center.clone().addScaledVector(right, 44);
  })();

  scene.add(new THREE.AmbientLight(0x2b3a5c, 1.25));
  const key1 = new THREE.PointLight(0xbdd8ff, 2.4, 400, 1.2);
  scene.add(key1);

  scene.add(buildDust(small ? 700 : 2000));

  const pointer = new THREE.Vector2();
  const smoothPointer = new THREE.Vector2();
  let target = 0;
  let progress = 0;
  let activeIndex = -1;
  const clock = new THREE.Clock();
  let frame = 0;
  let running = false;
  let lastDim = -1;

  const camPos = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const centroid = stations
    .reduce((acc, s) => acc.add(s.center), new THREE.Vector3())
    .multiplyScalar(1 / stations.length);
  const finaleCam = centroid.clone().add(new THREE.Vector3(0, 120, 330));

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

  // The last slice of the page is the pull-back.
  const FINALE_START = 0.86;

  function render() {
    const t = clock.getElapsedTime();
    progress += (target - progress) * (reducedMotion ? 1 : 0.075);
    smoothPointer.lerp(pointer, reducedMotion ? 1 : 0.06);

    // Journey phase maps onto the rail; finale phase lifts away from it.
    const journeyP = Math.min(progress / FINALE_START, 1);
    const finaleP = progress <= FINALE_START ? 0 : (progress - FINALE_START) / (1 - FINALE_START);

    rail.getPointAt(THREE.MathUtils.clamp(journeyP, 0, 1), camPos);
    const focusIdx = journeyP * (stations.length - 1);
    const lo = Math.floor(focusIdx);
    const hi = Math.min(lo + 1, stations.length - 1);
    lookAt.copy(stations[lo].center).lerp(stations[hi].center, focusIdx - lo);

    // Ease out of the establishing shot over the first slice of the hero.
    if (journeyP < 0.09) {
      const e = 1 - journeyP / 0.09;
      const w = e * e;
      camPos.lerp(heroPose, w);
      lookAt.lerp(heroLook, w);
    }

    if (finaleP > 0) {
      const e = finaleP * finaleP * (3 - 2 * finaleP);
      camPos.lerp(finaleCam, e);
      lookAt.lerp(centroid, e);
    }

    camera.position.copy(camPos).add(new THREE.Vector3(smoothPointer.x * 6, smoothPointer.y * 4, 0));
    camera.lookAt(lookAt);
    key1.position.copy(camera.position).add(new THREE.Vector3(0, 30, 0));

    // Connectors only earn their opacity once we are pulling back.
    links.material.opacity = finaleP * 0.5;

    // The world owns the hero outright; over the chapters it steps back so it
    // is atmosphere behind the text rather than competition with it. Fading
    // the canvas element is cheaper than touching every material.
    const dim = 1 - Math.min(progress / 0.07, 1) * 0.48;
    if (Math.abs(dim - lastDim) > 0.004) {
      canvas.style.opacity = dim.toFixed(3);
      lastDim = dim;
    }

    // Focus falls off with distance along the journey, so a station assembles
    // as you approach and holds once passed.
    const nearest = Math.round(focusIdx);
    if (nearest !== activeIndex) {
      activeIndex = nearest;
      onStation?.(activeIndex, stations[activeIndex]?.key);
    }

    for (let i = 0; i < stations.length; i++) {
      const d = Math.abs(focusIdx - i);
      const focus = THREE.MathUtils.clamp(1 - (d - 0.15) / 0.85, 0, 1);
      // Signed progress past this station: negative approaching, 0 at it,
      // positive beyond. Stations whose story is "this assembles as you move
      // through it" need direction, which `focus` alone cannot express.
      const pass = focusIdx - i;
      const s = stations[i];
      s.group.visible = d < 3.2 || finaleP > 0.05;
      if (s.group.visible && !reducedMotion) s.update(t, focus, pass);
      else if (s.group.visible) s.update(0, 1, 1);
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
    render();
  } else {
    running = true;
    loop();
  }

  return {
    resize, onPointerMove, setScroll,
    stop() { running = false; cancelAnimationFrame(frame); frame = 0; },
    start() { if (reducedMotion || running) return; running = true; loop(); },
    /** Jump the camera to a station -- used by the chapter rail. */
    stationProgress(index) {
      return (index / (stations.length - 1)) * FINALE_START;
    },
  };
}

/* ==================== stations ==================== */

const mat = (hue, opts = {}) => new THREE.MeshStandardMaterial({
  color: hue, emissive: hue, emissiveIntensity: 0.35,
  roughness: 0.4, metalness: 0.35, ...opts,
});

const lineMat = (hue, opacity = 0.35) => new THREE.LineBasicMaterial({
  color: hue, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false,
});

/** 01 -- scattered inputs converging into a single problem statement. */
function problemStation(hue, density) {
  const group = new THREE.Group();
  const n = Math.round(46 * density);
  const geo = new THREE.BoxGeometry(1.5, 1.9, 0.16);
  const mesh = new THREE.InstancedMesh(geo, mat(hue, { transparent: true, opacity: 0.9 }), n);
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  group.add(mesh);

  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(2.4, 2), mat(0xe8f2ff, { emissiveIntensity: 0.7 }));
  group.add(core);

  const seeds = Array.from({ length: n }, () => ({
    scatter: new THREE.Vector3(
      (Math.random() - 0.5) * 54, (Math.random() - 0.5) * 34, (Math.random() - 0.5) * 44
    ),
    spin: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
    phase: Math.random() * 6.28,
  }));

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const pos = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);

  return {
    group,
    update(t, focus, pass = 1) {
      // Driven by how far the visitor has travelled, not by proximity: at the
      // hero this must read as scattered chaos, converging only as they move
      // on. Using `focus` here collapsed it before anyone had scrolled.
      const gather = THREE.MathUtils.clamp(pass + 0.12, 0, 1) ** 1.6;
      for (let i = 0; i < n; i++) {
        const s = seeds[i];
        pos.copy(s.scatter).multiplyScalar(1 - gather * 0.86);
        pos.y += Math.sin(t * 0.7 + s.phase) * (1 - gather) * 1.5;
        q.setFromEuler(new THREE.Euler(
          s.spin.x + t * 0.1 * (1 - gather),
          s.spin.y + t * 0.12 * (1 - gather),
          s.spin.z * (1 - gather)
        ));
        m.compose(pos, q, one);
        mesh.setMatrixAt(i, m);
      }
      mesh.instanceMatrix.needsUpdate = true;
      core.scale.setScalar(0.3 + gather * 0.9 + Math.sin(t * 1.6) * 0.04);
      core.material.emissiveIntensity = 0.2 + gather * 0.9;
    },
  };
}

/** 02 -- BA at the centre of a stakeholder ring, with live connections. */
function stakeholderStation(hue, density) {
  const group = new THREE.Group();
  const COUNT = 8;
  const R = 15;

  const hub = new THREE.Mesh(new THREE.OctahedronGeometry(2.6, 1), mat(0xeaf3ff, { emissiveIntensity: 0.65 }));
  group.add(hub);

  const nodes = [];
  const edgePts = [];
  for (let i = 0; i < COUNT; i++) {
    const a = (i / COUNT) * Math.PI * 2;
    const p = new THREE.Vector3(Math.cos(a) * R, Math.sin(a * 2) * 3.4, Math.sin(a) * R);
    const node = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), mat(hue));
    node.position.copy(p);
    group.add(node);
    nodes.push({ node, home: p.clone(), phase: i * 0.8 });
    edgePts.push(new THREE.Vector3(), p.clone());
  }
  const edges = new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints(edgePts), lineMat(hue, 0.4)
  );
  group.add(edges);

  const pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 3), 3));
  const pulses = new THREE.Points(pulseGeo, new THREE.PointsMaterial({
    color: hue, size: 1.1, transparent: true, opacity: 0.95,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  group.add(pulses);

  return {
    group,
    update(t, focus) {
      group.rotation.y = t * 0.05;
      hub.rotation.y = -t * 0.3;
      hub.scale.setScalar(0.4 + focus * 0.8);
      const arr = pulseGeo.attributes.position.array;
      nodes.forEach((n, i) => {
        n.node.position.copy(n.home).multiplyScalar(0.35 + focus * 0.65);
        n.node.position.y += Math.sin(t * 0.9 + n.phase) * 0.7;
        n.node.rotation.x = t * 0.4;
        // Information travelling inward: stakeholders feed the analyst.
        const p = ((t * 0.22 + i / COUNT) % 1);
        arr[i * 3] = n.node.position.x * (1 - p);
        arr[i * 3 + 1] = n.node.position.y * (1 - p);
        arr[i * 3 + 2] = n.node.position.z * (1 - p);
      });
      pulseGeo.attributes.position.needsUpdate = true;
      pulses.material.opacity = focus * 0.95;
      edges.material.opacity = focus * 0.45;
    },
  };
}

/** 03 -- messy input snapping into an ordered requirements stack. */
function requirementsStation(hue) {
  const group = new THREE.Group();
  const N = 8;
  const plates = [];
  for (let i = 0; i < N; i++) {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(13, 0.42, 8.4),
      mat(hue, { transparent: true, opacity: 0.9, emissiveIntensity: 0.28 })
    );
    const chaos = new THREE.Vector3(
      (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 26, (Math.random() - 0.5) * 24
    );
    const chaosRot = new THREE.Euler((Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 2.4, (Math.random() - 0.5) * 2.4);
    group.add(plate);
    plates.push({ plate, chaos, chaosRot, ordered: new THREE.Vector3(0, (i - (N - 1) / 2) * 2.5, 0) });
  }
  const edge = new THREE.Mesh(
    new THREE.BoxGeometry(13.6, N * 2.5 + 1.2, 9),
    new THREE.MeshBasicMaterial({ color: hue, wireframe: true, transparent: true, opacity: 0.14 })
  );
  group.add(edge);

  return {
    group,
    update(t, focus) {
      const order = focus * focus * (3 - 2 * focus);
      plates.forEach((p, i) => {
        p.plate.position.lerpVectors(p.chaos, p.ordered, order);
        p.plate.rotation.set(
          p.chaosRot.x * (1 - order),
          p.chaosRot.y * (1 - order) + t * 0.04,
          p.chaosRot.z * (1 - order)
        );
        p.plate.material.opacity = 0.55 + order * 0.4;
        p.plate.material.emissiveIntensity = 0.2 + order * 0.5 * (0.6 + 0.4 * Math.sin(t * 1.4 + i));
      });
      edge.scale.setScalar(0.9 + order * 0.1);
      edge.material.opacity = order * 0.16;
    },
  };
}

/** 04 -- a delivery board with work crossing columns toward done. */
function agileStation(hue) {
  const group = new THREE.Group();
  const COLS = 6;
  const GAP = 6.4;
  const x0 = -((COLS - 1) * GAP) / 2;

  for (let c = 0; c < COLS; c++) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 17, 0.3),
      new THREE.MeshBasicMaterial({ color: hue, wireframe: true, transparent: true, opacity: 0.22 })
    );
    frame.position.set(x0 + c * GAP, 0, 0);
    group.add(frame);
  }

  const CARDS = 12;
  const cards = [];
  for (let i = 0; i < CARDS; i++) {
    const card = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.5, 0.5), mat(hue, { emissiveIntensity: 0.3 }));
    group.add(card);
    cards.push({ card, lane: i % 4, offset: i / CARDS, speed: 0.05 + (i % 5) * 0.012 });
  }

  return {
    group,
    update(t, focus) {
      cards.forEach((c) => {
        // Work marches left to right; done cards brighten.
        const p = (c.offset + t * c.speed * focus) % 1;
        const col = p * (COLS - 1);
        c.card.position.set(x0 + col * GAP, 6.5 - c.lane * 3.6, 0.6);
        c.card.material.emissiveIntensity = 0.2 + Math.pow(p, 3) * 1.1;
        c.card.scale.setScalar(0.6 + focus * 0.4);
      });
      group.rotation.y = Math.sin(t * 0.12) * 0.12;
    },
  };
}

/** 05 -- source-to-insight pipeline with records flowing through. */
function dataStation(hue, density) {
  const group = new THREE.Group();
  const STAGES = 8;
  const GAP = 7.2;
  const x0 = -((STAGES - 1) * GAP) / 2;
  const rings = [];
  for (let i = 0; i < STAGES; i++) {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(3.1, 0.16, 8, 40),
      mat(hue, { emissiveIntensity: 0.5 })
    );
    ring.rotation.y = Math.PI / 2;
    ring.position.x = x0 + i * GAP;
    group.add(ring);
    rings.push(ring);
  }

  const N = Math.round(260 * density);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const flow = new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0xdfeaff, size: 0.42, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  group.add(flow);
  const seeds = Array.from({ length: N }, () => ({
    off: Math.random(), r: Math.random() * 2.4, a: Math.random() * 6.28, sp: 0.05 + Math.random() * 0.07,
  }));

  const span = (STAGES - 1) * GAP;
  return {
    group,
    update(t, focus) {
      const arr = geo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        const s = seeds[i];
        const p = (s.off + t * s.sp * focus) % 1;
        arr[i * 3] = x0 + p * span;
        arr[i * 3 + 1] = Math.sin(s.a + p * 8) * s.r;
        arr[i * 3 + 2] = Math.cos(s.a + p * 8) * s.r;
      }
      geo.attributes.position.needsUpdate = true;
      flow.material.opacity = focus * 0.9;
      rings.forEach((r, i) => {
        r.scale.setScalar(0.5 + focus * (0.6 + 0.12 * Math.sin(t * 2 + i)));
        r.material.emissiveIntensity = 0.25 + focus * 0.6;
      });
    },
  };
}

/** 06 -- AI proposes, a human validates, then the decision is made. */
function aiStation(hue) {
  const group = new THREE.Group();

  const engine = new THREE.Mesh(new THREE.IcosahedronGeometry(4.6, 3), new THREE.MeshBasicMaterial({
    color: hue, wireframe: true, transparent: true, opacity: 0.5,
  }));
  group.add(engine);
  const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(2.6, 2), mat(hue, { emissiveIntensity: 0.8 }));
  group.add(inner);

  // Human validation gate sits downstream: nothing passes without it.
  const gate = new THREE.Mesh(new THREE.TorusGeometry(3.4, 0.22, 8, 32), mat(0xeaf3ff, { emissiveIntensity: 0.6 }));
  gate.position.x = 16;
  gate.rotation.y = Math.PI / 2;
  group.add(gate);

  const decision = new THREE.Mesh(new THREE.OctahedronGeometry(2, 1), mat(0xeaf3ff, { emissiveIntensity: 0.7 }));
  decision.position.x = 28;
  group.add(decision);

  group.add(new THREE.LineSegments(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-22, 0, 0), new THREE.Vector3(-5, 0, 0),
      new THREE.Vector3(5, 0, 0), gate.position.clone(),
      gate.position.clone(), decision.position.clone(),
    ]),
    lineMat(hue, 0.4)
  ));

  const N = 90;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  const stream = new THREE.Points(geo, new THREE.PointsMaterial({
    color: hue, size: 0.5, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  group.add(stream);
  const seeds = Array.from({ length: N }, (_, i) => ({
    off: i / N, lane: (i % 5 - 2) * 1.5, sp: 0.06 + (i % 4) * 0.01,
  }));

  return {
    group,
    update(t, focus) {
      engine.rotation.y = t * 0.22;
      engine.rotation.x = t * 0.1;
      inner.scale.setScalar(0.5 + focus * 0.6 + Math.sin(t * 2.2) * 0.05);
      gate.rotation.z = t * 0.5;
      gate.scale.setScalar(0.6 + focus * 0.5);
      decision.rotation.y = t * 0.4;
      decision.material.emissiveIntensity = 0.3 + focus * 0.9;

      const arr = geo.attributes.position.array;
      for (let i = 0; i < N; i++) {
        const s = seeds[i];
        const p = (s.off + t * s.sp * focus) % 1;
        // Inputs funnel in, then a single validated stream continues out.
        arr[i * 3] = -22 + p * 50;
        const converge = Math.max(0, 1 - Math.abs(p - 0.44) * 4);
        arr[i * 3 + 1] = s.lane * (1 - converge) * (p < 0.5 ? 1 : 0.35);
        arr[i * 3 + 2] = s.lane * 0.6 * (1 - converge) * (p < 0.5 ? 1 : 0.2);
      }
      geo.attributes.position.needsUpdate = true;
      stream.material.opacity = focus * 0.9;
    },
  };
}

/** 07 -- gates a change has to pass, with a defect loop back. */
function uatStation(hue) {
  const group = new THREE.Group();
  const GATES = 5;
  const GAP = 8;
  const x0 = -((GATES - 1) * GAP) / 2;
  const gates = [];
  for (let i = 0; i < GATES; i++) {
    const g = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 9, 9),
      new THREE.MeshBasicMaterial({ color: hue, wireframe: true, transparent: true, opacity: 0.3 })
    );
    g.position.x = x0 + i * GAP;
    group.add(g);
    gates.push(g);
  }
  const token = new THREE.Mesh(new THREE.IcosahedronGeometry(1.1, 2), mat(0xeaf3ff, { emissiveIntensity: 0.8 }));
  group.add(token);

  // The retest loop: a failed check sends the token back, not forward.
  const loop = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
      new THREE.CubicBezierCurve3(
        new THREE.Vector3(x0 + 3 * GAP, 0, 0),
        new THREE.Vector3(x0 + 2.4 * GAP, -11, 0),
        new THREE.Vector3(x0 + 0.8 * GAP, -11, 0),
        new THREE.Vector3(x0 + GAP, 0, 0)
      ).getPoints(40)
    ),
    lineMat(hue, 0.35)
  );
  group.add(loop);

  const span = (GATES - 1) * GAP;
  return {
    group,
    update(t, focus) {
      const cycle = (t * 0.14 * (0.3 + focus)) % 1.35;
      if (cycle <= 1) {
        token.position.set(x0 + cycle * span, 0, 0);
      } else {
        // Failed: dip under and return upstream before trying again.
        const b = (cycle - 1) / 0.35;
        token.position.set(x0 + span - b * span * 0.55, -Math.sin(b * Math.PI) * 10, 0);
      }
      token.rotation.y = t * 0.8;
      token.scale.setScalar(0.5 + focus * 0.6);
      gates.forEach((g, i) => {
        const passed = token.position.x > g.position.x && token.position.y > -1;
        g.material.opacity = 0.16 + (passed ? 0.5 : 0.12) * focus;
        g.scale.y = 0.7 + focus * 0.3;
      });
    },
  };
}

/** 08 -- measured outcomes converging into business value. */
function impactStation(hue) {
  const group = new THREE.Group();
  const N = 6;
  const bars = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 10, 10), mat(hue, { emissiveIntensity: 0.4 }));
    bar.position.set(Math.cos(a) * 12, 0, Math.sin(a) * 12);
    group.add(bar);
    bars.push({ bar, phase: i * 0.9, target: 5 + (i % 3) * 4 });
  }
  const apex = new THREE.Mesh(new THREE.IcosahedronGeometry(3, 3), mat(0xffffff, { emissiveIntensity: 0.9 }));
  apex.position.y = 13;
  group.add(apex);

  const beamPts = [];
  bars.forEach(({ bar }) => beamPts.push(bar.position.clone(), apex.position.clone()));
  const beams = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(beamPts), lineMat(hue, 0.3));
  group.add(beams);

  return {
    group,
    update(t, focus) {
      bars.forEach(({ bar, phase, target }) => {
        const h = 0.15 + focus * (target / 10) * (0.9 + 0.1 * Math.sin(t * 1.5 + phase));
        bar.scale.y = h;
        bar.position.y = (h * 10) / 2 - 5;
        bar.material.emissiveIntensity = 0.2 + focus * 0.7;
      });
      apex.rotation.y = t * 0.3;
      apex.scale.setScalar(0.4 + focus * 0.8 + Math.sin(t * 2) * 0.04);
      beams.material.opacity = focus * 0.35;
      group.rotation.y = t * 0.04;
    },
  };
}

const BUILDERS = {
  problem: problemStation,
  stakeholders: stakeholderStation,
  requirements: requirementsStation,
  agile: agileStation,
  data: dataStation,
  ai: aiStation,
  uat: uatStation,
  impact: impactStation,
};

/** Ambient depth particles across the whole world. */
function buildDust(count) {
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 620;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 220;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 620;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(geo, new THREE.PointsMaterial({
    color: 0x8fb0d8, size: 0.5, transparent: true, opacity: 0.42,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  }));
}
