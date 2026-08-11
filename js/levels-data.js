// =============================================================
// Dados das fases — copiados de js/fases.js do jogo original,
// sem alteração no layout (mesmas posições de plataformas, gemas,
// inimigos, caixas, power-ups etc.).
// Por enquanto só as fases 1 e 2 (ambas tema "ilha" no original).
// As fases 3-5 usam temas especiais (gelo/vento/noite) com mecânicas
// próprias (zonas de gelo escorregadio, vento) — ficam pra quando
// migrarmos esses sistemas também, pra não misturar tema com física.
// =============================================================
const LEVELS = [
  { // ---------- Fase 1 ----------
    groundY: 380,
    worldWidth: 2920,
    playerStart: { x: 50, y: 300 },
    portalX: 2850,
    platforms: [
      {x:250,y:300,w:120,h:20},{x:450,y:230,w:120,h:20},{x:650,y:300,w:140,h:20},
      {x:900,y:340,w:100,h:20},{x:1050,y:260,w:120,h:20},{x:1250,y:320,w:150,h:20},
      {x:1480,y:250,w:120,h:20},{x:1650,y:320,w:100,h:20},{x:1820,y:260,w:120,h:20},
      {x:2000,y:330,w:100,h:20},{x:2180,y:270,w:130,h:20},{x:2380,y:320,w:110,h:20},
      {x:2560,y:250,w:130,h:20},
    ],
    gems: [
      {x:290,y:260},{x:490,y:190},{x:690,y:260},{x:940,y:300},
      {x:1090,y:220},{x:1300,y:280},{x:1520,y:210},{x:150,y:340},
      {x:1690,y:280},{x:1860,y:220},{x:2040,y:290},{x:2220,y:230},
      {x:2420,y:280},{x:2600,y:210},{x:2750,y:340},
    ],
    enemies: [
      {x:600,y:355,range:120,dir:1,baseX:600},{x:1000,y:315,range:80,dir:-1,baseX:1000},
      {x:1400,y:355,range:150,dir:1,baseX:1400},{x:1750,y:355,range:100,dir:1,baseX:1750},
      {x:2100,y:355,range:120,dir:-1,baseX:2100},{x:2450,y:355,range:100,dir:1,baseX:2450},
    ],
    spikes: [
      {x:800,y:365,w:60,h:15},{x:1950,y:365,w:60,h:15},{x:2300,y:365,w:70,h:15},
    ],
    boxes: [
      {x:130,y:346,w:34,h:34,contents:'coin'},
      {x:520,y:196,w:34,h:34,contents:'powerup:wing'},
      {x:970,y:306,w:34,h:34,contents:'coin'},
      {x:1350,y:286,w:34,h:34,contents:'powerup:shield'},
      {x:1670,y:286,w:34,h:34,contents:'coin'},
      {x:2020,y:296,w:34,h:34,contents:'coin'},
      {x:2400,y:286,w:34,h:34,contents:'powerup:star'},
      {x:2600,y:216,w:34,h:34,contents:'coin'},
    ],
    powerups: [
      {x:200,y:270,type:'shield'},{x:960,y:310,type:'star'},{x:1280,y:290,type:'wing'},
    ],
    silverGem: {x:2230,y:200},
    checkpoints: [{x:1250,y:380}],
  },
  { // ---------- Fase 2 ----------
    groundY: 380,
    worldWidth: 3050,
    playerStart: { x: 50, y: 300 },
    portalX: 2980,
    platforms: [
      {x:200,y:310,w:90,h:18},{x:360,y:250,w:90,h:18},{x:520,y:190,w:90,h:18},
      {x:700,y:250,w:90,h:18},{x:880,y:310,w:90,h:18},{x:1050,y:340,w:120,h:18},
      {x:1250,y:280,w:100,h:18},{x:1420,y:220,w:100,h:18},{x:1600,y:300,w:140,h:18},
      {x:1780,y:250,w:100,h:18},{x:1950,y:190,w:100,h:18},{x:2130,y:250,w:100,h:18},
      {x:2310,y:310,w:100,h:18},{x:2480,y:340,w:120,h:18},{x:2660,y:280,w:100,h:18},
      {x:2840,y:220,w:100,h:18},
    ],
    gems: [
      {x:230,y:270},{x:390,y:210},{x:550,y:150},{x:730,y:210},
      {x:910,y:270},{x:1090,y:300},{x:1280,y:240},{x:1450,y:180},
      {x:1650,y:260},{x:1750,y:340},
      {x:1820,y:210},{x:1990,y:150},{x:2170,y:210},{x:2350,y:270},
      {x:2520,y:300},{x:2700,y:240},{x:2880,y:180},{x:2980,y:340},
    ],
    enemies: [
      {x:300,y:355,range:100,dir:1,baseX:300},{x:650,y:355,range:130,dir:-1,baseX:650},
      {x:1150,y:355,range:100,dir:1,baseX:1150},{x:1500,y:355,range:120,dir:-1,baseX:1500},
      {x:1900,y:355,range:110,dir:1,baseX:1900},{x:2250,y:355,range:130,dir:-1,baseX:2250},
      {x:2600,y:355,range:100,dir:1,baseX:2600},
    ],
    spikes: [
      {x:450,y:365,w:70,h:15},{x:990,y:365,w:50,h:15},
      {x:2050,y:365,w:60,h:15},{x:2420,y:365,w:70,h:15},
    ],
    boxes: [
      {x:240,y:276,w:34,h:34,contents:'coin'},
      {x:560,y:156,w:34,h:34,contents:'powerup:wing'},
      {x:900,y:276,w:34,h:34,contents:'coin'},
      {x:1270,y:246,w:34,h:34,contents:'powerup:shield'},
      {x:1800,y:216,w:34,h:34,contents:'coin'},
      {x:2150,y:216,w:34,h:34,contents:'powerup:star'},
      {x:2500,y:306,w:34,h:34,contents:'coin'},
      {x:2860,y:186,w:34,h:34,contents:'coin'},
    ],
    powerups: [
      {x:730,y:220,type:'wing'},{x:1080,y:310,type:'star'},{x:1630,y:270,type:'shield'},
    ],
    silverGem: {x:2000,y:130},
    checkpoints: [{x:1600,y:380}],
  },
  { // ---------- Fase 3: Geleira Escorregadia (gelo) ----------
    theme: 'gelo',
    groundY: 380,
    worldWidth: 2420,
    playerStart: { x: 50, y: 300 },
    portalX: 2350,
    platforms: [
      {x:220,y:300,w:110,h:20},
      {x:400,y:230,w:100,h:20, move:{axis:'y', range:55, speed:0.9}},
      {x:600,y:300,w:130,h:20},{x:820,y:250,w:100,h:20},
      {x:1000,y:320,w:120,h:20, move:{axis:'x', range:70, speed:0.8}},
      {x:1250,y:260,w:110,h:20},{x:1450,y:320,w:100,h:20},{x:1650,y:250,w:120,h:20},
      {x:1850,y:310,w:100,h:20, move:{axis:'x', range:60, speed:1.1}},
      {x:2050,y:250,w:120,h:20},{x:2250,y:310,w:110,h:20},
    ],
    gems: [
      {x:250,y:260},{x:430,y:190},{x:640,y:260},{x:860,y:210},
      {x:1040,y:280},{x:1290,y:220},{x:1490,y:280},{x:1690,y:210},
      {x:1890,y:270},{x:2090,y:210},{x:2290,y:270},{x:120,y:340},
    ],
    enemies: [
      {x:520,y:355,range:110,dir:1,baseX:520},{x:900,y:355,range:90,dir:-1,baseX:900},
      {x:1350,y:355,range:120,dir:1,baseX:1350},{x:1750,y:355,range:100,dir:-1,baseX:1750},
      {x:2150,y:355,range:100,dir:1,baseX:2150},
    ],
    spikes: [{x:720,y:365,w:60,h:15},{x:1550,y:365,w:60,h:15}],
    boxes: [
      {x:160,y:346,w:34,h:34,contents:'coin'},
      {x:670,y:266,w:34,h:34,contents:'powerup:shield'},
      {x:1080,y:286,w:34,h:34,contents:'coin'},
      {x:1480,y:286,w:34,h:34,contents:'powerup:star'},
      {x:2100,y:216,w:34,h:34,contents:'coin'},
    ],
    powerups: [{x:250,y:270,type:'shield'},{x:1450,y:290,type:'star'}],
    silverGem: {x:430,y:150},
    checkpoints: [{x:1200,y:380}],
    iceZones: [{x:480,w:820},{x:1680,w:420}],
  },
  { // ---------- Fase 4: Penhascos Ventosos (vento) ----------
    theme: 'vento',
    groundY: 380,
    worldWidth: 2680,
    playerStart: { x: 50, y: 300 },
    portalX: 2600,
    platforms: [
      {x:200,y:310,w:100,h:20},{x:380,y:250,w:90,h:20},
      {x:560,y:190,w:90,h:20, move:{axis:'y', range:60, speed:1.0}},
      {x:900,y:230,w:90,h:20, move:{axis:'y', range:70, speed:0.85}},
      {x:1150,y:190,w:100,h:20},{x:1400,y:260,w:100,h:20},{x:1650,y:320,w:110,h:20},
      {x:1900,y:250,w:100,h:20, move:{axis:'x', range:80, speed:0.9}},
      {x:2150,y:300,w:120,h:20},{x:2380,y:230,w:110,h:20},
    ],
    gems: [
      {x:230,y:270},{x:410,y:210},{x:600,y:150},{x:950,y:190},
      {x:1180,y:150},{x:1430,y:220},{x:1690,y:280},{x:1940,y:210},
      {x:2190,y:260},{x:2410,y:190},{x:2600,y:280},
    ],
    enemies: [
      {x:280,y:355,range:100,dir:1,baseX:280},{x:1200,y:355,range:120,dir:-1,baseX:1200},
      {x:1750,y:355,range:100,dir:1,baseX:1750},{x:2250,y:355,range:110,dir:-1,baseX:2250},
    ],
    spikes: [{x:650,y:365,w:220,h:15},{x:2050,y:365,w:80,h:15}],
    boxes: [
      {x:140,y:356,w:34,h:34,contents:'coin'},
      {x:1220,y:126,w:34,h:34,contents:'powerup:wing'},
      {x:1720,y:246,w:34,h:34,contents:'coin'},
      {x:2440,y:156,w:34,h:34,contents:'powerup:star'},
    ],
    powerups: [{x:220,y:280,type:'wing'},{x:1950,y:210,type:'shield'}],
    silverGem: {x:1930,y:130},
    checkpoints: [{x:1350,y:380}],
    windZones: [{x:650,y:0,w:230,h:450,strength:-0.4},{x:2100,y:0,w:280,h:450,strength:0.3}],
  },
  { // ---------- Fase 5: Caverna da Meia-Noite (noite) ----------
    theme: 'noite',
    groundY: 380,
    worldWidth: 2820,
    playerStart: { x: 50, y: 300 },
    portalX: 2740,
    platforms: [
      {x:210,y:300,w:100,h:20},{x:400,y:340,w:90,h:20},
      {x:580,y:270,w:100,h:20, move:{axis:'x', range:90, speed:0.75}},
      {x:820,y:200,w:100,h:20},
      {x:1030,y:260,w:110,h:20, move:{axis:'y', range:60, speed:1.0}},
      {x:1280,y:330,w:120,h:20},{x:1480,y:220,w:100,h:20},
      {x:1680,y:290,w:100,h:20, move:{axis:'x', range:70, speed:0.9}},
      {x:1900,y:200,w:110,h:20},{x:2100,y:280,w:100,h:20},
      {x:2320,y:220,w:120,h:20, move:{axis:'y', range:55, speed:0.8}},
      {x:2540,y:300,w:110,h:20},
    ],
    gems: [
      {x:240,y:260},{x:430,y:300},{x:620,y:230},{x:850,y:160},
      {x:1060,y:220},{x:1310,y:290},{x:1510,y:180},{x:1710,y:250},
      {x:1930,y:160},{x:2130,y:240},{x:2350,y:180},{x:2570,y:260},
      {x:150,y:340},{x:2700,y:340},
    ],
    enemies: [
      {x:340,y:355,range:90,dir:1,baseX:340},{x:760,y:355,range:100,dir:-1,baseX:760},
      {x:1200,y:355,range:110,dir:1,baseX:1200},{x:1620,y:355,range:90,dir:-1,baseX:1620},
      {x:2040,y:355,range:100,dir:1,baseX:2040},{x:2460,y:355,range:100,dir:-1,baseX:2460},
    ],
    spikes: [{x:500,y:365,w:70,h:15},{x:1400,y:365,w:60,h:15},{x:2250,y:365,w:70,h:15}],
    boxes: [
      {x:160,y:346,w:34,h:34,contents:'coin'},
      {x:660,y:236,w:34,h:34,contents:'powerup:star'},
      {x:1090,y:226,w:34,h:34,contents:'coin'},
      {x:1540,y:186,w:34,h:34,contents:'powerup:shield'},
      {x:1960,y:166,w:34,h:34,contents:'coin'},
      {x:2380,y:186,w:34,h:34,contents:'powerup:wing'},
      {x:2600,y:266,w:34,h:34,contents:'coin'},
    ],
    powerups: [{x:300,y:270,type:'star'},{x:1350,y:290,type:'shield'},{x:2150,y:250,type:'wing'}],
    silverGem: {x:1035,y:160},
    checkpoints: [{x:900,y:380},{x:1900,y:380}],
  },
];

// Paleta de cada tema — copiada de THEMES em js/jogo.js
const THEMES = {
  ilha:  { skyTop: 0x7ec8e3, skyBot: 0xc9e8d8, hill: 0x8fc99b, ground: 0x8c5a2b, grass: 0x4caf50, sun: true },
  gelo:  { skyTop: 0x8fb8e8, skyBot: 0xdbeeff, hill: 0xc7dff0, ground: 0x7f8fa6, grass: 0xeaf6ff, sun: true },
  vento: { skyTop: 0x6fa8c9, skyBot: 0xd7ece0, hill: 0x7fb08f, ground: 0x8c5a2b, grass: 0x59b06a, sun: true },
  noite: { skyTop: 0x1b1140, skyBot: 0x3a2a63, hill: 0x241a45, ground: 0x3a2c55, grass: 0x5a3f86, sun: false },
};

// Duração dos power-ups, em ms — mesmos valores do original (que eram em
// frames a 60fps: STAR_FRAMES=360 → 6s, WING_FRAMES=480 → 8s)
const STAR_MS = 6000;
const WING_MS = 8000;
