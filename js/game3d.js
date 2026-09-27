/**
 * ZOMBIE: STRING OF SURVIVAL — AAA 3D/4D/5D SURVIVAL HORROR ENGINE
 * Features:
 * - Sprawling Apocalyptic City District with Skyscrapers, Overpasses, and Burning Embers
 * - Tactical Recon Drone (PUBG/Free Fire style free-flying camera to view the whole city)
 * - Skeletal & Procedural Animations: Walking, Sprinting, Melee Bat Swing Arc, Weapon Recoil, Zombie Claw Lunges, Ragdoll Death
 * - Real-time Minimap & Compass Bar (PUBG / Free Fire HUD)
 * - Dynamic Day/Night Cycle with Lighting, Shadows, and Lightning Storms
 * - Base Heat Attraction Dome with Interactive Diesel Generator
 * - Physical NPC Survivors & Adaptive 3D Zombie Archetypes
 */

class SurvivalGame3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.width = this.container.clientWidth || 960;
    this.height = this.container.clientHeight || 600;

    // Temporal 4D Cycle (Day/Night)
    this.gameTime = 8.5; // 08:30 AM
    this.currentDay = 1;
    this.timeSpeed = 0.04;

    // 5D Bio-Physical Stats
    this.playerStats = {
      health: 100,
      maxHealth: 100,
      stamina: 100,
      hunger: 90,
      thirst: 85,
      infection: 0,
      temperature: 36.8,
      noiseLevel: 0,
      ammo: 24,
      maxAmmo: 24,
      currentWeapon: 'pistol', // 'pistol' or 'bat'
      isCrouching: false,
      isSprinting: false,
      isAiming: false,
      isReloading: false,
      isAttacking: false,
      flashlightOn: true,
      dominantArchetype: 'Hunter'
    };

    // Camera Modes: 'fps' (First-Person), 'tps' (Third-Person), 'drone' (City Flying Camera)
    this.cameraMode = 'fps';
    this.drone = {
      position: new THREE.Vector3(-40, 80, -40),
      velocity: new THREE.Vector3(),
      yaw: 0,
      pitch: -0.4,
      speed: 40.0
    };

    // Three.js Core
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sunLight = null;
    this.ambientLight = null;
    this.flashlight = null;
    this.flashlightTarget = null;
    this.clock = new THREE.Clock();

    // World Entities
    this.playerGroup = null;
    this.playerBody = null;
    this.playerLegL = null;
    this.playerLegR = null;
    this.playerArmR = null;
    this.weaponObj = null;
    this.batObj = null;
    this.zombies = [];
    this.survivors = [];
    this.interactiveObjects = [];
    this.particles = [];
    this.fireLights = [];
    this.lightningTimer = 10;

    // Base Heat Manager
    this.baseHeat = {
      totalHeat: 45,
      radius: 90,
      sphereMesh: null,
      generatorActive: true,
      generatorMesh: null,
      generatorLight: null
    };

    // Movement & Controls
    this.keys = {};
    this.mouse = { x: 0, y: 0, isLocked: false };
    this.yaw = 0;
    this.pitch = 0;
    this.walkCycle = 0;
    this.swingAnim = 0;
    this.currentInteraction = null;

    this.initScene();
    this.initLighting();
    this.buildCityMetropolis();
    this.initPlayer();
    this.initSurvivors();
    this.initZombies();
    this.initHeatDome();
    this.initAtmosphericParticles();
    this.bindControls();

    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  /* ========================================================================
     1. SCENE & RENDERER INITIALIZATION
     ======================================================================== */
  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f16);
    this.scene.fog = new THREE.FogExp2(0x0e141e, 0.012);

    this.camera = new THREE.PerspectiveCamera(65, this.width / this.height, 0.1, 800);

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
     2. LIGHTING & 4D TEMPORAL DYNAMICS
     ======================================================================== */
  initLighting() {
    this.ambientLight = new THREE.AmbientLight(0x334455, 0.5);
    this.scene.add(this.ambientLight);

    this.sunLight = new THREE.DirectionalLight(0xffecd2, 1.4);
    this.sunLight.position.set(60, 140, 60);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 400;
    this.sunLight.shadow.camera.left = -160;
    this.sunLight.shadow.camera.right = 160;
    this.sunLight.shadow.camera.top = 160;
    this.sunLight.shadow.camera.bottom = -160;
    this.scene.add(this.sunLight);

    // Tactical Flashlight
    this.flashlight = new THREE.SpotLight(0xfff8e7, 3.0, 60, Math.PI / 5.5, 0.35, 1.2);
    this.flashlight.castShadow = true;
    this.flashlightTarget = new THREE.Object3D();
    this.scene.add(this.flashlightTarget);
    this.flashlight.target = this.flashlightTarget;
    this.scene.add(this.flashlight);
  }

  /* ========================================================================
     3. EXPANSIVE CITY METROPOLIS (Skyscrapers, Overpasses, Burning Barrels)
     ======================================================================== */
  buildCityMetropolis() {
    // Ground
    const groundGeo = new THREE.PlaneGeometry(600, 600);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x11161f, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Grid of Roads
    this.createRoad(0, 0, 500, 20, true);
    this.createRoad(0, 0, 20, 500, false);
    this.createRoad(0, 100, 500, 16, true);
    this.createRoad(0, -100, 500, 16, true);
    this.createRoad(100, 0, 16, 500, false);
    this.createRoad(-100, 0, 16, 500, false);

    // 1. Safehouse Substation (District 4 HQ: -40, 0, -40)
    this.createSafehouse(-40, -40);

    // 2. St. Jude Medical Hospital (Multi-level skyscraper: 50, -60)
    this.createSkyscraper(50, -60, 40, 55, 34, 0x1e293b, "ST. JUDE HOSPITAL", 0x38bdf8);

    // 3. Police Headquarters (Armory: 60, 50)
    this.createSkyscraper(60, 50, 42, 40, 36, 0x0f172a, "POLICE PRECINCT 09", 0xf59e0b);

    // 4. Metro Plaza Mall (-65, 55)
    this.createSkyscraper(-65, 55, 48, 30, 44, 0x18202c, "METRO PLAZA MALL", 0xe63946);

    // 5. Biogenix Central Tower (Endgame Skyscraper: 120, -120)
    this.createSkyscraper(120, -120, 50, 95, 50, 0x090d16, "BIOGENIX GENETICS", 0x10b981);

    // Additional Skyline Skyscrapers for Epic Drone Flight View
    const buildingCoords = [
      [-120, -120, 36, 75, 36], [-120, -40, 30, 60, 30], [-120, 40, 34, 80, 34], [-120, 120, 40, 90, 40],
      [-40, 120, 32, 65, 32], [40, 120, 38, 70, 38], [120, 40, 42, 85, 42], [120, -40, 35, 65, 35]
    ];
    buildingCoords.forEach(c => {
      this.createGenericSkyscraper(c[0], c[1], c[2], c[3], c[4]);
    });

    // Elevated Highway Overpass
    this.createElevatedHighway(0, -25, 260);

    // Burning Trash Barrels with Flickering Fire
    this.createBurningBarrel(-15, -15);
    this.createBurningBarrel(25, -20);
    this.createBurningBarrel(15, 35);
    this.createBurningBarrel(-35, 40);

    // Abandoned Vehicles & Supply Crates
    this.createVehicle(-10, 8, 0.4, 0x334155);
    this.createVehicle(15, -12, -0.6, 0x1e3a8a);
    this.createVehicle(-60, 8, 1.2, 0x52525b);
    this.createVehicle(8, 65, 0.1, 0x71717a);

    this.createSupplyCrate(20, -42, 'medical');
    this.createSupplyCrate(50, 35, 'ammo');
    this.createSupplyCrate(-45, 35, 'rations');
    this.createSupplyCrate(0, -25, 'ammo');
  }

  createRoad(x, z, w, l, isHorizontal) {
    const roadGeo = new THREE.PlaneGeometry(w, l);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.95 });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(x, 0.02, z);
    road.receiveShadow = true;
    this.scene.add(road);

    // Divider Stripe
    const stripeGeo = new THREE.PlaneGeometry(isHorizontal ? w : 0.7, isHorizontal ? 0.7 : l);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.rotation.x = -Math.PI / 2;
    stripe.position.set(x, 0.03, z);
    this.scene.add(stripe);
  }

  createSkyscraper(x, z, w, h, d, color, labelText, neonCol) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.7, metalness: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.scene.add(mesh);

    // Illuminated Windows Grid
    const winGeo = new THREE.PlaneGeometry(w * 0.9, h * 0.8);
    const winMat = new THREE.MeshBasicMaterial({ color: 0xfff0c2, wireframe: true, transparent: true, opacity: 0.15 });
    const win = new THREE.Mesh(winGeo, winMat);
    win.position.set(x, h / 2, z + d / 2 + 0.1);
    this.scene.add(win);

    // Neon Rooftop Sign
    const signGeo = new THREE.BoxGeometry(w * 0.7, 2.5, 0.5);
    const signMat = new THREE.MeshBasicMaterial({ color: neonCol });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(x, h + 1.5, z + d / 2 + 0.3);
    this.scene.add(sign);
  }

  createGenericSkyscraper(x, z, w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const mat = new THREE.MeshStandardMaterial({ color: 0x18202c, roughness: 0.8, metalness: 0.2 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, h / 2, z);
    mesh.castShadow = true; mesh.receiveShadow = true;
    this.scene.add(mesh);
  }

  createElevatedHighway(x, z, length) {
    const deckGeo = new THREE.BoxGeometry(length, 1.2, 14);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(x, 10, z);
    deck.castShadow = true; deck.receiveShadow = true;
    this.scene.add(deck);

    // Pillars
    for (let px = -length / 2 + 20; px <= length / 2 - 20; px += 45) {
      const colGeo = new THREE.CylinderGeometry(1.4, 1.6, 10, 8);
      const colMat = new THREE.MeshStandardMaterial({ color: 0x475569 });
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.set(px, 5, z);
      col.castShadow = true;
      this.scene.add(col);
    }
  }

  createBurningBarrel(x, z) {
    const barrelGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.4, 12);
    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.7 });
    const barrel = new THREE.Mesh(barrelGeo, barrelMat);
    barrel.position.set(x, 0.7, z);
    barrel.castShadow = true;
    this.scene.add(barrel);

    // Flickering Point Light
    const fireLight = new THREE.PointLight(0xff5500, 2.0, 16);
    fireLight.position.set(x, 1.8, z);
    this.scene.add(fireLight);
    this.fireLights.push(fireLight);
  }

  createSafehouse(x, z) {
    const w = 38;
    const d = 38;
    const h = 7.5;

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });

    // Perimeter Walls
    const nWall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1), wallMat);
    nWall.position.set(x, h/2, z - d/2); nWall.castShadow = true; this.scene.add(nWall);

    const sWallL = new THREE.Mesh(new THREE.BoxGeometry(w * 0.38, h, 1), wallMat);
    sWallL.position.set(x - w * 0.31, h/2, z + d/2); sWallL.castShadow = true; this.scene.add(sWallL);

    const sWallR = new THREE.Mesh(new THREE.BoxGeometry(w * 0.38, h, 1), wallMat);
    sWallR.position.set(x + w * 0.31, h/2, z + d/2); sWallR.castShadow = true; this.scene.add(sWallR);

    const wWall = new THREE.Mesh(new THREE.BoxGeometry(1, h, d), wallMat);
    wWall.position.set(x - w/2, h/2, z); wWall.castShadow = true; this.scene.add(wWall);

    const eWall = new THREE.Mesh(new THREE.BoxGeometry(1, h, d), wallMat);
    eWall.position.set(x + w/2, h/2, z); eWall.castShadow = true; this.scene.add(eWall);

    // Watchtower
    const towerGeo = new THREE.BoxGeometry(6, 14, 6);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(x + w/2 - 3, 7, z + d/2 - 3);
    tower.castShadow = true; this.scene.add(tower);

    // Modified Diesel Generator
    const genGeo = new THREE.BoxGeometry(3.2, 2.2, 2.2);
    const genMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, metalness: 0.7 });
    this.baseHeat.generatorMesh = new THREE.Mesh(genGeo, genMat);
    this.baseHeat.generatorMesh.position.set(x - 8, 1.1, z - 8);
    this.baseHeat.generatorMesh.castShadow = true;
    this.scene.add(this.baseHeat.generatorMesh);

    this.baseHeat.generatorLight = new THREE.PointLight(0xff9e00, 2.0, 22);
    this.baseHeat.generatorLight.position.set(x - 8, 3, z - 8);
    this.scene.add(this.baseHeat.generatorLight);

    this.interactiveObjects.push({
      type: 'generator',
      x: x - 8,
      z: z - 8,
      radius: 4.5,
      prompt: 'Toggle Modified Diesel Generator (Press E)'
    });
  }

  createVehicle(x, z, rot, color) {
    const car = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.3, 2.2), new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.7 }));
    body.position.y = 0.9; body.castShadow = true;
    car.add(body);

    const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.0, 1.9), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.1 }));
    cab.position.set(-0.3, 1.8, 0);
    car.add(cab);

    car.position.set(x, 0, z);
    car.rotation.y = rot;
    this.scene.add(car);
  }

  createSupplyCrate(x, z, type) {
    let col = 0x10b981;
    if (type === 'ammo') col = 0xeab308;
    if (type === 'rations') col = 0x3b82f6;

    const crate = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.6), new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 }));
    crate.position.set(x, 0.7, z);
    crate.castShadow = true;
    this.scene.add(crate);

    this.interactiveObjects.push({
      type: 'crate', crateType: type, mesh: crate, x, z, radius: 3.2, looted: false,
      prompt: `Scavenge ${type.toUpperCase()} Crate (Press E)`
    });
  }

  /* ========================================================================
     4. ANIMATED 3D SURVIVOR CHARACTER & WEAPONS (Alexei)
     ======================================================================== */
  initPlayer() {
    this.playerGroup = new THREE.Group();
    this.playerGroup.position.set(-36, 0, -25); // Inside safehouse
    this.scene.add(this.playerGroup);

    // Torso
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7 });
    this.playerBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.45), bodyMat);
    this.playerBody.position.y = 1.3;
    this.playerBody.castShadow = true;
    this.playerGroup.add(this.playerBody);

    // Tactical Backpack
    const pack = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 0.35), new THREE.MeshStandardMaterial({ color: 0x52525b }));
    pack.position.set(0, 1.3, -0.35);
    this.playerGroup.add(pack);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
    head.position.y = 2.15;
    this.playerGroup.add(head);

    // Animated Legs
    const legGeo = new THREE.BoxGeometry(0.32, 0.85, 0.32);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1f2937 });
    this.playerLegL = new THREE.Mesh(legGeo, legMat);
    this.playerLegL.position.set(-0.22, 0.42, 0);
    this.playerGroup.add(this.playerLegL);

    this.playerLegR = new THREE.Mesh(legGeo, legMat);
    this.playerLegR.position.set(0.22, 0.42, 0);
    this.playerGroup.add(this.playerLegR);

    // Arms & Weapons
    this.initWeapons();
  }

  initWeapons() {
    // 1. Suppressed Tactical Pistol
    const gunGroup = new THREE.Group();
    const gunMat = new THREE.MeshStandardMaterial({ color: 0x09090b, metalness: 0.9, roughness: 0.2 });
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.8), gunMat);
    barrel.position.set(0, 0, -0.35);
    gunGroup.add(barrel);

    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.45, 0.22), gunMat);
    grip.position.set(0, -0.25, -0.05);
    grip.rotation.x = 0.2;
    gunGroup.add(grip);

    const supp = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.55, 12), new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.7 }));
    supp.rotation.x = Math.PI / 2;
    supp.position.set(0, 0, -0.9);
    gunGroup.add(supp);

    gunGroup.position.set(0.32, -0.28, -0.55);
    this.camera.add(gunGroup);
    this.weaponObj = gunGroup;

    // 2. Barbed-Wire Baseball Bat
    const batGroup = new THREE.Group();
    const batMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.6 });
    const wood = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.05, 1.2, 8), batMat);
    wood.position.set(0, 0.4, 0);
    batGroup.add(wood);

    const wireMat = new THREE.MeshStandardMaterial({ color: 0xa1a1aa, metalness: 0.8 });
    const wire = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.02, 6, 12), wireMat);
    wire.position.set(0, 0.7, 0);
    batGroup.add(wire);

    batGroup.position.set(0.35, -0.4, -0.6);
    batGroup.rotation.set(0.2, 0.3, -0.5);
    batGroup.visible = false;
    this.camera.add(batGroup);
    this.batObj = batGroup;

    this.scene.add(this.camera);
  }

  /* ========================================================================
     5. NPC SURVIVORS (Dr. Evelyn, Marcus, Darius)
     ======================================================================== */
  initSurvivors() {
    this.createSurvivor(50, -48, "DR. EVELYN REED", 0x38bdf8, "Doctor", [
      "Alexei! You made it. The clinic triage bay was overrun on Day 2.",
      "If we recover my heavy synthesis medical crate, I can produce the Day 7 antiviral cure for extraction Zulu-9!",
      "Will you prioritize the vaccine research, or escape with raw firepower?"
    ]);

    this.createSurvivor(-34, -42, "MARCUS VANCE", 0xf59e0b, "Engineer", [
      "Generator is purring, Alexei. But each appliance we flip on pushes our heat radius deeper into the streets.",
      "Bring me 40 scrap metal from the overpass and I'll craft an automated sentry turret."
    ]);

    this.createSurvivor(-22, -22, "SGT. DARIUS COLE", 0x10b981, "Soldier", [
      "Watchtower clear. The acoustic Swarmers are pacing the highway.",
      "Remember: crouching cuts your acoustic noise down to a whisper. Don't sprint unless you have to."
    ]);
  }

  createSurvivor(x, z, name, color, role, lines) {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1.8, 8), new THREE.MeshStandardMaterial({ color: color }));
    body.position.y = 0.9; body.castShadow = true;
    group.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), new THREE.MeshStandardMaterial({ color: 0xffdbac }));
    head.position.y = 1.95;
    group.add(head);

    group.position.set(x, 0, z);
    this.scene.add(group);

    const sData = { name, role, mesh: group, dialogue: lines, idx: 0, x, z, radius: 3.8, prompt: `Talk to ${name} (${role}) — Press E` };
    this.survivors.push(sData);
    this.interactiveObjects.push(sData);
  }

  /* ========================================================================
     6. ANIMATED 3D ZOMBIE ARCHETYPES (Swarm, Ambusher, Hunter, Tank)
     ======================================================================== */
  initZombies() {
    this.zombies = [];
    for (let i = 0; i < 16; i++) {
      this.spawnZombieArchetype();
    }
  }

  spawnZombieArchetype(typeOverride = null) {
    const type = typeOverride || this.playerStats.dominantArchetype || 'Hunter';
    const angle = Math.random() * Math.PI * 2;
    const dist = 50 + Math.random() * 80;
    const x = Math.cos(angle) * dist;
    const z = Math.sin(angle) * dist;

    const group = new THREE.Group();
    let skinColor = 0x64748b;
    let eyeColor = 0xeab308;
    let speed = 3.0;
    let hp = 55;

    if (type === 'Swarm') {
      skinColor = 0x991b1b; // Red calcified flesh
      speed = 4.2; hp = 45;
    } else if (type === 'Ambusher') {
      skinColor = 0x18181b; eyeColor = 0x38bdf8;
      speed = 4.8; hp = 35;
    } else if (type === 'Tank') {
      skinColor = 0x334155; speed = 1.8; hp = 220;
    }

    // Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.2, 0.45), new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.8 }));
    torso.position.y = 1.1; torso.castShadow = true;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.42), new THREE.MeshStandardMaterial({ color: skinColor }));
    head.position.y = 1.95;
    group.add(head);

    // Glowing Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: eyeColor });
    const eL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat);
    eL.position.set(-0.12, 1.98, 0.22); group.add(eL);
    const eR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), eyeMat);
    eR.position.set(0.12, 1.98, 0.22); group.add(eR);

    // Swarmer Giant Bat Ears
    if (type === 'Swarm') {
      const earMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d });
      const earL = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 5), earMat);
      earL.rotation.z = -0.55; earL.position.set(-0.38, 2.2, 0); group.add(earL);

      const earR = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.65, 5), earMat);
      earR.rotation.z = 0.55; earR.position.set(0.38, 2.2, 0); group.add(earR);
    }

    // Animated Limbs
    const armGeo = new THREE.BoxGeometry(0.22, 0.8, 0.22);
    const armL = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({ color: skinColor }));
    armL.position.set(-0.48, 1.2, 0.2);
    armL.rotation.x = -0.8; // Reaching forward
    group.add(armL);

    const armR = new THREE.Mesh(armGeo, new THREE.MeshStandardMaterial({ color: skinColor }));
    armR.position.set(0.48, 1.2, 0.2);
    armR.rotation.x = -0.8;
    group.add(armR);

    group.position.set(x, 0, z);
    this.scene.add(group);

    this.zombies.push({
      mesh: group, armL, armR, type, hp, maxHp: hp, speed,
      state: 'wander',
      wanderTarget: new THREE.Vector3(x + (Math.random() - 0.5) * 35, 0, z + (Math.random() - 0.5) * 35),
      wanderTimer: 3,
      animTime: Math.random() * 10
    });
  }

  /* ========================================================================
     7. BASE HEAT 3D ATTRACTION SPHERE
     ======================================================================== */
  initHeatDome() {
    const geo = new THREE.SphereGeometry(this.baseHeat.radius, 32, 20);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff6600, wireframe: true, transparent: true, opacity: 0.08 });
    this.baseHeat.sphereMesh = new THREE.Mesh(geo, mat);
    this.baseHeat.sphereMesh.position.set(-40, 0, -40);
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
      const s = this.baseHeat.radius / 90.0;
      this.baseHeat.sphereMesh.scale.set(s, s, s);
      this.baseHeat.sphereMesh.material.opacity = 0.06 + Math.sin(performance.now() * 0.003) * 0.03;
    }
  }

  /* ========================================================================
     8. ATMOSPHERIC PARTICLES (Embers, Rain, Dust)
     ======================================================================== */
  initAtmosphericParticles() {
    const pCount = 350;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(pCount * 3);

    for (let i = 0; i < pCount * 3; i += 3) {
      pPositions[i] = (Math.random() - 0.5) * 200;
      pPositions[i + 1] = Math.random() * 40;
      pPositions[i + 2] = (Math.random() - 0.5) * 200;
    }

    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    const pMat = new THREE.PointsMaterial({ color: 0xffaa44, size: 0.35, transparent: true, opacity: 0.6 });
    const pSystem = new THREE.Points(pGeo, pMat);
    this.scene.add(pSystem);
    this.particles = pSystem;
  }

  /* ========================================================================
     9. CONTROLS, DRONE RECON FLIGHT & ANIMATIONS
     ======================================================================== */
  bindControls() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;

      // Toggle Tactical Recon Drone [T]
      if (e.key.toLowerCase() === 't') {
        this.cameraMode = this.cameraMode === 'drone' ? 'fps' : 'drone';
        if (this.cameraMode === 'drone') {
          this.drone.position.set(this.playerGroup.position.x, 75, this.playerGroup.position.z + 40);
          this.drone.pitch = -0.55;
          if (window.showToast) window.showToast("🛸 TACTICAL DRONE ONLINE: Fly across the city! (WASD + Space/Shift)", "#00f5d4");
        } else {
          if (window.showToast) window.showToast("Boots on Ground: First-Person Restored", "#ff9e00");
        }
      }

      // Toggle 1st / 3rd Person View [V]
      if (e.key.toLowerCase() === 'v' && this.cameraMode !== 'drone') {
        this.cameraMode = this.cameraMode === 'fps' ? 'tps' : 'fps';
        if (window.showToast) window.showToast(`View: ${this.cameraMode.toUpperCase()}`, "#ff9e00");
      }

      // Flashlight [F]
      if (e.key.toLowerCase() === 'f') {
        this.playerStats.flashlightOn = !this.playerStats.flashlightOn;
        this.flashlight.intensity = this.playerStats.flashlightOn ? 3.0 : 0;
      }

      // Crouch [C]
      if (e.key.toLowerCase() === 'c') {
        this.playerStats.isCrouching = !this.playerStats.isCrouching;
      }

      // Interact [E]
      if (e.key.toLowerCase() === 'e') {
        this.executeInteraction();
      }

      // Weapon Select [1] Pistol / [2] Bat
      if (e.key === '1') this.switchWeapon('pistol');
      if (e.key === '2') this.switchWeapon('bat');

      // Reload [R]
      if (e.key.toLowerCase() === 'r') this.reloadWeapon();
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    // Pointer Lock & Mouse Look
    this.renderer.domElement.addEventListener('click', () => {
      if (!this.mouse.isLocked) {
        this.renderer.domElement.requestPointerLock();
      } else {
        this.attack();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.mouse.isLocked = document.pointerLockElement === this.renderer.domElement;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.mouse.isLocked) return;
      const sens = 0.0022;

      if (this.cameraMode === 'drone') {
        this.drone.yaw -= e.movementX * sens;
        this.drone.pitch -= e.movementY * sens;
        this.drone.pitch = Math.max(-Math.PI / 2.1, Math.min(Math.PI / 2.1, this.drone.pitch));
      } else {
        this.yaw -= e.movementX * sens;
        this.pitch -= e.movementY * sens;
        this.pitch = Math.max(-Math.PI / 2.3, Math.min(Math.PI / 2.3, this.pitch));
      }
    });

    // Right Click ADS
    window.addEventListener('mousedown', (e) => {
      if (e.button === 2 && this.cameraMode !== 'drone') {
        this.playerStats.isAiming = true;
        this.camera.fov = 42;
        this.camera.updateProjectionMatrix();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 2 && this.cameraMode !== 'drone') {
        this.playerStats.isAiming = false;
        this.camera.fov = 65;
        this.camera.updateProjectionMatrix();
      }
    });
  }

  switchWeapon(type) {
    this.playerStats.currentWeapon = type;
    if (this.weaponObj) this.weaponObj.visible = (type === 'pistol');
    if (this.batObj) this.batObj.visible = (type === 'bat');
    if (window.showToast) window.showToast(`Equipped: ${type === 'pistol' ? 'Suppressed 9mm Pistol' : 'Barbed Baseball Bat'}`, "#00f5d4");
  }

  reloadWeapon() {
    if (this.playerStats.isReloading) return;
    this.playerStats.isReloading = true;
    if (window.showToast) window.showToast("Reloading Magazine...", "#ff9e00");

    if (this.weaponObj) {
      this.weaponObj.rotation.x = -0.5;
      setTimeout(() => {
        this.playerStats.ammo = this.playerStats.maxAmmo;
        this.playerStats.isReloading = false;
        if (this.weaponObj) this.weaponObj.rotation.x = 0;
        if (window.showToast) window.showToast("Pistol Reloaded (24/24)", "#10b981");
      }, 1200);
    }
  }

  attack() {
    if (this.cameraMode === 'drone') return;

    if (this.playerStats.currentWeapon === 'pistol') {
      if (this.playerStats.ammo <= 0) {
        this.reloadWeapon();
        return;
      }
      this.playerStats.ammo--;
      this.playerStats.noiseLevel = 110;
      if (window.horrorAudio) window.horrorAudio.playGunshot();

      // Recoil
      if (this.weaponObj) {
        this.weaponObj.position.z += 0.16;
        setTimeout(() => { if (this.weaponObj) this.weaponObj.position.z -= 0.16; }, 70);
      }

      this.checkHitscanHit(45, 45);
    } else {
      // Melee Bat Swing Arc Animation
      this.playerStats.isAttacking = true;
      this.playerStats.noiseLevel = 25;
      this.swingAnim = 1.0;

      if (window.horrorAudio) window.horrorAudio.playHeartbeat();
      this.checkHitscanHit(120, 6);
    }
  }

  checkHitscanHit(damage, range) {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), this.camera);

    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const z = this.zombies[i];
      const dist = this.playerGroup.position.distanceTo(z.mesh.position);

      if (dist < range) {
        z.hp -= damage;
        z.state = 'chase';

        // Hit Reaction & Blood Splatter
        z.mesh.position.y += 0.2;
        setTimeout(() => { z.mesh.position.y = 0; }, 80);

        this.showHitMarker();

        if (z.hp <= 0) {
          // Ragdoll flop death
          z.mesh.rotation.x = Math.PI / 2;
          z.mesh.position.y = 0.2;
          setTimeout(() => {
            this.scene.remove(z.mesh);
            this.zombies.splice(i, 1);
            setTimeout(() => this.spawnZombieArchetype(), 5000);
          }, 3000);
          if (window.showToast) window.showToast(`Zombie Eliminated (${z.type})!`, "#ff9e00");
        }
        break;
      }
    }
  }

  showHitMarker() {
    const hm = document.getElementById('hitMarkerCrosshair');
    if (hm) {
      hm.style.opacity = '1';
      setTimeout(() => { hm.style.opacity = '0'; }, 100);
    }
  }

  executeInteraction() {
    if (!this.currentInteraction) return;
    const item = this.currentInteraction;

    if (item.type === 'generator') {
      this.baseHeat.generatorActive = !this.baseHeat.generatorActive;
      this.updateHeatDome();
      if (window.horrorAudio) window.horrorAudio.toggleGeneratorHum(this.baseHeat.generatorActive);
      const s = this.baseHeat.generatorActive ? "ONLINE (+35 Heat)" : "OFFLINE";
      if (window.showToast) window.showToast(`Diesel Generator: ${s}`, "#ff9e00");
    } else if (item.type === 'crate' && !item.looted) {
      item.looted = true;
      if (item.crateType === 'ammo') this.playerStats.ammo = this.playerStats.maxAmmo;
      if (item.crateType === 'medical') this.playerStats.health = Math.min(100, this.playerStats.health + 45);
      if (item.crateType === 'rations') { this.playerStats.hunger = 100; this.playerStats.thirst = 100; }
      this.scene.remove(item.mesh);
      if (window.showToast) window.showToast(`Scavenged ${item.crateType.toUpperCase()} Crate!`, "#10b981");
    } else if (item.role) {
      const line = item.dialogue[item.idx % item.dialogue.length];
      item.idx++;
      this.showDialogue(item.name, line);
    }
  }

  showDialogue(speaker, text) {
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
     10. UPDATE LOOPS & ANIMATIONS
     ======================================================================== */
  updateDrone(dt) {
    const move = new THREE.Vector3();
    if (this.keys['w']) move.z -= 1;
    if (this.keys['s']) move.z += 1;
    if (this.keys['a']) move.x -= 1;
    if (this.keys['d']) move.x += 1;
    if (this.keys[' ']) move.y += 1; // Ascend
    if (this.keys['shift']) move.y -= 1; // Descend

    if (move.lengthSq() > 0) {
      move.normalize();
      move.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.drone.yaw);
      this.drone.position.addScaledVector(move, this.drone.speed * dt);
    }

    this.camera.position.copy(this.drone.position);
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.y = this.drone.yaw;
    this.camera.rotation.x = this.drone.pitch;
  }

  updatePlayer(dt) {
    const move = new THREE.Vector3();
    if (this.keys['w']) move.z -= 1;
    if (this.keys['s']) move.z += 1;
    if (this.keys['a']) move.x -= 1;
    if (this.keys['d']) move.x += 1;

    const isMoving = move.lengthSq() > 0;
    this.playerStats.isSprinting = !!(this.keys['shift'] && this.playerStats.stamina > 5 && !this.playerStats.isCrouching && isMoving);

    let speed = 6.5;
    if (this.playerStats.isCrouching) {
      speed = 3.2;
      this.playerStats.noiseLevel = 15;
    } else if (this.playerStats.isSprinting) {
      speed = 11.5;
      this.playerStats.stamina = Math.max(0, this.playerStats.stamina - dt * 25);
      this.playerStats.noiseLevel = 70;
    } else {
      this.playerStats.stamina = Math.min(100, this.playerStats.stamina + dt * 15);
      this.playerStats.noiseLevel = isMoving ? 35 : 0;
    }

    if (isMoving) {
      move.normalize();
      move.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.playerGroup.position.addScaledVector(move, speed * dt);

      // Walking Leg Animation Cycle
      this.walkCycle += dt * (this.playerStats.isSprinting ? 16 : 9);
      if (this.playerLegL && this.playerLegR) {
        this.playerLegL.rotation.x = Math.sin(this.walkCycle) * 0.6;
        this.playerLegR.rotation.x = -Math.sin(this.walkCycle) * 0.6;
      }
    } else {
      if (this.playerLegL && this.playerLegR) {
        this.playerLegL.rotation.x = 0;
        this.playerLegR.rotation.x = 0;
      }
    }

    this.playerGroup.rotation.y = this.yaw;

    // Bat Swing Animation
    if (this.swingAnim > 0) {
      this.swingAnim -= dt * 4;
      if (this.batObj) {
        this.batObj.rotation.z = -0.5 + Math.sin(this.swingAnim * Math.PI) * 1.8;
      }
      if (this.swingAnim <= 0) this.playerStats.isAttacking = false;
    }

    // Camera Placement (FPS vs TPS)
    const eyeY = this.playerStats.isCrouching ? 1.15 : 1.85;
    if (this.cameraMode === 'fps') {
      this.camera.position.set(this.playerGroup.position.x, eyeY, this.playerGroup.position.z);
    } else {
      const offset = new THREE.Vector3(0.7, eyeY + 0.35, 2.6).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      this.camera.position.copy(this.playerGroup.position).add(offset);
    }

    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // Flashlight follows camera look
    this.flashlight.position.copy(this.camera.position);
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    this.flashlightTarget.position.copy(this.camera.position).add(forward);

    // Interaction Check
    this.currentInteraction = null;
    let nearest = 999;
    for (let obj of this.interactiveObjects) {
      const d = Math.hypot(this.playerGroup.position.x - obj.x, this.playerGroup.position.z - obj.z);
      if (d < obj.radius && d < nearest) {
        nearest = d;
        this.currentInteraction = obj;
      }
    }

    const pEl = document.getElementById('interactionPrompt');
    if (pEl) {
      if (this.currentInteraction) {
        pEl.textContent = this.currentInteraction.prompt;
        pEl.style.display = 'block';
      } else {
        pEl.style.display = 'none';
      }
    }
  }

  updateZombies(dt) {
    const pPos = this.playerGroup.position;
    const basePos = new THREE.Vector3(-40, 0, -40);

    for (let z of this.zombies) {
      if (z.hp <= 0) continue;

      const distP = z.mesh.position.distanceTo(pPos);
      const distB = z.mesh.position.distanceTo(basePos);

      // Base Heat Pull
      if (distB < this.baseHeat.radius && z.state !== 'chase') {
        z.state = 'drawn_to_heat';
      }

      // Detection
      let alertRange = 28;
      if (this.playerStats.isCrouching) alertRange = 12;
      if (this.playerStats.isSprinting) alertRange = 45;
      if (this.playerStats.noiseLevel > 75) alertRange = 90; // Gunfire pull

      if (distP < alertRange) z.state = 'chase';

      let target = z.wanderTarget;
      if (z.state === 'chase') target = pPos;
      else if (z.state === 'drawn_to_heat') target = basePos;

      const dir = new THREE.Vector3().subVectors(target, z.mesh.position);
      dir.y = 0;
      if (dir.length() > 1.4) {
        dir.normalize();
        z.mesh.position.addScaledVector(dir, z.speed * dt);
        z.mesh.rotation.y = Math.atan2(dir.x, dir.z);

        // Shambling claw animation
        z.animTime += dt * 6;
        z.armL.rotation.x = -0.8 + Math.sin(z.animTime) * 0.4;
        z.armR.rotation.x = -0.8 - Math.sin(z.animTime) * 0.4;
      }

      // Claw Scratch Attack
      if (distP < 2.0) {
        this.playerStats.health = Math.max(0, this.playerStats.health - dt * 20);
        this.playerStats.infection = Math.min(100, this.playerStats.infection + dt * 10);
        if (window.setGlobalInfection) window.setGlobalInfection(this.playerStats.infection);
      }
    }
  }

  updateAtmosphere(dt) {
    // Flickering barrel fires
    this.fireLights.forEach(l => {
      l.intensity = 1.6 + Math.sin(performance.now() * 0.02 + l.position.x) * 0.6;
    });

    // Embers drift
    if (this.particles) {
      const pos = this.particles.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += dt * 2;
        if (pos[i] > 35) pos[i] = 0;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }
  }

  updateHUD() {
    const hp = document.getElementById('hudHealthBar3D');
    const sta = document.getElementById('hudStaminaBar3D');
    const inf = document.getElementById('hudInfectionBar3D');
    const ammo = document.getElementById('hudAmmo3D');
    const comp = document.getElementById('hudCompassBar');

    if (hp) hp.style.width = this.playerStats.health + '%';
    if (sta) sta.style.width = this.playerStats.stamina + '%';
    if (inf) inf.style.width = this.playerStats.infection + '%';
    if (ammo) ammo.textContent = `${this.playerStats.ammo} / ${this.playerStats.maxAmmo}`;

    // Compass Heading
    if (comp) {
      let deg = Math.round(((-this.yaw * 180 / Math.PI) % 360 + 360) % 360);
      comp.textContent = `${deg}° | ${this.getCardinal(deg)}`;
    }
  }

  getCardinal(deg) {
    if (deg >= 337 || deg < 23) return 'N';
    if (deg >= 23 && deg < 67) return 'NE';
    if (deg >= 67 && deg < 112) return 'E';
    if (deg >= 112 && deg < 157) return 'SE';
    if (deg >= 157 && deg < 202) return 'S';
    if (deg >= 202 && deg < 247) return 'SW';
    if (deg >= 247 && deg < 292) return 'W';
    return 'NW';
  }

  animate() {
    const dt = Math.min(0.1, this.clock.getDelta());

    if (this.cameraMode === 'drone') {
      this.updateDrone(dt);
    } else {
      this.updatePlayer(dt);
    }

    this.updateZombies(dt);
    this.updateHeatDome();
    this.updateAtmosphere(dt);
    this.updateHUD();

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate);
  }
}

window.SurvivalGame3D = SurvivalGame3D;
