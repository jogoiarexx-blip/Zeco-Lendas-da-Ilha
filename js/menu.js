// =============================================================
// Zeco e a Ilha das Gemas — Menu, história, opções e pausa
// Depende de: jogo.js, audio.js, historia.js
// =============================================================
const continueBtn = document.getElementById('continueBtn');
const storyBtn = document.getElementById('storyBtn');
const settingsBtn = document.getElementById('settingsBtn');
const screenStory = document.getElementById('screenStory');
const screenSettings = document.getElementById('screenSettings');
const storyTitle = document.getElementById('storyTitle');
const storyChapter = document.getElementById('storyChapter');
const storyText = document.getElementById('storyText');
const storyNextBtn = document.getElementById('storyNextBtn');
const storyBackBtn = document.getElementById('storyBackBtn');
const settingsBackBtn = document.getElementById('settingsBackBtn');
const soundToggle = document.getElementById('soundToggle');
const shakeToggle = document.getElementById('shakeToggle');
const tipsToggle = document.getElementById('tipsToggle');
const islandMapBtn = document.getElementById('islandMapBtn');
const islandMapBackBtn = document.getElementById('islandMapBackBtn');
const screenIslandMap = document.getElementById('screenIslandMap');
const islandMap = document.getElementById('islandMap');
const creditsBtn = document.getElementById('creditsBtn');
const creditsBackBtn = document.getElementById('creditsBackBtn');
const screenCredits = document.getElementById('screenCredits');
const screenTransition = document.getElementById('screenTransition');
const transitionBackdrop = document.getElementById('transitionBackdrop');
const transitionChapter = document.getElementById('transitionChapter');
const transitionNumber = document.getElementById('transitionNumber');
const transitionTitle = document.getElementById('transitionTitle');
const transitionText = document.getElementById('transitionText');
const transitionHintText = document.getElementById('transitionHintText');
const transitionPercent = document.getElementById('transitionPercent');
const transitionFill = document.getElementById('transitionFill');
const transitionStartBtn = document.getElementById('transitionStartBtn');
const transitionDestination = document.getElementById('transitionDestination');
const transitionZeco = document.getElementById('transitionZeco');
const menuProgressPercent = document.getElementById('menuProgressPercent');
const menuProgressFill = document.getElementById('menuProgressFill');
const menuCompletedStat = document.getElementById('menuCompletedStat');
const menuObjectiveStat = document.getElementById('menuObjectiveStat');
const menuBestStat = document.getElementById('menuBestStat');
const menuNextRegion = document.getElementById('menuNextRegion');
const continueSubtext = document.getElementById('continueSubtext');

let storyCursor = 0;
let storyMode = 'browse'; // browse | start
let pendingStart = null; // {level, continueRun}

function hideAllScreens() {
  [screenMenu, screenHowTo, screenEnd, screenLevelComplete, screenLevelSelect, screenStory, screenSettings, screenPause, screenIslandMap, screenCredits, screenTransition]
    .forEach(el => el && el.classList.add('hidden'));
}

function refreshContinueButton() {
  const completed = state.levelProgress.filter(p => p && p.completed).length;
  const objectives = state.levelProgress.filter(p => p && p.objective).length;
  const hasProgress = completed > 0 || objectives > 0 || state.lastPlayedLevel > 0;
  continueBtn.classList.toggle('hidden', !hasProgress);
  const idx = Math.max(0, Math.min(state.lastPlayedLevel, levels.length - 1));
  if (hasProgress) {
    if (continueSubtext) continueSubtext.textContent = 'Fase ' + (idx + 1) + ' · ' + ((typeof ZECO_LEVEL_NAMES !== 'undefined' && ZECO_LEVEL_NAMES[idx]) || 'Aventura');
  }

  const total = Math.max(1, levels.length);
  const pct = Math.round((completed / total) * 100);
  if (menuProgressPercent) menuProgressPercent.textContent = pct + '%';
  if (menuProgressFill) menuProgressFill.style.width = pct + '%';
  if (menuCompletedStat) menuCompletedStat.textContent = completed + '/' + total;
  if (menuObjectiveStat) menuObjectiveStat.textContent = objectives + '/' + total;
  if (menuBestStat) menuBestStat.textContent = state.bestScore || 0;
  if (menuNextRegion) menuNextRegion.textContent = (typeof ZECO_LEVEL_NAMES !== 'undefined' && ZECO_LEVEL_NAMES[idx]) || ('Fase ' + (idx + 1));
}

function showMainMenu() {
  state.running = false;
  state.paused = false;
  clearInputState();
  overlay.classList.remove('hidden');
  hideAllScreens();
  screenMenu.classList.remove('hidden');
  refreshContinueButton();
  updateBestScoreDisplay();
}

let transitionPending = null;
let transitionTimer = null;
let transitionFrame = null;

