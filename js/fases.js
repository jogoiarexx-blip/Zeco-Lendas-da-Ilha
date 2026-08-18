// =============================================================
// Zeco e a Ilha das Gemas — Definição das Fases (níveis)
// Cada fase é criada com makeLevel(...)
// =============================================================
// ---------- Level Definitions ----------
// boxes: {x,y,w,h,contents:'coin'|'empty'|'powerup:star'|'powerup:wing'|'powerup:shield'}
// platforms: {x,y,w,h, move?:{axis:'x'|'y', range, speed}} — `move` faz a plataforma
//   ir e vir em vaivém (usada nas fases de vento/gelo/caverna)
// checkpoints: [{x,y}] — bandeiras que salvam o ponto de reaparecimento na fase
// windZones: [{x,y,w,h,strength}] — empurram o jogador (strength negativo empurra p/ esquerda)
// iceZones: [{x,w}] — trechos de chão escorregadio
// theme: 'ilha' (padrão) | 'gelo' | 'vento' | 'noite' — muda o visual do cenário
function makeLevel(groundY, platforms, gems, enemies, spikes, boxes, powerups, portalX, playerStart, worldWidth, silverGem, extra={}) {
  const { checkpoints=[], windZones=[], iceZones=[], theme='ilha' } = extra;
  return { groundY, platforms, gems, enemies, spikes, boxes, powerups, portalX, playerStart, worldWidth, silverGem, checkpoints, windZones, iceZones, theme };
}

