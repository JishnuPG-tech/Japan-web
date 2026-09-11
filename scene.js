import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';
import { SEASONS, clamp, seededRandom } from './world.js';

export function createWorld(container, initialState, onContextLost) {
  const state = { ...initialState };
  const compact = container.clientWidth < 550;
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = !compact;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-11, 11, 9, -9, 0.1, 100);
  const root = new THREE.Group();
  const scenery = new THREE.Group();
  scene.add(root);
  root.add(scenery);
  const hemisphere = new THREE.HemisphereLight('#fff4dc', '#65806e', 2.8);
  const sunlight = new THREE.DirectionalLight('#fff0d5', 3.3);
  sunlight.position.set(-6, 12, 8);
  sunlight.castShadow = !compact;
  sunlight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunlight.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 40 });
  sunlight.shadow.normalBias = 0.06;
  const rim = new THREE.DirectionalLight('#b7d2cf', 1.4);
  rim.position.set(7, 5, -6);
  scene.add(hemisphere, sunlight, rim);

  const geometries = {
    box: new THREE.BoxGeometry(1, 1, 1),
    trunk: new THREE.CylinderGeometry(1, 1, 1, 7),
    cone: new THREE.ConeGeometry(1, 1, 12),
    roof: new THREE.ConeGeometry(1, 1, 4),
    rock: new THREE.DodecahedronGeometry(1, 0),
    island: new THREE.CylinderGeometry(1, 0.82, 1, 15),
    disc: new THREE.CircleGeometry(1, 64),
    ring: new THREE.RingGeometry(0.985, 1, 64),
    bird: new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-0.22, 0, 0), new THREE.Vector3(0, 0.08, 0), new THREE.Vector3(0.22, 0, 0),
    ]),
  };
  const materials = new Map();
  function material(color) {
    if (!materials.has(color)) materials.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true }));
    return materials.get(color);
  }
  const palette = SEASONS[state.season];
  const foliage = new THREE.MeshStandardMaterial({ color: palette.foliage, roughness: 1, flatShading: true });
  const terrain = new THREE.MeshStandardMaterial({ color: palette.ground, roughness: 1, flatShading: true });
  const water = new THREE.MeshStandardMaterial({ color: palette.water, metalness: 0.18, roughness: 0.28, transparent: true, opacity: 0.91 });
  const lantern = new THREE.MeshStandardMaterial({ color: '#f6dfa1', emissive: '#ffb44b', emissiveIntensity: 0.1 });
  const rippleMaterial = new THREE.MeshBasicMaterial({ color: '#e3ece0', transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false });
  const birdMaterial = new THREE.LineBasicMaterial({ color: '#67766c', transparent: true, opacity: 0.7 });

  function mesh(parent, shape, color, position, scale, rotation = null) {
    const object = new THREE.Mesh(geometries[shape], typeof color === 'string' ? material(color) : color);
    object.position.set(...position);
    object.scale.set(...scale);
    if (rotation) object.rotation.set(...rotation);
    object.castShadow = shape !== 'disc' && shape !== 'ring';
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }
  function group(parent, x, y, z, size = 1) {
    const object = new THREE.Group();
    object.position.set(x, y, z);
    object.scale.setScalar(size);
    parent.add(object);
    return object;
  }
  function tree(parent, x, z, size, random) {
    const treeRoot = group(parent, x, 0.15, z, size);
    mesh(treeRoot, 'trunk', '#77624e', [0, 0.9, 0], [0.11, 1.8, 0.11]);
    for (let index = 0; index < 3; index++) {
      const angle = index * Math.PI * 2 / 3;
      mesh(treeRoot, 'trunk', '#77624e', [Math.cos(angle) * 0.23, 1.5, Math.sin(angle) * 0.23], [0.05, 0.8, 0.05], [Math.sin(angle) * 0.65, 0, -Math.cos(angle) * 0.65]);
    }
    for (let index = 0; index < 6; index++) {
      const angle = index * Math.PI * 2 / 5;
      const radius = index === 5 ? 0 : 0.5;
      mesh(treeRoot, 'rock', foliage, [Math.cos(angle) * radius, 1.9 + random() * 0.5, Math.sin(angle) * radius], [0.65, 0.57, 0.62], [random(), random(), 0]);
    }
  }
  function torii(parent, x, z, size = 1) {
    const gate = group(parent, x, 0.1, z, size);
    for (const side of [-1, 1]) {
      mesh(gate, 'trunk', '#b8523d', [side, 1.35, 0], [0.12, 2.7, 0.12], [0, 0, side * 0.025]);
      mesh(gate, 'trunk', '#46574c', [side * 1.035, 0.15, 0], [0.16, 0.3, 0.16]);
      mesh(gate, 'box', '#b8523d', [side * 0.77, 2.78, 0], [1.6, 0.19, 0.28], [0, 0, side * 0.055]);
      mesh(gate, 'box', '#3e5149', [side * 0.77, 2.9, 0], [1.7, 0.11, 0.34], [0, 0, side * 0.055]);
    }
    mesh(gate, 'box', '#b8523d', [0, 2.32, 0], [2.65, 0.16, 0.19]);
    mesh(gate, 'box', '#b8523d', [0, 2.6, 0], [0.14, 0.55, 0.16]);
    mesh(gate, 'box', '#d7b980', [0, 2.61, 0.12], [0.2, 0.33, 0.06]);
  }
  function pagoda(parent, x, z, size = 1) {
    const temple = group(parent, x, 0.15, z, size);
    mesh(temple, 'box', '#b8b5a1', [0, 0.12, 0], [2.6, 0.24, 2.6]);
    for (let level = 0; level < 4; level++) {
      const width = 2.1 - level * 0.28;
      const y = 0.5 + level * 0.85;
      mesh(temple, 'box', '#b86149', [0, y, 0], [width * 0.7, 0.65, width * 0.7]);
      for (const side of [-1, 1]) {
        mesh(temple, 'box', '#f0d7a8', [side * width * 0.2, y, width * 0.355], [width * 0.19, 0.35, 0.025]);
        mesh(temple, 'box', '#f0d7a8', [width * 0.355, y, side * width * 0.2], [0.025, 0.35, width * 0.19]);
      }
      mesh(temple, 'roof', '#485d53', [0, y + 0.48, 0], [width, 0.6, width], [0, Math.PI / 4, 0]);
      mesh(temple, 'box', '#934932', [0, y - 0.26, 0], [width * 0.88, 0.07, width * 0.88]);
    }
    mesh(temple, 'trunk', '#b9a26b', [0, 4.05, 0], [0.035, 0.95, 0.035]);
    for (let index = 0; index < 4; index++) mesh(temple, 'trunk', '#b9a26b', [0, 3.8 + index * 0.13, 0], [0.12 - index * 0.015, 0.035, 0.12 - index * 0.015]);
  }
  function bamboo(parent, x, z, height, random) {
    const plant = group(parent, x, 0.12, z);
    plant.rotation.z = (random() - 0.5) * 0.07;
    mesh(plant, 'trunk', '#688a57', [0, height / 2, 0], [0.085, height, 0.085]);
    for (let y = 0.6; y < height; y += 0.7) {
      mesh(plant, 'trunk', '#b0bd83', [0, y, 0], [0.098, 0.04, 0.098]);
    }
    for (let index = 0; index < 4; index++) {
      const angle = random() * Math.PI * 2;
      const y = height * (0.57 + random() * 0.37);
      mesh(plant, 'rock', '#597c4f', [Math.cos(angle) * 0.33, y, Math.sin(angle) * 0.33], [0.52, 0.045, 0.13], [0, -angle, 0.3]);
    }
  }
  function stoneLantern(parent, x, z) {
    mesh(parent, 'box', '#999c88', [x, 0.14, z], [0.4, 0.28, 0.4]);
    mesh(parent, 'trunk', '#999c88', [x, 0.48, z], [0.09, 0.5, 0.09]);
    mesh(parent, 'box', lantern, [x, 0.85, z], [0.27, 0.25, 0.27]);
    mesh(parent, 'roof', '#687663', [x, 1.08, z], [0.35, 0.25, 0.35], [0, Math.PI / 4, 0]);
  }
  let ripples = [];
  let birds = [];
  function buildDestination() {
    // Meshes share a small pool of geometries/materials, so switching scenes does not allocate GPU assets.
    scenery.clear();
    ripples = [];
    birds = [];
    const random = seededRandom(state.destination === 'fuji' ? 17 : state.destination === 'kyoto' ? 31 : 53);
    mesh(scenery, 'island', '#818b6e', [0, -0.62, 0], [7.7, 1.4, 6.1]);
    mesh(scenery, 'island', terrain, [0, 0.05, 0], [7.72, 0.18, 6.12]);
    mesh(scenery, 'disc', water, [0, 0.155, 2.1], [5.05, 2.85, 1], [-Math.PI / 2, 0, 0]);
    for (let index = 0; index < 3; index++) {
      const ripple = mesh(scenery, 'ring', rippleMaterial, [-1 + index * 1.1, 0.175 + index * 0.003, 2 + index * 0.5], [0.6 + index * 0.3, 0.3 + index * 0.15, 1], [-Math.PI / 2, 0, 0]);
      ripple.userData.baseScale = ripple.scale.clone();
      ripples.push(ripple);
    }
    for (let index = 0; index < 22; index++) {
      const angle = random() * Math.PI * 2;
      const x = Math.cos(angle) * (6.5 + random() * 0.6);
      const z = Math.sin(angle) * (4.8 + random() * 0.4);
      const size = 0.18 + random() * 0.42;
      mesh(scenery, 'rock', index % 3 === 0 ? '#a4ae95' : '#82927b', [x, 0.2, z], [size, size * 0.7, size], [random(), random(), random()]);
    }
    if (state.destination === 'fuji') {
      mesh(scenery, 'cone', '#8d9e96', [-1.25, 2.88, -2.2], [3.4, 5.5, 3.4]);
      mesh(scenery, 'cone', '#f1f2e9', [-1.25, 4.77, -2.2], [1.08, 1.76, 1.08]);
      mesh(scenery, 'rock', terrain, [-4.4, 0.37, -2.3], [1.9, 0.7, 1.5]);
      mesh(scenery, 'rock', terrain, [3.1, 0.26, -2.7], [2.0, 0.55, 1.7]);
      pagoda(scenery, 3.65, -0.8, 0.72);
      torii(scenery, 1.7, 2.5, 0.72);
      for (const [x, z, size] of [[-4.7, 0.3, 1.1], [-5.2, 2, 0.85], [-3.7, 3.9, 0.9], [4.5, 2.8, 1], [5.4, 0.4, 0.8], [2.8, -3.5, 0.75]]) tree(scenery, x, z, size, random);
    } else if (state.destination === 'kyoto') {
      mesh(scenery, 'box', '#c2b798', [0.5, 0.2, 0.7], [1.8, 0.09, 6.6]);
      pagoda(scenery, -2.5, -1.5, 1.22);
      torii(scenery, 0.5, 3.5, 1);
      torii(scenery, 0.5, 1.4, 0.9);
      torii(scenery, 0.5, -0.6, 0.8);
      torii(scenery, 0.5, -2.5, 0.7);
      for (let index = 0; index < 8; index++) tree(scenery, (index % 2 ? -1 : 1) * (3.8 + random()), -3.5 + Math.floor(index / 2) * 2, 0.85 + random() * 0.3, random);
      stoneLantern(scenery, -0.9, 2.6);
      stoneLantern(scenery, 1.9, 2.6);
    } else {
      mesh(scenery, 'box', '#baad8a', [0, 0.2, -1.9], [1.6, 0.1, 6]);
      for (let index = 0; index < (compact ? 24 : 36); index++) {
        const side = index % 2 ? -1 : 1;
        bamboo(scenery, side * (1.5 + random() * 4.1), -4.3 + random() * 7.7, 2.8 + random() * 2.8, random);
      }
      for (let index = 0; index < 13; index++) {
        const x = -2.1 + index * 0.35;
        mesh(scenery, 'box', '#a28159', [x, 0.3 + Math.sin(index / 12 * Math.PI) * 0.23, 2.4], [0.32, 0.13, 1.25]);
      }
      for (const z of [1.7, 3.1]) {
        mesh(scenery, 'box', '#8d6248', [0, 1.0, z], [4.7, 0.08, 0.08]);
        for (const x of [-2.1, -0.7, 0.7, 2.1]) mesh(scenery, 'box', '#8d6248', [x, 0.68, z], [0.08, 0.8, 0.08]);
      }
      torii(scenery, 0, -3.2, 0.65);
      stoneLantern(scenery, -1.2, 0.5);
      stoneLantern(scenery, 1.2, 0.5);
    }
    for (let index = 0; index < 3; index++) {
      const bird = new THREE.Line(geometries.bird, birdMaterial);
      bird.position.set(index - 2, 6 + index * 0.2, -3);
      scenery.add(bird);
      birds.push(bird);
    }
  }

  const shadowCanvas = document.createElement('canvas');
  shadowCanvas.width = shadowCanvas.height = 64;
  const shadowContext = shadowCanvas.getContext('2d');
  const gradient = shadowContext.createRadialGradient(32, 32, 1, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(40,65,48,0.24)');
  gradient.addColorStop(1, 'rgba(40,65,48,0)');
  shadowContext.fillStyle = gradient;
  shadowContext.fillRect(0, 0, 64, 64);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
  const shadowMaterial = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
  mesh(scene, 'disc', shadowMaterial, [0, -1.65, 0], [10, 8, 1], [-Math.PI / 2, 0, 0]);

  const particleCanvas = document.createElement('canvas');
  particleCanvas.width = particleCanvas.height = 32;
  const particleContext = particleCanvas.getContext('2d');
  particleContext.fillStyle = '#fff';
  particleContext.beginPath();
  particleContext.ellipse(16, 16, 6, 12, 0.5, 0, Math.PI * 2);
  particleContext.fill();
  const particleTexture = new THREE.CanvasTexture(particleCanvas);
  const particleCount = compact ? 75 : 150;
  const positions = new Float32Array(particleCount * 3);
  const random = seededRandom(81);
  for (let index = 0; index < particleCount; index++) {
    positions[index * 3] = (random() - 0.5) * 18;
    positions[index * 3 + 1] = random() * 10;
    positions[index * 3 + 2] = (random() - 0.5) * 13;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({ color: palette.particle, map: particleTexture, size: 0.14, transparent: true, opacity: 0.8, depthWrite: false, sizeAttenuation: true });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  root.add(particles);

  let disposed = false;
  let lost = false;
  let visible = true;
  let frame = 0;
  let previousTime = performance.now();
  let elapsed = 0;
  let targetYaw = -0.25;
  let yaw = targetYaw;
  let targetPitch = 0.58;
  let pitch = targetPitch;
  let zoom = 1;
  let pointer = null;
  const listeners = [];
  function listen(target, name, handler, options) {
    target.addEventListener(name, handler, options);
    listeners.push(() => target.removeEventListener(name, handler, options));
  }
  function requestRender() {
    if (!frame && !disposed && !lost && visible && !document.hidden) frame = requestAnimationFrame(render);
  }
  function render(now) {
    frame = 0;
    if (disposed || lost || !visible || document.hidden) return;
    const delta = Math.min((now - previousTime) / 1000, 0.05);
    previousTime = now;
    const smoothing = state.paused ? 1 : 1 - Math.exp(-delta * 9);
    yaw += (targetYaw - yaw) * smoothing;
    pitch += (targetPitch - pitch) * smoothing;
    if (!state.paused) {
      elapsed += delta;
      root.position.y = Math.sin(elapsed * 0.65) * 0.08;
      for (let index = 0; index < particleCount; index++) {
        const offset = index * 3;
        positions[offset] += delta * (0.19 + Math.sin(elapsed + index) * 0.11);
        positions[offset + 1] -= delta * (state.season === 'winter' ? 0.5 : 0.28);
        if (positions[offset + 1] < -0.3) positions[offset + 1] = 9;
        if (positions[offset] > 9) positions[offset] = -9;
      }
      particleGeometry.attributes.position.needsUpdate = true;
      ripples.forEach((ripple, index) => ripple.scale.copy(ripple.userData.baseScale).multiplyScalar(1 + Math.sin(elapsed * 0.8 + index) * 0.08));
      birds.forEach((bird, index) => {
        bird.position.x = Math.sin(elapsed * 0.12 + index * 0.25) * 5;
        bird.position.y = 6.2 + index * 0.24 + Math.sin(elapsed * 0.8 + index) * 0.12;
        bird.rotation.z = Math.sin(elapsed * 1.5 + index) * 0.1;
      });
    }
    root.rotation.y = yaw + Math.sin(elapsed * 0.12) * 0.08;
    camera.position.set(11 * Math.cos(pitch), 22 * Math.sin(pitch), 18 * Math.cos(pitch));
    camera.lookAt(0, 1.6, 0);
    renderer.render(scene, camera);
    if (!state.paused) requestRender();
  }
  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height || disposed) return;
    renderer.setSize(width, height);
    const aspect = width / height;
    const vertical = Math.max(13.6, 20 / aspect);
    camera.left = -vertical * aspect / 2;
    camera.right = vertical * aspect / 2;
    camera.top = vertical / 2;
    camera.bottom = -vertical / 2;
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
    requestRender();
  }
  function resetView() {
    targetYaw = -0.25;
    targetPitch = 0.58;
    zoom = 1;
    resize();
  }
  function setNight(value) {
    state.night = value;
    hemisphere.intensity = value ? 1.1 : 2.8;
    hemisphere.color.set(value ? '#96b6d5' : '#fff4dc');
    sunlight.intensity = value ? 0.65 : 3.3;
    sunlight.color.set(value ? '#a4c2e9' : '#fff0d5');
    rim.intensity = value ? 1.9 : 1.4;
    lantern.emissiveIntensity = value ? 2.5 : 0.1;
    renderer.toneMappingExposure = value ? 0.95 : 1.25;
    requestRender();
  }
  function setSeason(key) {
    if (!Object.hasOwn(SEASONS, key)) return;
    state.season = key;
    const colors = SEASONS[key];
    foliage.color.set(colors.foliage);
    terrain.color.set(colors.ground);
    water.color.set(colors.water);
    particleMaterial.color.set(colors.particle);
    particleMaterial.size = key === 'winter' ? 0.1 : 0.14;
    particleMaterial.opacity = key === 'summer' ? 0.35 : 0.8;
    requestRender();
  }
  listen(container, 'pointerdown', event => {
    if (event.button !== 0 || pointer) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    container.setPointerCapture(event.pointerId);
    container.classList.add('dragging');
    container.focus({ preventScroll: true });
  });
  listen(container, 'pointermove', event => {
    if (!pointer || event.pointerId !== pointer.id) return;
    targetYaw += (event.clientX - pointer.x) * 0.008;
    targetPitch = clamp(targetPitch + (event.clientY - pointer.y) * 0.003, 0.3, 1.0);
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    requestRender();
  });
  function releasePointer(event) {
    if (!pointer || event.pointerId !== pointer.id) return;
    if (container.hasPointerCapture(event.pointerId)) container.releasePointerCapture(event.pointerId);
    pointer = null;
    container.classList.remove('dragging');
  }
  listen(container, 'pointerup', releasePointer);
  listen(container, 'pointercancel', releasePointer);
  listen(container, 'lostpointercapture', releasePointer);
  listen(container, 'keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowLeft') targetYaw -= 0.15;
    if (event.key === 'ArrowRight') targetYaw += 0.15;
    if (event.key === 'ArrowUp') targetPitch = clamp(targetPitch + 0.08, 0.3, 1);
    if (event.key === 'ArrowDown') targetPitch = clamp(targetPitch - 0.08, 0.3, 1);
    if (['+', '='].includes(event.key)) zoom = clamp(zoom + 0.1, 0.75, 1.45);
    if (event.key === '-') zoom = clamp(zoom - 0.1, 0.75, 1.45);
    if (event.key === 'Home') resetView();
    resize();
  });
  listen(document, 'visibilitychange', () => { previousTime = performance.now(); requestRender(); });
  listen(renderer.domElement, 'webglcontextlost', event => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    onContextLost();
  });
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersectionObserver = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    previousTime = performance.now();
    requestRender();
  }, { threshold: 0 });
  intersectionObserver.observe(container);
  buildDestination();
  setNight(state.night);
  resize();

  return {
    setSeason,
    setNight,
    resetView,
    setDestination(key) {
      state.destination = key;
      buildDestination();
      resetView();
    },
    setPaused(value) {
      state.paused = value;
      previousTime = performance.now();
      requestRender();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      listeners.forEach(remove => remove());
      Object.values(geometries).forEach(geometry => geometry.dispose());
      materials.forEach(value => value.dispose());
      [foliage, terrain, water, lantern, rippleMaterial, birdMaterial, particleMaterial, shadowMaterial].forEach(value => value.dispose());
      particleGeometry.dispose();
      particleTexture.dispose();
      shadowTexture.dispose();
      scene.clear();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