const ZECO_TRANSITION_HINTS = [
  'Explore além do caminho principal: algumas gemas ficam em rotas escondidas.',
  'Ataques e pulos bem cronometrados são mais seguros que correr sem parar.',
  'No gelo, controle a velocidade antes das bordas e dos espinhos.',
  'Use o ritmo das plataformas e do vento a seu favor.',
  'A escuridão esconde perigos. Observe o cenário antes de avançar.',
  'Nem todo brilho é decoração: procure sinais de caminhos secretos.',
  'As ruínas guardam pistas sobre o passado do Barão Sombra.',
  'No vulcão, movimento constante vale mais que pressa.',
  'Nas ilhas flutuantes, planeje o salto antes de sair da plataforma.',
  'O Barão Sombra tem padrões. Aprenda o ritmo antes de atacar.'
];

function getTransitionTheme(levelIndex) {
  const raw = (levels[levelIndex] && levels[levelIndex].theme) || 'ilha';
  return ({noite:'caverna', lava:'vulcao', lendaria:'apice'}[raw] || raw);
}

function startLevelNow(levelIndex, continueRun=false) {
  if (transitionTimer) { clearInterval(transitionTimer); transitionTimer = null; }
  if (transitionFrame) { cancelAnimationFrame(transitionFrame); transitionFrame = null; }
  transitionPending = null;
  initAudio();
  goFullscreenLandscape();
  hideAllScreens();
  overlay.classList.add('hidden');
  if (continueRun) {
    state.levelIndex = levelIndex;
    state.lastPlayedLevel = levelIndex;
    saveProgress();
    loadLevel(levelIndex);
    updateHUD();
  } else {
    resetGame(levelIndex);
  }
  clearInputState();
  state.running = true;
  state.paused = false;
}

function showLevelTransition(levelIndex, continueRun=false) {
  const idx = Math.max(0, Math.min(levelIndex, levels.length - 1));
  transitionPending = { levelIndex: idx, continueRun };
  state.running = false;
  clearInputState();
  hideAllScreens();
  overlay.classList.remove('hidden');
  screenTransition.classList.remove('hidden');

  const story = (typeof getStoryForLevel === 'function') ? getStoryForLevel(idx) : null;
  transitionChapter.textContent = 'CAPÍTULO ' + (idx + 1);
  transitionNumber.textContent = String(idx + 1).padStart(2, '0');
  transitionTitle.textContent = (typeof ZECO_LEVEL_NAMES !== 'undefined' && ZECO_LEVEL_NAMES[idx]) || ('Fase ' + (idx + 1));
  transitionDestination.textContent = transitionTitle.textContent;
  transitionText.textContent = story ? story.text : 'Uma nova região da Ilha de Aruana espera por Zeco.';
  transitionHintText.textContent = ZECO_TRANSITION_HINTS[idx] || ZECO_TRANSITION_HINTS[0];

  const theme = getTransitionTheme(idx);
  transitionBackdrop.className = 'transitionBackdrop theme-' + theme;
  transitionZeco.src = idx === levels.length - 1 ? 'assets/zeco/attack.png' : 'assets/zeco/run1.png';
  transitionFill.style.width = '0%';
  transitionPercent.textContent = '0%';
  transitionStartBtn.disabled = true;
  transitionStartBtn.textContent = idx === levels.length - 1 ? 'Enfrentar o Barão ▶' : 'Entrar na região ▶';

  let progress = 0;
  const startedAt = performance.now();
  const duration = 1150;
  const animate = (now) => {
    const t = Math.min(1, (now - startedAt) / duration);
    progress = Math.round((1 - Math.pow(1 - t, 3)) * 100);
    transitionFill.style.width = progress + '%';
    transitionPercent.textContent = progress + '%';
    if (t < 1) transitionFrame = requestAnimationFrame(animate);
    else {
      transitionFrame = null;
      transitionStartBtn.disabled = false;
      transitionStartBtn.focus({preventScroll:true});
    }
  };
  transitionFrame = requestAnimationFrame(animate);
}

function beginLevel(levelIndex, continueRun=false) {
  showLevelTransition(levelIndex, continueRun);
}

if (transitionStartBtn) transitionStartBtn.addEventListener('click', () => {
  if (!transitionPending || transitionStartBtn.disabled) return;
  const p = transitionPending;
  startLevelNow(p.levelIndex, p.continueRun);
});

function renderStory(index) {
  storyCursor = Math.max(0, Math.min(index, ZECO_STORY.length - 1));
  const item = ZECO_STORY[storyCursor];
  hideAllScreens();
  overlay.classList.remove('hidden');
  screenStory.classList.remove('hidden');
  storyTitle.textContent = item.title;
  storyChapter.textContent = item.chapter;
  storyText.textContent = item.text;
  if (storyMode === 'start') storyNextBtn.textContent = 'Começar ▶';
  else storyNextBtn.textContent = storyCursor >= ZECO_STORY.length - 1 ? 'Voltar ao Menu' : 'Próximo ▶';
}

