// =============================================================
// Zeco e a Ilha das Gemas — Motor do Jogo (JS principal)
// Referências DOM, entrada (teclado/toque), física, colisão,
// partículas, desenho e o loop principal.
// Depende de: fases.js (levels) — carregar ANTES deste arquivo.
// =============================================================

// ---------- Referências DOM, tamanho da tela e entrada ----------
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
// Tamanho lógico do jogo (o que a lógica/desenho sempre usa). A resolução real
// do canvas é multiplicada pelo devicePixelRatio para não ficar borrado em
// telas HiDPI (celulares, retina), e o contexto é escalado de volta para que
// todo o resto do código continue desenhando em coordenadas 800x450 normais.
const W = 800, H = 450;
const DPR = window.devicePixelRatio || 1;
const wrap = document.getElementById('wrap');

// ---------- Sprites animados do Zeco ----------
// Cada pose foi recortada da arte enviada pelo usuário e mantida como PNG transparente.
const ZECO_SPRITES = {};
for (const name of ['idle1','idle2','run1','run2','jump','attack','throw','crouch','hurt','dead']) {
  const img = new Image();
  img.src = `assets/zeco/${name}.png`;
  ZECO_SPRITES[name] = img;
}

// Preferência de "menos movimento" do sistema: usada para suavizar tremidas
// de câmera e reduzir um pouco a quantidade de partículas.
const REDUCED_MOTION = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Ajusta o tamanho do quadro do jogo para caber inteiro na tela (sem cortar),
// respeitando a proporção 800x450, tanto na largura quanto na altura disponíveis.
// Em telas de PC (bem mais largas que altas) o jogo antes ficava travado num
// máximo de 800px de largura, o que sobrava um monte de tela vazia ao redor
// e fazia o jogo parecer pequeno demais nesses monitores. Agora o limite
// escala com a altura disponível da janela, então em monitores grandes o
// jogo ocupa a tela de verdade, igual já acontecia no celular.
function fitWrap() {
  const aspect = 800 / 450;
  const maxH = window.innerHeight * 0.95;
  let h = maxH;
  let w = h * aspect;
  if (w > window.innerWidth * 0.97) {
    w = window.innerWidth * 0.97;
    h = w / aspect;
  }
  wrap.style.width = w + 'px';
  wrap.style.height = h + 'px';

  // Redimensiona o buffer real do canvas para bater com o tamanho exibido
  // (multiplicado pelo devicePixelRatio), em vez de deixá-lo fixo em 800x450
  // e esticado via CSS — isso é o que mantinha a imagem nítida antes, mas
  // borrava o jogo ao exibi-lo maior que 800px em telas de PC.
  canvas.width = Math.round(w * DPR);
  canvas.height = Math.round(h * DPR);
  ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
}
fitWrap();
window.addEventListener('resize', fitWrap);
window.addEventListener('orientationchange', () => setTimeout(fitWrap, 150));

const scoreDisplay = document.getElementById('scoreDisplay');
const livesDisplay = document.getElementById('livesDisplay');
const gemProgressDisplay = document.getElementById('gemProgressDisplay');
const objectiveDisplay = document.getElementById('objectiveDisplay');
const coinDisplay = document.getElementById('coinDisplay');
const levelDisplay = document.getElementById('levelDisplay');
const powerupStatus = document.getElementById('powerupStatus');
const muteBtn = document.getElementById('muteBtn');
const bestScoreDisplay = document.getElementById('bestScoreDisplay');
const overlay = document.getElementById('overlay');
const screenMenu = document.getElementById('screenMenu');
const screenHowTo = document.getElementById('screenHowTo');
const screenEnd = document.getElementById('screenEnd');
const screenLevelComplete = document.getElementById('screenLevelComplete');
const completeChapter = document.getElementById('completeChapter');
const completeTitle = document.getElementById('completeTitle');
const completeStars = document.getElementById('completeStars');
const completeGemStat = document.getElementById('completeGemStat');
const completeSecretStat = document.getElementById('completeSecretStat');
const completeTimeStat = document.getElementById('completeTimeStat');
const completeLivesStat = document.getElementById('completeLivesStat');
const completeScoreStat = document.getElementById('completeScoreStat');
const completeBonusStat = document.getElementById('completeBonusStat');
const completeGemGoal = document.getElementById('completeGemGoal');
const completeSecretGoal = document.getElementById('completeSecretGoal');
const completeNextBtn = document.getElementById('completeNextBtn');
const completeReplayBtn = document.getElementById('completeReplayBtn');
const completeMapBtn = document.getElementById('completeMapBtn');
const screenLevelSelect = document.getElementById('screenLevelSelect');
const levelGrid = document.getElementById('levelGrid');
const overlayTitle = document.getElementById('overlayTitle');
const overlayText = document.getElementById('overlayText');
const playBtn = document.getElementById('playBtn');
const levelSelectBtn = document.getElementById('levelSelectBtn');
const levelSelectBackBtn = document.getElementById('levelSelectBackBtn');
const howToBtn = document.getElementById('howToBtn');
const howToBackBtn = document.getElementById('howToBackBtn');
const startBtn = document.getElementById('startBtn');
const menuBtn = document.getElementById('menuBtn');
const pauseBtn = document.getElementById('pauseBtn');
const attackBtn = document.getElementById('attackBtn');
const specialBtn = document.getElementById('specialBtn');
const screenPause = document.getElementById('screenPause');
const resumeBtn = document.getElementById('resumeBtn');
const restartLevelBtn = document.getElementById('restartLevelBtn');
const pauseMenuBtn = document.getElementById('pauseMenuBtn');
const pauseLevelText = document.getElementById('pauseLevelText');
const dialogueBox = document.getElementById('dialogueBox');
const dialogueName = document.getElementById('dialogueName');
const dialogueText = document.getElementById('dialogueText');
const dialoguePortrait = document.getElementById('dialoguePortrait');
const dialogueNext = document.getElementById('dialogueNext');

const GRAVITY = 0.6;
const FRICTION = 0.82;
const MOVE_SPEED = 0.9;
const MAX_SPEED = 5.5;
const JUMP_FORCE = -12.5;
const STAR_FRAMES = 360;   // 6s a 60fps
const WING_FRAMES = 480;   // 8s a 60fps

let keys = {};
document.addEventListener('keydown', e => {
  keys[e.key.toLowerCase()] = true;
  if ([' ','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) e.preventDefault();
  const k = e.key.toLowerCase();
  if ((k === 'p' || k === 'escape') && state.running && !e.repeat) {
    // ESC durante diálogo fecha o diálogo; não abre dois overlays ao mesmo tempo.
    if (dialogueOpen) {
      if (k === 'escape') closeDialogue();
      return;
    }
    if (typeof setPaused === 'function') setPaused(!state.paused);
    else state.paused = !state.paused;
  }
});
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// ---------- Touch controls ----------
function bindTouchBtn(el, keyName) {
  const press = ev => { ev.preventDefault(); keys[keyName] = true; el.classList.add('active'); };
  const release = ev => { ev.preventDefault(); keys[keyName] = false; el.classList.remove('active'); };
  el.addEventListener('touchstart', press, {passive:false});
  el.addEventListener('touchend', release, {passive:false});
  el.addEventListener('touchcancel', release, {passive:false});
  el.addEventListener('mousedown', press);
  el.addEventListener('mouseup', release);
  el.addEventListener('mouseleave', release);
  // Suporte a teclado/leitor de tela, já que os botões têm role="button"
  el.addEventListener('keydown', ev => {
    if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); press(ev); }
  });
  el.addEventListener('keyup', ev => {
    if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); release(ev); }
  });
}
bindTouchBtn(document.getElementById('leftBtn'), 'arrowleft');
bindTouchBtn(document.getElementById('rightBtn'), 'arrowright');
bindTouchBtn(document.getElementById('jumpBtn'), ' ');
bindTouchBtn(document.getElementById('attackBtn'), 'x');
if (specialBtn) bindTouchBtn(specialBtn, 'c');

function clearInputState() {
  keys = {};
  jumpKeyPrev = false;
  attackKeyPrev = false;
  document.querySelectorAll('.touchBtn.active').forEach(el => el.classList.remove('active'));
}
window.addEventListener('blur', clearInputState);
document.addEventListener('visibilitychange', () => { if (document.hidden) clearInputState(); });


// ---------- Tela cheia + travar em paisagem ao iniciar ----------
function goFullscreenLandscape() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (req) {
    try { req.call(el).catch(() => {}); } catch (e) {}
  }
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(() => {});
  }
  setTimeout(fitWrap, 200);
}

// ---------- Partículas ----------
// =====================================================================
// PARTÍCULAS
// =====================================================================
let particles = [];
function spawnParticles(x, y, count, opts={}) {
  const {
    color='#ffd166', speed=3, life=30, gravity=0.15, size=3
  } = opts;
  if (REDUCED_MOTION) count = Math.ceil(count * 0.5);
  for (let i=0;i<count;i++) {
    const ang = Math.random()*Math.PI*2;
    const spd = (0.4 + Math.random()*0.6) * speed;
    particles.push({
      x, y,
      vx: Math.cos(ang)*spd,
      vy: Math.sin(ang)*spd - (opts.up ? 2 : 0),
      life, maxLife: life,
      color, size: size*(0.6+Math.random()*0.8),
      gravity
    });
  }
}
function updateParticles() {
  for (let i=particles.length-1;i>=0;i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.96;
    p.life--;
    if (p.life <= 0) particles.splice(i,1);
  }
}
function drawParticles() {
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---------- Textos flutuantes (ex.: aviso de checkpoint) ----------
let floatTexts = [];
function spawnFloatText(x, y, text, color='#9be8ff') {
  if (REDUCED_MOTION) { floatTexts.push({x, y, text, color, life:36, maxLife:36, vy:-0.5}); return; }
  floatTexts.push({x, y, text, color, life:50, maxLife:50, vy:-0.7});
}
function updateFloatTexts() {
  for (let i=floatTexts.length-1;i>=0;i--) {
    const f = floatTexts[i];
    f.y += f.vy;
    f.vy *= 0.97;
    f.life--;
    if (f.life <= 0) floatTexts.splice(i,1);
  }
}
function drawFloatTexts() {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 15px sans-serif';
  for (const f of floatTexts) {
    const a = Math.max(0, f.life / f.maxLife);
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(20,20,30,0.55)';
    ctx.fillText(f.text, f.x+1.5, f.y+1.5);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

// ---------- Estado do jogo, jogador e carregamento de fase ----------
// Alguns navegadores/modos privados podem bloquear localStorage completamente.
// Centralizar o acesso evita que o jogo deixe de abrir por causa disso.
function safeStorageGet(key, fallback=null) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value;
  } catch (e) { return fallback; }
}
function safeStorageSet(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch (e) { return false; }
}

let state = {
  running: false,
  paused: false,
  levelIndex: 0,
  score: 0,
  bestScore: 0,
  lives: 3,
  gemStreak: 0,
  objectives: 0,
  camX: 0,
  lastWon: false,
  lastPlayedLevel: 0,
  cameraShake: safeStorageGet('zeco_shake', '1') !== '0',
  coins: 0,
  unlockedThrow: false,
  showTips: safeStorageGet('zeco_tips', '1') !== '0',
  shake: {x:0, y:0, timer:0},
  levelProgress: levels.map(() => ({completed:false, objective:false})),
};

// ---------- Progresso salvo (localStorage) ----------
// Guarda quais fases/objetivos já foram concluídos e a maior pontuação já
// alcançada, para não perder tudo ao fechar a aba ou dar F5.
const SAVE_KEY = 'zeco_save_v1';

function saveProgress() {
  try {
    safeStorageSet(SAVE_KEY, JSON.stringify({
      levelProgress: state.levelProgress,
      bestScore: state.bestScore,
      lastPlayedLevel: state.lastPlayedLevel,
      coins: state.coins,
      unlockedThrow: state.unlockedThrow,
    }));
  } catch (e) { /* localStorage indisponível (modo privado, etc.) — ignora */ }
}

function loadProgress() {
  try {
    const raw = safeStorageGet(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.levelProgress)) {
      // Migração segura: preserva progresso mesmo quando novas fases são adicionadas.
      state.levelProgress = levels.map((_, i) => ({
        completed: !!(data.levelProgress[i] && data.levelProgress[i].completed),
        objective: !!(data.levelProgress[i] && data.levelProgress[i].objective),
      }));
    }
    if (typeof data.bestScore === 'number') state.bestScore = data.bestScore;
    if (typeof data.coins === 'number') state.coins = Math.max(0, data.coins|0);
    state.unlockedThrow = !!data.unlockedThrow || state.coins >= 20;
    if (Number.isInteger(data.lastPlayedLevel)) state.lastPlayedLevel = Math.max(0, Math.min(data.lastPlayedLevel, levels.length - 1));
  } catch (e) { /* dados corrompidos — ignora e começa do zero */ }
  updateBestScoreDisplay();
}

