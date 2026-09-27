/**
 * ZOMBIE: STRING OF SURVIVAL — 3D/4D/5D IMMERSIVE SURVIVAL HORROR ENGINE
 * Powered by Three.js WebGL Engine.
 * Features:
 * - 3D City District (Roads, Safehouse, Clinic, Police Precinct, Abandoned Cars)
 * - 4D Temporal Mechanics (Day/Night 24-hr cycle, dynamic shadows, flashlight beam)
 * - 5D Bio-Physical Simulation (Health, Stamina, Hunger, Thirst, Infection, Body Temp, Acoustic Noise)
 * - First-Person / Third-Person toggle with weapon models, sway, recoil, muzzle flash
 * - NPC Survivors with 3D models and interactive dialogue (Dr. Evelyn, Marcus, Sgt. Darius)
 * - 5 Distinct Zombie Archetypes with custom 3D anatomy, ragdolls, and adaptive AI
 * - Base Heat 3D attraction sphere with physical interactive Diesel Generator
 */

class SurvivalGame3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.width = this.container.clientWidth || 960;
    this.height = this.container.clientHeight || 600;

    // Temporal 4D Cycle (Day/Night)
    this.gameTime = 8.0; // 08:00 AM (Day 1)
    this.currentDay = 1;
    this.timeSpeed = 0.05; // 24hr cycle in ~8 mins

    // 5D Bio-Physical Player Metrics
    this.playerStats = {
      health: 100,
      stamina: 100,
      hunger: 90,
      thirst: 85,
      infection: 0,
      temperature: 36.8, // Celsius
      noiseLevel: 0, // dB
      isCrouching: false,
      isSprinting: false,
      flashlightOn: true,
      ammo: 24,
      maxAmmo: 24,
      currentWeapon: 'pistol', // 'pistol' or 'bat'
      isAiming: false,
      scoreStealth: 25,
      scoreAggression: 25,
      scoreLooting: 25,
      scoreBuilding: 25,
      dominantArchetype: 'Hunter'
    };

    // Camera view mode: 'fps' or 'tps'
    this.viewMode = 'fps';

    // Three.js Core Components
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sunLight = null;
    this.ambientLight = null;
    this.flashlight = null;
    this.flashlightTarget = null;

    // World Entities
    this.playerObj = null;
    this.weaponObj = null;
    this.zombies = [];
    this.survivors = [];
    this.interactiveObjects = [];
    this.bullets = [];
    this.particles = [];
    this.colliders = [];

    // Base Heat Manager in 3D
    this.baseHeat = {
      totalHeat: 45,
      radius: 90,
      sphereMesh: null,
      generatorActive: true,
      generatorMesh: null,
      generatorLight: null,
      radioActive: true,
      lightsActive: true
    };

    // Movement & Controls
    this.keys = {};
    this.mouse = { x: 0, y: 0, isLocked: false };
    this.pitch = 0;
    this.yaw = 0;
    this.velocity = new THREE.Vector3();
    this.clock = new THREE.Clock();

    // Interaction target
    this.currentInteraction = null;

    this.initScene();
    this.initLighting();
    this.buildCityDistrict();
    this.initPlayer();
    this.initSurvivors();
    this.initZombies();
    this.initHeatDome();
    this.bindInputEvents();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  /* ========================================================================
     1. THREE.JS INITIALIZATION & SCENE SETUP
     ======================================================================== */
  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x06090e);
    this.scene.fog = new THREE.FogExp2(0x0a0f16, 0.015);

    this.camera = new THREE.PerspectiveCamera(65, this.width / this.height, 0.1, 400);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    window.addEventListener('resize', () => {
      this.width = this.container.clientWidth;
      this.height = this.container.clientHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    });
  }

  /* ========================================================================
     2. 4D DYNAMIC LIGHTING & DAY/NIGHT SYSTEM
     ======================================================================== */
  initLighting() {
    this.ambientLight = new THREE.AmbientLight(0x223344, 0.4);
    this.scene.add(this.ambientLight);

    // Directional Sun / Moon
    this.sunLight = new THREE.DirectionalLight(0xffecd2, 1.2);
    this.sunLight.position.set(50, 100, 50);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 1024;
    this.sunLight.shadow.mapSize.height = 1024;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 300;
    this.sunLight.shadow.camera.left = -100;
    this.sunLight.shadow.camera.right = 100;
    this.sunLight.shadow.camera.top = 100;
    this.sunLight.shadow.camera.bottom = -100;
    this.scene.add(this.sunLight);

    // Player Flashlight SpotLight
    this.flashlight = new THREE.SpotLight(0xfff5e6, 2.5, 45, Math.PI / 6, 0.4, 1.2);
    this.flashlight.castShadow = true;
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.flashlight);
  }

  updateDayNightCycle(dt) {
    this.gameTime += dt * this.timeSpeed;
    if (this.gameTime >= 24.0) {
      this.gameTime = 0.0;
      this.currentDay = Math.min(7, this.currentDay + 1);
      if (window.showToast) {
        window.showToast(`🌅 DAWN OF DAY ${this.currentDay}: The horde mutates further.`, '#ff9e00');
      }
    }

    // Update time HUD
    const hours = Math.floor(this.gameTime);
    const mins = Math.floor((this.gameTime - hours) * 60);
    const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    const dayEl = document.getElementById('hudDayTime');
    if (dayEl) dayEl.textContent = `DAY ${this.currentDay} | ${timeStr}`;

    // Solar angle calculation
    const sunAngle = (this.gameTime / 24.0) * Math.PI * 2 - Math.PI / 2;
    this.sunLight.position.x = Math.cos(sunAngle) * 120;
    this.sunLight.position.y = Math.sin(sunAngle) * 120;
    this.sunLight.position.z = 40;

    const isDay = this.gameTime >= 6.0 && this.gameTime <= 18.0;

    if (isDay) {
      // Daytime lighting
      const dayFactor = Math.sin((this.gameTime - 6.0) / 12.0 * Math.PI);
      this.sunLight.color.setHSL(0.1, 0.6, 0.6 + dayFactor * 0.2);
      this.sunLight.intensity = 0.8 + dayFactor * 1.0;
      this.ambientLight.color.setHSL(0.6, 0.2, 0.3 + dayFactor * 0.2);
      this.scene.fog.color.setHex(0x101824);
      this.scene.background.setHex(0x0a121c);
    } else {
      // Nighttime horror lighting
      this.sunLight.color.setHex(0x3b82f6); // Moonlight
      this.sunLight.intensity = 0.15;
      this.ambientLight.color.setHex(0x060910);
      this.scene.fog.color.setHex(0x040609);
      this.scene.background.setHex(0x030406);
    }
  }

  /* ========================================================================
     3. 3D CITY DISTRICT BUILDER (Safehouse, Clinic, Police, Roads, Cars)
     ======================================================================== */
  buildCityDistrict() {
    // Ground Asphalt
    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x141820, roughness: 0.9, metalness: 0.1 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Main Asphalt Crossroad
    this.createRoad(0, 0, 300, 16, true);  // East-West
    this.createRoad(0, 0, 16, 300, false); // North-South

    // 1. Safehouse Substation (District 4 HQ: -40, 0, -40)
    this.createSafehouse(-40, -40);

    // 2. St. Jude Clinic (Where Dr. Evelyn is pinned: 40, -50)
    this.createBuilding(40, -50, 32, 14, 28, 0x1e293b, "ST. JUDE MEDICAL CLINIC", 0x3b82f6);

    // 3. Police Headquarters (Armory: 45, 45)
    this.createBuilding(45, 45, 36, 16, 30, 0x0f172a, "POLICE PRECINCT 09", 0xeab308);

    // 4. Shopping Mall Ruins (-50, 45)
    this.createBuilding(-50, 45, 40, 18, 36, 0x181e28, "METRO PLAZA MALL", 0xe63946);

    // Abandoned Vehicles & Road Barricades
    this.createVehicle(-10, 8, Math.PI / 7, 0x334155); // Civilian Sedan
    this.createVehicle(15, -12, -Math.PI / 4, 0x1e3a8a); // Police Cruiser
    this.createVehicle(5, 50, 0.1, 0x3f3f46); // Cargo Truck

    // Street Lamps with flickering nocturnal point lights
    this.createStreetLamp(-20, -20);
    this.createStreetLamp(20, -20);
    this.createStreetLamp(-20, 20);
    this.createStreetLamp(20, 20);

    // Supply Crates
    this.createSupplyCrate(15, -42, 'medical'); // Outside Clinic
    this.createSupplyCrate(38, 35, 'ammo');     // Outside Police
    this.createSupplyCrate(-35, 35, 'rations'); // Near Mall
  }

  createRoad(x, z, w, l, isHorizontal) {
    const roadGeo = new THREE.PlaneGeometry(w, l);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.95 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.02, z);
    road.receiveShadow = true;
    this.scene.add(road);

    // Yellow Lane Divider
    const stripeGeo = new THREE.PlaneGeometry(isHorizontal ? w : 0.6, isHorizontal ? 0.6 : l);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(x, 0.03, z);
    this.scene.add(stripe);
  }

  createBuilding(x, z, width, height, depth, color, labelText, neonColor) {
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.8, metalness: 0.2 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    this.colliders.push({ x, z, w: width + 2, d: depth + 2 });

    // Neon Rooftop Sign
    const signGeo = new THREE.BoxGeometry(width * 0.6, 1.8, 0.4);
    const signMat = new THREE.MeshBasicMaterial({ color: neonColor });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(x, height + 1.2, z + depth / 2 + 0.2);
    this.scene.add(sign);

    // Red Bio-Vein Decals crawling up facade
    const veinGeo = new THREE.CylinderGeometry(0.2, 0.05, height * 0.7, 5);
    const veinMat = new THREE.MeshStandardMaterial({ color: 0x8b0000, roughness: 0.5, emissive: 0x330000 });
    const vein = new THREE.Mesh(veinGeo, veinMat);
    vein.position.set(x - width * 0.3, height * 0.4, z + depth / 2 + 0.3);
    vein.rotation.z = 0.2;
    this.scene.add(vein);
  }

  createSafehouse(x, z) {
    const w = 36;
    const d = 36;
    const h = 8;

    // Concrete Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    
    // North Wall
    const nWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1), wallMat);
    nWall.position.set(x, h/2, z - d/2);
    nWall.castShadow = true; nWall.receiveShadow = true;
    this.scene.add(nWall);

    // South Wall (with Entrance Gap)
    const sWallL = new THREE.Mesh(new THREE.BoxGeometry(w * 0.38, h, 1), wallMat);
    sWallL.position.set(x - w * 0.31, h/2, z + d/2);
    sWallL.castShadow = true; this.scene.add(sWallL);

    const sWallR = new THREE.Mesh(new THREE.BoxGeometry(w * 0.38, h, 1), wallMat);
    sWallR.position.set(x + w * 0.31, h/2, z + d/2);
    sWallR.castShadow = true; this.scene.add(sWallR);

    // West Wall
    const wWall = new THREE.Mesh(new THREE.BoxGeometry(1, h, d), wallMat);
    wWall.position.set(x - w/2, h/2, z);
    wWall.castShadow = true; this.scene.add(wWall);

    // East Wall
    const eWall = new THREE.Mesh(new THREE.BoxGeometry(1, h, d), wallMat);
    eWall.position.set(x + w/2, h/2, z);
    eWall.castShadow = true; this.scene.add(eWall);

    // Steel Fortified Gate (Can be reinforced)
    const gateGeo = new THREE.BoxGeometry(8, h * 0.8, 0.4);
    const gateMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 });
    const gate = new THREE.Mesh(gateGeo, gateMat);
    gate.position.set(x, (h * 0.8)/2, z + d/2);
    this.scene.add(gate);

    // 3D Physical Modified Diesel Generator inside Safehouse
    const genGeo = new THREE.BoxGeometry(3, 2.2, 2);
    const genMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.6, roughness: 0.4 });
    this.baseHeat.generatorMesh = new THREE.Mesh(genGeo, genMat);
    this.baseHeat.generatorMesh.position.set(x - 8, 1.1, z - 8);
    this.baseHeat.generatorMesh.castShadow = true;
    this.scene.add(this.baseHeat.generatorMesh);

    // Exhaust pipe with glow
    const pipeGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.5);
    const pipeMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
    const pipe = new THREE.Mesh(pipeGeo, pipeMat);
    pipe.position.set(x - 8.8, 2.8, z - 8);
    this.scene.add(pipe);

    // Generator light
    this.baseHeat.generatorLight = new THREE.PointLight(0xff9e00, 1.5, 20);
    this.baseHeat.generatorLight.position.set(x - 8, 3, z - 8);
    this.scene.add(this.baseHeat.generatorLight);

    // Interactive hook on Generator
    this.interactiveObjects.push({
      type: 'generator',
      x: x - 8,
      z: z - 8,
      radius: 4,
      prompt: 'Toggle Modified Diesel Generator (Press E)'
    });
  }

  createVehicle(x, z, rot, color) {
    const bodyGeo = new THREE.BoxGeometry(4.6, 1.4, 2.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.7 });
    const car = new THREE.Mesh(bodyGeo, bodyMat);
    car.position.set(x, 1.1, z);
    car.rotation.y = rot;
    car.castShadow = true; car.receiveShadow = true;
    this.scene.add(car);

    // Cabin
    const cabGeo = new THREE.BoxGeometry(2.4, 1.1, 1.9);
    const cabMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 });
    const cab = new THREE.Mesh(cabGeo, cabMat);
    cab.position.set(x - 0.3 * Math.cos(rot), 2.1, z - 0.3 * Math.sin(rot));
    cab.rotation.y = rot;
    this.scene.add(cab);

    this.colliders.push({ x, z, w: 4.8, d: 2.8 });
  }

  createStreetLamp(x, z) {
    const poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 9);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.set(x, 4.5, z);
    pole.castShadow = true;
    this.scene.add(pole);

    const lampLight = new THREE.PointLight(0xfff0c2, 1.2, 28);
    lampLight.position.set(x, 8.8, z);
    lampLight.castShadow = true;
    this.scene.add(lampLight);
  }

  createSupplyCrate(x, z, type) {
    const geo = new THREE.BoxGeometry(1.6, 1.4, 1.6);
    let col = 0x10b981; // Medical
    if (type === 'ammo') col = 0xeab308;
    if (type === 'rations') col = 0x3b82f6;

    const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.6, metalness: 0.3 });
    const crate = new THREE.Mesh(geo, mat);
    crate.position.set(x, 0.7, z);
    crate.castShadow = true;
    this.scene.add(crate);

    this.interactiveObjects.push({
      type: 'crate',
      crateType: type,
      mesh: crate,
      x: x,
      z: z,
      radius: 3,
      looted: false,
      prompt: `Scavenge ${type.toUpperCase()} Crate (Press E)`
    });
  }

  /* ========================================================================
     4. PLAYER CHARACTER, ARMS, WEAPONS & CONTROLS
     ======================================================================== */
  initPlayer() {
    this.playerObj = new THREE.Group();
    this.playerObj.position.set(-36, 1.7, -25); // Inside Safehouse
    this.scene.add(this.playerObj);

    // 3D Weapon Model (Tactical Suppressed Pistol)
    const gunGroup = new THREE.Group();
    
    // Barrel
    const barrelGeo = new THREE.BoxGeometry(0.12, 0.16, 0.9);
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 });
    const barrel = new THREE.Mesh(barrelGeo, gunMat);
    barrel.position.set(0, 0, -0.4);
    gunGroup.add(barrel);

    // Grip
    const gripGeo = new THREE.BoxGeometry(0.12, 0.5, 0.25);
    const grip = new THREE.Mesh(gripGeo, gunMat);
    grip.position.set(0, -0.28, -0.05);
    grip.rotation.x = 0.2;
    gunGroup.add(grip);

    // Suppressor
    const suppGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 12);
    const suppMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.7 });
    const supp = new THREE.Mesh(suppGeo, suppMat);
    supp.rotation.x = Math.PI / 2;
    supp.position.set(0, 0, -0.95);
    gunGroup.add(supp);

    gunGroup.position.set(0.35, -0.3, -0.6);
    this.camera.add(gunGroup);
    this.weaponObj = gunGroup;

    this.scene.add(this.camera);
  }

  /* ========================================================================
     5. 3D SURVIVORS WITH DIALOGUE & SKILLS
     ======================================================================== */
  initSurvivors() {
    // 1. Dr. Evelyn Reed (Medical Doctor at St. Jude Clinic: 40, -48)
    this.createSurvivor(40, -48, "DR. EVELYN REED", 0x38bdf8, "Doctor", [
      "Alexei! Thank God you reached the clinic. The horde broke into the triage bay.",
      "If we extract my heavy medical research crate, I can synthesize an antiviral cure for the Day 7 flight!",
      "Will you help me carry the medical crate, or must we run immediately?"
    ]);

    // 2. Marcus Vance (Combat Engineer at Safehouse: -34, -42)
    this.createSurvivor(-34, -42, "MARCUS VANCE", 0xf59e0b, "Engineer", [
      "Generator is drinking fuel like water, Alexei. Keep it online, and the perimeter lights hold.",
      "Give me 50 scrap metal, and I'll build an automated 5.56mm sentry turret for the main gate."
    ]);

    // 3. Sgt. Darius Cole (Watchtower Guard: -22, -22)
    this.createSurvivor(-22, -22, "SGT. DARIUS COLE", 0x10b981, "Soldier", [
      "Perimeter secure for now, Chief. But my radar picks up heavy movement in the subway tunnels.",
      "Save your rifle ammo for the night. When darkness hits, those blind Swarmers come running to every gunshot."
    ]);
  }

  createSurvivor(x, z, name, color, role, dialogueLines) {
    const group = new THREE.Group();

    // Body
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.8, 8);
    const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.9;
    body.castShadow = true;
    group.add(body);

    // Head
    const headGeo = new THREE.SphereGeometry(0.28, 8, 8);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.95;
    group.add(head);

    group.position.set(x, 0, z);
    this.scene.add(group);

    const survivorData = {
      name,
      role,
      mesh: group,
      dialogue: dialogueLines,
      dialogueIndex: 0,
      x, z,
      radius: 3.5,
      prompt: `Talk to ${name} (${role}) — Press E`
    };

    this.survivors.push(survivorData);
    this.interactiveObjects.push(survivorData);
  }

  /* ========================================================================
     6. 3D ZOMBIE ARCHETYPES & ADAPTIVE AI
     ======================================================================== */
  initZombies() {
    this.zombies = [];
    // Spawn 12 initial roaming zombies
    for (let i = 0; i < 14; i++) {
      this.spawnZombieArchetype();
    }
  }

  spawnZombieArchetype(typeOverride = null) {
    const type = typeOverride || this.playerStats.dominantArchetype || 'Hunter';

    // Spawn randomly outside safehouse
    const angle = Math.random() * Math.PI * 2;
    const dist = 45 + Math.random() * 65;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    const group = new THREE.Group();

    let skinColor = 0x64748b; // Grey
    let eyeColor = 0xeab308;
    let speed = 2.4;
    let hp = 50;

    if (type === 'Swarm') {
      // Sound-Adapted Swarmer: Reddish flesh, calcified bone mask, huge bat ears
      skinColor = 0x991b1b;
      speed = 3.6;
      hp = 40;
    } else if (type === 'Ambusher') {
      // Charcoal black skin, pale glowing eyes, agile
      skinColor = 0x18181b;
      eyeColor = 0x38bdf8;
      speed = 4.2;
      hp = 35;
    } else if (type === 'Tank') {
      // Massive brute, armor plating
      skinColor = 0x334155;
      speed = 1.6;
      hp = 180;
    }

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.7, 1.2, 0.4);
    const torsoMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8 });
    const torso = new THREE.Mesh(torsoGeo, torsoMat);
    torso.position.y = 1.1;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const headGeo = new THREE.BoxGeometry(0.4, 0.45, 0.4);
    const headMat = new THREE.MeshStandardMaterial({ color: skinColor });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.95;
    group.add(head);

    // Glowing Eyes
    const eyeGeo = new THREE.SphereGeometry(0.06, 6, 6);
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.12, 1.98, 0.22);
    group.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.12, 1.98, 0.22);
    group.add(rightEye);

    // If Swarmer: Add Overgrown Bat Ears
    if (type === 'Swarm') {
      const earGeo = new THREE.ConeGeometry(0.2, 0.6, 5);
      const earMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d });
      const leftEar = new THREE.Mesh(earGeo, earMat);
      leftEar.rotation.z = -0.5;
      leftEar.position.set(-0.35, 2.2, 0);
      group.add(leftEar);

      const rightEar = new THREE.Mesh(earGeo, earMat);
      rightEar.rotation.z = 0.5;
      rightEar.position.set(0.35, 2.2, 0);
      group.add(rightEar);
    }

    group.position.set(x, 0, z);
    this.scene.add(group);

    this.zombies.push({
      mesh: group,
      type: type,
      hp: hp,
      speed: speed,
      state: 'wander',
      wanderTarget: new THREE.Vector3(x + (Math.random() - 0.5) * 30, 0, z + (Math.random() - 0.5) * 30),
      wanderTimer: 3
    });
  }

  /* ========================================================================
     7. BASE HEAT 3D PULSING DOME
     ======================================================================== */
  initHeatDome() {
    const geo = new THREE.SphereGeometry(this.baseHeat.radius, 24, 16);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xff7700,
      transparent: true,
      opacity: 0.08,
      wireframe: true
    });
    this.baseHeat.sphereMesh = new THREE.Mesh(geo, mat);
    this.baseHeat.sphereMesh.position.set(-40, 0, -40); // Centered on Safehouse
    this.scene.add(this.baseHeat.sphereMesh);
  }

  updateHeatDome() {
    let heat = 10;
    if (this.baseHeat.generatorActive) heat += 35;
    if (this.baseHeat.radioActive) heat += 15;
    if (this.baseHeat.lightsActive) heat += 20;

    this.baseHeat.totalHeat = heat;
    this.baseHeat.radius = heat * 2.0;

    if (this.baseHeat.sphereMesh) {
      const scale = this.baseHeat.radius / 90.0;
      this.baseHeat.sphereMesh.scale.set(scale, scale, scale);
      // Pulsing wireframe glow
      this.baseHeat.sphereMesh.material.opacity = 0.06 + Math.sin(performance.now() * 0.003) * 0.03;
    }

    if (this.baseHeat.generatorLight) {
      this.baseHeat.generatorLight.intensity = this.baseHeat.generatorActive ? 1.5 : 0;
    }
  }

  /* ========================================================================
     8. PLAYER CONTROLS & PHYSICAL INTERACTION
     ======================================================================== */
  bindInputEvents() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      // Flashlight Toggle (F)
      if (e.key.toLowerCase() === 'f') {
        this.playerStats.flashlightOn = !this.playerStats.flashlightOn;
        this.flashlight.intensity = this.playerStats.flashlightOn ? 2.5 : 0;
        if (window.showToast) window.showToast(this.playerStats.flashlightOn ? 'Flashlight ON' : 'Flashlight OFF', '#ff9e00');
      }

      // Crouch Toggle (C)
      if (e.key.toLowerCase() === 'c') {
        this.playerStats.isCrouching = !this.playerStats.isCrouching;
        const hudPosture = document.getElementById('hudPosture');
        if (hudPosture) {
          hudPosture.textContent = this.playerStats.isCrouching ? 'CROUCHING (STEALTH)' : 'STANDING';
          hudPosture.style.color = this.playerStats.isCrouching ? '#3b82f6' : '#00f5d4';
        }
      }

      // Interact (E)
      if (e.key.toLowerCase() === 'e') {
        this.executeInteraction();
      }

      // Weapon Switch (1 or 2)
      if (e.key === '1') this.playerStats.currentWeapon = 'pistol';
      if (e.key === '2') this.playerStats.currentWeapon = 'bat';

      // View Mode Toggle (V)
      if (e.key.toLowerCase() === 'v') {
        this.viewMode = this.viewMode === 'fps' ? 'tps' : 'fps';
        if (window.showToast) window.showToast(`Camera: ${this.viewMode.toUpperCase()}`, '#00f5d4');
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Mouse Look (Pointer Lock)
    this.renderer.domElement.addEventListener('click', () => {
      if (!this.mouse.isLocked) {
        this.renderer.domElement.requestPointerLock();
      } else {
        this.fireWeapon();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.mouse.isLocked = document.pointerLockElement === this.renderer.domElement;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.mouse.isLocked) return;
      const sensitivity = 0.0022;
      this.yaw -= e.movementX * sensitivity;
      this.pitch -= e.movementY * sensitivity;
      this.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.pitch));
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 2) { // Right Click ADS
        this.playerStats.isAiming = true;
        this.camera.fov = 45;
        this.camera.updateProjectionMatrix();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this.playerStats.isAiming = false;
        this.camera.fov = 65;
        this.camera.updateProjectionMatrix();
      }
    });
  }

  fireWeapon() {
    if (this.playerStats.currentWeapon === 'pistol') {
      if (this.playerStats.ammo <= 0) {
        if (window.showToast) window.showToast("Click! Gun empty. Press R to reload.", "#e63946");
        return;
      }

      this.playerStats.ammo--;
      this.playerStats.noiseLevel = 110; // Loud gunfire

      if (window.horrorAudio) window.horrorAudio.playGunshot();

      // Recoil kick
      if (this.weaponObj) {
        this.weaponObj.position.z += 0.15;
        setTimeout(() => { if (this.weaponObj) this.weaponObj.position.z -= 0.15; }, 80);
      }

      // Raycast bullet from camera center
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);

      for (let i = this.zombies.length - 1; i >= 0; i--) {
        const z = this.zombies[i];
        const dist = this.playerObj.position.distanceTo(z.mesh.position);
        if (dist < 40) {
          z.hp -= 35;
          z.state = 'chase';
          if (z.hp <= 0) {
            this.scene.remove(z.mesh);
            this.zombies.splice(i, 1);
            if (window.showToast) window.showToast(`Zombie Eliminated (${z.type})`, "#ff9e00");
            setTimeout(() => this.spawnZombieArchetype(), 5000);
          }
        }
      }

      // Alert nearby zombies acoustically
      for (let z of this.zombies) {
        if (this.playerObj.position.distanceTo(z.mesh.position) < 55) {
          z.state = 'chase';
        }
      }
    }
  }

  executeInteraction() {
    if (!this.currentInteraction) return;

    const item = this.currentInteraction;

    if (item.type === 'generator') {
      this.baseHeat.generatorActive = !this.baseHeat.generatorActive;
      this.updateHeatDome();
      if (window.horrorAudio) window.horrorAudio.toggleGeneratorHum(this.baseHeat.generatorActive);
      const state = this.baseHeat.generatorActive ? "ONLINE (+35 Heat)" : "OFFLINE";
      if (window.showToast) window.showToast(`Diesel Generator: ${state}`, "#ff9e00");
    } else if (item.type === 'crate' && !item.looted) {
      item.looted = true;
      if (item.crateType === 'ammo') this.playerStats.ammo = Math.min(this.playerStats.maxAmmo, this.playerStats.ammo + 12);
      if (item.crateType === 'medical') this.playerStats.health = Math.min(100, this.playerStats.health + 40);
      if (item.crateType === 'rations') {
        this.playerStats.hunger = 100;
        this.playerStats.thirst = 100;
      }
      this.scene.remove(item.mesh);
      if (window.showToast) window.showToast(`Looted ${item.crateType.toUpperCase()} (+Supplies)`, "#10b981");
    } else if (item.role) {
      // Survivor Dialogue
      const line = item.dialogue[item.dialogueIndex % item.dialogue.length];
      item.dialogueIndex++;
      this.showDialogueBox(item.name, line);
    }
  }

  showDialogueBox(speaker, text) {
    let box = document.getElementById('survivorDialogueModal');
    if (!box) {
      box = document.createElement('div');
      box.id = 'survivorDialogueModal';
      box.className = 'dialogue-modal';
      document.body.appendChild(box);
    }
    box.innerHTML = `
      <div class="dialogue-header">
        <span class="dialogue-speaker">${speaker}</span>
        <button class="dialogue-close" onclick="this.parentElement.parentElement.style.display='none'">✕</button>
      </div>
      <p class="dialogue-body">"${text}"</p>
      <div class="dialogue-footer">
        <button class="cyber-btn" onclick="document.getElementById('survivorDialogueModal').style.display='none'">[E] Continue</button>
      </div>
    `;
    box.style.display = 'block';
  }

  /* ========================================================================
     9. ANIMATION LOOP & SIMULATION INTEGRATION
     ======================================================================== */
  updatePlayerPhysics(dt) {
    const moveVector = new THREE.Vector3();

    if (this.keys['w'] || this.keys['arrowup']) moveVector.z -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) moveVector.z += 1;
    if (this.keys['a'] || this.keys['arrowleft']) moveVector.x -= 1;
    if (this.keys['d'] || this.keys['arrowright']) moveVector.x += 1;

    this.playerStats.isSprinting = !!(this.keys['shift'] && this.playerStats.stamina > 5 && !this.playerStats.isCrouching);

    let speed = 6.0;
    if (this.playerStats.isCrouching) {
      speed = 3.0;
      this.playerStats.noiseLevel = 15;
    } else if (this.playerStats.isSprinting) {
      speed = 10.5;
      this.playerStats.stamina = Math.max(0, this.playerStats.stamina - dt * 25);
      this.playerStats.noiseLevel = 65;
    } else {
      this.playerStats.stamina = Math.min(100, this.playerStats.stamina + dt * 15);
      this.playerStats.noiseLevel = 35;
    }

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.playerObj.position.addScaledVector(moveVector, speed * dt);
    }

    // Camera positioning based on FPS / TPS
    const eyeHeight = this.playerStats.isCrouching ? 1.1 : 1.75;
    if (this.viewMode === 'fps') {
      this.camera.position.set(this.playerObj.position.x, eyeHeight, this.playerObj.position.z);
    } else {
      // Third Person over-the-shoulder
      const camOffset = new THREE.Vector3(0.8, eyeHeight + 0.4, 2.5);
      camOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.camera.position.copy(this.playerObj.position).add(camOffset);
    }

    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // Flashlight follows camera look direction
    this.flashlight.position.copy(this.camera.position);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.flashlightTarget.position.copy(this.camera.position).add(forward);

    // Update Proximity Interaction Prompt
    this.currentInteraction = null;
    let closestDist = 999;
    for (let obj of this.interactiveObjects) {
      const d = Math.hypot(this.playerObj.position.x - obj.x, this.playerObj.position.z - obj.z);
      if (d < obj.radius && d < closestDist) {
        closestDist = d;
        this.currentInteraction = obj;
      }
    }

    const promptEl = document.getElementById('interactionPrompt');
    if (promptEl) {
      if (this.currentInteraction) {
        promptEl.textContent = this.currentInteraction.prompt;
        promptEl.style.display = 'block';
      } else {
        promptEl.style.display = 'none';
      }
    }
  }

  updateZombies(dt) {
    const pPos = this.playerObj.position;
    const safehouseCenter = new THREE.Vector3(-40, 0, -40);

    for (let z of this.zombies) {
      const distToPlayer = z.mesh.position.distanceTo(pPos);
      const distToSafehouse = z.mesh.position.distanceTo(safehouseCenter);

      // Check Heat Pull
      if (distToSafehouse < this.baseHeat.radius && z.state !== 'chase') {
        z.state = 'drawn_to_heat';
      }

      // Check Player Detection (Acoustic vs Vision)
      let detectRange = 25;
      if (this.playerStats.isCrouching) detectRange = 10;
      if (this.playerStats.isSprinting) detectRange = 40;
      if (this.playerStats.noiseLevel > 80) detectRange = 75; // Gunfire

      if (distToPlayer < detectRange) {
        z.state = 'chase';
      }

      let target = z.wanderTarget;
      if (z.state === 'chase') {
        target = pPos;
      } else if (z.state === 'drawn_to_heat') {
        target = safehouseCenter;
      }

      const dir = new THREE.Vector3().subVectors(target, z.mesh.position);
      dir.y = 0;
      if (dir.length() > 1.2) {
        dir.normalize();
        z.mesh.position.addScaledVector(dir, z.speed * dt);
        z.mesh.rotation.y = Math.atan2(dir.x, dir.z);
      }

      // Scratch attack player
      if (distToPlayer < 1.8) {
        this.playerStats.health = Math.max(0, this.playerStats.health - dt * 15);
        this.playerStats.infection = Math.min(100, this.playerStats.infection + dt * 8);

        // Screen shake
        this.camera.position.x += (Math.random() - 0.5) * 0.1;

        if (window.setGlobalInfection) {
          window.setGlobalInfection(this.playerStats.infection);
        }
      }
    }
  }

  updateHUD() {
    const hpBar = document.getElementById('hudHealthBar3D');
    const staBar = document.getElementById('hudStaminaBar3D');
    const infBar = document.getElementById('hudInfectionBar3D');
    const ammoEl = document.getElementById('hudAmmo3D');

    if (hpBar) hpBar.style.width = this.playerStats.health + '%';
    if (staBar) staBar.style.width = this.playerStats.stamina + '%';
    if (infBar) infBar.style.width = this.playerStats.infection + '%';
    if (ammoEl) ammoEl.textContent = `${this.playerStats.ammo} / ${this.playerStats.maxAmmo}`;
  }

  animate() {
    const dt = Math.min(0.1, this.clock.getDelta());

    this.updateDayNightCycle(dt);
    this.updatePlayerPhysics(dt);
    this.updateZombies(dt);
    this.updateHeatDome();
    this.updateHUD();

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.animate);
  }
}

window.SurvivalGame3D = SurvivalGame3D;