function showStoryForLevel(levelIndex, continueRun=false) {
  storyMode = 'start';
  pendingStart = { level: levelIndex, continueRun };
  renderStory(levelIndex + 1);
}

function setPaused(paused) {
  if (!state.running && paused) return;
  state.paused = paused;
  clearInputState();
  if (paused) {
    overlay.classList.remove('hidden');
    hideAllScreens();
    screenPause.classList.remove('hidden');
    pauseLevelText.textContent = 'Fase ' + (state.levelIndex + 1) + (typeof ZECO_LEVEL_NAMES !== 'undefined' ? ' · ' + ZECO_LEVEL_NAMES[state.levelIndex] : '');
  } else {
    screenPause.classList.add('hidden');
    overlay.classList.add('hidden');
    initAudio();
  }
}

playBtn.addEventListener('click', () => {
  // Nova aventura começa com o prólogo, dando contexto ao jogo.
  storyMode = 'start';
  pendingStart = { level: 0, continueRun: false };
  renderStory(0);
});

continueBtn.addEventListener('click', () => {
  const idx = Math.max(0, Math.min(state.lastPlayedLevel, levels.length - 1));
  beginLevel(idx, false);
});

storyBtn.addEventListener('click', () => {
  storyMode = 'browse';
  pendingStart = null;
  renderStory(0);
});

storyNextBtn.addEventListener('click', () => {
  if (storyMode === 'start' && pendingStart) {
    const p = pendingStart;
    pendingStart = null;
    beginLevel(p.level, p.continueRun);
    return;
  }
  if (storyCursor < ZECO_STORY.length - 1) renderStory(storyCursor + 1);
  else showMainMenu();
});

storyBackBtn.addEventListener('click', () => {
  if (storyMode === 'browse' && storyCursor > 0) renderStory(storyCursor - 1);
  else showMainMenu();
});

settingsBtn.addEventListener('click', () => {
  hideAllScreens();
  overlay.classList.remove('hidden');
  screenSettings.classList.remove('hidden');
  soundToggle.checked = !muted;
  shakeToggle.checked = state.cameraShake;
  tipsToggle.checked = state.showTips;
});
settingsBackBtn.addEventListener('click', showMainMenu);

soundToggle.addEventListener('change', () => {
  const shouldMute = !soundToggle.checked;
  if (muted !== shouldMute) muteBtn.click();
});
shakeToggle.addEventListener('change', () => {
  state.cameraShake = shakeToggle.checked;
  safeStorageSet('zeco_shake', state.cameraShake ? '1' : '0');
});
tipsToggle.addEventListener('change', () => {
  state.showTips = tipsToggle.checked;
  safeStorageSet('zeco_tips', state.showTips ? '1' : '0');
});

howToBtn.addEventListener('click', () => {
  hideAllScreens();
  screenHowTo.classList.remove('hidden');
});
howToBackBtn.addEventListener('click', showMainMenu);

pauseBtn.addEventListener('click', () => {
  if (state.running && !dialogueOpen) setPaused(!state.paused);
});
resumeBtn.addEventListener('click', () => setPaused(false));
restartLevelBtn.addEventListener('click', () => {
  const idx = state.levelIndex;
  overlay.classList.add('hidden');
  hideAllScreens();
  resetGame(idx);
  clearInputState();
  state.running = true;
});
pauseMenuBtn.addEventListener('click', showMainMenu);

startBtn.addEventListener('click', () => {
  initAudio();
  if (state.lastWon) {
    storyMode = 'start';
    pendingStart = { level: 0, continueRun: false };
    renderStory(0);
  } else {
    beginLevel(state.levelIndex, false);
  }
});

menuBtn.addEventListener('click', showMainMenu);

if (creditsBtn) creditsBtn.addEventListener('click', () => {
  hideAllScreens();
  overlay.classList.remove('hidden');
  screenCredits.classList.remove('hidden');
});
if (creditsBackBtn) creditsBackBtn.addEventListener('click', showMainMenu);

// Estado inicial do menu.
refreshContinueButton();


function renderIslandMap() {
  if (!islandMap) return;
  islandMap.innerHTML = '';
  ZECO_LEVEL_NAMES.forEach((name,i) => {
    const node=document.createElement('div');
    const done=state.levelProgress[i] && state.levelProgress[i].completed;
    node.className='mapNode '+(done?'done':'')+(i===state.lastPlayedLevel?' current':'');
    node.innerHTML=`<span class="mapNumber">${i+1}</span><span>${name}</span>${done?'<b>◆</b>':''}`;
    islandMap.appendChild(node);
    if (i<ZECO_LEVEL_NAMES.length-1) { const path=document.createElement('div'); path.className='mapPath '+(done?'done':''); islandMap.appendChild(path); }
  });
}
if (islandMapBtn) islandMapBtn.addEventListener('click',()=>{hideAllScreens();overlay.classList.remove('hidden');screenIslandMap.classList.remove('hidden');renderIslandMap();});
if (islandMapBackBtn) islandMapBackBtn.addEventListener('click',showMainMenu);