function updateBestScoreDisplay() {
  if (state.bestScore > 0) {
    bestScoreDisplay.textContent = '🏆 Recorde: ' + state.bestScore;
    bestScoreDisplay.classList.remove('hidden');
  } else {
    bestScoreDisplay.classList.add('hidden');
  }
}

let player, gems, enemies, portalX, worldWidth, groundY, platforms, spikes, powerups, boxes, silverGem, checkpoints;
let boss = null;
const mestreTupiSprites = { idle:new Image(), talk:new Image() };
mestreTupiSprites.idle.src='assets/tupi/idle.png';
mestreTupiSprites.talk.src='assets/tupi/talk.png';
const linaSprites = { idle:new Image(), talk:new Image(), map:new Image() };
linaSprites.idle.src='assets/lina/idle.png';
linaSprites.talk.src='assets/lina/talk.png';
linaSprites.map.src='assets/lina/map.png';
let npc = null;
let dialogueOpen = false;
let dialogueSeen = {};
let bossProjectiles = [];
let specialProjectiles = [];
let chests = [];
let miniBoss = null;
let jumpKeyPrev = false;
let attackKeyPrev = false;
let lastCheckpoint = null; // {x,y} do último checkpoint tocado na fase atual, ou null
let riddenPlatform = null; // plataforma móvel em que o jogador está em pé no frame atual, ou null

// Estatísticas da fase atual para a tela de resultado.
let levelRunStats = { startScore:0, startClock:0, gemsCollected:0, totalGems:0, deaths:0, objectiveAtStart:false };
let lastCompleteResult = null;

// Relógio de jogo: ao contrário de Date.now(), só avança enquanto o jogo
// não está pausado. Usado para toda animação/física que depende de tempo
// (plataformas móveis, efeitos visuais), para que uma pausa longa não faça
// nada "teleportar" para onde estaria se o tempo nunca tivesse parado.
let gameClock = 0;
let lastFrameTime = null;
function tickGameClock() {
  const now = Date.now();
  if (lastFrameTime === null) lastFrameTime = now;
  const dt = (now - lastFrameTime) / 1000;
  lastFrameTime = now;
  if (!state.paused && state.running) gameClock += dt;
  return gameClock;
}

function loadLevel(idx) {
  const lvl = levels[idx];
  groundY = lvl.groundY;
  platforms = lvl.platforms.map(p => ({...p, baseX:p.x, baseY:p.y, dx:0, dy:0}));
  gems = lvl.gems.map(g => ({...g, taken:false}));
  enemies = lvl.enemies.map((e,i) => ({...e, alive:true, x:e.x, baseY:e.y, hp:1, archetype:['walker','hopper','charger','floater'][state.levelIndex%4]}));
  spikes = lvl.spikes.map(s => ({...s}));
  boxes = lvl.boxes.map(b => ({...b, broken:false}));
  powerups = lvl.powerups.map(p => ({...p, taken:false}));
  silverGem = lvl.silverGem ? {...lvl.silverGem, taken:false} : null;
  checkpoints = (lvl.checkpoints || []).map(c => ({...c, active:false, pulse:0}));
  // NPCs narrativos aparecem em momentos-chave da aventura.
  const npcData = (typeof ZECO_NPCS !== 'undefined') ? ZECO_NPCS[idx] : null;
  npc = npcData ? {...npcData, shown:false} : null;
  dialogueOpen = false;
  if (dialogueBox) dialogueBox.classList.add('hidden');
  bossProjectiles = [];
  specialProjectiles = [];
  // Baú secreto por região: recompensa moedas permanentes.
  chests = [{x: Math.max(280, Math.min(lvl.portalX-650, Math.floor(lvl.worldWidth*0.62))), y: groundY-30, w:34, h:30, opened:false}];
  // Miniboss nas fases 3, 6 e 9.
  miniBoss = ([2,5,8].includes(idx)) ? {x:Math.max(650,lvl.portalX-520),y:groundY-48,w:46,h:48,hp:3,maxHp:3,alive:true,invuln:0,dir:-1,baseX:Math.max(650,lvl.portalX-520),range:150} : null;
  // O Barão Sombra é o chefe verdadeiro da fase 10. O portal fica selado até derrotá-lo.
  boss = (idx === levels.length - 1) ? {
    x: Math.max(900, lvl.portalX - 420), y: groundY - 74, w:58, h:74,
    hp:8, maxHp:8, dir:-1, vx:0, invuln:0, attackTimer:120, phase:1, alive:true, active:false
  } : null;
  portalX = lvl.portalX;
  worldWidth = lvl.worldWidth;
  lastCheckpoint = null;
  player = {
    x: lvl.playerStart.x,
    y: lvl.playerStart.y,
    w: 34, h: 40,
    vx: 0, vy: 0,
    onGround: false,
    facing: 1,
    invuln: 0,
    squash: 1,
    starTimer: 0,
    wingTimer: 0,
    shield: false,
    doubleJumpUsed: false,
    gliding: false,
    walkPhase: 0,
    dustTimer: 0,
    hurtTimer: 0,
    attackTimer: 0,
    attackCooldown: 0,
    specialTimer: 0,
    specialCooldown: 0,
  };
  particles = [];
  state.camX = 0;
  state.paused = false;
  riddenPlatform = null;
  levelRunStats = {
    startScore: state.score,
    startClock: gameClock,
    gemsCollected: 0,
    totalGems: lvl.gems.length,
    deaths: 0,
    objectiveAtStart: !!(state.levelProgress[idx] && state.levelProgress[idx].objective),
  };
  levelDisplay.textContent = 'Fase ' + (idx+1) + (typeof ZECO_LEVEL_NAMES !== 'undefined' ? ' · ' + ZECO_LEVEL_NAMES[idx] : '');
  updatePowerupHUD();
}

function resetGame(startIndex) {
  state.score = 0;
  state.lives = 3;
  state.gemStreak = 0;
  state.objectives = 0;
  state.levelIndex = startIndex || 0;
  state.lastPlayedLevel = state.levelIndex;
  saveProgress();
  loadLevel(state.levelIndex);
  updateHUD();
}

function updateHUD() {
  scoreDisplay.textContent = '💎 ' + state.score;
  livesDisplay.textContent = '❤️ ' + state.lives;
  gemProgressDisplay.textContent = '💗 ' + state.gemStreak + '/100';
  const totalObjectives = state.levelProgress.filter(p => p.objective).length;
  objectiveDisplay.textContent = '🥈 ' + totalObjectives + '/' + levels.length;
  if (coinDisplay) coinDisplay.textContent = '🪙 ' + state.coins;
}

function updatePowerupHUD() {
  let html = '';
  if (player.starTimer > 0) html += '<span>⭐</span>';
  if (player.wingTimer > 0) html += '<span>🪽</span>';
  if (player.shield) html += '<span>🛡️</span>';
  powerupStatus.innerHTML = html;
}

