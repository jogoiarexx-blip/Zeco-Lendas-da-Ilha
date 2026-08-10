// =============================================================
// Dados da Fase 1 — copiados de js/fases.js do jogo original,
// sem nenhuma alteração no layout (mesmas posições de plataformas,
// gemas, inimigos, caixas etc.), só pra provar que a versão Phaser
// consegue rodar o mesmo conteúdo do jogo vanilla.
// =============================================================
const FASE1 = {
  groundY: 380,
  worldWidth: 2920,
  playerStart: { x: 50, y: 300 },
  portalX: 2850,
  platforms: [
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
  gems: [
    {x:290,y:260},{x:490,y:190},{x:690,y:260},{x:940,y:300},
    {x:1090,y:220},{x:1300,y:280},{x:1520,y:210},{x:150,y:340},
    {x:1690,y:280},{x:1860,y:220},{x:2040,y:290},{x:2220,y:230},
    {x:2420,y:280},{x:2600,y:210},{x:2750,y:340}
  ],
  enemies: [
    {x:600,y:355,range:120,dir:1,baseX:600},
    {x:1000,y:315,range:80,dir:-1,baseX:1000},
    {x:1400,y:355,range:150,dir:1,baseX:1400},
    {x:1750,y:355,range:100,dir:1,baseX:1750},
    {x:2100,y:355,range:120,dir:-1,baseX:2100},
    {x:2450,y:355,range:100,dir:1,baseX:2450},
  ],
  spikes: [
    {x:800,y:365,w:60,h:15},
    {x:1950,y:365,w:60,h:15},
    {x:2300,y:365,w:70,h:15},
  ],
  silverGem: {x:2230,y:200},
  checkpoints: [{x:1250,y:380}],
};

// Paleta do tema "ilha" — copiada de THEMES.ilha em js/jogo.js
const THEME_ILHA = {
  skyTop: 0x7ec8e3,
  skyBot: 0xc9e8d8,
  hill: 0x8fc99b,
  ground: 0x8c5a2b,
  grass: 0x4caf50,
};
