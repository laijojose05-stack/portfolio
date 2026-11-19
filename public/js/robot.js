/* ==========================================================================
 * Interactive 3D Professional Robot Companion
 * Inspired by retro-futuristic rounded monitor aesthetics & developer themes
 * Built with Three.js (via importmap), zero external wasm, 100% CSP-safe
 *
 * Features:
 *  1. Rounded-beveled monitor CRT head with glossy screen and glowing pink eyes
 *  2. Warm brushed copper/bronze chassis with studio PBR environment reflections
 *  3. Multi-tiered floating tech pedestal with chamfered obsidian slab
 *  4. Floating 3D "Front" and "End" badges bobbing gently beside the robot
 *  5. Background floating rounded bokeh rings matching the reference artwork
 *  6. Smooth mouse pointer look-at with clamped yaw/pitch & lerp damping
 *  7. Drag-to-rotate body interaction with inertia, grab cursor & auto-recenter
 *  8. touch-action: pan-y on canvas so mobile vertical scrolling remains intact
 *  9. Natural blinking eyes, levitation float, thruster pulse & arm rhythm
 * 10. Pause rendering when off-screen via IntersectionObserver to save battery
 * ========================================================================== */

import * as THREE from 'three';

/* ----------------------------------------------------------------------------
 * Geometry Helpers: Rounded Beveled Boxes & Chamfered Slabs
 * -------------------------------------------------------------------------- */

/**
 * Creates a rounded rectangular box geometry using Shape + ExtrudeGeometry
 */
function createRoundedBoxGeometry(width, height, depth, radius, bevelSegments = 3) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  const w = width;
  const h = height;
  const r = Math.min(radius, w / 2, h / 2);

  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  const extrudeSettings = {
    steps: 1,
    depth: depth,
    bevelEnabled: true,
    bevelThickness: r * 0.4,
    bevelSize: r * 0.4,
    bevelOffset: 0,
    bevelSegments: bevelSegments,
  };

  const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geo.center();
  return geo;
}

/**
 * Creates a chamfered platform slab geometry
 */
function createChamferedSlabGeometry(width, length, height, chamfer) {
  const shape = new THREE.Shape();
  const w = width / 2;
  const l = length / 2;
  const c = Math.min(chamfer, w * 0.45, l * 0.45);

  shape.moveTo(-w + c, -l);
  shape.lineTo(w - c, -l);
  shape.lineTo(w, -l + c);
  shape.lineTo(w, l - c);
  shape.lineTo(w - c, l);
  shape.lineTo(-w + c, l);
  shape.lineTo(-w, l - c);
  shape.lineTo(-w, -l + c);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    steps: 1,
    depth: height,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  geo.center();
  geo.rotateX(Math.PI / 2);
  return geo;
}

/**
 * Helper to render crisp floating 3D text textures on a high-DPI canvas
 */