// ---------- Colisão, física e regras do jogo ----------
// ---------- Collision helpers ----------
function rectsOverlap(a,b) {
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

// Todos os retângulos sólidos: chão, plataformas e caixas ainda inteiras.
// Chamada uma única vez por frame em update() (o resultado é reaproveitado
// na resolução de colisão X e Y) para não remontar a lista duas vezes.
function collidableRects() {
  const rects = [{x:-50,y:groundY,w:worldWidth+100,h:60, type:'ground'}];
  for (const p of platforms) rects.push({x:p.x,y:p.y,w:p.w,h:p.h, type:'platform', ref:p});
  for (const b of boxes) if (!b.broken) rects.push({x:b.x,y:b.y,w:b.w,h:b.h, type:'box', ref:b});
  return rects;
}

// Move as plataformas com propriedade `move` (vaivém senoidal) e guarda o
// deslocamento (dx/dy) deste frame, usado para "carregar" o jogador junto.
function updateMovingPlatforms() {
  const t = gameClock;
  for (const p of platforms) {
    if (!p.move) { p.dx = 0; p.dy = 0; continue; }
    const prevX = p.x, prevY = p.y;
    const offset = Math.sin(t * p.move.speed) * p.move.range;
    if (p.move.axis === 'y') p.y = p.baseY + offset;
    else p.x = p.baseX + offset;
    p.dx = p.x - prevX;
    p.dy = p.y - prevY;
  }
}

// Fase atual pode ter zonas de vento (empurram o jogador) e de gelo
// (reduzem o atrito no chão), definidas em fases.js.
function currentWindForce(playerBox) {
  const lvl = levels[state.levelIndex];
  if (!lvl.windZones) return 0;
  let force = 0;
  for (const wz of lvl.windZones) {
    if (rectsOverlap(playerBox, wz)) force += wz.strength;
  }
  return force;
}
function isOnIce(playerBox) {
  const lvl = levels[state.levelIndex];
  if (!lvl.iceZones) return false;
  for (const iz of lvl.iceZones) {
    if (playerBox.x + playerBox.w > iz.x && playerBox.x < iz.x + iz.w) return true;
  }
  return false;
}

function breakBox(box) {
  if (box.broken) return;
  box.broken = true;
  playBreak();
  spawnParticles(box.x+box.w/2, box.y+box.h/2, 12, {color:'#a9662f', speed:3.5, life:24, gravity:0.25, size:3});
  if (box.contents === 'coin') {
    state.score += 15;
    state.coins += 1;
    if (!state.unlockedThrow && state.coins >= 20) { state.unlockedThrow = true; spawnFloatText(player.x+player.w/2, player.y-18, 'ADAGA LIBERADA! C / ✦', '#fff1a8'); }
    saveProgress();
    playCoin();
    spawnParticles(box.x+box.w/2, box.y, 8, {color:'#ffd166', speed:2.5, life:20, gravity:-0.02, size:2.5});
    updateHUD();
  } else if (box.contents && box.contents.startsWith('powerup:')) {
    const type = box.contents.split(':')[1];
    activatePowerUp(type);
    playPowerUp();
    const colorMap = {star:'#ffd166', wing:'#a0e8ff', shield:'#8fe388'};
    spawnParticles(box.x+box.w/2, box.y, 14, {color: colorMap[type], speed:3, life:26, gravity:-0.02, size:3});
    updatePowerupHUD();
  }
}


function openDialogue(name, text) {
  if (!dialogueBox) return;
  dialogueOpen = true;
  clearInputState();
  dialogueName.textContent = name;
  dialogueText.textContent = text;
  if (dialoguePortrait) {
    let src = '';
    if (name === 'Mestre Tupi') src = 'assets/tupi/talk.png';
    else if (name === 'Lina, a Cartógrafa') src = 'assets/lina/talk.png';
    if (src) {
      dialoguePortrait.src = src;
      dialoguePortrait.classList.remove('hidden');
      dialogueBox.classList.add('hasPortrait');
    } else {
      dialoguePortrait.classList.add('hidden');
      dialogueBox.classList.remove('hasPortrait');
    }
  }
  dialogueBox.classList.remove('hidden');
}
function closeDialogue() {
  dialogueOpen = false;
  if (dialogueBox) {
    dialogueBox.classList.add('hidden');
    dialogueBox.classList.remove('hasPortrait');
  }
  if (dialoguePortrait) dialoguePortrait.classList.add('hidden');
  clearInputState();
}
if (dialogueNext) dialogueNext.addEventListener('click', closeDialogue);
document.addEventListener('keydown', e => {
  if (dialogueOpen && (e.key === 'Enter' || e.key === 'e' || e.key === 'E' || e.key === ' ')) {
    e.preventDefault(); closeDialogue();
  }
});

function updateBoss() {
  if (!boss || !boss.alive) return;
  // O chefe só entra em combate quando Zeco realmente chega à arena final.
  // Antes disso ele não dispara projéteis atravessando metade da fase.
  if (!boss.active) {
    if (player.x + player.w < boss.x - 520) return;
    boss.active = true;
    boss.attackTimer = 75;
    triggerShake(3);
    spawnFloatText(boss.x + boss.w/2, boss.y - 14, 'BARÃO SOMBRA!', '#e7c6ff');
  }
  if (boss.invuln > 0) boss.invuln--;
  boss.attackTimer--;
  const px = player.x + player.w/2;
  const bx = boss.x + boss.w/2;
  boss.dir = px < bx ? -1 : 1;
  const dist = Math.abs(px-bx);
  // Persegue o Zeco sem ficar impossível: duas fases de agressividade.
  boss.phase = boss.hp <= 4 ? 2 : 1;
  const speed = boss.phase === 2 ? 1.55 : 1.05;
  if (dist > 95) boss.x += Math.sign(px-bx) * speed;
  boss.x = Math.max(worldWidth-760, Math.min(boss.x, portalX-90));

  if (boss.attackTimer <= 0) {
    boss.attackTimer = boss.phase === 2 ? 70 : 105;
    const dx = px - bx, dy = (player.y+player.h/2) - (boss.y+boss.h/2);
    const len = Math.hypot(dx,dy)||1;
    bossProjectiles.push({x:bx,y:boss.y+26,vx:dx/len*(boss.phase===2?5.2:4.1),vy:dy/len*(boss.phase===2?5.2:4.1),life:180,r:7});
    spawnParticles(bx,boss.y+26,12,{color:'#b56cff',speed:2.8,life:25,gravity:0,size:2.5});
  }

  const bBox={x:boss.x,y:boss.y,w:boss.w,h:boss.h};
  if (player.attackTimer > 5 && boss.invuln===0) {
    const reach=50;
    const aBox=player.facing>0?{x:player.x+player.w-4,y:player.y+2,w:reach,h:player.h}:{x:player.x-reach+4,y:player.y+2,w:reach,h:player.h};
    if (rectsOverlap(aBox,bBox)) {
      boss.hp--; boss.invuln=24; boss.x += player.facing*18;
      state.score += 100; updateHUD(); triggerShake(7);
      spawnParticles(boss.x+boss.w/2,boss.y+28,20,{color:'#ffcf66',speed:4,life:28,gravity:0.08,size:3});
      spawnFloatText(boss.x+boss.w/2,boss.y-8,'-1','#ffd166');
      if (boss.hp<=0) {
        boss.alive=false;
        bossProjectiles = []; // nenhum tiro antigo pode atingir Zeco depois da vitória
        state.score+=1000; updateHUD(); playWin(); triggerShake(12);
        spawnParticles(boss.x+boss.w/2,boss.y+boss.h/2,50,{color:'#c48cff',speed:6,life:42,gravity:-0.02,size:4});
        spawnFloatText(boss.x+boss.w/2,boss.y-15,'BARÃO DERROTADO!','#fff1a8');
        openDialogue('Barão Sombra','Isso não termina aqui, Zeco... a ilha guarda segredos ainda mais antigos que eu.');
        return;
      }
    }
  }
  if (rectsOverlap(player,bBox) && player.invuln===0 && player.starTimer===0) {
    player.vx = px < bx ? -7 : 7;
    damagePlayer();
  }
}

function updateBossProjectiles() {
  for (let i=bossProjectiles.length-1;i>=0;i--) {
    const p=bossProjectiles[i]; p.x+=p.vx; p.y+=p.vy; p.life--;
    if (p.life<=0 || p.x<0 || p.x>worldWidth || p.y<0 || p.y>H+40) { bossProjectiles.splice(i,1); continue; }
    const pb={x:p.x-p.r,y:p.y-p.r,w:p.r*2,h:p.r*2};
    if (rectsOverlap(player,pb) && player.invuln===0 && player.starTimer===0) {
      bossProjectiles.splice(i,1); damagePlayer(); return;
    }
  }
}

function update() {
  if (!state.running || state.paused || dialogueOpen) return;

  updateMovingPlatforms();

  // Se o jogador estava em pé sobre uma plataforma móvel no fim do frame
  // anterior, aplica o deslocamento dela ANTES de qualquer outra física deste
  // frame. Fazer isso depois (junto com a resolução de colisão) causava o
  // jogador ser "empurrado" para o lado, porque a plataforma já tinha se
  // movido para a nova posição quando a colisão horizontal era checada.
  if (riddenPlatform) {
    player.x += riddenPlatform.dx;
    if (riddenPlatform.move.axis === 'y') player.y += riddenPlatform.dy;
  }

  const effMax = player.starTimer > 0 ? MAX_SPEED * 1.6 : MAX_SPEED;

  // Horizontal input
  if (keys['a'] || keys['arrowleft']) {
    player.vx -= MOVE_SPEED;
    player.facing = -1;
  }
  if (keys['d'] || keys['arrowright']) {
    player.vx += MOVE_SPEED;
    player.facing = 1;
  }

  // Vento da fase (se houver) empurra o jogador horizontalmente
  const wind = currentWindForce(player);
  if (wind !== 0) player.vx += wind;

  // Gelo reduz bastante o atrito, deixando o personagem escorregar
  const onIce = isOnIce(player) && player.onGround;
  player.vx *= onIce ? 0.97 : FRICTION;
  if (player.vx > effMax) player.vx = effMax;
  if (player.vx < -effMax) player.vx = -effMax;

  // Voo com asa: pulo normal + pulo duplo (toque) + planar (segurar)
  const jumpHeld = keys[' '] || keys['w'] || keys['arrowup'];
  const jumpPressed = jumpHeld && !jumpKeyPrev; // true só no frame em que o botão foi apertado (borda de subida)
  const attackHeld = !!(keys['x'] || keys['k']);
  const attackPressed = attackHeld && !attackKeyPrev;
  attackKeyPrev = attackHeld;
  if (player.attackCooldown > 0) player.attackCooldown--;
  if (player.attackTimer > 0) player.attackTimer--;
  if (attackPressed && player.attackCooldown <= 0) {
    player.attackTimer = 14;
    player.attackCooldown = 20;
    if (typeof playAttack === 'function') playAttack();
  }
  const specialHeld = !!(keys['c'] || keys['l']);
  if (player.specialCooldown > 0) player.specialCooldown--;
  if (player.specialTimer > 0) player.specialTimer--;
  if (specialHeld && !player._specialPrev && state.unlockedThrow && player.specialCooldown <= 0) {
    player.specialTimer = 18; player.specialCooldown = 45;
    specialProjectiles.push({x:player.x+player.w/2+player.facing*20,y:player.y+15,vx:player.facing*8,life:80,w:18,h:8});
    if (typeof playAttack === 'function') playAttack();
  }
  player._specialPrev = specialHeld;

  if (jumpPressed && player.onGround) {
    // Pulo normal a partir do chão
    player.vy = JUMP_FORCE;
    player.onGround = false;
    player.squash = 1.3;
    player.doubleJumpUsed = false;
    player.gliding = false;
    playJump(false);
    spawnParticles(player.x+player.w/2, player.y+player.h, 6, {color:'#fff', speed:2, life:16, gravity:0.05, size:2});
  } else if (jumpPressed && !player.onGround && player.wingTimer > 0 && !player.doubleJumpUsed) {
    // Pulo duplo: só dispara com um novo toque no botão (não segurando), e só com a asa ativa
    player.vy = JUMP_FORCE * 0.85;
    player.doubleJumpUsed = true;
    player.gliding = false;
    playJump(true);
    spawnParticles(player.x+player.w/2, player.y+player.h/2, 10, {color:'#a0e8ff', speed:3, life:20, gravity:0.05, size:2.5});
  }

  // Planar: com a asa ativa, no ar e caindo, segurar o botão de pulo reduz a
  // gravidade e limita a velocidade de queda, permitindo voar/planar por cima
  // de buracos e inimigos em vez de simplesmente cair. Funciona mesmo que o
  // pulo duplo já tenha sido usado.
  player.gliding = jumpHeld && !player.onGround && player.wingTimer > 0 && player.vy > 0;

  jumpKeyPrev = jumpHeld;

  if (player.gliding) {
    player.vy += GRAVITY * 0.15;
    if (player.vy > 1.8) player.vy = 1.8;
  } else {
    player.vy += GRAVITY;
    if (player.vy > 15) player.vy = 15;
  }

  const prevVy = player.vy;
  const prevOnGround = player.onGround;

  // Rects sólidos deste frame: montados uma única vez e reaproveitados nas
  // duas resoluções de colisão abaixo (X e Y), em vez de reconstruir a lista
  // duas vezes por frame.
  const rects = collidableRects();

  // Move X then resolve collisions
  player.x += player.vx;
  player.x = Math.max(0, Math.min(player.x, worldWidth - player.w));
  for (const r of rects) {
    if (r.type === 'box' && r.ref.broken) continue;
    if (rectsOverlap(player, r)) {
      if (player.vx > 0) player.x = r.x - player.w;
      else if (player.vx < 0) player.x = r.x + r.w;
    }
  }

  // Move Y then resolve collisions
  player.onGround = false;
  riddenPlatform = null;
  player.y += player.vy;
  for (const r of rects) {
    if (r.type === 'box' && r.ref.broken) continue;
    if (!rectsOverlap(player, r)) continue;
    if (player.vy > 0) {
      if (r.type === 'box') {
        player.y = r.y - player.h;
        breakBox(r.ref);
        player.vy = JUMP_FORCE * 0.45;
      } else {
        player.y = r.y - player.h;
        player.vy = 0;
        player.onGround = true;
        if (r.type === 'platform' && r.ref.move) riddenPlatform = r.ref;
      }
    } else if (player.vy < 0) {
      if (r.type === 'box') {
        player.y = r.y + r.h;
        breakBox(r.ref);
        player.vy = 1;
      } else {
        player.y = r.y + r.h;
        player.vy = 0;
      }
    }
  }

  // Poeira ao correr no chão
  if (player.onGround && Math.abs(player.vx) > 1.2) {
    player.dustTimer--;
    if (player.dustTimer <= 0) {
      spawnParticles(player.x + player.w/2 - player.facing*10, player.y + player.h - 2, 2,
        {color:'#e8d7b0', speed:0.8, life:18, gravity:0.05, size:2});
      player.dustTimer = 8;
    }
    player.walkPhase += Math.abs(player.vx) * 0.15;
  }

  // Poeira ao aterrissar
  if (!prevOnGround && player.onGround && prevVy > 6) {
    spawnParticles(player.x + player.w/2, player.y + player.h, 8, {color:'#e8d7b0', speed:2, life:16, gravity:0.1, size:2.5});
  }

  player.squash += (1 - player.squash) * 0.2;
  if (player.invuln > 0) player.invuln--;
  if (player.hurtTimer > 0) player.hurtTimer--;
  if (player.starTimer > 0) player.starTimer--;
  if (player.wingTimer > 0) player.wingTimer--;
  updatePowerupHUD();

  // Rastro de penas quando planando com a asa
  if (player.gliding && Math.random() < 0.4) {
    spawnParticles(player.x+player.w/2 - player.facing*12, player.y+8, 1,
      {color:'#a0e8ff', speed:0.6, life:24, gravity:0.02, size:2});
  }

  // Rastro de estrelinha quando invencível
  if (player.starTimer > 0 && Math.random() < 0.5) {
    spawnParticles(player.x+player.w/2, player.y+player.h/2, 1,
      {color: ['#ff5fa2','#ffd166','#7ee8fa'][Math.floor(Math.random()*3)], speed:1, life:22, gravity:-0.02, size:2.5});
  }

  updateParticles();
  updateFloatTexts();
  for (const cp of checkpoints) { if (cp.pulse > 0) cp.pulse = Math.max(0, cp.pulse - 0.045); }
  if (state.shake.timer > 0) state.shake.timer--;

  // Fall off world
  if (player.y > H + 100) {
    loseLife();
    return;
  }

  // Spikes
  for (const s of spikes) {
    if (rectsOverlap(player, s) && player.invuln === 0 && player.starTimer === 0) {
      damagePlayer();
      return;
    }
  }

  // Checkpoints — tocar na bandeira salva o ponto de reaparecimento na fase
  for (const cp of checkpoints) {
    if (!cp.active) {
      const cpBox = {x:cp.x-14, y:cp.y-40, w:28, h:40};
      if (rectsOverlap(player, cpBox)) {
        cp.active = true;
        cp.pulse = 1; // dispara o anel de energia expandindo no desenho
        lastCheckpoint = {x:cp.x - player.w/2, y:cp.y - player.h};
        playCheckpoint();
        triggerShake(2);
        spawnParticles(cp.x, cp.y-20, 18, {color:'#9be8ff', speed:3, life:26, gravity:-0.03, size:2.8, up:true});
        spawnParticles(cp.x, cp.y-40, 10, {color:'#fff8e0', speed:2, life:20, gravity:-0.02, size:2});
        spawnFloatText(cp.x, cp.y-56, 'Ponto salvo!', '#9be8ff');
      }
    }
  }


  // Diálogo contextual: aproximação do NPC pausa a ação e entrega história dentro da fase.
  if (npc && !npc.shown && Math.abs((player.x+player.w/2)-npc.x) < 62) {
    npc.shown = true;
    openDialogue(npc.name, npc.text);
    return;
  }

  // Gems
  for (const g of gems) {
    if (!g.taken) {
      const gemBox = {x:g.x-10,y:g.y-10,w:20,h:20};
      if (rectsOverlap(player, gemBox)) {
        g.taken = true;
        state.score += 10;
        playCoin();
        spawnParticles(g.x, g.y, 8, {color:'#ff5fa2', speed:2.5, life:22, gravity:0.08, size:2.5});
        state.gemStreak++;
        levelRunStats.gemsCollected++;
        if (state.gemStreak >= 100) {
          state.gemStreak -= 100;
          state.lives++;
          playExtraLife();
          spawnParticles(player.x+player.w/2, player.y+player.h/2, 24, {color:'#ff5fa2', speed:4, life:32, gravity:-0.05, size:3.5});
          triggerShake(3);
        }
        updateHUD();
      }
    }
  }

  // Gema de prata (objetivo da fase)
  if (silverGem && !silverGem.taken) {
    const sBox = {x:silverGem.x-16,y:silverGem.y-16,w:32,h:32};
    if (rectsOverlap(player, sBox)) {
      silverGem.taken = true;
      state.score += 100;
      if (!state.levelProgress[state.levelIndex].objective) state.objectives++;
      state.levelProgress[state.levelIndex].objective = true;
      saveProgress();
      playObjective();
      spawnParticles(silverGem.x, silverGem.y, 24, {color:'#e8eef2', speed:4, life:30, gravity:-0.02, size:3.5});
      triggerShake(3);
      updateHUD();
    }
  }

  // Power-ups (cristais)
  for (const pu of powerups) {
    if (!pu.taken) {
      const puBox = {x:pu.x-14,y:pu.y-14,w:28,h:28};
      if (rectsOverlap(player, puBox)) {
        pu.taken = true;
        activatePowerUp(pu.type);
        playPowerUp();
        const colorMap = {star:'#ffd166', wing:'#a0e8ff', shield:'#8fe388'};
        spawnParticles(pu.x, pu.y, 16, {color: colorMap[pu.type], speed:3.5, life:28, gravity:0.03, size:3});
        updatePowerupHUD();
      }
    }
  }

  // Enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    const archetype=e.archetype||'walker';
    if (archetype==='hopper') {
      e.x += e.dir*1.35; e.y = e.baseY - Math.abs(Math.sin(gameClock*2.6+e.baseX))*28;
    } else if (archetype==='charger') {
      const near=Math.abs(player.x-e.x)<180; e.x += e.dir*(near?3.0:1.1);
    } else if (archetype==='floater') {
      e.x += e.dir*1.45; e.y = e.baseY-38 + Math.sin(gameClock*2+e.baseX)*22;
    } else e.x += e.dir * 1.6;
    if (e.x > e.baseX + e.range) e.dir = -1;
    if (e.x < e.baseX - e.range) e.dir = 1;

    const eBox = {x:e.x-16,y:e.y-24,w:32,h:24};
    if (player.attackTimer > 5) {
      const reach = 38;
      const attackBox = player.facing > 0
        ? {x:player.x + player.w - 4, y:player.y + 5, w:reach, h:player.h - 8}
        : {x:player.x - reach + 4, y:player.y + 5, w:reach, h:player.h - 8};
      if (rectsOverlap(attackBox, eBox)) {
        e.alive = false;
        state.score += 30;
        playStomp();
        spawnParticles(e.x, e.y-12, 12, {color:'#ffd166', speed:3.2, life:22, gravity:0.1, size:3});
        spawnFloatText(e.x, e.y-36, '+30', '#ffd166');
        updateHUD();
        continue;
      }
    }
    if (rectsOverlap(player, eBox)) {
      const playerBottom = player.y + player.h;
      const stomping = player.vy > 0 && playerBottom - eBox.y < 18;
      if (stomping || player.starTimer > 0) {
        e.alive = false;
        if (stomping) player.vy = JUMP_FORCE * 0.6;
        state.score += 25;
        playStomp();
        spawnParticles(e.x, e.y-12, 10, {color:'#6b3fa0', speed:3, life:20, gravity:0.15, size:3});
        updateHUD();
      } else if (player.invuln === 0) {
        damagePlayer();
        return;
      }
    }
  }

  // Adaga arremessada (ataque especial do sprite throw).
  for (let i=specialProjectiles.length-1;i>=0;i--) {
    const p=specialProjectiles[i]; p.x+=p.vx; p.life--;
    let hit=false;
    const pb={x:p.x-p.w/2,y:p.y-p.h/2,w:p.w,h:p.h};
    for (const e of enemies) if(e.alive && rectsOverlap(pb,{x:e.x-16,y:e.y-24,w:32,h:24})) { e.alive=false; state.score+=40; hit=true; spawnParticles(e.x,e.y-14,12,{color:'#ffe08a',speed:3,life:20,gravity:.08,size:3}); break; }
    if (miniBoss && miniBoss.alive && rectsOverlap(pb,miniBoss) && miniBoss.invuln<=0) { miniBoss.hp--; miniBoss.invuln=18; hit=true; triggerShake(4); if(miniBoss.hp<=0){miniBoss.alive=false;state.score+=250;state.coins+=5;saveProgress();spawnFloatText(miniBoss.x,miniBoss.y-18,'MINIBOSS +5 🪙','#fff1a8');} }
    if(hit || p.life<=0 || p.x<0 || p.x>worldWidth) specialProjectiles.splice(i,1);
  }

  // Baús secretos: ataque corpo a corpo abre e entrega moedas permanentes.
  for (const c of chests) if(!c.opened) {
    const cb={x:c.x,y:c.y,w:c.w,h:c.h};
    if(player.attackTimer>5){ const reach=42; const ab=player.facing>0?{x:player.x+player.w-4,y:player.y+4,w:reach,h:player.h-6}:{x:player.x-reach+4,y:player.y+4,w:reach,h:player.h-6}; if(rectsOverlap(ab,cb)){c.opened=true;state.coins+=5;state.score+=75;if(!state.unlockedThrow&&state.coins>=20)state.unlockedThrow=true;saveProgress();updateHUD();spawnParticles(c.x+17,c.y,18,{color:'#ffd166',speed:4,life:28,gravity:.08,size:3});spawnFloatText(c.x+17,c.y-18,'+5 🪙','#ffd166');}}
  }

  // Minibosses regionais.
  if(miniBoss && miniBoss.alive){
    if(miniBoss.invuln>0) miniBoss.invuln--; miniBoss.dir=player.x<miniBoss.x?-1:1;
    miniBoss.x += miniBoss.dir*(Math.abs(player.x-miniBoss.x)<240?1.65:.7); miniBoss.x=Math.max(miniBoss.baseX-miniBoss.range,Math.min(miniBoss.x,miniBoss.baseX+miniBoss.range));
    const mb={x:miniBoss.x,y:miniBoss.y,w:miniBoss.w,h:miniBoss.h};
    if(player.attackTimer>5&&miniBoss.invuln<=0){const reach=46;const ab=player.facing>0?{x:player.x+player.w-4,y:player.y,w:reach,h:player.h}:{x:player.x-reach+4,y:player.y,w:reach,h:player.h};if(rectsOverlap(ab,mb)){miniBoss.hp--;miniBoss.invuln=20;triggerShake(5);spawnFloatText(miniBoss.x+20,miniBoss.y-8,'-1','#ffd166');if(miniBoss.hp<=0){miniBoss.alive=false;state.score+=250;state.coins+=5;saveProgress();updateHUD();spawnParticles(miniBoss.x+22,miniBoss.y+20,28,{color:'#ff9f43',speed:5,life:34,gravity:.1,size:4});}}}
    if(rectsOverlap(player,mb)&&player.invuln===0&&player.starTimer===0){damagePlayer();return;}
  }

  updateBoss();
  updateBossProjectiles();

  // Portal / win — na última fase só abre quando o Barão Sombra cair.
  if (player.x + player.w > portalX) {
    if (boss && boss.alive) {
      player.x = portalX - player.w - 4;
      player.vx = -3;
      spawnFloatText(portalX-45, groundY-95, 'Derrote o Barão Sombra!', '#ffd166');
    } else {
      nextLevel();
      return;
    }
  }

  // Camera
  state.camX = Math.max(0, Math.min(player.x - W/2 + player.w/2, worldWidth - W));
}