const levels = [
  makeLevel(
    380,
    [
      {x:250,y:300,w:120,h:20},
      {x:450,y:230,w:120,h:20},
      {x:650,y:300,w:140,h:20},
      {x:900,y:340,w:100,h:20},
      {x:1050,y:260,w:120,h:20},
      {x:1250,y:320,w:150,h:20},
      {x:1480,y:250,w:120,h:20},
      {x:1650,y:320,w:100,h:20},
      {x:1820,y:260,w:120,h:20},
      {x:2000,y:330,w:100,h:20},
      {x:2180,y:270,w:130,h:20},
      {x:2380,y:320,w:110,h:20},
      {x:2560,y:250,w:130,h:20},
    ],
    [
      {x:290,y:260},{x:490,y:190},{x:690,y:260},{x:940,y:300},
      {x:1090,y:220},{x:1300,y:280},{x:1520,y:210},{x:150,y:340},
      {x:1690,y:280},{x:1860,y:220},{x:2040,y:290},{x:2220,y:230},
      {x:2420,y:280},{x:2600,y:210},{x:2750,y:340}
    ],
    [
      {x:600,y:355,range:120,dir:1,type:'walker',baseX:600},
      {x:1000,y:315,range:80,dir:-1,type:'walker',baseX:1000},
      {x:1400,y:355,range:150,dir:1,type:'walker',baseX:1400},
      {x:1750,y:355,range:100,dir:1,type:'walker',baseX:1750},
      {x:2100,y:355,range:120,dir:-1,type:'walker',baseX:2100},
      {x:2450,y:355,range:100,dir:1,type:'walker',baseX:2450},
    ],
    [
      {x:800,y:365,w:60,h:15},
      {x:1950,y:365,w:60,h:15},
      {x:2300,y:365,w:70,h:15},
    ],
    [
      {x:130,y:346,w:34,h:34,contents:'coin'},
      {x:520,y:196,w:34,h:34,contents:'powerup:wing'},
      {x:970,y:306,w:34,h:34,contents:'coin'},
      {x:1350,y:286,w:34,h:34,contents:'powerup:shield'},
      {x:1670,y:286,w:34,h:34,contents:'coin'},
      {x:2020,y:296,w:34,h:34,contents:'coin'},
      {x:2400,y:286,w:34,h:34,contents:'powerup:star'},
      {x:2600,y:216,w:34,h:34,contents:'coin'},
    ],
    [
      {x:200,y:270,type:'shield'},
      {x:960,y:310,type:'star'},
      {x:1280,y:290,type:'wing'},
    ],
    2850,
    {x:50,y:300},
    2920,
    {x:2230,y:200},
    { checkpoints: [{x:1250,y:380}] }
  ),
  makeLevel(
    380,
    [
      {x:200,y:310,w:90,h:18},
      {x:360,y:250,w:90,h:18},
      {x:520,y:190,w:90,h:18},
      {x:700,y:250,w:90,h:18},
      {x:880,y:310,w:90,h:18},
      {x:1050,y:340,w:120,h:18},
      {x:1250,y:280,w:100,h:18},
      {x:1420,y:220,w:100,h:18},
      {x:1600,y:300,w:140,h:18},
      {x:1780,y:250,w:100,h:18},
      {x:1950,y:190,w:100,h:18},
      {x:2130,y:250,w:100,h:18},
      {x:2310,y:310,w:100,h:18},
      {x:2480,y:340,w:120,h:18},
      {x:2660,y:280,w:100,h:18},
      {x:2840,y:220,w:100,h:18},
    ],
    [
      {x:230,y:270},{x:390,y:210},{x:550,y:150},{x:730,y:210},
      {x:910,y:270},{x:1090,y:300},{x:1280,y:240},{x:1450,y:180},
      {x:1650,y:260},{x:1750,y:340},
      {x:1820,y:210},{x:1990,y:150},{x:2170,y:210},{x:2350,y:270},
      {x:2520,y:300},{x:2700,y:240},{x:2880,y:180},{x:2980,y:340}
    ],
    [
      {x:300,y:355,range:100,dir:1,type:'walker',baseX:300},
      {x:650,y:355,range:130,dir:-1,type:'walker',baseX:650},
      {x:1150,y:355,range:100,dir:1,type:'walker',baseX:1150},
      {x:1500,y:355,range:120,dir:-1,type:'walker',baseX:1500},
      {x:1900,y:355,range:110,dir:1,type:'walker',baseX:1900},
      {x:2250,y:355,range:130,dir:-1,type:'walker',baseX:2250},
      {x:2600,y:355,range:100,dir:1,type:'walker',baseX:2600},
    ],
    [
      {x:450,y:365,w:70,h:15},
      {x:990,y:365,w:50,h:15},
      {x:2050,y:365,w:60,h:15},
      {x:2420,y:365,w:70,h:15},
    ],
    [
      {x:240,y:276,w:34,h:34,contents:'coin'},
      {x:560,y:156,w:34,h:34,contents:'powerup:wing'},
      {x:900,y:276,w:34,h:34,contents:'coin'},
      {x:1270,y:246,w:34,h:34,contents:'powerup:shield'},
      {x:1800,y:216,w:34,h:34,contents:'coin'},
      {x:2150,y:216,w:34,h:34,contents:'powerup:star'},
      {x:2500,y:306,w:34,h:34,contents:'coin'},
      {x:2860,y:186,w:34,h:34,contents:'coin'},
    ],
    [
      {x:730,y:220,type:'wing'},
      {x:1080,y:310,type:'star'},
      {x:1630,y:270,type:'shield'},
    ],
    2980,
    {x:50,y:300},
    3050,
    {x:2000,y:130},
    { checkpoints: [{x:1600,y:380}] }
  ),

  // ---------- Fase 3: Geleira Escorregadia (gelo) ----------
  makeLevel(
    380,
    [
      {x:220,y:300,w:110,h:20},
      {x:400,y:230,w:100,h:20, move:{axis:'y', range:55, speed:0.9}},
      {x:600,y:300,w:130,h:20},
      {x:820,y:250,w:100,h:20},
      {x:1000,y:320,w:120,h:20, move:{axis:'x', range:70, speed:0.8}},
      {x:1250,y:260,w:110,h:20},
      {x:1450,y:320,w:100,h:20},
      {x:1650,y:250,w:120,h:20},
      {x:1850,y:310,w:100,h:20, move:{axis:'x', range:60, speed:1.1}},
      {x:2050,y:250,w:120,h:20},
      {x:2250,y:310,w:110,h:20},
    ],
    [
      {x:250,y:260},{x:430,y:190},{x:640,y:260},{x:860,y:210},
      {x:1040,y:280},{x:1290,y:220},{x:1490,y:280},{x:1690,y:210},
      {x:1890,y:270},{x:2090,y:210},{x:2290,y:270},{x:120,y:340},
    ],
    [
      {x:520,y:355,range:110,dir:1,type:'walker',baseX:520},
      {x:900,y:355,range:90,dir:-1,type:'walker',baseX:900},
      {x:1350,y:355,range:120,dir:1,type:'walker',baseX:1350},
      {x:1750,y:355,range:100,dir:-1,type:'walker',baseX:1750},
      {x:2150,y:355,range:100,dir:1,type:'walker',baseX:2150},
    ],
    [
      {x:720,y:365,w:60,h:15},
      {x:1550,y:365,w:60,h:15},
    ],
    [
      {x:160,y:346,w:34,h:34,contents:'coin'},
      {x:670,y:266,w:34,h:34,contents:'powerup:shield'},
      {x:1080,y:286,w:34,h:34,contents:'coin'},
      {x:1480,y:286,w:34,h:34,contents:'powerup:star'},
      {x:2100,y:216,w:34,h:34,contents:'coin'},
    ],
    [
      {x:250,y:270,type:'shield'},
      {x:1450,y:290,type:'star'},
    ],
    2350,
    {x:50,y:300},
    2420,
    {x:430,y:150},
    {
      checkpoints: [{x:1200,y:380}],
      iceZones: [{x:480,w:820},{x:1680,w:420}],
      theme: 'gelo',
    }
  ),

  // ---------- Fase 4: Penhascos Ventosos (vento) ----------
  makeLevel(
    380,
    [
      {x:200,y:310,w:100,h:20},
      {x:380,y:250,w:90,h:20},
      {x:560,y:190,w:90,h:20, move:{axis:'y', range:60, speed:1.0}},
      {x:900,y:230,w:90,h:20, move:{axis:'y', range:70, speed:0.85}},
      {x:1150,y:190,w:100,h:20},
      {x:1400,y:260,w:100,h:20},
      {x:1650,y:320,w:110,h:20},
      {x:1900,y:250,w:100,h:20, move:{axis:'x', range:80, speed:0.9}},
      {x:2150,y:300,w:120,h:20},
      {x:2380,y:230,w:110,h:20},
    ],
    [
      {x:230,y:270},{x:410,y:210},{x:600,y:150},{x:950,y:190},
      {x:1180,y:150},{x:1430,y:220},{x:1690,y:280},{x:1940,y:210},
      {x:2190,y:260},{x:2410,y:190},{x:2600,y:280},
    ],
    [
      {x:280,y:355,range:100,dir:1,type:'walker',baseX:280},
      {x:1200,y:355,range:120,dir:-1,type:'walker',baseX:1200},
      {x:1750,y:355,range:100,dir:1,type:'walker',baseX:1750},
      {x:2250,y:355,range:110,dir:-1,type:'walker',baseX:2250},
    ],
    [
      {x:650,y:365,w:220,h:15},
      {x:2050,y:365,w:80,h:15},
    ],
    [
      {x:140,y:356,w:34,h:34,contents:'coin'},
      {x:1220,y:126,w:34,h:34,contents:'powerup:wing'},
      {x:1720,y:246,w:34,h:34,contents:'coin'},
      {x:2440,y:156,w:34,h:34,contents:'powerup:star'},
    ],
    [
      {x:220,y:280,type:'wing'},
      {x:1950,y:210,type:'shield'},
    ],
    2600,
    {x:50,y:300},
    2680,
    {x:1930,y:130},
    {
      checkpoints: [{x:1350,y:380}],
      windZones: [
        {x:650,y:0,w:230,h:450,strength:-0.4},
        {x:2100,y:0,w:280,h:450,strength:0.3},
      ],
      theme: 'vento',
    }
  ),

  // ---------- Fase 5: Caverna da Meia-Noite (cenário novo) ----------
  makeLevel(
    380,
    [
      {x:210,y:300,w:100,h:20},
      {x:400,y:340,w:90,h:20},
      {x:580,y:270,w:100,h:20, move:{axis:'x', range:90, speed:0.75}},
      {x:820,y:200,w:100,h:20},
      {x:1030,y:260,w:110,h:20, move:{axis:'y', range:60, speed:1.0}},
      {x:1280,y:330,w:120,h:20},
      {x:1480,y:220,w:100,h:20},
      {x:1680,y:290,w:100,h:20, move:{axis:'x', range:70, speed:0.9}},
      {x:1900,y:200,w:110,h:20},
      {x:2100,y:280,w:100,h:20},
      {x:2320,y:220,w:120,h:20, move:{axis:'y', range:55, speed:0.8}},
      {x:2540,y:300,w:110,h:20},
    ],
    [
      {x:240,y:260},{x:430,y:300},{x:620,y:230},{x:850,y:160},
      {x:1060,y:220},{x:1310,y:290},{x:1510,y:180},{x:1710,y:250},
      {x:1930,y:160},{x:2130,y:240},{x:2350,y:180},{x:2570,y:260},
      {x:150,y:340},{x:2700,y:340},
    ],
    [
      {x:340,y:355,range:90,dir:1,type:'walker',baseX:340},
      {x:760,y:355,range:100,dir:-1,type:'walker',baseX:760},
      {x:1200,y:355,range:110,dir:1,type:'walker',baseX:1200},
      {x:1620,y:355,range:90,dir:-1,type:'walker',baseX:1620},
      {x:2040,y:355,range:100,dir:1,type:'walker',baseX:2040},
      {x:2460,y:355,range:100,dir:-1,type:'walker',baseX:2460},
    ],
    [
      {x:500,y:365,w:70,h:15},
      {x:1400,y:365,w:60,h:15},
      {x:2250,y:365,w:70,h:15},
    ],
    [
      {x:160,y:346,w:34,h:34,contents:'coin'},
      {x:660,y:236,w:34,h:34,contents:'powerup:star'},
      {x:1090,y:226,w:34,h:34,contents:'coin'},
      {x:1540,y:186,w:34,h:34,contents:'powerup:shield'},
      {x:1960,y:166,w:34,h:34,contents:'coin'},
      {x:2380,y:186,w:34,h:34,contents:'powerup:wing'},
      {x:2600,y:266,w:34,h:34,contents:'coin'},
    ],
    [
      {x:300,y:270,type:'star'},
      {x:1350,y:290,type:'shield'},
      {x:2150,y:250,type:'wing'},
    ],
    2740,
    {x:50,y:300},
    2820,
    {x:1035,y:160},
    {
      checkpoints: [{x:900,y:380},{x:1900,y:380}],
      theme: 'noite',
    }
  ),

  // ---------- Fase 6 - Praia Encantada ----------
  makeLevel(
    380,
    [
      {x:380,y:207,w:100,h:20},
      {x:589,y:209,w:100,h:20, move:{axis:'y', range:80, speed:1.06}},
      {x:782,y:266,w:100,h:20},
      {x:962,y:302,w:100,h:20},
      {x:1120,y:340,w:100,h:20},
      {x:1329,y:340,w:100,h:20},
      {x:1511,y:340,w:100,h:20},
      {x:1669,y:315,w:100,h:20},
      {x:1834,y:340,w:100,h:20},
      {x:2000,y:340,w:100,h:20},
      {x:2188,y:331,w:100,h:20},
      {x:2382,y:313,w:100,h:20},
      {x:2591,y:340,w:100,h:20},
      {x:2792,y:340,w:100,h:20}
    ],
    [
      {x:140,y:340},
      {x:420,y:167},
      {x:629,y:169},
      {x:822,y:226},
      {x:1002,y:262},
      {x:1160,y:300},
      {x:1369,y:300},
      {x:1551,y:300},
      {x:1709,y:275},
      {x:1874,y:300},
      {x:2040,y:300},
      {x:2228,y:291},
      {x:2422,y:273},
      {x:2631,y:300},
      {x:2832,y:300},
      {x:2942,y:340}
    ],
    [
      {x:782,y:355,range:132,dir:-1,type:'walker',baseX:782},
      {x:1120,y:355,range:144,dir:-1,type:'walker',baseX:1120},
      {x:1511,y:355,range:126,dir:-1,type:'walker',baseX:1511},
      {x:1834,y:355,range:93,dir:-1,type:'walker',baseX:1834},
      {x:2188,y:355,range:119,dir:1,type:'walker',baseX:2188},
      {x:2591,y:355,range:142,dir:-1,type:'walker',baseX:2591}
    ],
    [
      {x:932,y:365,w:72,h:15},
      {x:1481,y:365,w:60,h:15},
      {x:1970,y:365,w:74,h:15},
      {x:2561,y:365,w:74,h:15}
    ],
    [
      {x:599,y:165,w:34,h:34,contents:'powerup:shield'},
      {x:972,y:258,w:34,h:34,contents:'powerup:shield'},
      {x:1339,y:296,w:34,h:34,contents:'coin'},
      {x:1679,y:271,w:34,h:34,contents:'coin'},
      {x:2010,y:296,w:34,h:34,contents:'coin'},
      {x:2392,y:269,w:34,h:34,contents:'powerup:star'},
      {x:2802,y:296,w:34,h:34,contents:'coin'}
    ],
    [
      {x:962,y:262,type:'star'},
      {x:1669,y:275,type:'wing'},
      {x:2188,y:291,type:'shield'}
    ],
    3052,
    {x:50,y:300},
    3122,
    {x:1669,y:225},
    {
      checkpoints: [{x:1120,y:380},{x:2188,y:380}],
      theme: 'praia',
    }
  ),

  // ---------- Fase 7 - Ruinas Perdidas ----------
  makeLevel(
    380,
    [
      {x:380,y:284,w:100,h:20, move:{axis:'y', range:54, speed:0.91}},
      {x:545,y:246,w:100,h:20, move:{axis:'x', range:69, speed:0.95}},
      {x:748,y:289,w:100,h:20, move:{axis:'x', range:67, speed:0.98}},
      {x:922,y:340,w:100,h:20, move:{axis:'x', range:68, speed:1.17}},
      {x:1081,y:340,w:100,h:20},
      {x:1283,y:340,w:100,h:20},
      {x:1458,y:340,w:100,h:20},
      {x:1618,y:340,w:100,h:20, move:{axis:'x', range:61, speed:1.06}},
      {x:1769,y:313,w:100,h:20},
      {x:1976,y:269,w:100,h:20},
      {x:2170,y:211,w:100,h:20},
      {x:2371,y:198,w:100,h:20},
      {x:2562,y:211,w:100,h:20},
      {x:2751,y:190,w:100,h:20},
      {x:2911,y:190,w:100,h:20}
    ],
    [
      {x:140,y:340},
      {x:420,y:244},
      {x:585,y:206},
      {x:788,y:249},
      {x:962,y:300},
      {x:1121,y:300},
      {x:1323,y:300},
      {x:1498,y:300},
      {x:1658,y:300},
      {x:1809,y:273},
      {x:2016,y:229},
      {x:2210,y:171},
      {x:2411,y:158},
      {x:2602,y:171},
      {x:2791,y:150},
      {x:2951,y:150},
      {x:3061,y:340}
    ],
    [
      {x:748,y:355,range:129,dir:-1,type:'walker',baseX:748},
      {x:1081,y:355,range:95,dir:-1,type:'walker',baseX:1081},
      {x:1458,y:355,range:109,dir:-1,type:'walker',baseX:1458},
      {x:1769,y:355,range:103,dir:1,type:'walker',baseX:1769},
      {x:2170,y:355,range:99,dir:1,type:'walker',baseX:2170},
      {x:2562,y:355,range:100,dir:-1,type:'walker',baseX:2562},
      {x:2911,y:355,range:129,dir:1,type:'walker',baseX:2911}
    ],
    [
      {x:892,y:365,w:86,h:15},
      {x:1428,y:365,w:67,h:15},
      {x:1946,y:365,w:63,h:15},
      {x:2532,y:365,w:61,h:15}
    ],
    [
      {x:555,y:202,w:34,h:34,contents:'coin'},
      {x:932,y:296,w:34,h:34,contents:'powerup:shield'},
      {x:1293,y:296,w:34,h:34,contents:'powerup:star'},
      {x:1628,y:296,w:34,h:34,contents:'coin'},
      {x:1986,y:225,w:34,h:34,contents:'coin'},
      {x:2381,y:154,w:34,h:34,contents:'powerup:wing'},
      {x:2761,y:146,w:34,h:34,contents:'coin'}
    ],
    [
      {x:922,y:300,type:'star'},
      {x:1618,y:300,type:'wing'},
      {x:2371,y:158,type:'shield'}
    ],
    3171,
    {x:50,y:300},
    3241,
    {x:1769,y:223},
    {
      checkpoints: [{x:1081,y:380},{x:2170,y:380}],
      theme: 'ruinas',
    }
  ),

  // ---------- Fase 8 - Vulcao em Furia ----------
  makeLevel(
    380,
    [
      {x:347,y:230,w:90,h:20},
      {x:536,y:265,w:90,h:20},
      {x:684,y:255,w:90,h:20},
      {x:830,y:275,w:90,h:20, move:{axis:'y', range:77, speed:0.79}},
      {x:972,y:281,w:90,h:20, move:{axis:'x', range:61, speed:0.97}},
      {x:1114,y:314,w:90,h:20},
      {x:1261,y:267,w:90,h:20},
      {x:1426,y:283,w:90,h:20},
      {x:1593,y:294,w:90,h:20, move:{axis:'x', range:74, speed:0.86}},
      {x:1754,y:319,w:90,h:20, move:{axis:'y', range:70, speed:0.88}},
      {x:1895,y:340,w:90,h:20, move:{axis:'x', range:75, speed:1.16}},
      {x:2073,y:301,w:90,h:20, move:{axis:'y', range:60, speed:0.88}},
      {x:2259,y:272,w:90,h:20},
      {x:2446,y:269,w:90,h:20, move:{axis:'x', range:70, speed:0.88}},
      {x:2587,y:241,w:90,h:20, move:{axis:'x', range:82, speed:0.74}}
    ],
    [
      {x:120,y:340},
      {x:382,y:190},
      {x:571,y:225},
      {x:719,y:215},
      {x:865,y:235},
      {x:1007,y:241},
      {x:1149,y:274},
      {x:1296,y:227},
      {x:1461,y:243},
      {x:1628,y:254},
      {x:1789,y:279},
      {x:1930,y:300},
      {x:2108,y:261},
      {x:2294,y:232},
      {x:2481,y:229},
      {x:2622,y:201},
      {x:2737,y:340}
    ],
    [
      {x:684,y:355,range:140,dir:1,type:'walker',baseX:684},
      {x:972,y:355,range:109,dir:1,type:'walker',baseX:972},
      {x:1261,y:355,range:137,dir:1,type:'walker',baseX:1261},
      {x:1593,y:355,range:136,dir:1,type:'walker',baseX:1593},
      {x:1895,y:355,range:127,dir:-1,type:'walker',baseX:1895},
      {x:2259,y:355,range:139,dir:-1,type:'walker',baseX:2259},
      {x:2587,y:355,range:98,dir:-1,type:'walker',baseX:2587}
    ],
    [
      {x:800,y:365,w:74,h:15},
      {x:1084,y:365,w:87,h:15},
      {x:1396,y:365,w:65,h:15},
      {x:1724,y:365,w:87,h:15},
      {x:2043,y:365,w:68,h:15},
      {x:2416,y:365,w:83,h:15}
    ],
    [
      {x:546,y:221,w:34,h:34,contents:'coin'},
      {x:840,y:231,w:34,h:34,contents:'powerup:shield'},
      {x:1124,y:270,w:34,h:34,contents:'coin'},
      {x:1436,y:239,w:34,h:34,contents:'powerup:shield'},
      {x:1764,y:275,w:34,h:34,contents:'powerup:star'},
      {x:2083,y:257,w:34,h:34,contents:'powerup:wing'},
      {x:2456,y:225,w:34,h:34,contents:'coin'}
    ],
    [
      {x:830,y:235,type:'star'},
      {x:1426,y:243,type:'wing'},
      {x:2073,y:261,type:'shield'}
    ],
    2847,
    {x:50,y:300},
    2917,
    {x:1593,y:204},
    {
      checkpoints: [{x:1114,y:380},{x:1895,y:380}],
      theme: 'lava',
    }
  ),

  // ---------- Fase 9 - Ilhas Flutuantes ----------
  makeLevel(
    380,
    [
      {x:377,y:307,w:90,h:20, move:{axis:'y', range:62, speed:0.74}},
      {x:530,y:325,w:90,h:20},
      {x:696,y:262,w:90,h:20},
      {x:879,y:321,w:90,h:20, move:{axis:'y', range:76, speed:1.13}},
      {x:1040,y:276,w:90,h:20, move:{axis:'y', range:57, speed:0.82}},
      {x:1197,y:284,w:90,h:20},
      {x:1353,y:286,w:90,h:20, move:{axis:'x', range:76, speed:0.97}},
      {x:1516,y:340,w:90,h:20},
      {x:1679,y:321,w:90,h:20},
      {x:1832,y:259,w:90,h:20, move:{axis:'y', range:62, speed:1.06}},
      {x:2024,y:314,w:90,h:20},
      {x:2207,y:250,w:90,h:20},
      {x:2405,y:191,w:90,h:20, move:{axis:'y', range:64, speed:0.87}},
      {x:2591,y:218,w:90,h:20, move:{axis:'y', range:55, speed:1.01}},
      {x:2766,y:190,w:90,h:20},
      {x:2942,y:190,w:90,h:20, move:{axis:'x', range:60, speed:1.16}}
    ],
    [
      {x:140,y:340},
      {x:412,y:267},
      {x:565,y:285},
      {x:731,y:222},
      {x:914,y:281},
      {x:1075,y:236},
      {x:1232,y:244},
      {x:1388,y:246},
      {x:1551,y:300},
      {x:1714,y:281},
      {x:1867,y:219},
      {x:2059,y:274},
      {x:2242,y:210},
      {x:2440,y:151},
      {x:2626,y:178},
      {x:2801,y:150},
      {x:2977,y:150},
      {x:3092,y:340}
    ],
    [
      {x:696,y:355,range:92,dir:-1,type:'walker',baseX:696},
      {x:1197,y:355,range:140,dir:1,type:'walker',baseX:1197},
      {x:1679,y:355,range:109,dir:1,type:'walker',baseX:1679},
      {x:2207,y:355,range:141,dir:-1,type:'walker',baseX:2207},
      {x:2766,y:355,range:116,dir:1,type:'walker',baseX:2766}
    ],
    [
      {x:849,y:365,w:75,h:15},
      {x:1323,y:365,w:88,h:15},
      {x:1802,y:365,w:70,h:15},
      {x:2375,y:365,w:81,h:15},
      {x:2912,y:365,w:64,h:15}
    ],
    [
      {x:540,y:281,w:34,h:34,contents:'coin'},
      {x:889,y:277,w:34,h:34,contents:'powerup:wing'},
      {x:1207,y:240,w:34,h:34,contents:'coin'},
      {x:1526,y:296,w:34,h:34,contents:'powerup:shield'},
      {x:1842,y:215,w:34,h:34,contents:'coin'},
      {x:2217,y:206,w:34,h:34,contents:'coin'},
      {x:2601,y:174,w:34,h:34,contents:'powerup:shield'},
      {x:2952,y:146,w:34,h:34,contents:'powerup:wing'}
    ],
    [
      {x:879,y:281,type:'star'},
      {x:1353,y:246,type:'wing'},
      {x:1832,y:219,type:'shield'},
      {x:2405,y:151,type:'star'}
    ],
    3202,
    {x:50,y:300},
    3272,
    {x:1679,y:231},
    {
      checkpoints: [{x:1197,y:380},{x:2207,y:380}],
      windZones: [{x:1600,y:0,w:300,h:450,strength:-0.35},{x:2450,y:0,w:300,h:450,strength:0.3}],
      theme: 'ceu',
    }
  ),

  // ---------- Fase 10 - Apice da Ilha ----------
  makeLevel(
    380,
    [
      {x:377,y:254,w:100,h:20},
      {x:586,y:191,w:100,h:20},
      {x:794,y:237,w:100,h:20, move:{axis:'x', range:71, speed:0.76}},
      {x:946,y:190,w:100,h:20, move:{axis:'x', range:65, speed:0.95}},
      {x:1135,y:190,w:100,h:20},
      {x:1320,y:221,w:100,h:20},
      {x:1478,y:284,w:100,h:20},
      {x:1673,y:272,w:100,h:20},
      {x:1873,y:266,w:100,h:20},
      {x:2072,y:268,w:100,h:20},
      {x:2227,y:205,w:100,h:20, move:{axis:'y', range:62, speed:0.83}},
      {x:2389,y:190,w:100,h:20, move:{axis:'x', range:71, speed:1.17}},
      {x:2573,y:229,w:100,h:20},
      {x:2759,y:264,w:100,h:20, move:{axis:'y', range:70, speed:1.12}},
      {x:2939,y:322,w:100,h:20},
      {x:3102,y:340,w:100,h:20},
      {x:3310,y:304,w:100,h:20, move:{axis:'y', range:52, speed:1.17}}
    ],
    [
      {x:140,y:340},
      {x:417,y:214},
      {x:626,y:151},
      {x:834,y:197},
      {x:986,y:150},
      {x:1175,y:150},
      {x:1360,y:181},
      {x:1518,y:244},
      {x:1713,y:232},
      {x:1913,y:226},
      {x:2112,y:228},
      {x:2267,y:165},
      {x:2429,y:150},
      {x:2613,y:189},
      {x:2799,y:224},
      {x:2979,y:282},
      {x:3142,y:300},
      {x:3350,y:264},
      {x:3460,y:340}
    ],
    [
      {x:794,y:355,range:108,dir:-1,type:'walker',baseX:794},
      {x:1135,y:355,range:120,dir:-1,type:'walker',baseX:1135},
      {x:1478,y:355,range:105,dir:1,type:'walker',baseX:1478},
      {x:1873,y:355,range:141,dir:1,type:'walker',baseX:1873},
      {x:2227,y:355,range:138,dir:1,type:'walker',baseX:2227},
      {x:2573,y:355,range:142,dir:1,type:'walker',baseX:2573},
      {x:2939,y:355,range:147,dir:1,type:'walker',baseX:2939},
      {x:3310,y:355,range:114,dir:-1,type:'walker',baseX:3310}
    ],
    [
      {x:916,y:365,w:68,h:15},
      {x:1290,y:365,w:71,h:15},
      {x:1643,y:365,w:88,h:15},
      {x:2042,y:365,w:61,h:15},
      {x:2359,y:365,w:80,h:15},
      {x:2729,y:365,w:87,h:15},
      {x:3072,y:365,w:82,h:15}
    ],
    [
      {x:596,y:147,w:34,h:34,contents:'powerup:shield'},
      {x:956,y:146,w:34,h:34,contents:'coin'},
      {x:1330,y:177,w:34,h:34,contents:'powerup:shield'},
      {x:1683,y:228,w:34,h:34,contents:'powerup:wing'},
      {x:2082,y:224,w:34,h:34,contents:'powerup:wing'},
      {x:2399,y:146,w:34,h:34,contents:'powerup:shield'},
      {x:2769,y:220,w:34,h:34,contents:'powerup:shield'},
      {x:3112,y:296,w:34,h:34,contents:'powerup:wing'}
    ],
    [
      {x:946,y:150,type:'star'},
      {x:1478,y:244,type:'wing'},
      {x:2227,y:165,type:'shield'},
      {x:2759,y:224,type:'star'}
    ],
    3570,
    {x:50,y:300},
    3640,
    {x:2072,y:178},
    {
      checkpoints: [{x:1135,y:380},{x:2227,y:380},{x:2939,y:380}],
      windZones: [{x:1700,y:0,w:300,h:450,strength:0.35}],
      iceZones: [{x:794,w:600},{x:2389,w:500}],
      theme: 'lendaria',
    }
  ),
];
