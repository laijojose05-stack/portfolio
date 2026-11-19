/* ==========================================================================
 * Interactive 3D Procedural Robot Companion
 * Built with vanilla Three.js primitives loaded via importmap
 *
 * Features:
 *  1. Look at mouse pointer with smooth lerp damping & safety rotation clamps
 *  2. Drag to rotate body (mouse + touch via PointerEvents, inertia, grab cursor)
 *  3. touch-action: pan-y on canvas so mobile vertical scrolling is never blocked
 *  4. Floating levitation, blinking eyes, arm swing rhythm, pulsing antenna orb
 *  5. ResizeObserver & IntersectionObserver pausing for zero battery drain off-screen
 * ========================================================================== */

import * as THREE from 'three';

class RobotApp {
  constructor() {
    this.canvas = document.getElementById('robot-canvas');
    this.container = document.getElementById('robot-container');

    if (!this.canvas || !this.container) return;

    // Performance & motion flags
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

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 50);
    this.camera.position.set(0, 0.25, 5.2);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });

    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
  }

  /* --------------------------------------------------------------------------
   * Lighting: Warm key light, golden rim highlight & emerald fill
   * ------------------------------------------------------------------------ */
  initLighting() {
    // Ambient light for base shadow illumination
    const ambient = new THREE.AmbientLight(0xffffff, 1.4);
    this.scene.add(ambient);

    // Key light (soft warm white from top-right)
    const keyLight = new THREE.DirectionalLight(0xfff5e8, 2.8);
    keyLight.position.set(3.5, 4.0, 3.5);
    this.scene.add(keyLight);

    // Warm golden rim light (back-left, creating the glowing halo from reference)
    const rimLight = new THREE.DirectionalLight(0xff9e42, 3.6);
    rimLight.position.set(-3.5, 2.5, -2.5);
    this.scene.add(rimLight);

    // Lower emerald fill point light (reflecting off beveled platform)
    const fillLight = new THREE.PointLight(0x00f0a0, 2.2, 8);
    fillLight.position.set(0, -1.8, 1.8);
    this.scene.add(fillLight);
  }

  /* --------------------------------------------------------------------------
   * Procedural Robot Model (Built from Three.js primitives)
   * ------------------------------------------------------------------------ */
  buildRobot() {
    // Master hierarchy
    this.masterGroup = new THREE.Group();
    this.floatGroup = new THREE.Group();
    this.bodyGroup = new THREE.Group();
    this.headGroup = new THREE.Group();

    this.scene.add(this.masterGroup);
    this.masterGroup.add(this.floatGroup);
    this.floatGroup.add(this.bodyGroup);

    // Shared Materials
    const metalBodyMat = new THREE.MeshStandardMaterial({
      color: 0x181e1a,
      metalness: 0.88,
      roughness: 0.26,
    });

    const goldAccentMat = new THREE.MeshStandardMaterial({
      color: 0xe29d52,
      metalness: 0.92,
      roughness: 0.22,
    });

    const screenMat = new THREE.MeshStandardMaterial({
      color: 0x070908,
      roughness: 0.12,
      metalness: 0.45,
    });

    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3b6f,
      emissive: 0xff2a5b,
      emissiveIntensity: 2.8,
      roughness: 0.1,
    });

    this.antennaMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f0a0,
      emissive: 0x00f0a0,
      emissiveIntensity: 1.8,
      roughness: 0.15,
    });

    const darkTrimMat = new THREE.MeshStandardMaterial({
      color: 0x101412,
      metalness: 0.95,
      roughness: 0.35,
    });

    /* --- 1. Stepped Floating Pedestal Platform --- */
    this.pedestalGroup = new THREE.Group();
    this.floatGroup.add(this.pedestalGroup);
    this.pedestalGroup.position.y = -1.35;

    // Upper platform tier with beveled gold accent trim
    const topStepGeo = new THREE.CylinderGeometry(1.05, 1.18, 0.14, 6);
    const topStep = new THREE.Mesh(topStepGeo, goldAccentMat);
    topStep.position.y = 0.16;
    this.pedestalGroup.add(topStep);

    // Main platform body (hexagonal dark metallic)
    const mainStepGeo = new THREE.CylinderGeometry(1.5, 1.62, 0.32, 6);
    const mainStep = new THREE.Mesh(mainStepGeo, darkTrimMat);
    this.pedestalGroup.add(mainStep);

    // Lower inset pedestal base
    const baseStepGeo = new THREE.CylinderGeometry(1.18, 0.92, 0.2, 6);
    const baseStep = new THREE.Mesh(baseStepGeo, metalBodyMat);
    baseStep.position.y = -0.22;
    this.pedestalGroup.add(baseStep);

    // Glowing under-platform thruster ring
    const thrusterGeo = new THREE.TorusGeometry(0.72, 0.04, 16, 32);
    const thrusterMat = new THREE.MeshStandardMaterial({
      color: 0x00f0a0,
      emissive: 0x00f0a0,
      emissiveIntensity: 1.6,
      roughness: 0.2,
    });
    const thrusterRing = new THREE.Mesh(thrusterGeo, thrusterMat);
    thrusterRing.rotation.x = Math.PI / 2;
    thrusterRing.position.y = -0.32;
    this.pedestalGroup.add(thrusterRing);

    /* --- 2. Torso & Body --- */
    this.torsoGroup = new THREE.Group();
    this.bodyGroup.add(this.torsoGroup);
    this.torsoGroup.position.y = -0.55;

    // Main conical/curved chest
    const chestGeo = new THREE.CylinderGeometry(0.55, 0.44, 0.65, 24);
    const chest = new THREE.Mesh(chestGeo, metalBodyMat);
    this.torsoGroup.add(chest);

    // Golden waist belt band
    const beltGeo = new THREE.CylinderGeometry(0.46, 0.46, 0.09, 24);
    const belt = new THREE.Mesh(beltGeo, goldAccentMat);
    belt.position.y = -0.32;
    this.torsoGroup.add(belt);

    // Chest reactor indicator badge
    const reactorGeo = new THREE.TorusGeometry(0.13, 0.026, 16, 24);
    const reactor = new THREE.Mesh(reactorGeo, this.antennaMaterial);
    reactor.position.set(0, 0.08, 0.51);
    this.torsoGroup.add(reactor);

    /* --- 3. Articulated Arms --- */
    this.leftArm = this.createArm(-0.64, goldAccentMat, metalBodyMat);
    this.rightArm = this.createArm(0.64, goldAccentMat, metalBodyMat);
    this.torsoGroup.add(this.leftArm);
    this.torsoGroup.add(this.rightArm);

    /* --- 4. Neck & Head Group --- */
    // Metallic neck cylinder
    const neckGeo = new THREE.CylinderGeometry(0.18, 0.24, 0.26, 18);
    const neck = new THREE.Mesh(neckGeo, goldAccentMat);
    neck.position.y = -0.06;
    this.bodyGroup.add(neck);

    // Head pivot group positioned at neck joint
    this.headGroup.position.set(0, 0.35, 0);
    this.bodyGroup.add(this.headGroup);

    // Monitor head frame (beveled outer casing)
    const monitorGeo = new THREE.BoxGeometry(1.35, 0.95, 0.85);
    const monitor = new THREE.Mesh(monitorGeo, goldAccentMat);
    this.headGroup.add(monitor);

    // Inset screen face
    const screenGeo = new THREE.BoxGeometry(1.18, 0.78, 0.04);
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 0, 0.43);
    this.headGroup.add(screen);

    // Circular glowing eyes
    this.eyesGroup = new THREE.Group();
    this.eyesGroup.position.set(0, 0.03, 0.46);
    this.headGroup.add(this.eyesGroup);

    const eyeGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.03, 20);
    eyeGeo.rotateX(Math.PI / 2);

    this.leftEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    this.leftEye.position.x = -0.27;
    this.rightEye = new THREE.Mesh(eyeGeo, this.eyeMaterial);
    this.rightEye.position.x = 0.27;

    this.eyesGroup.add(this.leftEye);
    this.eyesGroup.add(this.rightEye);

    // Head antenna
    const rodGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.28, 12);
    const rod = new THREE.Mesh(rodGeo, metalBodyMat);
    rod.position.y = 0.58;
    this.headGroup.add(rod);

    const tipGeo = new THREE.SphereGeometry(0.065, 16, 16);
    this.antennaTip = new THREE.Mesh(tipGeo, this.antennaMaterial);
    this.antennaTip.position.y = 0.73;
    this.headGroup.add(this.antennaTip);

    // Ear bolts
    const earGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 16);
    earGeo.rotateZ(Math.PI / 2);

    const leftEar = new THREE.Mesh(earGeo, metalBodyMat);
    leftEar.position.x = -0.71;
    const rightEar = new THREE.Mesh(earGeo, metalBodyMat);
    rightEar.position.x = 0.71;

    this.headGroup.add(leftEar);
    this.headGroup.add(rightEar);
  }

  /* Helper to construct an articulated shoulder/arm */
  createArm(offsetX, jointMat, armMat) {
    const armPivot = new THREE.Group();
    armPivot.position.set(offsetX, 0.18, 0);

    // Shoulder joint sphere
    const shoulderGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const shoulder = new THREE.Mesh(shoulderGeo, jointMat);
    armPivot.add(shoulder);

    // Upper arm limb
    const upperGeo = new THREE.CylinderGeometry(0.07, 0.065, 0.36, 14);
    const upper = new THREE.Mesh(upperGeo, armMat);
    upper.position.set(offsetX > 0 ? 0.05 : -0.05, -0.22, 0);
    upper.rotation.z = offsetX > 0 ? -0.15 : 0.15;
    armPivot.add(upper);

    // Hand clamp
    const handGeo = new THREE.SphereGeometry(0.09, 12, 12);
    const hand = new THREE.Mesh(handGeo, jointMat);
    hand.position.set(offsetX > 0 ? 0.09 : -0.09, -0.42, 0);
    armPivot.add(hand);

    return armPivot;
  }

  /* --------------------------------------------------------------------------
   * Interaction Handlers: Mouse tracking, PointerEvents drag & Touch scroll
   * ------------------------------------------------------------------------ */
  initEvents() {
    // 1. Look-at Pointer Tracking across page
    window.addEventListener('pointermove', (e) => {
      this.isPointerInside = true;
      this.calculateHeadTarget(e.clientX, e.clientY);

      // Reset idle look-at timer (eases head back to center after 3.5s of no pointer movement)
      if (this.idleTimeout) clearTimeout(this.idleTimeout);
      this.idleTimeout = setTimeout(() => {
        this.isPointerInside = false;
        this.targetHeadRotY = 0;
        this.targetHeadRotX = 0;
      }, 3500);
    });

    document.addEventListener('pointerleave', () => {
      this.isPointerInside = false;
      this.targetHeadRotY = 0;
      this.targetHeadRotX = 0;
    });

    // 2. Drag-to-Rotate on Canvas (Supports both desktop mouse & mobile touch)
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.onPointerDrag(e));
    this.canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    this.canvas.addEventListener('pointercancel', (e) => this.onPointerUp(e));
  }

  /* Calculate clamped target head angles from screen pointer */
  calculateHeadTarget(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normX = (clientX - centerX) / (window.innerWidth / 2);
    const normY = (clientY - centerY) / (window.innerHeight / 2);

    // Negative mapping so head turns toward pointer
    const rawYaw = -normX * this.MAX_HEAD_YAW;
    const rawPitch = -normY * this.MAX_HEAD_PITCH;

    this.targetHeadRotY = THREE.MathUtils.clamp(rawYaw, -this.MAX_HEAD_YAW, this.MAX_HEAD_YAW);
    this.targetHeadRotX = THREE.MathUtils.clamp(rawPitch, -this.MAX_HEAD_PITCH, this.MAX_HEAD_PITCH);
  }

  onPointerDown(e) {
    // Only drag on primary pointer / left click
    if (e.button !== undefined && e.button !== 0) return;

    this.isDragging = true;
    this.autoRecenterActive = false;
    if (this.recenterTimeout) clearTimeout(this.recenterTimeout);

    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.velRotY = 0;
    this.velRotX = 0;

    // Capture pointer so drag persists outside canvas boundary
    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch (_) {}

    this.canvas.classList.add('is-grabbing');
  }

  onPointerDrag(e) {
    if (!this.isDragging) return;

    const deltaX = e.clientX - this.lastPointerX;
    const deltaY = e.clientY - this.lastPointerY;

    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;

    const dragSpeedY = 0.009;
    const dragSpeedX = 0.005;

    this.bodyRotY += deltaX * dragSpeedY;
    this.bodyRotX += deltaY * dragSpeedX;
    this.bodyRotX = THREE.MathUtils.clamp(this.bodyRotX, -this.MAX_BODY_PITCH, this.MAX_BODY_PITCH);

    // Track instantaneous release velocity for inertia
    this.velRotY = deltaX * dragSpeedY;
    this.velRotX = deltaY * dragSpeedX;
  }

  onPointerUp(e) {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.canvas.classList.remove('is-grabbing');

    try {
      if (this.canvas.hasPointerCapture(e.pointerId)) {
        this.canvas.releasePointerCapture(e.pointerId);
      }
    } catch (_) {}

    // Slowly return body to face forward 2.5s after user stops dragging
    if (this.recenterTimeout) clearTimeout(this.recenterTimeout);
    this.recenterTimeout = setTimeout(() => {
      this.autoRecenterActive = true;
    }, 2500);
  }

  /* --------------------------------------------------------------------------
   * Observers: Responsive resizing & Battery-saving off-screen pause
   * ------------------------------------------------------------------------ */
  initObservers() {
    // 1. Container ResizeObserver
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);

    // 2. Section Visibility IntersectionObserver
    const heroSection = document.getElementById('home');
    if (heroSection && typeof IntersectionObserver !== 'undefined') {
      this.visibilityObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            this.isHeroVisible = entry.isIntersecting;
            if (this.isHeroVisible && !this.rafId) {
              this.animate();
            }
          });
        },
        { threshold: 0.05 }
      );
      this.visibilityObserver.observe(heroSection);
    }
  }

  onResize() {
    if (!this.container || !this.renderer || !this.camera) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    if (width === 0 || height === 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  /* --------------------------------------------------------------------------
   * Animation Loop: Damped lerp, floating, blinking, arms & antenna
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

    const headDamping = this.reduceMotion ? 1 : 0.08;
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

    /* 3. Floating Levitation & Arm Rhythm */
    if (!this.reduceMotion) {
      const floatY = Math.sin(time * 2.0) * 0.1;
      const floatTilt = Math.sin(time * 1.3) * 0.015;

      this.floatGroup.position.y = floatY;
      this.floatGroup.rotation.z = floatTilt;

      // Arm subtle counter-swing
      this.leftArm.rotation.x = Math.sin(time * 2.0) * 0.12;
      this.rightArm.rotation.x = -Math.sin(time * 2.0) * 0.12;

      // Antenna beacon pulse
      const pulse = 1.3 + Math.sin(time * 4.2) * 0.7;
      this.antennaMaterial.emissiveIntensity = pulse;
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
        this.nextBlinkTime = time + 3.0 + Math.random() * 3.5; // Next blink in 3-6.5s
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
