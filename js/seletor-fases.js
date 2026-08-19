// =============================================================
// Zeco e a Ilha das Gemas — Seletor de Fases
// Depende de: jogo.js, audio.js e fases.js (carregar ANTES)
// =============================================================

// Referências extras usadas só pelo seletor de fases
const levelSelectBanner = document.getElementById('levelSelectBanner');
const levelProgressCount = document.getElementById('levelProgressCount');
const levelProgressTotal = document.getElementById('levelProgressTotal');
const levelProgressFill = document.getElementById('levelProgressFill');

// Contexto da última abertura do seletor:
// - continueRun: true quando viemos de "terminar uma fase" (mantém pontuação/vidas)
// - justCompletedIndex: índice da fase recém concluída (para destacar o card e mostrar o banner)
let lsContext = { continueRun: false, justCompletedIndex: null };

// Abre a tela de seleção de fases. opts: {continueRun, justCompletedIndex}
function openLevelSelect(opts = {}) {
  lsContext = { continueRun: !!opts.continueRun, justCompletedIndex: opts.justCompletedIndex ?? null };
  renderLevelSelect();
  screenMenu.classList.add('hidden');
  screenHowTo.classList.add('hidden');
  screenEnd.classList.add('hidden');
  if (screenLevelComplete) screenLevelComplete.classList.add('hidden');
  overlay.classList.remove('hidden');
  screenLevelSelect.classList.remove('hidden');
}

function renderLevelSelect() {
  levelGrid.innerHTML = '';

  const completedCount = state.levelProgress.filter(p => p.completed).length;
  levelProgressCount.textContent = completedCount;
  levelProgressTotal.textContent = levels.length;
  levelProgressFill.style.width = (levels.length ? (completedCount / levels.length) * 100 : 0) + '%';

  const nextUpIndex = state.levelProgress.findIndex(p => !p.completed);

  if (lsContext.justCompletedIndex !== null) {
    levelSelectBanner.textContent = '🎉 Fase ' + (lsContext.justCompletedIndex + 1) + ' concluída! Pontuação: ' + state.score;
    levelSelectBanner.classList.remove('hidden');
  } else {
    levelSelectBanner.classList.add('hidden');
  }

  levels.forEach((lvl, i) => {
    const progress = state.levelProgress[i];
    const unlocked = i === 0 || progress.completed || !!(state.levelProgress[i-1] && state.levelProgress[i-1].completed);
    const tile = document.createElement('div');
    tile.className = 'levelTile';
    tile.setAttribute('role', 'button');
    tile.setAttribute('tabindex', unlocked ? '0' : '-1');
    tile.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
    if (!unlocked) tile.classList.add('locked');
    if (progress.completed) tile.classList.add('completed');
    if (i === lsContext.justCompletedIndex) tile.classList.add('justCompleted');
    if (i === nextUpIndex) tile.classList.add('nextUp');
    tile.style.animationDelay = (i * 0.05) + 's';

    let badge = '';
    if (!unlocked) {
      badge = '<div class="tileBadge lockedBadge">🔒 BLOQUEADA</div>';
    } else if (i === lsContext.justCompletedIndex) {
      badge = '<div class="tileBadge">NOVO 🔷</div>';
    } else if (i === nextUpIndex) {
      badge = '<div class="tileBadge next">PRÓXIMA ▶</div>';
    }

    tile.innerHTML = `
      ${badge}
      <div class="levelNum">Fase ${i + 1}</div>
      <div class="levelName">${typeof ZECO_LEVEL_NAMES !== 'undefined' ? ZECO_LEVEL_NAMES[i] : ''}</div>
      <div class="levelIcons">
        <div class="crystalIcon${progress.completed ? ' earned' : ''}"></div>
        <div class="silverIcon${progress.objective ? ' earned' : ''}"></div>
      </div>
    `;
    const openTile = () => {
      if (!unlocked) return;
      // Mostra um pequeno capítulo antes de entrar na fase. Além de dar contexto,
      // isso aproveita o seletor como mapa narrativo da ilha.
      showStoryForLevel(i, lsContext.continueRun);
    };
    tile.addEventListener('click', openTile);
    tile.addEventListener('keydown', ev => {
      if (unlocked && (ev.key === 'Enter' || ev.key === ' ')) { ev.preventDefault(); openTile(); }
    });
    levelGrid.appendChild(tile);
  });
}

levelSelectBtn.addEventListener('click', () => {
  openLevelSelect({ continueRun: false, justCompletedIndex: null });
});

levelSelectBackBtn.addEventListener('click', () => {
  screenLevelSelect.classList.add('hidden');
  showMainMenu();
});