function activatePowerUp(type) {
  if (type === 'star') player.starTimer = STAR_FRAMES;
  else if (type === 'wing') { player.wingTimer = WING_FRAMES; player.doubleJumpUsed = false; }
  else if (type === 'shield') player.shield = true;
}

function damagePlayer() {
  if (player.shield) {
    player.shield = false;
    player.invuln = 60;
    player.hurtTimer = 16;
    updatePowerupHUD();
    playHurt();
    spawnParticles(player.x+player.w/2, player.y+player.h/2, 14, {color:'#8fe388', speed:3, life:24, gravity:0.1, size:3});
    triggerShake(4);
    return;
  }
  loseLife();
}

function triggerShake(amount) {
  state.shake.timer = 12;
  state.shake.amount = amount;
}

function loseLife() {
  state.lives--;
  levelRunStats.deaths++;
  player.hurtTimer = 18;
  playHurt();
  triggerShake(6);
  spawnParticles(player.x+player.w/2, player.y+player.h/2, 14, {color:'#e63946', speed:3.5, life:26, gravity:0.1, size:3});
  updateHUD();
  if (state.lives <= 0) {
    gameOver(false);
  } else {
    // Reaparece no último checkpoint tocado nesta fase, se houver, em vez de
    // sempre voltar para o início inteiro da fase.
    const respawn = lastCheckpoint || levels[state.levelIndex].playerStart;
    player.x = respawn.x;
    player.y = respawn.y;
    player.vx = 0; player.vy = 0;
    player.invuln = 60;
    riddenPlatform = null; // evita aplicar o deslocamento da plataforma antiga logo após o respawn
  }
}

function formatRunTime(seconds) {
  const total = Math.max(0, Math.round(seconds));
  const min = Math.floor(total / 60);
  const sec = total % 60;
  return min + ':' + String(sec).padStart(2, '0');
}

function showLevelComplete(finishedIndex) {
  state.running = false;
  clearInputState();

  const totalGems = levelRunStats.totalGems || 0;
  const gemsGot = Math.min(levelRunStats.gemsCollected, totalGems);
  const gemRatio = totalGems ? gemsGot / totalGems : 1;
  const secretFound = !!(state.levelProgress[finishedIndex] && state.levelProgress[finishedIndex].objective);
  const secretNew = secretFound && !levelRunStats.objectiveAtStart;
  const elapsed = Math.max(0, gameClock - levelRunStats.startClock);
  const levelPoints = Math.max(0, state.score - levelRunStats.startScore);

  // 1 estrela por concluir, +1 pela exploração, +1 pelo segredo da fase.
  const stars = 1 + (gemRatio >= 0.70 ? 1 : 0) + (secretFound ? 1 : 0);
  const bonus = (stars * 100) + (levelRunStats.deaths === 0 ? 150 : 0) + (secretNew ? 100 : 0);
  state.score += bonus;
  updateHUD();

  lastCompleteResult = { finishedIndex, stars, bonus, elapsed, gemsGot, totalGems, secretFound, levelPoints, deaths:levelRunStats.deaths };

  overlay.classList.remove('hidden');
  if (typeof hideAllScreens === 'function') hideAllScreens();
  else {
    [screenMenu, screenHowTo, screenEnd, screenLevelSelect].forEach(el => el && el.classList.add('hidden'));
  }
  screenLevelComplete.classList.remove('hidden');

  completeChapter.textContent = 'CAPÍTULO ' + (finishedIndex + 1) + ' CONCLUÍDO';
  completeTitle.textContent = (typeof ZECO_LEVEL_NAMES !== 'undefined' && ZECO_LEVEL_NAMES[finishedIndex]) || ('Fase ' + (finishedIndex + 1));
  completeGemStat.textContent = gemsGot + '/' + totalGems;
  completeSecretStat.textContent = secretFound ? 'Encontrado' : 'Não';
  completeTimeStat.textContent = formatRunTime(elapsed);
  completeLivesStat.textContent = Math.max(0, state.lives);
  completeScoreStat.textContent = levelPoints;
  completeBonusStat.textContent = '+' + bonus;

  const starEls = completeStars ? [...completeStars.querySelectorAll('span')] : [];
  starEls.forEach((el, i) => {
    el.textContent = i < stars ? '★' : '☆';
    el.classList.toggle('earned', i < stars);
  });
  completeGemGoal.classList.toggle('done', gemRatio >= 0.70);
  completeSecretGoal.classList.toggle('done', secretFound);

  const finalLevel = finishedIndex >= levels.length - 1;
  completeNextBtn.textContent = finalLevel ? 'Ver Epílogo ▶' : 'Próxima Região ▶';
  saveProgress();
  if (state.score > state.bestScore) {
    state.bestScore = state.score;
    saveProgress();
    updateBestScoreDisplay();
  }
}

