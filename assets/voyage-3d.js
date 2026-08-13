import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const container = document.getElementById('game-canvas');

if (container) {
  let scene;
  let camera;
  let renderer;
  let ocean;
  let oceanMaterial;
  let ship;
  let island;
  let treasure;
  let islandLeaves;
  let targetX = -8;
  let sinking = false;
  let speed = 0.14;
  let actionTimers = [];
  let encounter = null;
  let nextEncounterAt = 0;
  let hemisphereLight;
  let sunLight;
  let rainParticles;
  let activeWeatherLevel = -1;
  let activeWeatherIndex = -1;
  const islandColors = [0x55c96f, 0xff8a65, 0xb678dc, 0xf58db1, 0xffd15a];
  const weatherPresets = [
    { key: 'sunny', label: '晴朗', icon: '☀️', fog: 0x9bdeec, density: .012, hemi: 2.2, sun: 3.2, sunColor: 0xfff0c4, ocean: 0x10b9cc, roughness: .18 },
    { key: 'sunset', label: '夕陽', icon: '🌅', fog: 0xe6a988, density: .016, hemi: 1.65, sun: 2.5, sunColor: 0xff9d61, ocean: 0x188fa9, roughness: .26 },
    { key: 'cloudy', label: '多雲', icon: '☁️', fog: 0x9eb8c2, density: .021, hemi: 1.55, sun: 1.35, sunColor: 0xd5e3e5, ocean: 0x278ea0, roughness: .42 },
    { key: 'storm', label: '暴風雨', icon: '⛈️', fog: 0x536e7b, density: .031, hemi: .85, sun: .55, sunColor: 0x9fc2d0, ocean: 0x155d72, roughness: .58 }
  ];

  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({
    color,
    roughness: .75,
    metalness: 0,
    flatShading: true,
    ...extra
  });

  function mesh(geometry, material, x = 0, y = 0, z = 0) {
    const result = new THREE.Mesh(geometry, material);
    result.position.set(x, y, z);
    result.castShadow = true;
    result.receiveShadow = true;
    return result;
  }

  function createCloud(x, y, z, scale = 1) {
    const group = new THREE.Group();
    const cloudMaterial = mat(0xffffff, { roughness: 1 });
    [[0,0,0,1], [1,.1,0,.8], [-1,.08,0,.72], [.35,.55,0,.8], [-.35,.48,.05,.7]].forEach(([px,py,pz,s]) => {
      const puff = mesh(new THREE.IcosahedronGeometry(.85, 1), cloudMaterial, px, py, pz);
      puff.scale.set(1.35 * s, .82 * s, .7 * s);
      group.add(puff);
    });
    group.position.set(x, y, z);
    group.scale.setScalar(scale);
    group.name = 'cloud';
    group.userData.baseScale = scale;
    scene.add(group);
  }

  function createSail(width, height, color = 0xfff8e8) {
    const group = new THREE.Group();
    const sailShape = new THREE.Shape();
    sailShape.moveTo(-width / 2, height / 2);
    sailShape.quadraticCurveTo(width * .08, height * .36, width / 2, height / 2);
    sailShape.quadraticCurveTo(width * .35, 0, width / 2, -height / 2);
    sailShape.quadraticCurveTo(0, -height * .32, -width / 2, -height / 2);
    sailShape.lineTo(-width / 2, height / 2);

    const sailMaterial = mat(color, { side: THREE.DoubleSide, roughness: .9 });
    const sail = mesh(new THREE.ShapeGeometry(sailShape, 12), sailMaterial);
    sail.castShadow = true;
    group.add(sail);

    const wood = mat(0x4b2d21);
    const topYard = mesh(new THREE.CylinderGeometry(.055, .055, width + .35, 8), wood, 0, height / 2, 0);
    topYard.rotation.z = Math.PI / 2;
    const bottomYard = mesh(new THREE.CylinderGeometry(.045, .045, width + .2, 8), wood, 0, -height / 2, 0);
    bottomYard.rotation.z = Math.PI / 2;
    group.add(topYard, bottomYard);
    return group;
  }

  function createShip() {
    const group = new THREE.Group();
    const darkWood = mat(0x5a3022);
    const wood = mat(0x8c4d2c);
    const deck = mat(0xb77847);
    const gold = mat(0xffc846, { roughness: .3, metalness: .65 });
    const cream = mat(0xfff7df, { side: THREE.DoubleSide, roughness: .9 });
    const red = mat(0xe75c4d, { side: THREE.DoubleSide });
    const black = mat(0x17202a, { roughness: .4 });

    const hull = mesh(new THREE.BoxGeometry(4.5, 1.45, 2.25), darkWood, -.1, 1.1, 0);
    hull.scale.y = .9;
    group.add(hull);

    const bowGeometry = new THREE.ConeGeometry(1.58, 3.1, 4);
    bowGeometry.rotateZ(-Math.PI / 2);
    bowGeometry.rotateX(Math.PI / 4);
    const bow = mesh(bowGeometry, darkWood, 3.25, 1.1, 0);
    bow.scale.set(1, .74, .86);
    group.add(bow);

    const stern = mesh(new THREE.BoxGeometry(1.6, 2.15, 2.5), wood, -2.5, 1.48, 0);
    group.add(stern);
    const deckTop = mesh(new THREE.BoxGeometry(4.9, .18, 2.3), deck, -.25, 2, 0);
    group.add(deckTop);

    const sideGold = mesh(new THREE.BoxGeometry(5.3, .16, 2.36), gold, -.25, 1.65, 0);
    group.add(sideGold);
    const sternGold = mesh(new THREE.BoxGeometry(1.72, .18, 2.58), gold, -2.5, 2.55, 0);
    group.add(sternGold);

    for (let i = 0; i < 4; i++) {
      const cannonX = -1.25 + i * 1.15;
      const cannonRight = mesh(new THREE.CylinderGeometry(.11, .13, .55, 8), black, cannonX, 1.35, 1.35);
      cannonRight.rotation.x = Math.PI / 2;
      const cannonLeft = cannonRight.clone();
      cannonLeft.position.z = -1.35;
      group.add(cannonRight, cannonLeft);
    }

    const mastMaterial = mat(0x4a2b20);
    const mainMast = mesh(new THREE.CylinderGeometry(.11, .17, 7.8, 8), mastMaterial, 0, 5, 0);
    const foreMast = mesh(new THREE.CylinderGeometry(.09, .14, 5.8, 8), mastMaterial, 2.35, 4.2, 0);
    group.add(mainMast, foreMast);

    const bowsprit = mesh(new THREE.CylinderGeometry(.07, .11, 4.2, 8), mastMaterial, 4.6, 2.8, 0);
    bowsprit.rotation.z = -Math.PI / 3.8;
    group.add(bowsprit);

    const mainSail = createSail(3.65, 2.65);
    mainSail.position.set(.12, 5.05, 0);
    const topSail = createSail(2.45, 1.65, 0xfff3d4);
    topSail.position.set(.1, 7.25, 0);
    const frontSail = createSail(2.45, 2.05, 0xfffbeb);
    frontSail.position.set(2.42, 4.45, 0);
    group.add(mainSail, topSail, frontSail);

    const flagGeometry = new THREE.PlaneGeometry(1.25, .72, 8, 1);
    flagGeometry.translate(.62, 0, 0);
    const flag = mesh(flagGeometry, red, .08, 9.05, 0);
    flag.name = 'mainFlag';
    group.add(flag);

    const nest = mesh(new THREE.CylinderGeometry(.58, .42, .5, 10), wood, 0, 7.85, 0);
    group.add(nest);

    const railMaterial = mat(0xf1bd3a, { roughness: .35, metalness: .45 });
    [-1, 1].forEach(side => {
      const rail = mesh(new THREE.CylinderGeometry(.035, .035, 4.8, 6), railMaterial, -.25, 2.42, side * 1.13);
      rail.rotation.z = Math.PI / 2;
      group.add(rail);
      for (let i = 0; i < 6; i++) {
        group.add(mesh(new THREE.CylinderGeometry(.025, .025, .65, 6), railMaterial, -2.1 + i * .78, 2.15, side * 1.13));
      }
    });

    const foamMaterial = mat(0xffffff, { transparent: true, opacity: .68, depthWrite: false });
    for (let i = 0; i < 4; i++) {
      [-1, 1].forEach(side => {
        const foam = mesh(new THREE.CircleGeometry(.52 + i * .18, 10), foamMaterial, 2.8 - i * 1.25, .08, side * (1.22 + i * .12));
        foam.rotation.x = -Math.PI / 2;
        foam.name = `foam-${side}-${i}`;
        group.add(foam);
      });
    }

    group.scale.setScalar(.72);
    group.position.set(-20, 0, 1);
    scene.add(group);
    return group;
  }

  function createPalm(x, z, scale = 1) {
    const palm = new THREE.Group();
    const trunk = mesh(new THREE.CylinderGeometry(.13, .22, 2.4, 7), mat(0x8a5936), 0, 2.05, 0);
    trunk.rotation.z = -.12;
    palm.add(trunk);
    for (let i = 0; i < 6; i++) {
      const leaf = mesh(new THREE.ConeGeometry(.32, 1.7, 5), islandLeaves, 0, 3.36, 0);
      leaf.rotation.z = Math.PI / 2.5;
      leaf.rotation.y = i * Math.PI / 3;
      leaf.position.x = Math.cos(i * Math.PI / 3) * .48;
      leaf.position.z = Math.sin(i * Math.PI / 3) * .48;
      palm.add(leaf);
    }
    palm.position.set(x, 0, z);
    palm.scale.setScalar(scale);
    return palm;
  }

  function createIsland() {
    const group = new THREE.Group();
    const rock = mat(0x816249);
    const sand = mat(0xf0c66f);
    const grass = mat(0x5ec66f);
    const base = mesh(new THREE.CylinderGeometry(2.7, 4.2, 2.1, 13), rock, 0, 0, 0);
    const sandRing = mesh(new THREE.CylinderGeometry(3.15, 3.4, .42, 16), sand, 0, 1.14, 0);
    const top = mesh(new THREE.CylinderGeometry(2.42, 2.72, .4, 14), grass, 0, 1.46, 0);
    group.add(base, sandRing, top);

    islandLeaves = mat(islandColors[0]);
    group.add(createPalm(.65, .3, 1), createPalm(-.72, -.35, .78));
    group.position.set(12.2, 0, -2.2);
    scene.add(group);
    return group;
  }

  function createTreasure() {
    const group = new THREE.Group();
    const gold = mat(0xffca3a, { metalness: .7, roughness: .23 });
    const ruby = mat(0x32e0d0, { emissive: 0x0bb7ac, emissiveIntensity: .72, metalness: .6, roughness: .06 });
    const chestWood = mat(0x7d3f22);
    const chest = mesh(new THREE.BoxGeometry(1.7, .8, 1.15), chestWood, 0, 0, 0);
    const lid = mesh(new THREE.CylinderGeometry(.59, .59, 1.7, 12, 1, false, 0, Math.PI), chestWood, 0, .42, 0);
    lid.rotation.z = Math.PI / 2;
    const band1 = mesh(new THREE.BoxGeometry(.14, 1.18, 1.2), gold, -.56, .12, 0);
    const band2 = band1.clone();
    band2.position.x = .56;
    const lock = mesh(new THREE.BoxGeometry(.34, .48, .14), gold, 0, .08, .64);
    const gem = mesh(new THREE.OctahedronGeometry(.42), ruby, 0, 1.43, 0);
    const glow = new THREE.PointLight(0x46f7e7, 3, 13);
    glow.position.y = 1.2;
    group.add(chest, lid, band1, band2, lock, gem, glow);
    group.position.set(12.2, 1.1, -2.2);
    group.visible = false;
    scene.add(group);
    return group;
  }

  function createSeaMonster() {
    const group = new THREE.Group();
    const skin = mat(0x1ca89f, { roughness: .48 });
    const belly = mat(0x8be2b4, { roughness: .7 });
    const eyeWhite = mat(0xffffff, { roughness: .35 });
    const pupil = mat(0x14283a, { roughness: .25 });

    const head = mesh(new THREE.SphereGeometry(.72, 18, 12), skin, 0, .8, 0);
    head.scale.set(1, 1.08, .82);
    const snout = mesh(new THREE.SphereGeometry(.39, 14, 9), belly, 0, .57, .55);
    snout.scale.set(1.15, .65, .7);
    group.add(head, snout);

    [-.28, .28].forEach(x => {
      const eye = mesh(new THREE.SphereGeometry(.17, 12, 8), eyeWhite, x, 1.05, .56);
      const dot = mesh(new THREE.SphereGeometry(.075, 10, 7), pupil, x, 1.06, .71);
      group.add(eye, dot);
    });

    for (let i = 0; i < 5; i++) {
      const tentacle = new THREE.Group();
      for (let segment = 0; segment < 4; segment++) {
        const piece = mesh(new THREE.CylinderGeometry(.12 - segment * .015, .15 - segment * .015, .65, 8), skin, 0, segment * .48, 0);
        piece.rotation.z = -.22 - segment * .08;
        piece.position.x = segment * .12;
        tentacle.add(piece);
      }
      tentacle.position.set(-1.4 + i * .7, -.4, -.05 + Math.abs(2 - i) * .18);
      tentacle.rotation.z = (i - 2) * .22;
      tentacle.name = `tentacle-${i}`;
      group.add(tentacle);
    }
    group.userData.kind = 'monster';
    group.userData.label = '海怪探頭了！';
    return group;
  }

  function createPirateShip() {
    const group = new THREE.Group();
    const hullMaterial = mat(0x302421);
    const red = mat(0xb9323d, { side: THREE.DoubleSide });
    const mastMaterial = mat(0x241a17);
    const bone = mat(0xfff4d8);

    const hull = mesh(new THREE.BoxGeometry(2.7, .7, 1.15), hullMaterial, 0, .25, 0);
    const bowGeo = new THREE.ConeGeometry(.8, 1.4, 4);
    bowGeo.rotateZ(-Math.PI / 2);
    bowGeo.rotateX(Math.PI / 4);
    const bow = mesh(bowGeo, hullMaterial, 1.85, .25, 0);
    bow.scale.set(1, .7, .8);
    const mast = mesh(new THREE.CylinderGeometry(.055, .08, 3.6, 7), mastMaterial, 0, 2.1, 0);
    const sail = mesh(new THREE.PlaneGeometry(1.7, 1.6), red, 0, 2.3, .02);
    const flag = mesh(new THREE.PlaneGeometry(1.05, .65), mat(0x17171b, { side: THREE.DoubleSide }), .5, 4.02, 0);
    group.add(hull, bow, mast, sail, flag);

    const skull = mesh(new THREE.CircleGeometry(.2, 12), bone, .5, 4.05, .012);
    const jaw = mesh(new THREE.BoxGeometry(.25, .11, .025), bone, .5, 3.88, .02);
    group.add(skull, jaw);
    [-.075, .075].forEach(x => group.add(mesh(new THREE.SphereGeometry(.04, 6, 5), mastMaterial, .5 + x, 4.08, .035)));

    group.scale.setScalar(.72);
    group.userData.kind = 'pirate';
    group.userData.label = '海盜船出沒！';
    return group;
  }

  function createSurfer() {
    const group = new THREE.Group();
    const board = mesh(new THREE.CapsuleGeometry(.22, 1.35, 6, 12), mat(0xff6f61), 0, 0, 0);
    board.rotation.z = Math.PI / 2;
    board.scale.y = .18;
    const skin = mat(0xd88e62);
    const suit = mat(0xffd25e);
    const shorts = mat(0x153b5b);
    const torso = mesh(new THREE.CapsuleGeometry(.18, .55, 6, 10), suit, 0, .77, 0);
    torso.rotation.z = -.16;
    const head = mesh(new THREE.SphereGeometry(.22, 12, 8), skin, -.12, 1.34, 0);
    const shortsPart = mesh(new THREE.BoxGeometry(.48, .33, .36), shorts, .1, .42, 0);
    group.add(board, torso, head, shortsPart);

    [-1, 1].forEach((side, index) => {
      const leg = mesh(new THREE.CylinderGeometry(.07, .085, .68, 7), skin, side * .31, .18, 0);
      leg.rotation.z = side * (.62 + index * .08);
      const arm = mesh(new THREE.CylinderGeometry(.055, .07, .75, 7), skin, side * .42, .9, 0);
      arm.rotation.z = side * 1.02;
      group.add(leg, arm);
    });

    group.userData.kind = 'surfer';
    group.userData.label = '衝浪高手路過！';
    return group;
  }

  function createShark() {
    const group = new THREE.Group();
    const sharkSkin = mat(0x526d7b, { roughness: .42 });
    const sharkBelly = mat(0xb9d0d7, { roughness: .58 });
    const dark = mat(0x10232e);

    const body = mesh(new THREE.SphereGeometry(1, 20, 12), sharkSkin, 0, 0, 0);
    body.scale.set(1.75, .5, .55);
    const belly = mesh(new THREE.SphereGeometry(.86, 16, 10), sharkBelly, .05, -.18, .08);
    belly.scale.set(1.5, .28, .45);
    const snout = mesh(new THREE.ConeGeometry(.48, 1.1, 12), sharkSkin, 1.56, 0, 0);
    snout.rotation.z = -Math.PI / 2;
    snout.scale.set(1, .72, .72);
    const dorsal = mesh(new THREE.ConeGeometry(.44, 1.15, 4), sharkSkin, -.15, .64, 0);
    dorsal.rotation.z = -.18;
    const leftFin = mesh(new THREE.ConeGeometry(.28, 1.15, 5), sharkSkin, .1, -.18, .6);
    leftFin.rotation.x = Math.PI / 2.6;
    leftFin.rotation.z = -.35;
    const tailTop = mesh(new THREE.ConeGeometry(.32, 1.05, 5), sharkSkin, -1.72, .33, 0);
    tailTop.rotation.z = -.5;
    const tailBottom = tailTop.clone();
    tailBottom.position.y = -.33;
    tailBottom.rotation.z = Math.PI + .5;
    group.add(body, belly, snout, dorsal, leftFin, tailTop, tailBottom);

    [-.24, .24].forEach(z => {
      group.add(mesh(new THREE.SphereGeometry(.055, 8, 6), dark, 1.18, .16, z));
    });
    group.userData.kind = 'shark';
    group.userData.label = '鯊魚巡航中！';
    group.userData.duration = 6.8;
    return group;
  }

  function createWhale() {
    const group = new THREE.Group();
    const whaleBlue = mat(0x315b78, { roughness: .5 });
    const whaleBelly = mat(0x9bc4d1, { roughness: .65 });
    const eyeMaterial = mat(0x091a25);

    const body = mesh(new THREE.SphereGeometry(1.15, 22, 14), whaleBlue, 0, 0, 0);
    body.scale.set(1.75, .72, .8);
    const belly = mesh(new THREE.SphereGeometry(.9, 18, 12), whaleBelly, .32, -.32, .12);
    belly.scale.set(1.48, .35, .65);
    const tailStem = mesh(new THREE.CylinderGeometry(.24, .42, 1.25, 10), whaleBlue, -1.65, .02, 0);
    tailStem.rotation.z = Math.PI / 2;
    const flukeLeft = mesh(new THREE.ConeGeometry(.38, 1.25, 6), whaleBlue, -2.34, .35, .1);
    flukeLeft.rotation.z = -.7;
    const flukeRight = flukeLeft.clone();
    flukeRight.position.y = -.35;
    flukeRight.rotation.z = Math.PI + .7;
    const fin = mesh(new THREE.ConeGeometry(.26, 1.1, 6), whaleBlue, .15, -.22, .75);
    fin.rotation.x = Math.PI / 2.7;
    group.add(body, belly, tailStem, flukeLeft, flukeRight, fin);
    group.add(mesh(new THREE.SphereGeometry(.065, 8, 6), eyeMaterial, 1.18, .23, .69));

    for (let i = 0; i < 6; i++) {
      const spray = mesh(new THREE.SphereGeometry(.09 + i * .012, 8, 6), mat(0xdffaff, { transparent: true, opacity: .72 }), .72 + (i % 2 ? .12 : -.12), .78 + i * .23, 0);
      spray.name = `whale-spray-${i}`;
      group.add(spray);
    }
    group.userData.kind = 'whale';
    group.userData.label = '鯨魚躍出海面！';
    group.userData.duration = 7.4;
    return group;
  }

  function spawnEncounter(time) {
    if (encounter) {
      scene.remove(encounter);
      encounter = null;
    }
    const factories = [createSeaMonster, createPirateShip, createSurfer, createShark, createWhale];
    encounter = factories[Math.floor(Math.random() * factories.length)]();
    encounter.userData.bornAt = time;
    container.dataset.encounter = encounter.userData.kind;

    const narrow = window.innerWidth <= 660;
    if (encounter.userData.kind === 'monster') {
      encounter.position.set(narrow ? 0 : -1 + Math.random() * 5, -2.25, narrow ? 6 : 3.5);
      encounter.scale.setScalar(narrow ? .72 : 1);
    } else if (encounter.userData.kind === 'pirate') {
      encounter.position.set(narrow ? 8 : 19, -.2, narrow ? 2.5 : -4.5);
      encounter.scale.setScalar(narrow ? .62 : 1);
    } else if (encounter.userData.kind === 'surfer') {
      encounter.position.set(narrow ? -8 : -19, -.54, narrow ? 5 : 3.5);
      encounter.scale.setScalar(narrow ? .75 : 1);
    } else if (encounter.userData.kind === 'shark') {
      encounter.position.set(narrow ? 9 : 20, -.63, narrow ? 5.5 : 4.2);
      encounter.scale.setScalar(narrow ? .68 : 1);
    } else {
      encounter.position.set(narrow ? -7 : -16, -1.65, narrow ? 4.5 : -1.5);
      encounter.scale.setScalar(narrow ? .58 : .9);
    }
    scene.add(encounter);
  }

  function animateEncounter(time) {
    if (!encounter) {
      if (time >= nextEncounterAt && document.getElementById('game-screen')?.classList.contains('active')) {
        spawnEncounter(time);
      }
      return;
    }

    const age = time - encounter.userData.bornAt;
    const kind = encounter.userData.kind;
    if (kind === 'monster') {
      const rise = Math.min(1, age / 1.2);
      const fall = age > 5 ? Math.max(0, 1 - (age - 5) / 1.1) : 1;
      encounter.position.y = -2.25 + rise * fall * 1.85 + Math.sin(time * 2.2) * .08;
      encounter.rotation.y = Math.sin(time * .8) * .18;
      encounter.children.filter(child => child.name?.startsWith('tentacle-')).forEach((tentacle, index) => {
        tentacle.rotation.z += Math.sin(time * 2.4 + index) * .004;
      });
    } else if (kind === 'pirate') {
      encounter.position.x -= window.innerWidth <= 660 ? .022 : .036;
      encounter.position.y = -.18 + Math.sin(time * 2) * .15;
      encounter.rotation.z = Math.sin(time * 1.7) * .035;
    } else if (kind === 'surfer') {
      encounter.position.x += window.innerWidth <= 660 ? .028 : .05;
      encounter.position.y = -.48 + Math.sin(time * 3.1) * .16;
      encounter.rotation.z = Math.sin(time * 2.1) * .08;
    } else if (kind === 'shark') {
      encounter.position.x -= window.innerWidth <= 660 ? .035 : .062;
      encounter.position.y = -.72 + Math.sin(time * 2.7) * .16;
      encounter.rotation.y = Math.sin(time * 1.3) * .08;
      encounter.rotation.z = Math.sin(time * 2.2) * .035;
    } else if (kind === 'whale') {
      const duration = encounter.userData.duration;
      const phase = Math.min(1, age / duration);
      const breach = Math.sin(phase * Math.PI);
      encounter.position.x += window.innerWidth <= 660 ? .035 : .06;
      encounter.position.y = -1.65 + breach * 2.35;
      encounter.rotation.z = -.18 + Math.sin(phase * Math.PI * 2) * .16;
      encounter.children.filter(child => child.name?.startsWith('whale-spray-')).forEach((spray, index) => {
        const sprayPhase = Math.max(0, Math.sin((age - 1.4) * 2.1 + index * .35));
        spray.visible = age > 1.25 && age < 4.4;
        spray.position.y = .8 + index * .19 + sprayPhase * .48;
        spray.scale.setScalar(.7 + sprayPhase * .75);
      });
    }

    if (age > (encounter.userData.duration || 6.2)) {
      scene.remove(encounter);
      encounter = null;
      delete container.dataset.encounter;
      nextEncounterAt = time + 5 + Math.random() * 5;
    }
  }

  function createRain() {
    const count = 420;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = -28 + Math.random() * 56;
      positions[i * 3 + 1] = 3 + Math.random() * 25;
      positions[i * 3 + 2] = -12 + Math.random() * 28;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xbfe8f5, size: .11, transparent: true, opacity: .72, depthWrite: false });
    const rain = new THREE.Points(geometry, material);
    rain.visible = false;
    rain.frustumCulled = false;
    scene.add(rain);
    return rain;
  }

  function applyRandomWeather(levelIndex) {
    if (activeWeatherLevel === levelIndex) return;
    activeWeatherLevel = levelIndex;
    let nextIndex = Math.floor(Math.random() * weatherPresets.length);
    if (nextIndex === activeWeatherIndex && weatherPresets.length > 1) nextIndex = (nextIndex + 1 + Math.floor(Math.random() * (weatherPresets.length - 1))) % weatherPresets.length;
    activeWeatherIndex = nextIndex;
    const weather = weatherPresets[nextIndex];

    container.classList.remove(...weatherPresets.map(item => `weather-${item.key}`));
    container.classList.add(`weather-${weather.key}`);
    container.dataset.weather = weather.key;
    scene.fog.color.setHex(weather.fog);
    scene.fog.density = weather.density;
    hemisphereLight.intensity = weather.hemi;
    sunLight.intensity = weather.sun;
    sunLight.color.setHex(weather.sunColor);
    oceanMaterial.color.setHex(weather.ocean);
    oceanMaterial.roughness = weather.roughness;
    oceanMaterial.needsUpdate = true;
    renderer.toneMappingExposure = weather.key === 'storm' ? .84 : weather.key === 'sunset' ? 1.08 : 1.18;
    rainParticles.visible = weather.key === 'storm';

    scene.children.filter(child => child.name === 'cloud').forEach((cloud, index) => {
      cloud.visible = true;
      const densityScale = weather.key === 'storm' ? 1.45 : weather.key === 'cloudy' ? 1.18 : .82;
      const baseScale = cloud.userData.baseScale || 1;
      cloud.scale.setScalar(baseScale * densityScale * (1 + index * .04));
    });

    const indicator = document.getElementById('weather-indicator');
    const icon = document.getElementById('weather-icon');
    if (indicator) indicator.textContent = weather.label;
    if (icon) icon.textContent = weather.icon;
  }

  function animateRain() {
    if (!rainParticles?.visible) return;
    const positions = rainParticles.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      let y = positions.getY(i) - .34;
      let x = positions.getX(i) - .045;
      if (y < -1.2) {
        y = 20 + Math.random() * 8;
        x = -28 + Math.random() * 56;
      }
      positions.setY(i, y);
      positions.setX(i, x);
    }
    positions.needsUpdate = true;
  }

  function init() {
    scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.FogExp2(0x94dcee, .014);

    camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, .1, 700);
    camera.position.set(0, 16, 29);
    // Aim slightly above the deck so the ship sails through the lower stage,
    // leaving the floating rhythm prompt readable without covering the hull.
    frameCamera();

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setClearColor(0x8bd9ed, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.prepend(renderer.domElement);

    hemisphereLight = new THREE.HemisphereLight(0xd8f7ff, 0x37596a, 2.1);
    scene.add(hemisphereLight);
    sunLight = new THREE.DirectionalLight(0xfff0c4, 3.2);
    sunLight.position.set(13, 24, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(1536, 1536);
    sunLight.shadow.camera.left = -28;
    sunLight.shadow.camera.right = 28;
    sunLight.shadow.camera.top = 24;
    sunLight.shadow.camera.bottom = -12;
    scene.add(sunLight);

    const oceanGeometry = new THREE.PlaneGeometry(170, 150, 72, 58);
    oceanGeometry.rotateX(-Math.PI / 2);
    oceanMaterial = mat(0x10b9cc, { roughness: .18, metalness: .2 });
    ocean = mesh(oceanGeometry, oceanMaterial, 0, -1, 0);
    scene.add(ocean);

    createCloud(-16, 14, -34, 2.1);
    createCloud(5, 17, -43, 1.65);
    createCloud(24, 12, -36, 1.5);

    ship = createShip();
    island = createIsland();
    treasure = createTreasure();
    rainParticles = createRain();
    window.addEventListener('resize', resize);
    animate();
  }

  function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    frameCamera();
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  function frameCamera() {
    camera.lookAt(0, window.innerWidth <= 660 ? 8.2 : 5.1, 0);
  }

  function clearActionTimers() {
    actionTimers.forEach(clearTimeout);
    actionTimers = [];
  }

  function resetLevel(index = 0) {
    clearActionTimers();
    applyRandomWeather(index);
    if (encounter) {
      scene.remove(encounter);
      encounter = null;
      delete container.dataset.encounter;
    }
    nextEncounterAt = performance.now() * .001 + .7 + Math.random() * 1.4;
    const narrow = window.innerWidth <= 660;
    sinking = false;
    targetX = narrow ? -4.3 : -12;
    speed = .17;
    ship.visible = true;
    ship.position.set(narrow ? -10 : -21, 0, 1);
    ship.rotation.set(0, 0, 0);
    island.position.x = narrow ? 4.8 : 12.2;
    treasure.position.x = narrow ? 4.8 : 12.2;
    island.visible = true;
    treasure.visible = false;
    treasure.scale.set(.12, .12, .12);
    islandLeaves.color.setHex(islandColors[index % islandColors.length]);
  }

  function sink() {
    clearActionTimers();
    sinking = true;
    targetX = ship.position.x;
  }

  function sailToTreasure() {
    clearActionTimers();
    const narrow = window.innerWidth <= 660;
    sinking = false;
    speed = .18;
    targetX = narrow ? 2.5 : 7.5;
    actionTimers.push(setTimeout(() => {
      island.visible = false;
      treasure.visible = true;
      treasure.scale.set(.1, .1, .1);
    }, 1800));
    actionTimers.push(setTimeout(() => {
      targetX = narrow ? 12 : 23;
      speed = .24;
    }, 2600));
  }

  function celebrate() {
    treasure.visible = true;
    treasure.scale.set(1.45, 1.45, 1.45);
  }

  function animate() {
    requestAnimationFrame(animate);
    const time = performance.now() * .001;

    const positions = ocean.geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const wave = Math.sin(x * .24 + time * 1.25) * .38 + Math.sin(z * .19 + time * .8) * .29 + Math.sin((x + z) * .11 + time * .5) * .16;
      positions.setY(i, wave);
    }
    positions.needsUpdate = true;
    ocean.geometry.computeVertexNormals();

    if (sinking) {
      ship.position.y = Math.max(-5, ship.position.y - .045);
      ship.rotation.z -= .013;
      ship.rotation.x += .014;
    } else {
      ship.position.y = .12 + Math.sin(time * 1.9) * .27;
      ship.rotation.z = Math.sin(time * 1.45) * .045;
      ship.rotation.x = Math.sin(time * 1.1) * .025;
      const distance = targetX - ship.position.x;
      if (Math.abs(distance) > .02) ship.position.x += Math.sign(distance) * Math.min(Math.abs(distance), speed);
    }

    const flag = ship.getObjectByName('mainFlag');
    if (flag) {
      const vertices = flag.geometry.attributes.position;
      for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i);
        vertices.setZ(i, Math.sin(time * 10 + x * 4) * .12 * Math.max(0, x));
      }
      vertices.needsUpdate = true;
    }

    const moving = Math.abs(targetX - ship.position.x) > .08 && !sinking;
    ship.traverse(child => {
      if (child.name?.startsWith('foam-')) {
        const pulse = moving ? 1 + Math.sin(time * 8 + child.position.x) * .32 : .25;
        child.scale.setScalar(pulse);
      }
    });

    scene.children.filter(child => child.name === 'cloud').forEach((cloud, index) => {
      cloud.position.x += .0015 * (index + 1);
      cloud.position.y += Math.sin(time * .15 + index) * .0006;
    });

    if (treasure.visible) {
      treasure.rotation.y += .018;
      treasure.position.y = 1.2 + Math.sin(time * 2.7) * .22;
      if (treasure.scale.x < 1.35) {
        const next = Math.min(1.35, treasure.scale.x + .055);
        treasure.scale.setScalar(next);
      }
    }

    animateEncounter(time);
    animateRain();

    renderer.render(scene, camera);
  }

  init();
  window.Voyage3D = { resetLevel, sink, sailToTreasure, celebrate };
}
