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

let storyCursor = 0;
let storyMode = 'browse'; // browse | start
let pendingStart = null; // {level, continueRun}

function hideAllScreens() {
  [screenMenu, screenHowTo, screenEnd, screenLevelSelect, screenStory, screenSettings, screenPause, screenIslandMap]
    .forEach(el => el && el.classList.add('hidden'));
}

function refreshContinueButton() {
  const hasProgress = state.levelProgress.some(p => p.completed || p.objective) || state.lastPlayedLevel > 0;
  continueBtn.classList.toggle('hidden', !hasProgress);
  if (hasProgress) {
    const idx = Math.max(0, Math.min(state.lastPlayedLevel, levels.length - 1));
    continueBtn.textContent = '⏩ Continuar · Fase ' + (idx + 1);
  }
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

function beginLevel(levelIndex, continueRun=false) {
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
  localStorage.setItem('zeco_shake', state.cameraShake ? '1' : '0');
});
tipsToggle.addEventListener('change', () => {
  state.showTips = tipsToggle.checked;
  localStorage.setItem('zeco_tips', state.showTips ? '1' : '0');
});

howToBtn.addEventListener('click', () => {
  hideAllScreens();
  screenHowTo.classList.remove('hidden');
});
howToBackBtn.addEventListener('click', showMainMenu);

pauseBtn.addEventListener('click', () => {
  if (state.running) setPaused(!state.paused);
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