function nextLevel() {
  const finishedIndex = state.levelIndex;
  state.levelProgress[finishedIndex].completed = true;
  // "Continuar" deve apontar para a próxima fase liberada, não para a fase já concluída.
  state.lastPlayedLevel = Math.max(state.lastPlayedLevel, Math.min(finishedIndex + 1, levels.length - 1));
  saveProgress();
  playWin();
  triggerShake(3);
  spawnParticles(player.x + player.w/2, player.y + player.h/2, 22, {color:'#ffd166', speed:4, life:34, gravity:-0.03, size:3.5});
  showLevelComplete(finishedIndex);
}

if (completeNextBtn) completeNextBtn.addEventListener('click', () => {
  if (!lastCompleteResult) return;
  const idx = lastCompleteResult.finishedIndex;
  if (idx >= levels.length - 1) {
    screenLevelComplete.classList.add('hidden');
    gameOver(true);
  } else if (typeof showLevelTransition === 'function') {
    showLevelTransition(idx + 1, true);
  } else {
    state.levelIndex = idx + 1;
    loadLevel(state.levelIndex);
    state.running = true;
    overlay.classList.add('hidden');
  }
});

if (completeReplayBtn) completeReplayBtn.addEventListener('click', () => {
  if (!lastCompleteResult) return;
  const idx = lastCompleteResult.finishedIndex;
  // Repetir a fase começa uma tentativa limpa para que estrelas/tempo sejam comparáveis.
  resetGame(idx);
  clearInputState();
  overlay.classList.add('hidden');
  screenLevelComplete.classList.add('hidden');
  state.running = true;
  state.paused = false;
});

if (completeMapBtn) completeMapBtn.addEventListener('click', () => {
  screenLevelComplete.classList.add('hidden');
  const mapButton = document.getElementById('islandMapBtn');
  if (mapButton) mapButton.click();
  else if (typeof openLevelSelect === 'function') openLevelSelect({continueRun:false, justCompletedIndex:null});
});

function gameOver(won) {
  state.running = false;
  state.lastWon = won; // usado pelo botão "Jogar Novamente"/"Tentar Novamente" pra saber de onde reiniciar
  if (state.score > state.bestScore) state.bestScore = state.score;
  saveProgress();
  updateBestScoreDisplay();
  overlay.classList.remove('hidden');
  screenMenu.classList.add('hidden');
  screenHowTo.classList.add('hidden');
  screenLevelSelect.classList.add('hidden');
  screenEnd.classList.remove('hidden');
  if (won) {
    playWin();
    overlayTitle.textContent = '🏆 Você venceu!';
    const epilogue = (typeof ZECO_STORY !== 'undefined') ? ZECO_STORY[ZECO_STORY.length - 1].text : 'Zeco recuperou todas as gemas e salvou a ilha!';
    overlayText.textContent = epilogue + ' Pontuação final: ' + state.score;
    startBtn.textContent = 'Jogar Novamente';
  } else {
    playGameOver();
    overlayTitle.textContent = '💀 Fim de Jogo';
    overlayText.textContent = 'O Barão Sombra venceu desta vez... Pontuação final: ' + state.score;
    startBtn.textContent = 'Tentar Novamente';
  }
}

// ---------- Desenho ----------
// ---------- Drawing ----------
// Paletas por cenário/tema de fase. 'ilha' é o visual original (dia); os
// demais são usados pelas fases novas para dar uma cara diferente a cada uma.
// Além do céu/colina/chão, cada tema agora define a paleta de plataformas,
// caixas, espinhos, inimigos, núcleo do portal e o tipo de decoração de
// cenário (coqueiro, gelo, nuvem, cristal, ruína ou rocha vulcânica), para
// que cada fase tenha uma cara realmente própria e nada fique "genérico".
const THEMES = {
  ilha: {
    skyTop:'#7ec8e3', skyBot:'#c9e8d8', hill:'#8fc99b', ground:'#8c5a2b', grass:'#4caf50', grassDark:'#3f9c4a', sun:true,
    decoration:'palm',
    platform:'#a9662f', platformTop:'#5fbf6e', platformMove:'#c98a3f', platformMoveTop:'#7fd98f',
    box:'#b5772f', boxOutline:'#5c3a15',
    spike:'#c94c4c', spikeDark:'#8f2f2f',
    enemy:'#6b3fa0', enemyDark:'#4a2a70',
    portalCore:['#fff8e0','#ffe27a','#ffb703'],
  },
  gelo: {
    skyTop:'#8fb8e8', skyBot:'#dbeeff', hill:'#c7dff0', ground:'#7f8fa6', grass:'#eaf6ff', grassDark:'#cfe9ff', sun:true,
    decoration:'ice',
    platform:'#7f95ab', platformTop:'#eaf6ff', platformMove:'#9fb8d1', platformMoveTop:'#ffffff',
    box:'#6f8ba3', boxOutline:'#334a5c',
    spike:'#bfe8ff', spikeDark:'#6fa8cf',
    enemy:'#3f6f9a', enemyDark:'#274a68',
    portalCore:['#eaffff','#a8e8ff','#4fb3ff'],
  },
  vento: {
    skyTop:'#6fa8c9', skyBot:'#d7ece0', hill:'#7fb08f', ground:'#8c5a2b', grass:'#59b06a', grassDark:'#3f9c4a', sun:true,
    decoration:'cloud',
    platform:'#8a7a63', platformTop:'#a9d98f', platformMove:'#a89778', platformMoveTop:'#c3ecac',
    box:'#8a6a45', boxOutline:'#4a3320',
    spike:'#d9a34c', spikeDark:'#a3702a',
    enemy:'#4a7a9a', enemyDark:'#2f5570',
    portalCore:['#eafcff','#bfe8ff','#5fb8e0'],
  },
  noite: {
    skyTop:'#1b1140', skyBot:'#3a2a63', hill:'#241a45', ground:'#3a2c55', grass:'#5a3f86', grassDark:'#46316b', sun:false,
    decoration:'crystal',
    platform:'#4a3a6b', platformTop:'#8a6fd6', platformMove:'#5d4a85', platformMoveTop:'#a98cf0',
    box:'#3d2f5c', boxOutline:'#201735',
    spike:'#9b7ad6', spikeDark:'#5f4590',
    enemy:'#2f2050', enemyDark:'#1a1230',
    portalCore:['#e8dcff','#b083ff','#6b3fa0'],
  },
  praia: {
    skyTop:'#ff9d5c', skyBot:'#ffe0b3', hill:'#f4a261', ground:'#e9c46a', grass:'#f4a261', grassDark:'#e08c3e', sun:true,
    decoration:'palm',
    platform:'#d99a4e', platformTop:'#f4c869', platformMove:'#e8b169', platformMoveTop:'#ffe08c',
    box:'#c9853f', boxOutline:'#6b4620',
    spike:'#e0703f', spikeDark:'#a34a26',
    enemy:'#3a7a6f', enemyDark:'#22503f',
    portalCore:['#fff3d0','#ffcf7a','#ff9d3f'],
  },
  ruinas: {
    skyTop:'#4b3b6b', skyBot:'#8677a8', hill:'#5c4a7a', ground:'#463a5c', grass:'#8b7ab8', grassDark:'#6b5a94', sun:false,
    decoration:'ruinCol',
    platform:'#5c4a7a', platformTop:'#a897d6', platformMove:'#6f5c8f', platformMoveTop:'#c3b3ef',
    box:'#4a3a63', boxOutline:'#241c3a',
    spike:'#9b7ad6', spikeDark:'#5f4590',
    enemy:'#5a3f86', enemyDark:'#382860',
    portalCore:['#e8dcff','#b89bdd','#7b5fb0'],
  },
  lava: {
    skyTop:'#2a0a0a', skyBot:'#8b2500', hill:'#5c1a0a', ground:'#2b0f0a', grass:'#ff5522', grassDark:'#cc3d10', sun:false,
    decoration:'rock',
    platform:'#3a1a10', platformTop:'#ff6a33', platformMove:'#4a2418', platformMoveTop:'#ff8c4f',
    box:'#4a2010', boxOutline:'#1a0a05',
    spike:'#ff7733', spikeDark:'#b8431a',
    enemy:'#8a2a10', enemyDark:'#4f1608',
    portalCore:['#fff3c4','#ff8c3f','#ff3b1f'],
  },
  ceu: {
    skyTop:'#5ec8f2', skyBot:'#eaf7ff', hill:'#bfe3f7', ground:'#dcecf7', grass:'#ffffff', grassDark:'#dceefc', sun:true,
    decoration:'cloud',
    platform:'#bcd8ec', platformTop:'#ffffff', platformMove:'#cfe6f5', platformMoveTop:'#ffffff',
    box:'#a8cbe3', boxOutline:'#5f8aa8',
    spike:'#cfe6f5', spikeDark:'#7fa8c9',
    enemy:'#5f9ac9', enemyDark:'#3c6a90',
    portalCore:['#ffffff','#cbe8ff','#7fc4ff'],
  },
  lendaria: {
    skyTop:'#2b1055', skyBot:'#7b2ff7', hill:'#4a2080', ground:'#8a5a1e', grass:'#c9a3ff', grassDark:'#9b6fd6', sun:false,
    decoration:'crystal',
    platform:'#6a4a1e', platformTop:'#c9a3ff', platformMove:'#7f5c2c', platformMoveTop:'#e0c2ff',
    box:'#5a3a1e', boxOutline:'#2e1c10',
    spike:'#c9a3ff', spikeDark:'#8a5fd6',
    enemy:'#7b2ff7', enemyDark:'#4a1a99',
    portalCore:['#fff3ff','#e0b3ff','#a35fff'],
  },
};
function currentTheme() {
  return THEMES[levels[state.levelIndex].theme || 'ilha'];
}

// Converte '#rrggbb' em "r,g,b" para uso em rgba(...) dinâmico com as cores
// de cada tema (brilho do portal, fagulhas, etc).
function hexToRgb(hex) {
  const h = hex.replace('#','');
  const r = parseInt(h.substring(0,2),16);
  const g = parseInt(h.substring(2,4),16);
  const b = parseInt(h.substring(4,6),16);
  return `${r},${g},${b}`;
}