function createTextTexture(text, textColor, glowColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Soft text glow
  ctx.shadowColor = glowColor || 'rgba(255, 170, 70, 0.6)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Clean bold modern font
  ctx.font = '900 86px "Space Grotesk", "JetBrains Mono", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw glow pass
  ctx.fillStyle = textColor;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  // Crisp foreground pass
  ctx.shadowBlur = 0;
  ctx.fillStyle = textColor;
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/* ----------------------------------------------------------------------------
 * Main Robot Application
 * -------------------------------------------------------------------------- */
class RobotApp {
  constructor() {
    this.canvas = document.getElementById('robot-canvas');
    this.container = document.getElementById('robot-container');

    if (!this.canvas || !this.container) return;

    // Accessibility & Motion settings
    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isHeroVisible = true;
    this.rafId = null;

    // Clock
    this.clock = new THREE.Clock();

    // Head pointer tracking state
    this.pointer = { x: 0, y: 0 };
    this.targetHeadRotY = 0;
    this.targetHeadRotX = 0;
    this.currentHeadRotY = 0;
    this.currentHeadRotX = 0;
    this.idleTimeout = null;
    this.isPointerInside = false;

    // Body drag rotation state
    this.isDragging = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    this.bodyRotY = 0;
    this.bodyRotX = 0;
    this.velRotY = 0;
    this.velRotX = 0;
    this.autoRecenterActive = false;
    this.recenterTimeout = null;

    // Blink state
    this.isBlinking = false;
    this.blinkStartTime = 0;
    this.nextBlinkTime = 2.5;

    // Limits (radians)
    this.MAX_HEAD_YAW = THREE.MathUtils.degToRad(35); // ±35° horizontally
    this.MAX_HEAD_PITCH = THREE.MathUtils.degToRad(20); // ±20° vertically
    this.MAX_BODY_PITCH = THREE.MathUtils.degToRad(14); // ±14° tilt limit

    this.initScene();
    this.initStudioEnvironment();
    this.buildRobot();
    this.initLighting();
    this.initEvents();
    this.initObservers();
    this.animate();

    // Signal container loaded state
    this.container.classList.add('is-loaded');
  }

  /* --------------------------------------------------------------------------
   * Scene, Camera & Renderer
   * ------------------------------------------------------------------------ */
  initScene() {
    this.scene = new THREE.Scene();

    const width = this.container.clientWidth || 400;
    const height = this.container.clientHeight || 480;

    // Camera with slight isometric elevated angle to showcase 3D depth & pedestal
    this.camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    this.camera.position.set(0, 0.72, 4.45);
    this.camera.lookAt(0, -0.15, 0);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
  }

  /* --------------------------------------------------------------------------
   * Procedural Studio Environment Map (PBR reflections for metallic copper)
   * ------------------------------------------------------------------------ */
  initStudioEnvironment() {
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      pmremGenerator.compileEquirectangularShader();

      const envScene = new THREE.Scene();
      envScene.background = new THREE.Color(0x0c0e12);

      // Overhead softbox panel
      const topLight = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffeedd, side: THREE.DoubleSide })
      );
      topLight.position.set(0, 5, 0);
      topLight.rotation.x = Math.PI / 2;
      envScene.add(topLight);

      // Warm amber rim panel
      const rimLight = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 6),
        new THREE.MeshBasicMaterial({ color: 0xff9944, side: THREE.DoubleSide })
      );
      rimLight.position.set(-5, 2.5, -4);
      rimLight.lookAt(0, 0, 0);
      envScene.add(rimLight);

      // Cool fill panel
      const fillLight = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 6),
        new THREE.MeshBasicMaterial({ color: 0x44ddbb, side: THREE.DoubleSide })
      );
      fillLight.position.set(4, -1, 3);
      fillLight.lookAt(0, 0, 0);
      envScene.add(fillLight);

      this.scene.environment = pmremGenerator.fromScene(envScene, 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Fallback gracefully if WebGL context does not support PMREM
    }
  }

  /* --------------------------------------------------------------------------
   * Lighting: Warm studio key, intense amber rim highlight & ground bounce
   * ------------------------------------------------------------------------ */
  initLighting() {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xfff7ee, 1.2);
    this.scene.add(ambient);

    // Key light (soft warm white from top-right)
    const keyLight = new THREE.DirectionalLight(0xfffaec, 2.8);
    keyLight.position.set(3.5, 4.2, 3.8);
    this.scene.add(keyLight);

    // Warm amber rim light (creates the iconic glowing edge from the reference artwork)
    const rimLight = new THREE.DirectionalLight(0xff8833, 4.2);
    rimLight.position.set(-3.8, 3.2, -3.0);
    this.scene.add(rimLight);

    // Front fill light
    const fillLight = new THREE.DirectionalLight(0x70c0ff, 0.7);
    fillLight.position.set(1.5, -1.0, 3.0);
    this.scene.add(fillLight);

    // Pedestal bottom glow point light (warm copper bounce)
    this.thrusterLight = new THREE.PointLight(0xff7722, 2.4, 6);
    this.thrusterLight.position.set(0, -1.8, 0);
    this.scene.add(this.thrusterLight);
  }

  /* --------------------------------------------------------------------------
   * Professional 3D Robot Model Hierarchy
   * ------------------------------------------------------------------------ */
  buildRobot() {
    // Hierarchy
    this.masterGroup = new THREE.Group();
    this.floatGroup = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.headGroup = new THREE.Group();

    this.scene.add(this.masterGroup);
    this.masterGroup.add(this.floatGroup);
    this.floatGroup.add(this.bodyGroup);

    /* --- Materials: Warm Bronze / Polished Copper & Obsidian Tech --- */
    // Warm copper metallic material for the outer chassis
    const copperChassisMat = new THREE.MeshStandardMaterial({
      color: 0xc87b40,
      metalness: 0.92,
      roughness: 0.22,
    });

    // Dark titanium / obsidian platform material
    const obsidianMat = new THREE.MeshStandardMaterial({
      color: 0x121417,
      metalness: 0.88,
      roughness: 0.28,
    });

    // Dark glossy glass screen material
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x050608,
      metalness: 0.25,
      roughness: 0.08,
    });

    // Glowing pink/magenta expressive eyes
    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3b6f,
      emissive: 0xff2860,
      emissiveIntensity: 3.4,
      roughness: 0.12,
    });

    // Golden accent trim
    const goldAccentMat = new THREE.MeshStandardMaterial({
      color: 0xe59c44,
      metalness: 0.95,
      roughness: 0.18,
    });

    // Polished chrome joint material
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0x8c949c,
      metalness: 0.95,
      roughness: 0.14,
    });

    // Thruster glow material
    this.thrusterMat = new THREE.MeshStandardMaterial({
      color: 0xff6622,
      emissive: 0xff5511,
      emissiveIntensity: 2.2,
      roughness: 0.2,
    });

    /* ========================================================================
     * 1. Stepped Floating Pedestal Platform (Matching Reference Image)
     * ======================================================================== */
    this.pedestalGroup = new THREE.Group();
    this.floatGroup.add(this.pedestalGroup);
    this.pedestalGroup.position.y = -1.25;

    // Tier 1 (Top Plate): Warm copper rectangular beveled plate
    const topPlateGeo = createRoundedBoxGeometry(0.85, 0.12, 0.85, 0.08, 3);
    const topPlate = new THREE.Mesh(topPlateGeo, copperChassisMat);
    topPlate.position.y = 0.22;
    this.pedestalGroup.add(topPlate);

    // Tier 2 (Step Accent): Golden copper beveled step
    const stepPlateGeo = createRoundedBoxGeometry(1.22, 0.14, 1.22, 0.1, 3);
    const stepPlate = new THREE.Mesh(stepPlateGeo, goldAccentMat);
    stepPlate.position.y = 0.10;
    this.pedestalGroup.add(stepPlate);

    // Tier 3 (Main Platform Slab): Thick chamfered dark obsidian platform
    const mainSlabGeo = createChamferedSlabGeometry(2.35, 2.35, 0.38, 0.42);
    const mainSlab = new THREE.Mesh(mainSlabGeo, obsidianMat);
    mainSlab.position.y = -0.14;
    this.pedestalGroup.add(mainSlab);

    // Tier 4 (Underside Inset): Inset dark metallic base
    const underSlabGeo = createChamferedSlabGeometry(1.6, 1.6, 0.18, 0.3);
    const underSlab = new THREE.Mesh(underSlabGeo, obsidianMat);
    underSlab.position.y = -0.38;
    this.pedestalGroup.add(underSlab);

    // Tier 5 (Thruster Core): Floating anti-gravity emitter ring
    const thrusterGeo = new THREE.TorusGeometry(0.55, 0.045, 16, 32);
    const thrusterRing = new THREE.Mesh(thrusterGeo, this.thrusterMat);
    thrusterRing.rotation.x = Math.PI / 2;
    thrusterRing.position.y = -0.48;
    this.pedestalGroup.add(thrusterRing);

    /* ========================================================================
     * 2. Robot Legs & Pedestal Mount
     * ======================================================================== */
    this.legsGroup = new THREE.Group();
    this.bodyGroup.add(this.legsGroup);
    this.legsGroup.position.y = -0.88;

    const legSpacing = 0.14;
    [-legSpacing, legSpacing].forEach((xPos) => {
      // Cylindrical cyber leg strut
      const legGeo = new THREE.CylinderGeometry(0.042, 0.048, 0.36, 16);
      const leg = new THREE.Mesh(legGeo, chromeMat);
      leg.position.set(xPos, 0.04, 0);
      this.legsGroup.add(leg);

      // Foot pad
      const footGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.06, 16);
      const foot = new THREE.Mesh(footGeo, goldAccentMat);
      foot.position.set(xPos, -0.12, 0);
      this.legsGroup.add(foot);
    });

    /* ========================================================================
     * 3. Sleek Conical Torso
     * ======================================================================== */
    this.torsoGroup = new THREE.Group();
    this.bodyGroup.add(this.torsoGroup);
    this.torsoGroup.position.y = -0.48;

    // Curved bell/conical torso matching reference
    const chestGeo = new THREE.CylinderGeometry(0.36, 0.52, 0.55, 32);
    const chest = new THREE.Mesh(chestGeo, copperChassisMat);
    this.torsoGroup.add(chest);

    // Rounded bottom cap for smooth curvature
    const chestBottomGeo = new THREE.SphereGeometry(0.52, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
    chestBottomGeo.scale(1, 0.45, 1);
    const chestBottom = new THREE.Mesh(chestBottomGeo, copperChassisMat);
    chestBottom.position.y = -0.27;
    this.torsoGroup.add(chestBottom);

    // Golden waist accent rim
    const waistRimGeo = new THREE.TorusGeometry(0.51, 0.025, 16, 32);
    const waistRim = new THREE.Mesh(waistRimGeo, goldAccentMat);
    waistRim.rotation.x = Math.PI / 2;
    waistRim.position.y = -0.26;
    this.torsoGroup.add(waistRim);

    /* ========================================================================
     * 4. Neck Joint & Flared Collar
     * ======================================================================== */
    // Metallic conical collar
    const neckCollarGeo = new THREE.CylinderGeometry(0.18, 0.28, 0.16, 24);
    const neckCollar = new THREE.Mesh(neckCollarGeo, chromeMat);
    neckCollar.position.y = -0.14;
    this.bodyGroup.add(neckCollar);

    // Chrome spherical neck pivot
    const neckBallGeo = new THREE.SphereGeometry(0.14, 20, 20);
    const neckBall = new THREE.Mesh(neckBallGeo, goldAccentMat);
    neckBall.position.y = -0.05;
    this.bodyGroup.add(neckBall);

    /* ========================================================================
     * 5. Retro-Futuristic Rounded Monitor Head (Matching Reference Art)
     * ======================================================================== */
    this.headGroup.position.set(0, 0.32, 0);
    this.bodyGroup.add(this.headGroup);

    // Rounded Monitor Outer Casing (width: 1.28, height: 0.88, depth: 0.72)
    const monitorGeo = createRoundedBoxGeometry(1.28, 0.88, 0.72, 0.22, 4);
    const monitorCasing = new THREE.Mesh(monitorGeo, copperChassisMat);
    this.headGroup.add(monitorCasing);

    // Recessed Glossy Screen Face
    const screenGeo = createRoundedBoxGeometry(1.04, 0.68, 0.06, 0.12, 3);
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.set(0, 0, 0.36);
    this.headGroup.add(screenMesh);

    // Screen inner golden bevel trim
    const screenTrimGeo = createRoundedBoxGeometry(1.08, 0.72, 0.02, 0.14, 2);
    const screenTrim = new THREE.Mesh(screenTrimGeo, goldAccentMat);
    screenTrim.position.set(0, 0, 0.34);
    this.headGroup.add(screenTrim);

    // Expressive Luminescent Pink Eyes (smooth rounded pill capsules)
    this.eyesGroup = new THREE.Group();
    this.eyesGroup.position.set(0, 0.02, 0.40);
    this.headGroup.add(this.eyesGroup);

    const eyeGeo = new THREE.SphereGeometry(0.11, 24, 20);
    eyeGeo.scale(1.15, 1.0, 0.45); // Soft pill capsule shape

    this.leftEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    this.leftEye.position.x = -0.26;

    this.rightEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    this.rightEye.position.x = 0.26;

    this.eyesGroup.add(this.leftEye);
    this.eyesGroup.add(this.rightEye);

    // Circular Ear Ports on sides of head (visible in reference image)
    [-0.67, 0.67].forEach((xPos) => {
      const earGroup = new THREE.Group();
      earGroup.position.set(xPos, 0, 0);

      // Outer bezel ring
      const earRimGeo = new THREE.CylinderGeometry(0.13, 0.13, 0.05, 24);
      earRimGeo.rotateZ(Math.PI / 2);
      const earRim = new THREE.Mesh(earRimGeo, goldAccentMat);
      earGroup.add(earRim);

      // Inset dark socket
      const earInnerGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.06, 24);
      earInnerGeo.rotateZ(Math.PI / 2);
      const earInner = new THREE.Mesh(earInnerGeo, obsidianMat);
      earGroup.add(earInner);

      this.headGroup.add(earGroup);
    });

    /* ========================================================================
     * 6. Floating 3D Text Badges ("Front" & "End" from Reference Artwork)
     * ======================================================================== */
    this.floatingTextGroup = new THREE.Group();
    this.floatGroup.add(this.floatingTextGroup);

    // "Front" Text (Floating on the left, angled in 3D perspective)
    const frontTex = createTextTexture('Front', '#df954d', 'rgba(235, 150, 75, 0.7)');
    const frontMat = new THREE.MeshBasicMaterial({
      map: frontTex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const frontPlaneGeo = new THREE.PlaneGeometry(1.4, 0.7);
    this.frontBadge = new THREE.Mesh(frontPlaneGeo, frontMat);
    this.frontBadge.position.set(-1.45, 0.62, 0.15);
    this.frontBadge.rotation.set(-0.06, 0.25, 0.04);
    this.floatingTextGroup.add(this.frontBadge);

    // "End" Text (Floating on the right, golden warm tone)
    const endTex = createTextTexture('End', '#ffd166', 'rgba(255, 205, 80, 0.8)');
    const endMat = new THREE.MeshBasicMaterial({
      map: endTex,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const endPlaneGeo = new THREE.PlaneGeometry(1.2, 0.6);
    this.endBadge = new THREE.Mesh(endPlaneGeo, endMat);
    this.endBadge.position.set(1.45, -0.15, 0.25);
    this.endBadge.rotation.set(-0.08, -0.28, -0.03);
    this.floatingTextGroup.add(this.endBadge);

    /* ========================================================================
     * 7. Soft Ambient Bokeh Square Rings (Matching Reference Background)
     * ======================================================================== */
    this.bokehRings = [];
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc87b40,
      transparent: true,
      opacity: 0.18,
      wireframe: false,
      side: THREE.DoubleSide,
    });

    // Create 2 gentle floating rounded bokeh rings in the deep background
    const bokeh1 = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 8, 24), ringMat);
    bokeh1.position.set(-1.8, 1.25, -1.8);
    bokeh1.rotation.set(0.3, 0.4, 0.2);
    this.scene.add(bokeh1);
    this.bokehRings.push(bokeh1);

    const bokeh2 = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.025, 8, 24), ringMat);
    bokeh2.position.set(1.9, 1.1, -2.2);
    bokeh2.rotation.set(-0.2, 0.5, -0.3);
    this.scene.add(bokeh2);
    this.bokehRings.push(bokeh2);
  }

  /* --------------------------------------------------------------------------
   * Event Handling: Pointer Tracking, Drag to Rotate & Touch Compatibility
   * ------------------------------------------------------------------------ */
  initEvents() {
    // 1. Pointer move over window (for head look-at)
    window.addEventListener('pointermove', (e) => this.onWindowPointerMove(e), { passive: true });

    // Track when pointer leaves window
    document.addEventListener('mouseleave', () => this.onPointerLeave());

    // 2. Interactive Drag on Canvas (Mouse & Touch via PointerEvents)
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.onPointerDrag(e));
    this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    this.canvas.addEventListener('pointercancel', (e) => this.onPointerUp(e));

    // Prevent default context menu on drag
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  onWindowPointerMove(e) {
    if (this.isDragging) return;

    this.isPointerInside = true;
    this.calculateHeadTarget(e.clientX, e.clientY);

    // Reset idle timeout
    clearTimeout(this.idleTimeout);
    this.idleTimeout = setTimeout(() => {
      // Ease back to center after 3 seconds of cursor inactivity
      this.targetHeadRotY = 0;
      this.targetHeadRotX = 0;
    }, 3000);
  }

  onPointerLeave() {
    this.isPointerInside = false;
    clearTimeout(this.idleTimeout);
    this.targetHeadRotY = 0;
    this.targetHeadRotX = 0;
  }

  calculateHeadTarget(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normalized screen offset (-1 to +1) relative to canvas center
    const normX = (clientX - centerX) / (window.innerWidth / 2);
    const normY = (clientY - centerY) / (window.innerHeight / 2);

    // Direct mapping so head turns directly toward the cursor position
    const rawYaw = normX * this.MAX_HEAD_YAW;
    const rawPitch = normY * this.MAX_HEAD_PITCH;

    this.targetHeadRotY = THREE.MathUtils.clamp(rawYaw, -this.MAX_HEAD_YAW, this.MAX_HEAD_YAW);
    this.targetHeadRotX = THREE.MathUtils.clamp(rawPitch, -this.MAX_HEAD_PITCH, this.MAX_HEAD_PITCH);
  }

  onPointerDown(e) {
    // Left click or touch only
    if (e.button !== undefined && e.button !== 0) return;

    this.isDragging = true;
    this.autoRecenterActive = false;
    clearTimeout(this.recenterTimeout);

    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.velRotY = 0;
    this.velRotX = 0;

    this.canvas.setPointerCapture(e.pointerId);
    this.canvas.classList.add('is-grabbing');
  }

  onPointerDrag(e) {
    if (!this.isDragging) return;

    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;

    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;

    // Sensitivity multipliers
    const sensitivity = 0.0075;
    const deltaRotY = dx * sensitivity;
    const deltaRotX = dy * sensitivity * 0.45;

    this.bodyRotY += deltaRotY;
    this.bodyRotX += deltaRotX;

    // Clamp vertical tilt
    this.bodyRotX = THREE.MathUtils.clamp(this.bodyRotX, -this.MAX_BODY_PITCH, this.MAX_BODY_PITCH);

    // Track velocity for inertia
    this.velRotY = deltaRotY;
    this.velRotX = deltaRotX;
  }

  onPointerUp(e) {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.canvas.classList.remove('is-grabbing');

    try {
      this.canvas.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if pointer capture was already released
    }

    // Schedule gentle recentering after user stops interacting (2.2 seconds)
    clearTimeout(this.recenterTimeout);
    this.recenterTimeout = setTimeout(() => {
      this.autoRecenterActive = true;
    }, 2200);
  }

  /* --------------------------------------------------------------------------
   * Observers: Resize & Visibility Pausing
   * ------------------------------------------------------------------------ */
  initObservers() {
    // 1. ResizeObserver for pixel-perfect responsive canvas scaling
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);

    // 2. IntersectionObserver to pause rendering when hero is off-screen
    const heroSection = document.getElementById('hero') || this.container.closest('section');
    if (heroSection && 'IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            this.isHeroVisible = entry.isIntersecting;
            if (this.isHeroVisible && !this.rafId) {
              this.clock.start();
              this.animate();
            }
          });
        },
        { threshold: 0.05 }
      );
      this.intersectionObserver.observe(heroSection);
    }
  }

  onResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    if (!width || !height) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  /* --------------------------------------------------------------------------
   * Render Loop & Animation Pipeline
   * ------------------------------------------------------------------------ */
  animate() {
    if (!this.isHeroVisible) {
      this.rafId = null;
      return;
    }

    this.rafId = requestAnimationFrame(() => this.animate());

    const delta = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    /* 1. Head Look-At Damping: Pause head follow while dragging */
    const headTargetY = this.isDragging ? 0 : this.targetHeadRotY;
    const headTargetX = this.isDragging ? 0 : this.targetHeadRotX;

    const headDamping = this.reduceMotion ? 1 : 0.085;
    this.currentHeadRotY = THREE.MathUtils.lerp(this.currentHeadRotY, headTargetY, headDamping);
    this.currentHeadRotX = THREE.MathUtils.lerp(this.currentHeadRotX, headTargetX, headDamping);

    this.headGroup.rotation.y = this.currentHeadRotY;
    this.headGroup.rotation.x = this.currentHeadRotX;

    /* 2. Body Drag Inertia & Auto-Recenter */
    if (!this.isDragging) {
      this.bodyRotY += this.velRotY;
      this.bodyRotX += this.velRotX;
      this.bodyRotX = THREE.MathUtils.clamp(this.bodyRotX, -this.MAX_BODY_PITCH, this.MAX_BODY_PITCH);

      // Smooth inertia friction
      this.velRotY *= 0.91;
      this.velRotX *= 0.91;

      // Gentle auto-recenter after delay
      if (this.autoRecenterActive) {
        this.bodyRotY = THREE.MathUtils.lerp(this.bodyRotY, 0, 0.035);
        this.bodyRotX = THREE.MathUtils.lerp(this.bodyRotX, 0, 0.035);

        if (Math.abs(this.bodyRotY) < 0.002 && Math.abs(this.bodyRotX) < 0.002) {
          this.bodyRotY = 0;
          this.bodyRotX = 0;
          this.autoRecenterActive = false;
        }
      }
    }

    this.bodyGroup.rotation.y = this.bodyRotY;
    this.bodyGroup.rotation.x = this.bodyRotX;

    /* 3. Floating Levitation & Badges Bobbing */
    if (!this.reduceMotion) {
      const floatY = Math.sin(time * 1.8) * 0.09;
      const floatTilt = Math.sin(time * 1.2) * 0.015;

      this.floatGroup.position.y = floatY;
      this.floatGroup.rotation.z = floatTilt;

      // Thruster light pulse
      const thrusterPulse = 2.0 + Math.sin(time * 3.6) * 0.7;
      if (this.thrusterLight) {
        this.thrusterLight.intensity = thrusterPulse;
      }
      if (this.thrusterMat) {
        this.thrusterMat.emissiveIntensity = thrusterPulse;
      }

      // Floating "Front" & "End" badges gentle independent bob
      if (this.frontBadge) {
        this.frontBadge.position.y = 0.62 + Math.sin(time * 2.2 + 0.4) * 0.05;
        this.frontBadge.rotation.z = 0.04 + Math.sin(time * 1.5) * 0.02;
      }
      if (this.endBadge) {
        this.endBadge.position.y = -0.15 + Math.sin(time * 2.0 + 1.2) * 0.04;
        this.endBadge.rotation.z = -0.03 + Math.cos(time * 1.6) * 0.02;
      }

      // Bokeh rings slow rotation
      if (this.bokehRings) {
        this.bokehRings.forEach((ring, idx) => {
          ring.rotation.z += 0.002 * (idx === 0 ? 1 : -1);
          ring.position.y += Math.sin(time * 1.0 + idx) * 0.0008;
        });
      }
    }

    /* 4. Blinking Eyes Rhythm */
    if (time > this.nextBlinkTime && !this.isBlinking) {
      this.isBlinking = true;
      this.blinkStartTime = time;
    }

    if (this.isBlinking) {
      const elapsed = time - this.blinkStartTime;
      const blinkDuration = 0.16; // 160ms natural blink

      if (elapsed < blinkDuration) {
        const p = elapsed / blinkDuration;
        const scaleY = Math.max(0.06, Math.abs(Math.cos(p * Math.PI)));
        this.leftEye.scale.y = scaleY;
        this.rightEye.scale.y = scaleY;
      } else {
        this.leftEye.scale.y = 1;
        this.rightEye.scale.y = 1;
        this.isBlinking = false;
        this.nextBlinkTime = time + 3.0 + Math.random() * 3.5;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Instantiate on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new RobotApp());
} else {
  new RobotApp();
}
