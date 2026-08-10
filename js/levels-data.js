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
];

// Paleta do tema "ilha" — copiada de THEMES.ilha em js/jogo.js
const THEME_ILHA = {
  skyTop: 0x7ec8e3,
  skyBot: 0xc9e8d8,
  hill: 0x8fc99b,
  ground: 0x8c5a2b,
  grass: 0x4caf50,
};

// Duração dos power-ups, em ms — mesmos valores do original (que eram em
// frames a 60fps: STAR_FRAMES=360 → 6s, WING_FRAMES=480 → 8s)
const STAR_MS = 6000;
const WING_MS = 8000;