function drawBackground() {
  const theme = currentTheme();
  const grad = ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, theme.skyTop);
  grad.addColorStop(1, theme.skyBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,W,H);

  if (theme.sun) {
    // sol
    const sunGrad = ctx.createRadialGradient(680,70,5,680,70,70);
    sunGrad.addColorStop(0,'rgba(255,244,190,0.95)');
    sunGrad.addColorStop(1,'rgba(255,244,190,0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(680,70,70,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.arc(680,70,26,0,Math.PI*2);
    ctx.fill();
  } else {
    // lua + estrelas (cenário noturno)
    const moonGrad = ctx.createRadialGradient(680,70,5,680,70,55);
    moonGrad.addColorStop(0,'rgba(230,230,255,0.9)');
    moonGrad.addColorStop(1,'rgba(230,230,255,0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath(); ctx.arc(680,70,55,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#f4f4ff';
    ctx.beginPath(); ctx.arc(680,70,22,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i=0;i<40;i++) {
      const sx = (i*97) % W;
      const sy = (i*53) % 220;
      const tw = 0.5 + 0.5*Math.sin((gameClock*1000)/500 + i);
      ctx.globalAlpha = 0.3 + tw*0.5;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  // pássaros (só de dia)
  if (theme.sun) {
    ctx.strokeStyle = 'rgba(60,40,70,0.5)';
    ctx.lineWidth = 2;
    const t = (gameClock*1000)/1000;
    for (let i=0;i<3;i++) {
      const bx = ((t*30 + i*180) % (W+100)) - 50;
      const by = 50 + i*22 + Math.sin(t*2+i)*5;
      ctx.beginPath();
      ctx.moveTo(bx-8,by); ctx.quadraticCurveTo(bx-4,by-6,bx,by);
      ctx.quadraticCurveTo(bx+4,by-6,bx+8,by);
      ctx.stroke();
    }
  }

  // nuvens parallax
  ctx.save();
  ctx.translate(-state.camX * 0.3, 0);
  ctx.fillStyle = theme.sun ? 'rgba(255,255,255,0.8)' : 'rgba(180,180,220,0.25)';
  for (let i=0;i<16;i++) {
    const cx = i*260 + 80;
    ctx.beginPath();
    ctx.ellipse(cx,80,40,20,0,0,Math.PI*2);
    ctx.ellipse(cx+30,70,30,18,0,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();

  // colinas + coqueiros parallax
  ctx.save();
  ctx.translate(-state.camX * 0.6, 0);
  ctx.fillStyle = theme.hill;
  for (let i=0;i<20;i++) {
    const hx = i*220;
    ctx.beginPath();
    ctx.moveTo(hx, H);
    ctx.quadraticCurveTo(hx+110, H-140, hx+220, H);
    ctx.fill();
  }
  for (let i=0;i<14;i++) {
    const px = i*300 + 150;
    const py = H-150;
    drawSceneryDecoration(theme, px, py, i);
  }
  ctx.restore();
}

// Decoração de fundo (colinas) que muda de acordo com o tema da fase, no
// lugar de sempre desenhar coqueiros tropicais em todo cenário.
function drawSceneryDecoration(theme, px, py, i) {
  const kind = theme.decoration || 'palm';
  if (kind === 'palm') {
    // Coqueiro: tronco curvo + folhas em leque
    ctx.strokeStyle = theme.sun ? '#6b4226' : '#2b2040';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(px, py+70);
    ctx.quadraticCurveTo(px+10, py+30, px+4, py);
    ctx.stroke();
    ctx.fillStyle = theme.sun ? '#4a9d5c' : '#4a3d78';
    for (let j=0;j<5;j++) {
      const ang = (j/5)*Math.PI*2;
      ctx.beginPath();
      ctx.ellipse(px+4+Math.cos(ang)*14, py+Math.sin(ang)*8, 14, 6, ang, 0, Math.PI*2);
      ctx.fill();
    }
  } else if (kind === 'ice') {
    // Pico de gelo: triângulo cristalino com faceta clara
    ctx.fillStyle = '#bcdcf0';
    ctx.beginPath();
    ctx.moveTo(px-16, py+70); ctx.lineTo(px+2, py-10); ctx.lineTo(px+20, py+70);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath();
    ctx.moveTo(px+2, py-10); ctx.lineTo(px+8, py+70); ctx.lineTo(px+20, py+70);
    ctx.closePath(); ctx.fill();
  } else if (kind === 'cloud') {
    // Ilhota de nuvem sólida flutuando
    const bob = Math.sin((gameClock*1000)/900 + i) * 4;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.ellipse(px, py+30+bob, 34, 14, 0, 0, Math.PI*2);
    ctx.ellipse(px+20, py+22+bob, 22, 12, 0, 0, Math.PI*2);
    ctx.ellipse(px-18, py+24+bob, 20, 11, 0, 0, Math.PI*2);
    ctx.fill();
  } else if (kind === 'crystal') {
    // Cristal roxo brilhante saindo do chão
    const glow = 0.5 + Math.sin((gameClock*1000)/500 + i) * 0.3;
    ctx.save();
    ctx.shadowColor = theme.spike;
    ctx.shadowBlur = 12*glow;
    ctx.fillStyle = theme.spike;
    ctx.beginPath();
    ctx.moveTo(px, py-30); ctx.lineTo(px+12, py+45); ctx.lineTo(px-12, py+45);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(px, py-30); ctx.lineTo(px+4, py+45); ctx.lineTo(px-2, py+10);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  } else if (kind === 'ruinCol') {
    // Coluna de pedra quebrada
    ctx.fillStyle = '#6f5f8f';
    ctx.fillRect(px-9, py-20, 18, 90);
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fillRect(px-9, py-20, 6, 90);
    ctx.fillStyle = '#8577a8';
    ctx.fillRect(px-13, py-24, 26, 8);
    // topo quebrado (irregular)
    ctx.beginPath();
    ctx.moveTo(px-9, py-20); ctx.lineTo(px-2, py-32); ctx.lineTo(px+5, py-18); ctx.lineTo(px+9, py-20);
    ctx.closePath(); ctx.fill();
  } else if (kind === 'rock') {
    // Espinhaço de rocha vulcânica com brilho de lava no topo
    ctx.fillStyle = '#241008';
    ctx.beginPath();
    ctx.moveTo(px-18, py+70); ctx.lineTo(px-2, py-24); ctx.lineTo(px+16, py+70);
    ctx.closePath(); ctx.fill();
    const glow = 0.5 + Math.sin((gameClock*1000)/400 + i) * 0.4;
    ctx.fillStyle = `rgba(255,110,40,${(0.5+glow*0.4).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(px-2, py-22, 5+glow*2, 0, Math.PI*2);
    ctx.fill();
  }
}

// ---------- Gemas e cristais ----------
// Desenha uma gema com corte de brilhante (6 facetas ao redor de um ponto
// central, luz simulada vindo de cima-direita) + aresta desenhada por cima.
// shades = {bright, light, mid, dark, edge}
function drawFacetedGem(w, h, shades) {
  const top={x:0,y:-h};
  const upR={x:w*0.62,y:-h*0.38};
  const loR={x:w,y:h*0.12};
  const bottom={x:0,y:h};
  const loL={x:-w,y:h*0.12};
  const upL={x:-w*0.62,y:-h*0.38};
  const c={x:0,y:0};
  function tri(p1,p2,color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(c.x,c.y); ctx.lineTo(p1.x,p1.y); ctx.lineTo(p2.x,p2.y);
    ctx.closePath(); ctx.fill();
  }
  // Seis facetas em leque, alternando tons pra simular reflexo de luz girando.
  tri(top, upR, shades.bright);
  tri(upR, loR, shades.light);
  tri(loR, bottom, shades.mid);
  tri(bottom, loL, shades.dark);
  tri(loL, upL, shades.mid);
  tri(upL, top, shades.light);

  // "Mesa" central (faceta de topo achatada), característica de gema lapidada
  ctx.fillStyle = shades.bright;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.moveTo(top.x,top.y*0.35); ctx.lineTo(upR.x*0.5,upR.y*0.6);
  ctx.lineTo(loR.x*0.35,loR.y*1.6); ctx.lineTo(loL.x*0.35,loL.y*1.6); ctx.lineTo(upL.x*0.5,upL.y*0.6);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = shades.edge || 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(top.x,top.y); ctx.lineTo(upR.x,upR.y); ctx.lineTo(loR.x,loR.y);
  ctx.lineTo(bottom.x,bottom.y); ctx.lineTo(loL.x,loL.y); ctx.lineTo(upL.x,upL.y);
  ctx.closePath();
  ctx.moveTo(c.x,c.y); ctx.lineTo(top.x,top.y);
  ctx.moveTo(c.x,c.y); ctx.lineTo(upR.x,upR.y);
  ctx.moveTo(c.x,c.y); ctx.lineTo(loR.x,loR.y);
  ctx.moveTo(c.x,c.y); ctx.lineTo(bottom.x,bottom.y);
  ctx.moveTo(c.x,c.y); ctx.lineTo(loL.x,loL.y);
  ctx.moveTo(c.x,c.y); ctx.lineTo(upL.x,upL.y);
  ctx.stroke();
}

// Aglomerado de cristal (cristal principal + 2 lascas menores ao lado),
// usado nos power-ups pra parecer um cristal bruto crescendo do chão/ar,
// em vez de uma simples gema lapidada — reforça que é um item diferente.
function drawCrystalCluster(w, h, shades) {
  ctx.save();
  ctx.translate(-w*0.62, h*0.28);
  ctx.rotate(-0.35);
  drawFacetedGem(w*0.42, h*0.5, shades);
  ctx.restore();
  ctx.save();
  ctx.translate(w*0.6, h*0.32);
  ctx.rotate(0.3);
  drawFacetedGem(w*0.38, h*0.42, shades);
  ctx.restore();
  drawFacetedGem(w, h, shades);
}

// Brilho piscante em forma de "+" — o clássico glint de gema de jogo.
function drawGemGlint(x, y, size, alpha, color='#ffffff') {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(x-size, y); ctx.lineTo(x+size, y);
  ctx.moveTo(x, y-size); ctx.lineTo(x, y+size);
  ctx.stroke();
  ctx.restore();
}

// Flare de 4 pontas maior, usado nos momentos de brilho mais forte (gema de
// prata) — como o "lens flare" de luz forte batendo numa gema de RPG.
function drawStarFlare(x, y, size, alpha, color='#ffffff') {
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y-size); ctx.lineTo(x+size*0.16, y-size*0.16);
  ctx.lineTo(x+size, y); ctx.lineTo(x+size*0.16, y+size*0.16);
  ctx.lineTo(x, y+size); ctx.lineTo(x-size*0.16, y+size*0.16);
  ctx.lineTo(x-size, y); ctx.lineTo(x-size*0.16, y-size*0.16);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = alpha*0.6;
  ctx.beginPath();
  ctx.moveTo(x, y-size*1.6); ctx.lineTo(x, y+size*1.6);
  ctx.moveTo(x-size*1.6, y); ctx.lineTo(x+size*1.6, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

// Ícone gravado dentro do cristal de power-up, no lugar do emoji solto.
function drawPowerupGlyph(type) {
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#ffffff';
  if (type === 'star') {
    ctx.beginPath();
    for (let i=0;i<5;i++) {
      const ang = -Math.PI/2 + i*(Math.PI*2/5);
      const ang2 = ang + Math.PI/5;
      const xo = Math.cos(ang)*7, yo = Math.sin(ang)*7;
      const xi = Math.cos(ang2)*3, yi = Math.sin(ang2)*3;
      if (i===0) ctx.moveTo(xo,yo); else ctx.lineTo(xo,yo);
      ctx.lineTo(xi,yi);
    }
    ctx.closePath(); ctx.fill();
  } else if (type === 'wing') {
    ctx.beginPath(); ctx.ellipse(-4,0,6,3,-0.4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(4,0,6,3,0.4,0,Math.PI*2); ctx.fill();
  } else if (type === 'shield') {
    ctx.beginPath();
    ctx.moveTo(0,-7);
    ctx.quadraticCurveTo(7,-5,7,-1);
    ctx.quadraticCurveTo(7,5,0,8);
    ctx.quadraticCurveTo(-7,5,-7,-1);
    ctx.quadraticCurveTo(-7,-5,0,-7);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function drawGround() {
  ctx.save();
  ctx.translate(-state.camX, 0);
  const theme = currentTheme();

  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, groundY, worldWidth, 60);
  ctx.fillStyle = theme.grass;
  ctx.fillRect(0, groundY, worldWidth, 14);
  ctx.fillStyle = theme.grassDark;
  for (let gx=0; gx<worldWidth; gx+=18) {
    ctx.beginPath();
    ctx.moveTo(gx, groundY+2);
    ctx.lineTo(gx+4, groundY-6);
    ctx.lineTo(gx+8, groundY+2);
    ctx.fill();
  }

  // zonas de gelo: trecho de chão translúcido azulado + brilho
  const lvl = levels[state.levelIndex];
  if (lvl.iceZones) {
    for (const iz of lvl.iceZones) {
      ctx.fillStyle = 'rgba(190,230,255,0.55)';
      ctx.fillRect(iz.x, groundY, iz.w, 14);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = 1.5;
      for (let k=0;k<iz.w;k+=22) {
        ctx.beginPath();
        ctx.moveTo(iz.x+k, groundY+2);
        ctx.lineTo(iz.x+k+10, groundY+10);
        ctx.stroke();
      }
    }
  }
  // zonas de vento: riscos horizontais animados indicando a direção do vento
  if (lvl.windZones) {
    const t = (gameClock*1000)/1000;
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    for (const wz of lvl.windZones) {
      const dir = wz.strength >= 0 ? 1 : -1;
      for (let i=0;i<6;i++) {
        const rowY = wz.y + 20 + i*((wz.h-40)/6);
        const phase = (t*160*dir + i*70) % (wz.w+80) - 40;
        const sx = wz.x + ((phase % wz.w) + wz.w) % wz.w;
        ctx.beginPath();
        ctx.moveTo(sx, rowY);
        ctx.lineTo(sx + 26*dir, rowY);
        ctx.stroke();
      }
    }
  }

  for (const p of platforms) {
    ctx.fillStyle = p.move ? theme.platformMove : theme.platform;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = p.move ? theme.platformMoveTop : theme.platformTop;
    ctx.fillRect(p.x, p.y, p.w, 6);
  }

  // bandeiras de checkpoint (poste com ponteira, pano ondulando, aura e
  // anel de energia que se expande no instante em que é ativado)
  for (const cp of checkpoints) {
    const t = gameClock*1000;
    const topY = cp.y - 46;

    // anel de ativação (toca uma vez, expande e some)
    if (cp.pulse > 0) {
      const r = (1-cp.pulse) * 46;
      ctx.strokeStyle = `rgba(155,232,255,${cp.pulse.toFixed(2)})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y-20, 10+r, 0, Math.PI*2);
      ctx.stroke();
    }

    // base do poste
    ctx.fillStyle = '#5c3a1f';
    ctx.beginPath();
    ctx.ellipse(cp.x, cp.y+2, 9, 3.5, 0, 0, Math.PI*2);
    ctx.fill();

    // poste (com leve gradiente pra dar volume)
    const poleGrad = ctx.createLinearGradient(cp.x-2, 0, cp.x+2, 0);
    poleGrad.addColorStop(0, '#5c3a1f');
    poleGrad.addColorStop(0.5, '#8a5a30');
    poleGrad.addColorStop(1, '#5c3a1f');
    ctx.strokeStyle = poleGrad;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cp.x, cp.y);
    ctx.lineTo(cp.x, topY);
    ctx.stroke();

    // ponteira
    ctx.fillStyle = cp.active ? '#ffe9a8' : '#b8b8b8';
    ctx.beginPath();
    ctx.arc(cp.x, topY-3, 3.5, 0, Math.PI*2);
    ctx.fill();

    // pano da bandeira, ondulando (mais forte quando ativa)
    const waveAmp = cp.active ? 3 : 1.3;
    const wave = (i) => Math.sin(t/260 + i*0.9) * waveAmp;
    ctx.fillStyle = cp.active ? '#5fe0a0' : '#c9c9c9';
    ctx.beginPath();
    ctx.moveTo(cp.x, topY+2);
    ctx.lineTo(cp.x+20, topY+6+wave(0));
    ctx.lineTo(cp.x+15, topY+12+wave(1));
    ctx.lineTo(cp.x+20, topY+18+wave(2));
    ctx.lineTo(cp.x, topY+22);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = cp.active ? '#bff7dd' : '#e7e7e7';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cp.x, topY+3);
    ctx.lineTo(cp.x+19, topY+7+wave(0));
    ctx.stroke();

    if (cp.active) {
      // aura pulsante suave em volta do checkpoint
      const glow = 0.5 + Math.sin(t/300)*0.25;
      ctx.fillStyle = `rgba(95,224,160,${(0.18*glow).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(cp.x, cp.y-20, 24, 0, Math.PI*2);
      ctx.fill();
      // faíscas cintilando ao redor do poste
      for (let i=0;i<3;i++) {
        const ang = t/700 + i*(Math.PI*2/3);
        const sx = cp.x + Math.cos(ang)*16;
        const sy = cp.y-24 + Math.sin(ang)*14;
        const tw = 0.35 + Math.max(0, Math.sin(t/220 + i*2))*0.65;
        ctx.fillStyle = `rgba(191,247,221,${tw.toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.6, 0, Math.PI*2);
        ctx.fill();
      }
    }
  }

  // caixas quebráveis
  for (const b of boxes) {
    if (b.broken) continue;
    ctx.fillStyle = theme.box;
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = theme.boxOutline;
    ctx.lineWidth = 2;
    ctx.strokeRect(b.x+1.5, b.y+1.5, b.w-3, b.h-3);
    ctx.beginPath();
    ctx.moveTo(b.x+4, b.y+4); ctx.lineTo(b.x+b.w-4, b.y+b.h-4);
    ctx.moveTo(b.x+b.w-4, b.y+4); ctx.lineTo(b.x+4, b.y+b.h-4);
    ctx.stroke();
    if (b.contents && b.contents.startsWith('powerup:')) {
      ctx.fillStyle = '#ffe27a';
      ctx.beginPath();
      ctx.arc(b.x+b.w/2, b.y+5, 4, 0, Math.PI*2);
      ctx.fill();
    }
  }

  for (const s of spikes) {
    const count = Math.floor(s.w/15);
    for (let i=0;i<count;i++) {
      ctx.fillStyle = theme.spikeDark;
      ctx.beginPath();
      ctx.moveTo(s.x + i*15, s.y+s.h);
      ctx.lineTo(s.x + i*15+7.5, s.y);
      ctx.lineTo(s.x + i*15+15, s.y+s.h);
      ctx.fill();
      // faceta clara no lado esquerdo de cada espinho, pra dar volume
      ctx.fillStyle = theme.spike;
      ctx.beginPath();
      ctx.moveTo(s.x + i*15, s.y+s.h);
      ctx.lineTo(s.x + i*15+7.5, s.y);
      ctx.lineTo(s.x + i*15+7.5, s.y+s.h);
      ctx.fill();
    }
  }


  // gems
  for (const g of gems) {
    if (g.taken) continue;
    const t = gameClock*1000;
    const bob = Math.sin(t/300 + g.x) * 4;
    // auréola suave rosada atrás da gema, pra destacar mais do fundo
    ctx.save();
    ctx.translate(g.x, g.y+bob);
    const gHalo = ctx.createRadialGradient(0,0,1,0,0,14);
    gHalo.addColorStop(0, 'rgba(255,95,162,0.35)');
    gHalo.addColorStop(1, 'rgba(255,95,162,0)');
    ctx.fillStyle = gHalo;
    ctx.beginPath(); ctx.arc(0,0,14,0,Math.PI*2); ctx.fill();
    ctx.rotate(t/500 % (Math.PI*2));
    drawFacetedGem(8, 10, {
      bright:'#ffe6f0', light:'#ff8fc0', mid:'#ff5fa2', dark:'#c93f78',
      edge:'rgba(255,255,255,0.5)'
    });
    ctx.restore();
    // glints não giram junto (ficam fixos no mundo, só piscam), pra não ficar "correndo em círculo"
    const glintA = Math.max(0, Math.sin(t/260 + g.x*0.6));
    drawGemGlint(g.x-3, g.y+bob-4, 3.5, glintA*0.85, '#fff5fa');
    const glintB = Math.max(0, Math.sin(t/310 + g.x*0.9 + 2));
    drawGemGlint(g.x+3, g.y+bob+3, 1.8, glintB*0.7, '#ffffff');
  }

  // gema de prata (objetivo da fase)
  if (silverGem && !silverGem.taken) {
    const t = gameClock*1000;
    const bob = Math.sin(t/280 + silverGem.x) * 5;
    const glow = 0.6 + Math.sin(t/220)*0.4;
    // feixe de luz vertical suave atrás da gema, reforçando que é o item mais importante
    ctx.save();
    ctx.translate(silverGem.x, silverGem.y+bob);
    const beam = ctx.createLinearGradient(0,-60,0,60);
    beam.addColorStop(0, 'rgba(255,255,255,0)');
    beam.addColorStop(0.5, `rgba(255,255,255,${(0.16*glow).toFixed(2)})`);
    beam.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = beam;
    ctx.fillRect(-10, -60, 20, 120);
    ctx.restore();

    ctx.save();
    ctx.translate(silverGem.x, silverGem.y+bob);
    ctx.rotate(t/650 % (Math.PI*2));
    ctx.shadowColor = '#eef3f6';
    ctx.shadowBlur = 18*glow;
    drawFacetedGem(15, 18, {
      bright:'#ffffff', light:'#f2f7fa', mid:'#c7d3db', dark:'#8fa0ac',
      edge:'rgba(255,255,255,0.6)'
    });
    ctx.restore();
    // duas faíscas orbitando + um flare central pulsante — reforça que é o item mais importante da fase
    for (let i=0;i<2;i++) {
      const ang = t/450 + i*Math.PI;
      const ox = Math.cos(ang)*22, oy = Math.sin(ang)*10;
      const spA = 0.4 + Math.max(0, Math.sin(t/300+i*3))*0.6;
      drawGemGlint(silverGem.x+ox, silverGem.y+bob+oy, 2.6, spA, '#ffffff');
    }
    const flareA = Math.max(0, Math.sin(t/220)) * 0.9;
    drawStarFlare(silverGem.x, silverGem.y+bob, 6, flareA, '#ffffff');
  }

  // power-ups (cristais)
  for (const pu of powerups) {
    if (pu.taken) continue;
    const t = gameClock*1000;
    const bob = Math.sin(t/250 + pu.x) * 5;
    const glow = 0.6 + Math.sin(t/200)*0.3;
    const shadesMap = {
      star:   {bright:'#fff9d0', light:'#ffe27a', mid:'#ffd166', dark:'#c98a1f', edge:'rgba(255,255,255,0.55)'},
      wing:   {bright:'#eafcff', light:'#c3eeff', mid:'#a0e8ff', dark:'#4fa8c9', edge:'rgba(255,255,255,0.55)'},
      shield: {bright:'#eafff0', light:'#b8f0c0', mid:'#8fe388', dark:'#4a9e4f', edge:'rgba(255,255,255,0.55)'},
    };
    const glowColor = {star:'#ffd166', wing:'#a0e8ff', shield:'#8fe388'}[pu.type];
    ctx.save();
    ctx.translate(pu.x, pu.y+bob);
    // auréola suave atrás do cristal (um pouco maior agora, cobrindo o cluster inteiro)
    const halo = ctx.createRadialGradient(0,0,2,0,0,24);
    halo.addColorStop(0, glowColor+'55');
    halo.addColorStop(1, glowColor+'00');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0,0,24,0,Math.PI*2); ctx.fill();

    ctx.rotate(Math.sin(t/700 + pu.x)*0.18); // leve balanço, sem girar 360°
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14*glow;
    drawCrystalCluster(11, 15, shadesMap[pu.type]);
    ctx.shadowBlur = 0;
    drawPowerupGlyph(pu.type);
    ctx.restore();
    const glintA = Math.max(0, Math.sin(t/240 + pu.x*0.5));
    drawGemGlint(pu.x-5, pu.y+bob-7, 3, glintA*0.8, '#ffffff');
  }

  // portal (moldura de pedra + núcleo pulsante + anéis rotativos + faíscas)
  {
    const px = portalX, pyBase = groundY, pyCenter = groundY - 62;
    const t = gameClock*1000;
    const pulse = 0.6 + Math.sin(t/260)*0.4;

    ctx.save();

    // brilho refletido no chão (cor do núcleo do portal deste tema)
    const glowRgb = hexToRgb(theme.portalCore[1]);
    const floorGlow = ctx.createRadialGradient(px, pyBase, 2, px, pyBase, 48);
    floorGlow.addColorStop(0, `rgba(${glowRgb},0.45)`);
    floorGlow.addColorStop(1, `rgba(${glowRgb},0)`);
    ctx.fillStyle = floorGlow;
    ctx.beginPath();
    ctx.ellipse(px, pyBase, 48, 14, 0, 0, Math.PI*2);
    ctx.fill();

    // moldura em arco (pedra do tema + friso mais claro)
    ctx.lineCap = 'round';
    ctx.strokeStyle = theme.ground;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(px-34, pyBase+4);
    ctx.lineTo(px-34, pyCenter-52);
    ctx.quadraticCurveTo(px, pyCenter-90, px+34, pyCenter-52);
    ctx.lineTo(px+34, pyBase+4);
    ctx.stroke();
    ctx.strokeStyle = theme.hill;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(px-34, pyBase+2);
    ctx.lineTo(px-34, pyCenter-52);
    ctx.quadraticCurveTo(px, pyCenter-90, px+34, pyCenter-52);
    ctx.lineTo(px+34, pyBase+2);
    ctx.stroke();
    // pequenos brasões/pinos na moldura
    ctx.fillStyle = theme.hill;
    ctx.beginPath(); ctx.arc(px-34, pyCenter-52, 4.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(px+34, pyCenter-52, 4.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(px, pyCenter-90, 5, 0, Math.PI*2); ctx.fill();

    // núcleo energético pulsante
    const [coreC0, coreC1, coreC2] = theme.portalCore;
    const core = ctx.createRadialGradient(px, pyCenter, 4, px, pyCenter, 46*pulse+14);
    core.addColorStop(0, coreC0);
    core.addColorStop(0.45, coreC1);
    core.addColorStop(1, coreC2);
    ctx.shadowColor = coreC1;
    ctx.shadowBlur = 24*pulse;
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.ellipse(px, pyCenter, 24, 56, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // anéis de energia rotativos
    ctx.translate(px, pyCenter);
    for (let i=0;i<2;i++) {
      const dir = i===0 ? 1 : -1;
      ctx.save();
      ctx.rotate((dir*t/900) % (Math.PI*2));
      ctx.strokeStyle = i===0 ? 'rgba(255,255,255,0.55)' : `rgba(${hexToRgb(coreC2)},0.55)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 20-i*5, 50-i*10, 0, 0, Math.PI*1.4);
      ctx.stroke();
      ctx.restore();
    }

    // faíscas orbitando o núcleo
    for (let i=0;i<6;i++) {
      const ang = (t/500) + i*(Math.PI*2/6);
      const rx = 15 + Math.sin(t/300+i)*3;
      const ry = 30 + Math.cos(t/260+i)*3;
      const sx = Math.cos(ang)*rx;
      const sy = Math.sin(ang)*ry;
      const sSize = 1.6 + Math.sin(t/200+i)*1;
      ctx.fillStyle = i%2===0 ? coreC0 : coreC2;
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(0.6,sSize), 0, Math.PI*2);
      ctx.fill();
    }
    ctx.translate(-px, -pyCenter);

    // fagulhas subindo do chão
    for (let i=0;i<5;i++) {
      const cyc = ((t/900) + i/5) % 1;
      const sx = px + Math.sin(t/400 + i*10)*16;
      const sy = pyBase - cyc*90;
      const alpha = 1-cyc;
      ctx.fillStyle = `rgba(${glowRgb},${alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 2*(1-cyc*0.5), 0, Math.PI*2);
      ctx.fill();
    }

    ctx.restore();
  }

  // enemies
  for (const e of enemies) {
    if (!e.alive) continue;
    const bob = Math.sin((gameClock*1000)/150 + e.x) * 2;
    ctx.save();
    ctx.translate(e.x, e.y+bob);
    ctx.scale(e.dir, 1);
    const et=e.archetype||'walker';
    ctx.fillStyle = et==='hopper'?'#5bbf78':et==='charger'?'#d85b47':et==='floater'?'#5b89d8':theme.enemy;
    ctx.beginPath();
    if(et==='floater') ctx.ellipse(0,-12,17,10,0,0,Math.PI*2); else if(et==='charger') ctx.roundRect(-18,-27,36,24,7); else ctx.ellipse(0,-12,16,12,0,0,Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'white';
    ctx.beginPath(); ctx.arc(6,-16,4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath(); ctx.arc(7,-16,2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = theme.enemyDark;
    ctx.fillRect(-10,-4,8,6);
    ctx.fillRect(4,-4,8,6);
    ctx.restore();
  }


  // Baús secretos
  for(const c of chests){const x=c.x-state.camX,y=c.y;ctx.save();ctx.translate(x,y);ctx.fillStyle=c.opened?'#6d4c2f':'#9b622b';ctx.fillRect(0,8,34,22);ctx.fillStyle='#e4b94f';ctx.fillRect(0,6,34,6);ctx.fillRect(14,5,6,25);if(!c.opened){ctx.fillStyle='#fff1a8';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText('?',17,0);}ctx.restore();}
  // Miniboss regional
  if(miniBoss&&miniBoss.alive){const x=miniBoss.x-state.camX,y=miniBoss.y;ctx.save();if(miniBoss.invuln>0&&miniBoss.invuln%4<2)ctx.globalAlpha=.45;ctx.translate(x+23,y+24);ctx.scale(miniBoss.dir,1);ctx.fillStyle='#7b2e2e';ctx.beginPath();ctx.roundRect(-23,-24,46,48,12);ctx.fill();ctx.fillStyle='#ffd166';ctx.beginPath();ctx.arc(-8,-8,4,0,Math.PI*2);ctx.arc(8,-8,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#382020';ctx.fillRect(-16,8,32,7);ctx.restore();const bw=80;ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(x-17,y-13,bw,7);ctx.fillStyle='#ff7b54';ctx.fillRect(x-17,y-13,bw*(miniBoss.hp/miniBoss.maxHp),7);}
  // Adagas especiais
  for(const p of specialProjectiles){const x=p.x-state.camX;ctx.save();ctx.translate(x,p.y);ctx.rotate(gameClock*12);ctx.fillStyle='#f6e7b0';ctx.fillRect(-9,-2,14,4);ctx.fillStyle='#b66b3d';ctx.fillRect(5,-3,6,6);ctx.restore();}


  // NPCs narrativos com sprites próprios
  if (npc) {
    const sx = npc.x - state.camX;
    const isTupi = npc.name === 'Mestre Tupi';
    const isLina = npc.name === 'Lina, a Cartógrafa';
    let img = null;
    let drawH = 0;
    if (isTupi && mestreTupiSprites.idle.complete && mestreTupiSprites.idle.naturalWidth) {
      img = (dialogueOpen && mestreTupiSprites.talk.complete && mestreTupiSprites.talk.naturalWidth) ? mestreTupiSprites.talk : mestreTupiSprites.idle;
      drawH = 108;
    } else if (isLina && linaSprites.idle.complete && linaSprites.idle.naturalWidth) {
      img = (dialogueOpen && linaSprites.talk.complete && linaSprites.talk.naturalWidth) ? linaSprites.talk : linaSprites.idle;
      drawH = 96;
    }
    if (img) {
      const drawW = drawH * (img.naturalWidth / img.naturalHeight);
      const bob = Math.sin(gameClock * 2.2 + npc.x * .01) * 1.5;
      ctx.save();
      ctx.shadowColor='rgba(0,0,0,.28)'; ctx.shadowBlur=8;
      ctx.drawImage(img, sx-drawW/2, groundY-drawH+bob, drawW, drawH);
      ctx.restore();
      if (!npc.shown) {
        ctx.save();
        ctx.fillStyle='#fff7d6'; ctx.strokeStyle=isLina?'#2d6f78':'#7a3f20'; ctx.lineWidth=3;
        ctx.beginPath(); ctx.arc(sx,groundY-drawH-10+bob,13,0,Math.PI*2); ctx.fill(); ctx.stroke();
        ctx.fillStyle=isLina?'#147d8a':'#b02a2a'; ctx.font='bold 18px sans-serif'; ctx.textAlign='center';
        ctx.fillText('!',sx,groundY-drawH-4+bob); ctx.restore();
      }
    } else {
      const sy=groundY-47;
      ctx.save(); ctx.translate(sx,sy);
      ctx.fillStyle='#e8d0a5'; ctx.beginPath(); ctx.arc(0,-20,10,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#4d8a63'; ctx.fillRect(-9,-10,18,24);
      ctx.fillStyle='#d8b24c'; ctx.fillRect(-12,13,24,5);
      ctx.fillStyle='#fff'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center';
      ctx.fillText('!',0,-38); ctx.restore();
    }
  }

  // Chefe final: Barão Sombra
  if (boss && boss.alive) {
    const bx=boss.x-state.camX, by=boss.y;
    ctx.save(); ctx.translate(bx+boss.w/2,by+boss.h/2); ctx.scale(boss.dir,1);
    if (boss.invuln>0 && boss.invuln%4<2) ctx.globalAlpha=.4;
    ctx.shadowColor='#9d4edd'; ctx.shadowBlur=18;
    ctx.fillStyle='#24103d'; ctx.beginPath(); ctx.ellipse(0,5,28,34,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#3b1763'; ctx.beginPath(); ctx.arc(0,-25,22,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#6f2dbd'; ctx.beginPath(); ctx.moveTo(-14,-42);ctx.lineTo(-24,-65);ctx.lineTo(-4,-47);ctx.closePath();ctx.fill();
    ctx.beginPath();ctx.moveTo(14,-42);ctx.lineTo(24,-65);ctx.lineTo(4,-47);ctx.closePath();ctx.fill();
    ctx.fillStyle='#ff4d6d'; ctx.beginPath();ctx.arc(-7,-27,4,0,Math.PI*2);ctx.arc(7,-27,4,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#c77dff';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(-25,15);ctx.lineTo(-38,35);ctx.moveTo(25,15);ctx.lineTo(38,35);ctx.stroke();
    ctx.restore();
    // Barra de vida do boss no topo do mundo visível
    const bw=260,bh=14,bx2=W/2-bw/2,by2=48;
    ctx.fillStyle='rgba(20,8,34,.75)';ctx.fillRect(bx2-4,by2-4,bw+8,bh+8);
    ctx.fillStyle='#5a1434';ctx.fillRect(bx2,by2,bw,bh);
    ctx.fillStyle='#d1495b';ctx.fillRect(bx2,by2,bw*(boss.hp/boss.maxHp),bh);
    ctx.fillStyle='#fff8e7';ctx.font='bold 13px sans-serif';ctx.textAlign='center';ctx.fillText('BARÃO SOMBRA',W/2,by2-7);
  }
  for (const p of bossProjectiles) {
    const sx=p.x-state.camX; ctx.save();ctx.shadowColor='#c77dff';ctx.shadowBlur=16;ctx.fillStyle='#9d4edd';ctx.beginPath();ctx.arc(sx,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.restore();
  }

  drawPlayer();
  drawParticles();
  drawFloatTexts();

  ctx.restore();
}

function drawPlayer() {
  ctx.save();

  // A caixa de colisão continua pequena e precisa; a arte pode ultrapassá-la
  // visualmente sem deixar o personagem "pesado" de controlar.
  const cx = player.x + player.w/2;
  const feetY = player.y + player.h + 5;
  ctx.translate(cx, feetY);
  ctx.scale(player.facing, 1);

  if (player.invuln % 10 < 5 && player.invuln > 0) ctx.globalAlpha = 0.45;
  if (player.starTimer > 0) {
    const hue = ((gameClock*1000)/5) % 360;
    ctx.shadowColor = `hsl(${hue},90%,60%)`;
    ctx.shadowBlur = 18;
  }

  let spriteName = 'idle1';
  if (player.hurtTimer > 0) {
    spriteName = 'hurt';
  } else if (player.specialTimer > 0) {
    spriteName = 'throw';
  } else if (player.attackTimer > 0) {
    spriteName = 'attack';
  } else if (!player.onGround) {
    spriteName = 'jump';
  } else if (Math.abs(player.vx) > 0.8) {
    // Alterna as duas poses de corrida conforme a distância/velocidade.
    spriteName = (Math.floor(player.walkPhase / 2.2) % 2 === 0) ? 'run1' : 'run2';
  } else {
    // Idle vivo: troca suavemente entre duas poses, evitando personagem estático.
    spriteName = (Math.floor(gameClock * 2.2) % 2 === 0) ? 'idle1' : 'idle2';
  }

  const img = ZECO_SPRITES[spriteName];
  if (img && img.complete && img.naturalWidth) {
    // Altura visual maior que o Zeco antigo, mantendo os pés presos ao chão.
    const targetH = spriteName === 'hurt' ? 58 : (spriteName === 'jump' ? 72 : ((spriteName === 'attack' || spriteName === 'throw') ? 74 : 70));
    const targetW = targetH * (img.naturalWidth / img.naturalHeight);
    const bob = (spriteName.startsWith('idle')) ? Math.sin(gameClock * 3.2) * 0.8 : 0;
    ctx.drawImage(img, -targetW/2, -targetH + bob, targetW, targetH);
  } else {
    // Fallback enquanto a imagem termina de carregar.
    ctx.fillStyle = '#3f9a4f';
    ctx.beginPath(); ctx.ellipse(0,-22,15,20,0,0,Math.PI*2); ctx.fill();
  }


  if (player.attackTimer > 5) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, player.attackTimer / 10);
    ctx.strokeStyle = '#fff0a8'; ctx.lineWidth = 5; ctx.lineCap='round';
    ctx.shadowColor='#ffd166'; ctx.shadowBlur=12;
    ctx.beginPath(); ctx.arc(15,-34,28,-0.8,0.75); ctx.stroke();
    ctx.restore();
  }

  // Poderes continuam aparecendo por cima do novo sprite.
  ctx.shadowBlur = 0;
  if (player.wingTimer > 0) {
    ctx.fillStyle = 'rgba(160,232,255,0.72)';
    const flap = player.gliding ? 0 : Math.sin(gameClock*12) * 5;
    ctx.beginPath(); ctx.ellipse(-22,-37+flap,15,6,-0.55,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(-22,-37-flap,15,6,0.55,0,Math.PI*2); ctx.fill();
  }
  if (player.shield) {
    ctx.strokeStyle = 'rgba(143,227,136,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0,-34,31,0,Math.PI*2); ctx.stroke();
  }

  ctx.globalAlpha = 1;
  ctx.restore();
}

function draw() {
  ctx.save();
  if (state.shake.timer > 0 && state.cameraShake) {
    const amt = REDUCED_MOTION ? (state.shake.amount || 4) * 0.35 : (state.shake.amount || 4);
    ctx.translate((Math.random()-0.5)*amt, (Math.random()-0.5)*amt);
  }
  drawBackground();
  drawGround();
  ctx.restore();

  if (state.paused && (!screenPause || screenPause.classList.contains('hidden'))) {
    ctx.save();
    ctx.fillStyle = 'rgba(10,5,20,0.55)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#ffd166';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⏸ PAUSADO', W/2, H/2 - 12);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#fff8e7';
    ctx.fillText('Pressione P ou ESC para continuar', W/2, H/2 + 24);
    ctx.restore();
  }
}

function loop() {
  tickGameClock();
  update();
  draw();
  requestAnimationFrame(loop);
}
