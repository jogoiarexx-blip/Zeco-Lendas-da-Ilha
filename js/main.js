// =============================================================
// Zeco e a Ilha das Gemas — Phaser completo
// Menu + Seletor de fases + Áudio + Progresso + Touch + Pause
// =============================================================
const W = 800, H = 450;
const FPS_REF = 60;

const GRAVITY   = 0.6   * FPS_REF * FPS_REF;
const MOVE_ACC  = 0.9   * FPS_REF * FPS_REF;
const MAX_SPEED = 5.5   * FPS_REF;
const JUMP_VEL  = -12.5 * FPS_REF;
const FRICTION  = 0.82;
const ICE_FRICTION = 0.97;
const STARTING_LIVES = 3;
const SAVE_KEY = 'zeco_phaser_save_v1';

// ---------- Progresso global (atravessa cenas) ----------
const GameState = {
  score: 0,
  objectives: 0,
  lives: STARTING_LIVES,
  gemStreak: 0,
  bestScore: 0,
  levelProgress: LEVELS.map(() => ({ completed: false, objective: false })),
  continueRun: false, // true = mantém score/vidas ao escolher fase no seletor
};

function saveProgress() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      levelProgress: GameState.levelProgress,
      bestScore: GameState.bestScore,
    }));
  } catch (e) {}
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.levelProgress) && data.levelProgress.length === LEVELS.length) {
      GameState.levelProgress = data.levelProgress;
    }
    if (typeof data.bestScore === 'number') GameState.bestScore = data.bestScore;
  } catch (e) {}
}

function resetRun(startIndex = 0) {
  GameState.score = 0;
  GameState.lives = STARTING_LIVES;
  GameState.objectives = 0;
  GameState.gemStreak = 0;
  GameState.continueRun = false;
  return startIndex;
}

// ---------- Touch / teclado virtual ----------
const TouchKeys = { left: false, right: false, jump: false };
(function setupTouch() {
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const controls = document.getElementById('touchControls');
  if (isTouch && controls) controls.classList.add('show');

  function bind(el, key) {
    if (!el) return;
    const down = (e) => { e.preventDefault(); TouchKeys[key] = true; el.classList.add('active'); };
    const up = (e) => { e.preventDefault(); TouchKeys[key] = false; el.classList.remove('active'); };
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up, { passive: false });
    el.addEventListener('touchcancel', up, { passive: false });
    el.addEventListener('mousedown', down);
    el.addEventListener('mouseup', up);
    el.addEventListener('mouseleave', up);
  }
  bind(document.getElementById('leftBtn'), 'left');
  bind(document.getElementById('rightBtn'), 'right');
  bind(document.getElementById('jumpBtn'), 'jump');
})();

function goFullscreenLandscape() {
  const el = document.documentElement;
  const req = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
  if (req) { try { req.call(el).catch(() => {}); } catch (e) {} }
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock('landscape').catch(() => {});
  }
}

// =============================================================
// BOOT — decide se mostra intro ou vai pro menu
// =============================================================
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  create() {
    let seen = false;
    try { seen = localStorage.getItem('zeco_intro_seen') === '1'; } catch (e) {}
    if (seen) this.scene.start('Menu');
    else this.scene.start('Intro');
  }
}

// =============================================================
// INTRO CUTSCENE
// =============================================================
class IntroScene extends Phaser.Scene {
  constructor() { super('Intro'); }

  init(data) {
    this.fromMenu = !!(data && data.fromMenu);
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0612');
    this.step = 0;
    this.busy = false;
    this.canAdvance = false;

    // camadas
    this.bg = this.add.graphics();
    this.drawSky(0);

    // silhueta da ilha / decor
    this.decor = this.add.graphics();
    this.drawIsland();

    // personagem simples na intro (Zeco e sombra)
    this.zeco = this.add.image(180, 320, 'introZeco').setScale(1.2).setAlpha(0);
    this.baron = this.add.image(620, 300, 'introBaron').setScale(1.3).setAlpha(0);
    this.gemsFx = this.add.graphics().setAlpha(0);

    // caixa de texto
    this.box = this.add.rectangle(W / 2, H - 70, W - 40, 100, 0x12081f, 0.92)
      .setStrokeStyle(2, 0xffd166).setAlpha(0);
    this.speaker = this.add.text(40, H - 112, '', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '14px', color: '#ffd166',
    }).setAlpha(0);
    this.line = this.add.text(40, H - 90, '', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '16px', color: '#fff8e7',
      wordWrap: { width: W - 80 }, lineSpacing: 4,
    }).setAlpha(0);

    // título central (passo 0)
    this.title = this.add.text(W / 2, H / 2 - 20, '', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '42px', color: '#ffd166',
      stroke: '#d1495b', strokeThickness: 4, align: 'center',
    }).setOrigin(0.5).setAlpha(0);
    this.subtitle = this.add.text(W / 2, H / 2 + 30, '', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '16px', color: '#c9b8e8',
    }).setOrigin(0.5).setAlpha(0);

    // botões
    this.skipBtn = this.add.text(W - 16, 14, 'Pular intro ▶', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '13px', color: '#ffd166',
      backgroundColor: 'rgba(0,0,0,0.45)', padding: { x: 8, y: 4 },
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true }).setDepth(50);
    this.skipBtn.on('pointerdown', () => this.finish());

    this.hint = this.add.text(W / 2, H - 18, 'Toque / clique para continuar', {
      fontFamily: 'monospace', fontSize: '12px', color: '#a090c0',
    }).setOrigin(0.5).setAlpha(0);

    this.input.on('pointerdown', (ptr) => {
      // ignora clique no botão pular
      if (ptr.y < 40 && ptr.x > W - 140) return;
      this.advance();
    });
    this.input.keyboard.on('keydown-SPACE', () => this.advance());
    this.input.keyboard.on('keydown-ENTER', () => this.advance());

    this.panels = [
      {
        type: 'title',
        title: '🌴 ZECO 🌴',
        sub: 'Lendas da Ilha',
        duration: 2200,
      },
      {
        type: 'narration',
        speaker: 'Narrador',
        text: 'Há muito tempo, a Ilha das Gemas brilhava com cristais de todos os tamanhos…',
        showZeco: false, showBaron: false, gems: true,
      },
      {
        type: 'narration',
        speaker: 'Narrador',
        text: 'Até que o Barão Sombra roubou as gemas e cobriu a ilha com trevas.',
        showZeco: false, showBaron: true, gems: false, darken: true,
      },
      {
        type: 'narration',
        speaker: 'Narrador',
        text: 'Só restou um herói corajoso para recuperar o que foi tomado.',
        showZeco: true, showBaron: true, gems: false,
      },
      {
        type: 'narration',
        speaker: 'Zeco',
        text: 'Não vou deixar a ilha nas mãos do Barão! Vou recuperar cada gema — e o cristal de cada fase!',
        showZeco: true, showBaron: false, gems: true,
      },
      {
        type: 'narration',
        speaker: 'Barão Sombra',
        text: 'Ha! Venha até meu trono, pequeno aventureiro… se conseguir atravessar a ilha.',
        showZeco: true, showBaron: true, gems: false, darken: true,
      },
      {
        type: 'title',
        title: 'A jornada começa',
        sub: 'Ajude Zeco a salvar a Ilha das Gemas',
        duration: 2000,
      },
    ];

    this.buildIntroTextures();
    // refresh images if texture just created
    if (this.textures.exists('introZeco')) this.zeco.setTexture('introZeco');
    if (this.textures.exists('introBaron')) this.baron.setTexture('introBaron');

    this.time.delayedCall(300, () => this.showPanel(0));
  }

  buildIntroTextures() {
    if (this.textures.exists('introZeco')) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // Zeco simplificado
    g.fillStyle(0x3f9a4f, 1); g.fillEllipse(24, 36, 28, 30);
    g.fillStyle(0xf4c28a, 1); g.fillCircle(24, 16, 13);
    g.fillStyle(0xd62828, 1); g.fillEllipse(24, 8, 14, 5);
    g.fillStyle(0xffffff, 1); g.fillCircle(29, 15, 4);
    g.fillStyle(0x1a1a1a, 1); g.fillCircle(30, 15, 2);
    g.fillStyle(0x4a3220, 1); g.fillRect(14, 48, 8, 14); g.fillRect(26, 48, 8, 14);
    g.generateTexture('introZeco', 48, 66);
    // Barão
    g.clear();
    g.fillStyle(0x1a0a2e, 1); g.fillTriangle(28, 18, 4, 64, 52, 64);
    g.fillStyle(0x3a1e5c, 1); g.fillEllipse(28, 36, 24, 32);
    g.fillStyle(0x1a1a2e, 1); g.fillCircle(28, 16, 13);
    g.fillStyle(0xff0040, 1); g.fillCircle(23, 15, 3); g.fillCircle(33, 15, 3);
    g.fillStyle(0xffd166, 1); g.fillRect(18, 3, 20, 5);
    g.fillTriangle(18, 3, 22, -3, 26, 3);
    g.fillTriangle(26, 3, 28, -5, 30, 3);
    g.fillTriangle(30, 3, 34, -3, 38, 3);
    g.generateTexture('introBaron', 56, 68);
    g.destroy();
  }

  drawSky(dark) {
    this.bg.clear();
    if (dark) {
      this.bg.fillGradientStyle(0x0a0612, 0x0a0612, 0x1b1140, 0x1b1140, 1);
    } else {
      this.bg.fillGradientStyle(0x1b1140, 0x1b1140, 0x3a1e5c, 0x5a3a8a, 1);
    }
    this.bg.fillRect(0, 0, W, H);
    // estrelas
    this.bg.fillStyle(0xffffff, 0.5);
    for (let i = 0; i < 30; i++) {
      const x = (i * 97) % W;
      const y = (i * 53) % 200;
      this.bg.fillCircle(x, y, i % 3 === 0 ? 1.5 : 1);
    }
  }

  drawIsland() {
    this.decor.clear();
    this.decor.fillStyle(0x2a1840, 1);
    this.decor.fillEllipse(W / 2, H - 30, W + 40, 90);
    this.decor.fillStyle(0x3f9a4f, 0.7);
    this.decor.fillEllipse(W / 2 - 40, H - 50, 200, 40);
    // palmeiras simples
    this.decor.lineStyle(5, 0x5c3a15, 1);
    this.decor.lineBetween(80, H - 40, 90, H - 140);
    this.decor.lineBetween(720, H - 40, 710, H - 130);
    this.decor.fillStyle(0x4a9d5c, 1);
    this.decor.fillEllipse(90, H - 145, 40, 18);
    this.decor.fillEllipse(710, H - 135, 40, 18);
  }

  showPanel(i) {
    if (i >= this.panels.length) {
      this.finish();
      return;
    }
    this.step = i;
    this.busy = true;
    this.canAdvance = false;
    const p = this.panels[i];

    // fade out texto atual
    this.tweens.add({ targets: [this.line, this.speaker, this.box, this.hint, this.title, this.subtitle], alpha: 0, duration: 200 });

    this.time.delayedCall(220, () => {
      if (p.darken) this.drawSky(true);
      else this.drawSky(false);

      // personagens
      this.tweens.add({
        targets: this.zeco,
        alpha: p.showZeco ? 1 : 0,
        x: p.showBaron && p.showZeco ? 180 : 280,
        duration: 400,
      });
      this.tweens.add({
        targets: this.baron,
        alpha: p.showBaron ? 1 : 0,
        x: p.showZeco && p.showBaron ? 620 : 520,
        duration: 400,
      });

      // gemas decorativas
      this.gemsFx.clear();
      if (p.gems) {
        this.gemsFx.setAlpha(1);
        this.gemsFx.fillStyle(0xff5fa2, 1);
        for (let k = 0; k < 8; k++) {
          const gx = 200 + k * 55;
          const gy = 120 + (k % 2) * 20;
          this.gemsFx.fillTriangle(gx, gy - 8, gx - 7, gy + 4, gx + 7, gy + 4);
        }
      } else {
        this.gemsFx.setAlpha(0);
      }

      if (p.type === 'title') {
        this.title.setText(p.title).setAlpha(0);
        this.subtitle.setText(p.sub || '').setAlpha(0);
        this.tweens.add({ targets: this.title, alpha: 1, duration: 500 });
        this.tweens.add({ targets: this.subtitle, alpha: 1, duration: 500, delay: 200 });
        this.time.delayedCall(p.duration || 2000, () => {
          this.canAdvance = true;
          this.busy = false;
          this.hint.setAlpha(0.8);
          // auto-avança títulos
          this.time.delayedCall(800, () => { if (this.step === i) this.advance(); });
        });
      } else {
        this.speaker.setText(p.speaker || '').setAlpha(0);
        this.line.setText('').setAlpha(0);
        this.box.setAlpha(0);
        this.tweens.add({ targets: [this.box, this.speaker, this.line], alpha: 1, duration: 300 });
        // typewriter
        this.typewrite(p.text, () => {
          this.canAdvance = true;
          this.busy = false;
          this.hint.setAlpha(0.8);
        });
      }
    });
  }

  typewrite(text, onDone) {
    let idx = 0;
    this.line.setText('');
    if (this._typeTimer) this._typeTimer.remove(false);
    this._typeTimer = this.time.addEvent({
      delay: 22,
      repeat: text.length - 1,
      callback: () => {
        idx++;
        this.line.setText(text.slice(0, idx));
        if (idx >= text.length) {
          if (onDone) onDone();
        }
      },
    });
    // se avançar no meio, completa o texto
    this._fullText = text;
    this._typeDone = onDone;
  }

  advance() {
    if (this.busy && this._typeTimer && this._typeTimer.getRemaining() > 0) {
      // completa typewriter de uma vez
      this._typeTimer.remove(false);
      this.line.setText(this._fullText || '');
      this.busy = false;
      this.canAdvance = true;
      this.hint.setAlpha(0.8);
      if (this._typeDone) this._typeDone();
      this._typeDone = null;
      return;
    }
    if (!this.canAdvance) return;
    this.hint.setAlpha(0);
    this.showPanel(this.step + 1);
  }

  finish() {
    try { localStorage.setItem('zeco_intro_seen', '1'); } catch (e) {}
    this.cameras.main.fadeOut(400, 10, 5, 20);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Menu');
    });
  }
}

// =============================================================
// MENU SCENE
// =============================================================
class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    loadProgress();
    this.cameras.main.setBackgroundColor('#1b1030');

    // Fundo decorativo simples
    const g = this.add.graphics();
    g.fillGradientStyle(0x1b1030, 0x1b1030, 0x3a1e5c, 0x3a1e5c, 1);
    g.fillRect(0, 0, W, H);

    this.add.text(W / 2, 90, '🌴 ZECO 🌴', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '48px', color: '#ffd166',
      stroke: '#d1495b', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, 140, 'LENDAS DA ILHA', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '18px', color: '#fff8e7',
      letterSpacing: 6,
    }).setOrigin(0.5);

    if (GameState.bestScore > 0) {
      this.add.text(W / 2, 175, '🏆 Recorde: ' + GameState.bestScore, {
        fontFamily: 'monospace', fontSize: '16px', color: '#ffd166',
      }).setOrigin(0.5);
    }

    this.add.text(W / 2, 220, 'Ajude o Zeco a atravessar a ilha, pular nos\ncapangas do Barão Sombra e coletar todas as gemas!', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '15px', color: '#fff8e7',
      align: 'center', lineSpacing: 4,
    }).setOrigin(0.5);

    this.makeBtn(W / 2, 285, '▶  Jogar', () => {
      initAudio();
      goFullscreenLandscape();
      const idx = resetRun(0);
      this.scene.start('Fase', { levelIndex: idx });
    });

    this.makeBtn(W / 2, 330, '🗺️  Selecionar Fase', () => {
      initAudio();
      this.scene.start('LevelSelect', { continueRun: false });
    }, true);

    this.makeBtn(W / 2, 375, '❓  Como Jogar', () => {
      this.scene.start('HowTo');
    }, true);

    this.makeBtn(W / 2, 420, '🎬  Ver intro', () => {
      this.scene.start('Intro', { fromMenu: true });
    }, true);
  }

  makeBtn(x, y, label, onClick, secondary = false) {
    const bg = this.add.rectangle(x, y, 260, 38, secondary ? 0x3a1e5c : 0xffd166, secondary ? 0.9 : 1)
      .setStrokeStyle(2, 0xffd166)
      .setInteractive({ useHandCursor: true });
    const txt = this.add.text(x, y, label, {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '17px',
      color: secondary ? '#ffd166' : '#3a1e5c',
    }).setOrigin(0.5);
    bg.on('pointerover', () => bg.setScale(1.04));
    bg.on('pointerout', () => bg.setScale(1));
    bg.on('pointerdown', onClick);
    return { bg, txt };
  }
}

// =============================================================
// HOW TO SCENE
// =============================================================
class HowToScene extends Phaser.Scene {
  constructor() { super('HowTo'); }

  create() {
    this.cameras.main.setBackgroundColor('#1b1030');
    this.add.text(W / 2, 40, '❓ Como Jogar', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '28px', color: '#ffd166',
    }).setOrigin(0.5);

    const tips = [
      '⬅️ ➡️ ou A/D — mover   |   ESPAÇO / ⬆️ / W — pular',
      '👟 Pise nos inimigos (walker, jumper, charger, flyer)',
      '📦 Caixas escondem moedas e poderes',
      '⭐ Estrela  ·  🪽 Asas (pulo duplo)  ·  🛡️ Escudo',
      '💗 100 gemas rosas = 1 vida extra',
      '🥈 Gema prateada = objetivo secreto',
      '🚩 Checkpoints  ·  ⏸️ ESC/P pausar',
      '💨 Vento empurra  ·  🧊 Gelo escorrega',
      '🌋 Vulcão e 🏛️ Templo nas fases avançadas',
      '👑 Fase 8: derrote o Barão Sombra (pise / estrela)',
    ];
    tips.forEach((t, i) => {
      this.add.text(W / 2, 80 + i * 26, t, {
        fontFamily: 'Trebuchet MS, sans-serif', fontSize: '15px', color: '#fff8e7',
      }).setOrigin(0.5);
    });

    const bg = this.add.rectangle(W / 2, H - 36, 160, 40, 0x3a1e5c)
      .setStrokeStyle(2, 0xffd166)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H - 36, '◀ Voltar', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '16px', color: '#ffd166',
    }).setOrigin(0.5);
    bg.on('pointerdown', () => this.scene.start('Menu'));
  }
}

// =============================================================
// LEVEL SELECT SCENE
// =============================================================
class LevelSelectScene extends Phaser.Scene {
  constructor() { super('LevelSelect'); }

  init(data) {
    this.continueRun = !!(data && data.continueRun);
    this.justCompleted = data && data.justCompletedIndex != null ? data.justCompletedIndex : null;
  }

  create() {
    loadProgress();
    this.cameras.main.setBackgroundColor('#1b1030');

    this.add.text(W / 2, 36, '🗺️ Selecionar Fase', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '26px', color: '#ffd166',
    }).setOrigin(0.5);

    this.add.text(W / 2, 68, '🔷 Cristal = fase concluída   •   🥈 Gema = objetivo secreto', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '13px', color: '#fff8e7',
    }).setOrigin(0.5);

    const completedCount = GameState.levelProgress.filter(p => p.completed).length;
    this.add.text(W / 2, 92, `Progresso da ilha: ${completedCount}/${LEVELS.length}`, {
      fontFamily: 'monospace', fontSize: '14px', color: '#ffd166',
    }).setOrigin(0.5);

    // barra de progresso
    const barW = 320, barH = 10;
    const barX = (W - barW) / 2, barY = 108;
    this.add.rectangle(W / 2, barY, barW, barH, 0x2a1540).setOrigin(0.5);
    this.add.rectangle(barX, barY, barW * (completedCount / LEVELS.length), barH, 0xffd166).setOrigin(0, 0.5);

    if (this.justCompleted != null) {
      this.add.text(W / 2, 128, `🎉 Fase ${this.justCompleted + 1} concluída! Pontuação: ${GameState.score}`, {
        fontFamily: 'monospace', fontSize: '14px', color: '#8fe388',
      }).setOrigin(0.5);
    }

    const cols = 4;
    const tileW = 160, tileH = 100;
    const gapX = 14, gapY = 14;
    const startX = (W - cols * (tileW + gapX)) / 2 + tileW / 2 + gapX / 2;
    const startY = 175;

    const nextUp = GameState.levelProgress.findIndex(p => !p.completed);

    LEVELS.forEach((lvl, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * (tileW + gapX);
      const y = startY + row * (tileH + gapY);
      const prog = GameState.levelProgress[i];
      const nome = lvl.name || ('Fase ' + (i + 1));

      const bg = this.add.rectangle(x, y, tileW, tileH, prog.completed ? 0x2a5a3a : 0x3a1e5c)
        .setStrokeStyle(2, i === this.justCompleted ? 0x8fe388 : (i === nextUp ? 0xffd166 : 0x6b4a8f))
        .setInteractive({ useHandCursor: true });

      this.add.text(x, y - 28, `Fase ${i + 1}`, {
        fontFamily: 'Trebuchet MS, sans-serif', fontSize: '15px', color: '#fff8e7',
      }).setOrigin(0.5);

      this.add.text(x, y - 8, nome.length > 18 ? nome.slice(0, 16) + '…' : nome, {
        fontFamily: 'Trebuchet MS, sans-serif', fontSize: '11px', color: '#c9b8e8',
      }).setOrigin(0.5);

      const icons = (prog.completed ? '🔷' : '⬜') + '  ' + (prog.objective ? '🥈' : '⬜');
      this.add.text(x, y + 16, icons, { fontSize: '18px' }).setOrigin(0.5);

      if (i === nextUp) {
        this.add.text(x, y + 38, 'PRÓXIMA ▶', {
          fontFamily: 'monospace', fontSize: '11px', color: '#ffd166',
        }).setOrigin(0.5);
      } else if (i === this.justCompleted) {
        this.add.text(x, y + 38, 'NOVO 🔷', {
          fontFamily: 'monospace', fontSize: '11px', color: '#8fe388',
        }).setOrigin(0.5);
      }

      bg.on('pointerover', () => bg.setScale(1.04));
      bg.on('pointerout', () => bg.setScale(1));
      bg.on('pointerdown', () => {
        initAudio();
        goFullscreenLandscape();
        if (this.continueRun) {
          this.scene.start('Fase', { levelIndex: i });
        } else {
          resetRun(i);
          this.scene.start('Fase', { levelIndex: i });
        }
      });
    });

    const back = this.add.rectangle(W / 2, H - 36, 160, 40, 0x3a1e5c)
      .setStrokeStyle(2, 0xffd166)
      .setInteractive({ useHandCursor: true });
    this.add.text(W / 2, H - 36, '◀ Voltar', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '16px', color: '#ffd166',
    }).setOrigin(0.5);
    back.on('pointerdown', () => this.scene.start('Menu'));
  }
}

// =============================================================
// FASE SCENE (jogo)
// =============================================================
class FaseScene extends Phaser.Scene {
  constructor() { super('Fase'); }

  init(data) {
    this.levelIndex = (data && data.levelIndex) || 0;
  }

  preload() {}

  create() {
    const lvl = LEVELS[this.levelIndex];
    const theme = THEMES[lvl.theme || 'ilha'];
    this.theme = theme;
    this.buildTextures(theme);
    this.cameras.main.fadeIn(300);
    this.gameTime = 0;
    this.paused = false;

    this.physics.world.setBounds(0, 0, lvl.worldWidth, H);
    this.cameras.main.setBounds(0, 0, lvl.worldWidth, H);

    this.drawBackground(lvl, theme);

    // Chão + plataformas fixas
    this.solids = this.physics.add.staticGroup();
    const ground = this.add.tileSprite(
      lvl.worldWidth / 2, lvl.groundY + (H - lvl.groundY) / 2,
      lvl.worldWidth, H - lvl.groundY, 'groundTile_' + (lvl.theme || 'ilha')
    );
    this.physics.add.existing(ground, true);
    this.solids.add(ground);

    // Plataformas móveis
    this.movingPlatforms = [];
    for (const p of lvl.platforms) {
      const plat = this.add.tileSprite(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h, 'platformTile_' + (lvl.theme || 'ilha'));
      this.physics.add.existing(plat, true);
      if (p.move) {
        plat._mp = { baseX: p.x + p.w / 2, baseY: p.y + p.h / 2, axis: p.move.axis, range: p.move.range, speed: p.move.speed, dx: 0, dy: 0 };
        this.movingPlatforms.push(plat);
      } else {
        this.solids.add(plat);
      }
    }
    this.movingGroup = this.physics.add.staticGroup();
    this.movingPlatforms.forEach(p => this.movingGroup.add(p));
    this.riddenPlatform = null;

    // Espinhos
    this.spikesGroup = this.physics.add.staticGroup();
    for (const s of lvl.spikes) {
      const spike = this.add.tileSprite(s.x + s.w / 2, s.y + s.h / 2, s.w, s.h, 'spikeTile');
      this.physics.add.existing(spike, true);
      this.spikesGroup.add(spike);
    }

    // Inimigos (walker | jumper | flyer | charger)
    this.enemiesGroup = this.physics.add.group({ allowGravity: false });
    for (const e of lvl.enemies) {
      const type = e.type || 'walker';
      const tex = type === 'flyer' ? 'enemyFlyer' : type === 'jumper' ? 'enemyJumper' : type === 'charger' ? 'enemyCharger' : 'enemy';
      const body = this.physics.add.image(e.x, e.y - (type === 'flyer' ? 40 : 0), tex);
      body._data = {
        baseX: e.baseX, range: e.range, dir: e.dir, x: e.x,
        type, jumpTimer: 0, chargeTimer: 0, baseY: e.y - (type === 'flyer' ? 40 : 0),
      };
      this.enemiesGroup.add(body);
    }

    // Caixas
    this.boxesGroup = this.physics.add.staticGroup();
    for (const b of lvl.boxes) {
      const box = this.add.image(b.x + b.w / 2, b.y + b.h / 2, 'box');
      box._contents = b.contents;
      this.physics.add.existing(box, true);
      this.boxesGroup.add(box);
    }

    // Power-ups avulsos
    this.powerupsGroup = this.physics.add.group({ allowGravity: false });
    for (const pu of lvl.powerups) {
      const icon = this.physics.add.image(pu.x, pu.y, 'glow').setTint(this.powerupColor(pu.type));
      icon._ptype = pu.type;
      const label = this.add.text(pu.x, pu.y, this.powerupEmoji(pu.type), { fontSize: '22px' }).setOrigin(0.5);
      icon._label = label;
      this.powerupsGroup.add(icon);
      this.tweens.add({ targets: [icon, label], y: '+=8', duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Gemas
    this.gemsGroup = this.physics.add.group({ allowGravity: false });
    for (const g of lvl.gems) {
      const gem = this.physics.add.image(g.x, g.y, 'gem');
      this.gemsGroup.add(gem);
      this.tweens.add({ targets: gem, y: g.y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // Gema de prata
    this.gotSilver = false;
    const sg = lvl.silverGem;
    if (sg) {
      this.silverGem = this.physics.add.image(sg.x, sg.y, 'silverGem');
      this.tweens.add({ targets: this.silverGem, y: sg.y - 8, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: this.silverGem, angle: 360, duration: 4000, repeat: -1, ease: 'Linear' });
    }

    // Checkpoints
    this.checkpoints = (lvl.checkpoints || []).map(c => {
      const pole = this.add.rectangle(c.x, c.y - 30, 4, 60, 0x5a3f1a);
      const flag = this.add.triangle(c.x + 2, c.y - 55, 0, 0, 24, 8, 0, 16, 0x8a8a8a).setStrokeStyle(1, 0x555);
      return { x: c.x, y: c.y, flag, active: false };
    });
    this.lastCheckpoint = null;

    // Portal (só libera após derrotar o chefe, se houver)
    this.portalImg = this.add.image(lvl.portalX, lvl.groundY - 60, 'portal');
    this.portalLocked = !!(lvl.boss);
    if (this.portalLocked) this.portalImg.setAlpha(0.35);

    this.windZones = lvl.windZones || [];
    this.iceZones = lvl.iceZones || [];

    // ---------- Chefe final (Barão Sombra) ----------
    this.boss = null;
    this.bossProjectiles = this.physics.add.group({ allowGravity: false });
    this.bossState = null;
    if (lvl.boss) {
      this.initBoss(lvl.boss);
    }

    // Jogador
    this.player = this.physics.add.image(lvl.playerStart.x + 17, lvl.playerStart.y + 20, 'playerRight');
    this.player.body.setMaxVelocity(MAX_SPEED * 1.6, 900);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setSize(26, 44).setOffset(11, 10);
    this.vx = 0;
    this.squashX = 1; this.squashY = 1;
    this.facing = 1;
    this.starTimer = 0;
    this.wingTimer = 0;
    this.shield = false;
    this.doubleJumpUsed = false;
    this.invulnMs = 0;
    this.dead = false;
    this.levelDone = false;

    this.shieldBubble = this.add.image(this.player.x, this.player.y, 'shieldBubble').setVisible(false);

    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.player, this.movingGroup, (_p, plat) => {
      if (this.player.body.touching.down) this._rideCandidate = plat._mp;
    });
    this.physics.add.collider(this.player, this.boxesGroup, (_p, box) => this.tryBreakBox(box));
    this.physics.add.collider(this.player, this.spikesGroup, () => this.hitHazard());

    this.physics.add.overlap(this.player, this.enemiesGroup, (_p, enemy) => this.hitEnemy(enemy));

    this.physics.add.overlap(this.player, this.gemsGroup, (_p, gem) => {
      gem.destroy();
      GameState.score += 10;
      GameState.gemStreak += 1;
      if (typeof playCoin === 'function') playCoin();
      if (GameState.gemStreak >= 100) {
        GameState.gemStreak = 0;
        GameState.lives += 1;
        if (typeof playExtraLife === 'function') playExtraLife();
        this.flashText(this.player.x, this.player.y - 40, '❤️ +1 VIDA!');
      }
      this.refreshHud();
    });

    if (this.silverGem) {
      this.physics.add.overlap(this.player, this.silverGem, () => {
        if (this.gotSilver) return;
        this.gotSilver = true;
        this.silverGem.destroy();
        GameState.score += 100;
        GameState.objectives++;
        GameState.levelProgress[this.levelIndex].objective = true;
        saveProgress();
        if (typeof playObjective === 'function') playObjective();
        this.flashText(this.player.x, this.player.y - 40, '🥈 Objetivo!');
        this.refreshHud();
      });
    }

    this.physics.add.overlap(this.player, this.powerupsGroup, (_p, icon) => {
      this.activatePowerUp(icon._ptype);
      if (icon._label) icon._label.destroy();
      icon.destroy();
      if (typeof playPowerUp === 'function') playPowerUp();
    });

    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
    this.cameras.main.setDeadzone(80, 100);

    // HUD
    this.hud = this.add.text(14, 12, '', {
      fontFamily: 'monospace', fontSize: '16px', color: '#fff',
      backgroundColor: 'rgba(0,0,0,0.4)', padding: { x: 8, y: 4 },
    }).setScrollFactor(0).setDepth(100);
    this.statusHud = this.add.text(14, 42, '', {
      fontFamily: 'monospace', fontSize: '18px',
    }).setScrollFactor(0).setDepth(100);
    this.refreshHud();

    // Pause overlay
    this.pauseText = this.add.text(W / 2, H / 2, '⏸️ PAUSADO\nESC / P para continuar', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '24px', color: '#ffd166',
      align: 'center', backgroundColor: 'rgba(0,0,0,0.7)', padding: { x: 20, y: 16 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200).setVisible(false);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE,P,ESC');

    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-ESC', () => this.togglePause());

    if (theme.sun) this.birdsGfx = this.add.graphics().setScrollFactor(0).setDepth(5);
    else this.starsGfx = this.add.graphics().setScrollFactor(0).setDepth(5);
  }

  togglePause() {
    if (this.levelDone || this.dead) return;
    this.paused = !this.paused;
    this.pauseText.setVisible(this.paused);
    if (this.paused) this.physics.pause();
    else this.physics.resume();
  }

  refreshHud() {
    const hearts = '❤️'.repeat(Math.max(0, GameState.lives));
    const gemProg = GameState.gemStreak + '/100';
    this.hud.setText(`${hearts}  💎 ${GameState.score}  💗 ${gemProg}  🥈 ${GameState.objectives}/${LEVELS.length}  Fase ${this.levelIndex + 1}`);
  }

  powerupColor(type) { return { star: 0xffd166, wing: 0xa0e8ff, shield: 0x8fe388 }[type]; }
  powerupEmoji(type) { return { star: '⭐', wing: '🪽', shield: '🛡️' }[type]; }

  activatePowerUp(type) {
    if (type === 'star') this.starTimer = STAR_MS;
    else if (type === 'wing') { this.wingTimer = WING_MS; this.doubleJumpUsed = false; }
    else if (type === 'shield') this.shield = true;
  }

  tryBreakBox(box) {
    if (!box.active) return;
    const fromAbove = this.player.body.touching.down;
    const fromBelow = this.player.body.touching.up;
    if (!fromAbove && !fromBelow) return;

    const contents = box._contents;
    const bx = box.x, by = box.y;
    box.destroy();
    this.flashText(bx, by, '💥');
    if (typeof playBreak === 'function') playBreak();

    if (contents === 'coin') {
      GameState.score += 15;
      this.flashText(this.player.x, this.player.y - 30, '+15');
      if (typeof playCoin === 'function') playCoin();
    } else if (contents && contents.startsWith('powerup:')) {
      const type = contents.split(':')[1];
      this.activatePowerUp(type);
      this.flashText(this.player.x, this.player.y - 30, this.powerupEmoji(type));
      if (typeof playPowerUp === 'function') playPowerUp();
    }
    this.refreshHud();
    if (fromAbove) this.player.body.setVelocityY(JUMP_VEL * 0.45);
    else this.player.body.setVelocityY(80);
  }

  hitEnemy(enemy) {
    if (!enemy.active || this.dead) return;
    const stomping = this.player.body.velocity.y > 0 && this.player.y < enemy.y - 6;
    if (stomping || this.starTimer > 0) {
      enemy.destroy();
      GameState.score += 25;
      this.flashText(enemy.x, enemy.y, stomping ? '💥' : '⭐💥');
      if (stomping) {
        this.player.body.setVelocityY(JUMP_VEL * 0.6);
        if (typeof playStomp === 'function') playStomp();
      }
      this.refreshHud();
    } else if (this.invulnMs <= 0) {
      this.damagePlayer();
    }
  }

  hitHazard() {
    if (this.starTimer > 0 || this.invulnMs > 0 || this.dead) return;
    this.damagePlayer();
  }

  damagePlayer() {
    if (this.shield) {
      this.shield = false;
      this.invulnMs = 1000;
      this.flashText(this.player.x, this.player.y - 30, '🛡️ quebrou!');
      if (typeof playHurt === 'function') playHurt();
      return;
    }
    this.loseLife();
  }

  loseLife() {
    if (this.dead) return;
    GameState.lives--;
    this.refreshHud();
    this.cameras.main.shake(180, 0.01);
    if (typeof playHurt === 'function') playHurt();
    if (GameState.lives <= 0) {
      this.gameOverThenMenu();
      return;
    }
    const respawn = this.lastCheckpoint || LEVELS[this.levelIndex].playerStart;
    this.player.body.reset(respawn.x + 17, respawn.y + 20);
    this.vx = 0;
    this.invulnMs = 1500;
    this._rideCandidate = null;
    this.riddenPlatform = null;
  }

  gameOverThenMenu() {
    this.dead = true;
    if (GameState.score > GameState.bestScore) {
      GameState.bestScore = GameState.score;
      saveProgress();
    }
    if (typeof playGameOver === 'function') playGameOver();
    this.add.text(W / 2, H / 2, '💀 Fim de Jogo\nO Barão Sombra venceu desta vez...\nPontuação: ' + GameState.score, {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '20px', color: '#fff', align: 'center',
      backgroundColor: 'rgba(0,0,0,0.75)', padding: { x: 20, y: 14 },
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
    this.time.delayedCall(2800, () => {
      this.scene.start('Menu');
    });
  }

  flashText(x, y, str) {
    const t = this.add.text(x, y, str, { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  update(time, delta) {
    if (this.levelDone || this.dead || this.paused) return;
    const dt = delta / 1000;
    const framesElapsed = delta / (1000 / FPS_REF);
    const body = this.player.body;

    this.gameTime += dt;

    if (this.riddenPlatform) {
      body.x += this.riddenPlatform.dx;
      body.y += this.riddenPlatform.dy;
    }

    for (const plat of this.movingPlatforms) {
      const mp = plat._mp;
      const offset = Math.sin(this.gameTime * mp.speed) * mp.range;
      const newX = mp.axis === 'x' ? mp.baseX + offset : mp.baseX;
      const newY = mp.axis === 'y' ? mp.baseY + offset : mp.baseY;
      mp.dx = newX - plat.x;
      mp.dy = newY - plat.y;
      plat.setPosition(newX, newY);
      plat.body.updateFromGameObject();
    }

    if (this.invulnMs > 0) this.invulnMs = Math.max(0, this.invulnMs - delta);
    if (this.starTimer > 0) this.starTimer = Math.max(0, this.starTimer - delta);
    if (this.wingTimer > 0) this.wingTimer = Math.max(0, this.wingTimer - delta);

    const left = this.cursors.left.isDown || this.keys.A.isDown || TouchKeys.left;
    const right = this.cursors.right.isDown || this.keys.D.isDown || TouchKeys.right;
    const jumpHeld = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown || TouchKeys.jump;
    const jumpPressed = jumpHeld && !this.jumpPrev;
    const wasOnGround = this.onGroundPrev;
    const onGround = body.blocked.down || body.touching.down;

    if (onGround) this.coyoteMs = 100;
    else this.coyoteMs = Math.max(0, (this.coyoteMs || 0) - delta);

    if (jumpPressed) this.jumpBufferMs = 120;
    else this.jumpBufferMs = Math.max(0, (this.jumpBufferMs || 0) - delta);

    const effMax = this.starTimer > 0 ? MAX_SPEED * 1.6 : MAX_SPEED;

    if (left) { this.vx -= MOVE_ACC * dt; this.facing = -1; }
    if (right) { this.vx += MOVE_ACC * dt; this.facing = 1; }

    const playerBox = { x: this.player.x - 12, y: this.player.y - 20, w: 24, h: 40 };
    let wind = 0;
    for (const wz of this.windZones) {
      if (playerBox.x < wz.x + wz.w && playerBox.x + playerBox.w > wz.x) wind += wz.strength;
    }
    if (wind !== 0) this.vx += wind * FPS_REF * FPS_REF * dt;

    let onIce = false;
    if (onGround) {
      for (const iz of this.iceZones) {
        if (playerBox.x + playerBox.w > iz.x && playerBox.x < iz.x + iz.w) { onIce = true; break; }
      }
    }
    this.vx *= Math.pow(onIce ? ICE_FRICTION : FRICTION, framesElapsed);
    if (this.vx > effMax) this.vx = effMax;
    if (this.vx < -effMax) this.vx = -effMax;

    const canGroundJump = this.coyoteMs > 0;
    if ((jumpPressed || this.jumpBufferMs > 0) && canGroundJump) {
      body.setVelocityY(JUMP_VEL);
      this.squashY = 1.25; this.squashX = 0.8;
      this.coyoteMs = 0;
      this.jumpBufferMs = 0;
      if (typeof playJump === 'function') playJump(false);
    } else if (jumpPressed && !onGround && this.wingTimer > 0 && !this.doubleJumpUsed) {
      body.setVelocityY(JUMP_VEL * 0.85);
      this.doubleJumpUsed = true;
      this.flashText(this.player.x, this.player.y, '🪽');
      if (typeof playJump === 'function') playJump(true);
    }
    this.jumpPrev = jumpHeld;

    body.setVelocityX(this.vx);
    if (!onGround) body.setVelocityY(body.velocity.y + GRAVITY * dt);
    if (onGround) this.doubleJumpUsed = false;

    if (onGround && !wasOnGround) { this.squashY = 0.72; this.squashX = 1.28; }
    this.onGroundPrev = onGround;

    this.squashX += (1 - this.squashX) * Math.min(1, 12 * dt);
    this.squashY += (1 - this.squashY) * Math.min(1, 12 * dt);
    this.player.setScale(this.squashX, this.squashY);
    this.player.setFlipX(this.facing < 0);
    this.player.setTexture(Math.abs(this.vx) > 30 ? 'playerWalk' : 'playerRight');

    if (this.starTimer > 0) {
      const hue = (time / 5) % 360;
      this.player.setTint(Phaser.Display.Color.HSVToRGB(hue / 360, 0.9, 1).color);
    } else if (this.invulnMs > 0) {
      this.player.setAlpha(Math.floor(time / 80) % 2 === 0 ? 0.35 : 1);
      this.player.clearTint();
    } else {
      this.player.setAlpha(1);
      this.player.clearTint();
    }

    this.shieldBubble.setVisible(this.shield);
    if (this.shield) {
      this.shieldBubble.setPosition(this.player.x, this.player.y);
      this.shieldBubble.setAlpha(0.5 + Math.sin(time / 150) * 0.15);
    }

    let status = '';
    if (this.starTimer > 0) status += '⭐ ' + Math.ceil(this.starTimer / 1000) + 's  ';
    if (this.wingTimer > 0) status += '🪽 ' + Math.ceil(this.wingTimer / 1000) + 's  ';
    if (this.shield) status += '🛡️';
    this.statusHud.setText(status);

    this.riddenPlatform = this._rideCandidate;
    this._rideCandidate = null;

    for (const enemy of this.enemiesGroup.getChildren()) {
      if (!enemy.active) continue;
      const d = enemy._data;
      const type = d.type || 'walker';
      const speed = type === 'charger' ? 110 : type === 'flyer' ? 70 : 60;

      if (type === 'flyer') {
        d.x += d.dir * speed * dt;
        if (d.x > d.baseX + d.range || d.x < d.baseX - d.range) d.dir *= -1;
        enemy.x = d.x;
        enemy.y = d.baseY + Math.sin(this.gameTime * 2.2 + d.baseX) * 18;
      } else if (type === 'jumper') {
        d.x += d.dir * speed * dt;
        if (d.x > d.baseX + d.range || d.x < d.baseX - d.range) d.dir *= -1;
        enemy.x = d.x;
        d.jumpTimer = (d.jumpTimer || 0) + dt;
        if (d.jumpTimer > 1.4) {
          d.jumpTimer = 0;
          enemy.y = d.baseY - 28;
        } else {
          enemy.y += (d.baseY - enemy.y) * Math.min(1, 6 * dt);
        }
      } else if (type === 'charger') {
        // Acelera quando o jogador está na frente
        const dx = this.player.x - enemy.x;
        const facingPlayer = (d.dir > 0 && dx > 0) || (d.dir < 0 && dx < 0);
        const near = Math.abs(dx) < 220 && Math.abs(this.player.y - enemy.y) < 80;
        const spd = (facingPlayer && near) ? speed * 1.8 : speed * 0.7;
        d.x += d.dir * spd * dt;
        if (d.x > d.baseX + d.range || d.x < d.baseX - d.range) d.dir *= -1;
        enemy.x = d.x;
        enemy.y = d.baseY;
      } else {
        d.x += d.dir * speed * dt;
        if (d.x > d.baseX + d.range || d.x < d.baseX - d.range) d.dir *= -1;
        enemy.x = d.x;
        enemy.y = d.baseY;
      }
      enemy.setFlipX(d.dir < 0);
    }

    for (const cp of this.checkpoints) {
      if (!cp.active && Math.abs(this.player.x - cp.x) < 20 && this.player.y > cp.y - 60) {
        cp.active = true;
        cp.flag.fillColor = 0xffd166;
        this.lastCheckpoint = { x: cp.x - 17, y: cp.y - 40 };
        this.flashText(cp.x, cp.y - 60, '🚩');
        if (typeof playCheckpoint === 'function') playCheckpoint();
      }
    }

    if (this.birdsGfx) {
      const g = this.birdsGfx; g.clear();
      g.lineStyle(2, 0x3c2846, 0.5);
      const t = time / 1000;
      for (let i = 0; i < 3; i++) {
        const bx = ((t * 30 + i * 180) % (W + 100)) - 50;
        const by = 50 + i * 22 + Math.sin(t * 2 + i) * 5;
        g.beginPath();
        g.moveTo(bx - 8, by); g.lineTo(bx - 4, by - 6); g.lineTo(bx, by);
        g.lineTo(bx + 4, by - 6); g.lineTo(bx + 8, by);
        g.strokePath();
      }
    }
    if (this.starsGfx) {
      const g = this.starsGfx; g.clear();
      for (let i = 0; i < 40; i++) {
        const sx = (i * 97) % W, sy = (i * 53) % 220;
        const tw = 0.5 + 0.5 * Math.sin(time / 500 + i);
        g.fillStyle(0xffffff, 0.3 + tw * 0.5);
        g.fillRect(sx, sy, 2, 2);
      }
    }

    if (this.player.y > H + 100) { this.loseLife(); return; }

    // Chefe
    if (this.boss && this.boss.active) {
      this.updateBoss(time, delta);
    }

    // Projéteis do chefe
    for (const p of this.bossProjectiles.getChildren()) {
      if (!p.active) continue;
      p.x += p._vx * (delta / 1000);
      p.y += p._vy * (delta / 1000);
      if (p.x < -50 || p.x > LEVELS[this.levelIndex].worldWidth + 50 || p.y < -50 || p.y > H + 50) {
        p.destroy();
      }
    }

    const lvl = LEVELS[this.levelIndex];
    if (this.player.x > lvl.portalX) {
      if (this.portalLocked) {
        // empurra de volta e avisa
        this.player.x = lvl.portalX - 10;
        this.vx = -120;
        if (!this._portalWarnAt || time - this._portalWarnAt > 2000) {
          this._portalWarnAt = time;
          this.flashText(this.player.x, this.player.y - 40, '🔒 Derrote o Barão!');
        }
      } else {
        this.completeLevel();
      }
    }
  }

  completeLevel() {
    this.levelDone = true;
    const finishedIndex = this.levelIndex;
    GameState.levelProgress[finishedIndex].completed = true;
    if (this.gotSilver) GameState.levelProgress[finishedIndex].objective = true;
    saveProgress();
    if (typeof playWin === 'function') playWin();

    const next = finishedIndex + 1;
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (next >= LEVELS.length) {
        // Vitória total
        if (GameState.score > GameState.bestScore) {
          GameState.bestScore = GameState.score;
          saveProgress();
        }
        this.add.text(W / 2, H / 2, '🏆 Você venceu!\nZeco recuperou todas as gemas\ne salvou a ilha!\nPontuação final: ' + GameState.score, {
          fontFamily: 'Trebuchet MS, sans-serif', fontSize: '20px', color: '#fff', align: 'center',
          backgroundColor: 'rgba(0,0,0,0.75)', padding: { x: 20, y: 14 },
        }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
        this.cameras.main.fadeIn(400);
        this.time.delayedCall(3500, () => this.scene.start('Menu'));
      } else {
        // Vai para o seletor (mantém corrida)
        GameState.continueRun = true;
        this.scene.start('LevelSelect', { continueRun: true, justCompletedIndex: finishedIndex });
      }
    });
  }


  // ===========================================================
  // CHEFE FINAL — Barão Sombra
  // Padrões: idle → shoot → slam → charge → summon (ciclo)
  // ===========================================================
  initBoss(cfg) {
    this.bossCfg = cfg;
    this.bossHp = cfg.hp;
    this.bossMaxHp = cfg.hp;
    this.bossPhase = 1; // 1 = 100-60%, 2 = 60-30%, 3 = 30-0%
    this.bossPattern = 'intro';
    this.bossTimer = 0;
    this.bossInvuln = 0;
    this.bossIntroDone = false;

    const b = this.physics.add.image(cfg.x, cfg.y, 'boss');
    b.setDepth(20);
    b.body.setAllowGravity(false);
    b.body.setImmovable(true);
    b.body.setSize(48, 56).setOffset(8, 8);
    this.boss = b;
    this.bossBaseY = cfg.y;

    // Barra de HP
    this.bossHpBg = this.add.rectangle(W / 2, 28, 220, 14, 0x1a0a20)
      .setScrollFactor(0).setDepth(150).setStrokeStyle(2, 0x6b2d8f);
    this.bossHpFill = this.add.rectangle(W / 2 - 108, 28, 216, 10, 0xc23f77)
      .setScrollFactor(0).setDepth(151).setOrigin(0, 0.5);
    this.bossNameTag = this.add.text(W / 2, 12, '👑 BARÃO SOMBRA', {
      fontFamily: 'Trebuchet MS, sans-serif', fontSize: '13px', color: '#ffd166',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(152);

    // Colisão projétil → jogador
    this.physics.add.overlap(this.player, this.bossProjectiles, (_p, proj) => {
      if (this.invulnMs > 0 || this.starTimer > 0 || this.dead) return;
      proj.destroy();
      this.damagePlayer();
    });

    // Contato corpo a corpo com o chefe
    this.physics.add.overlap(this.player, this.boss, () => {
      if (!this.boss || !this.boss.active || this.dead) return;
      if (this.bossInvuln > 0) return;
      const stomping = this.player.body.velocity.y > 80 && this.player.y < this.boss.y - 10;
      if (stomping || this.starTimer > 0) {
        this.hurtBoss(stomping ? 2 : 3);
        if (stomping) this.player.body.setVelocityY(JUMP_VEL * 0.7);
      } else if (this.invulnMs <= 0) {
        this.damagePlayer();
      }
    });

    this.flashText(cfg.x, cfg.y - 80, '👑 BARÃO SOMBRA');
  }

  updateBossHpBar() {
    if (!this.bossHpFill) return;
    const pct = Math.max(0, this.bossHp / this.bossMaxHp);
    this.bossHpFill.width = 216 * pct;
    if (pct > 0.6) this.bossHpFill.setFillStyle(0xc23f77);
    else if (pct > 0.3) this.bossHpFill.setFillStyle(0xff9f1c);
    else this.bossHpFill.setFillStyle(0xe63946);
  }

  hurtBoss(dmg) {
    if (!this.boss || !this.boss.active || this.bossInvuln > 0) return;
    this.bossHp -= dmg;
    this.bossInvuln = 400;
    this.boss.setTint(0xffffff);
    this.cameras.main.shake(120, 0.008);
    GameState.score += 15 * dmg;
    this.refreshHud();
    this.updateBossHpBar();
    if (typeof playStomp === 'function') playStomp();

    const pct = this.bossHp / this.bossMaxHp;
    if (pct <= 0.3) this.bossPhase = 3;
    else if (pct <= 0.6) this.bossPhase = 2;
    else this.bossPhase = 1;

    if (this.bossHp <= 0) {
      this.defeatBoss();
    }
  }

  defeatBoss() {
    // Limpa projéteis
    this.bossProjectiles.clear(true, true);
    const bx = this.boss.x, by = this.boss.y;
    this.boss.destroy();
    this.boss = null;

    // Efeitos de vitória no chefe
    for (let i = 0; i < 12; i++) {
      this.time.delayedCall(i * 60, () => {
        this.flashText(bx + (Math.random() - 0.5) * 60, by + (Math.random() - 0.5) * 40, '💥');
      });
    }
    GameState.score += 500;
    this.refreshHud();
    if (typeof playWin === 'function') playWin();

    this.portalLocked = false;
    if (this.portalImg) {
      this.portalImg.setAlpha(1);
      this.tweens.add({ targets: this.portalImg, scaleX: 1.15, scaleY: 1.15, yoyo: true, duration: 400, repeat: 2 });
    }
    if (this.bossHpBg) this.bossHpBg.setVisible(false);
    if (this.bossHpFill) this.bossHpFill.setVisible(false);
    if (this.bossNameTag) this.bossNameTag.setText('👑 BARÃO DERROTADO!').setColor('#8fe388');

    this.flashText(bx, by - 50, '🏆 +500');
    this.time.delayedCall(1500, () => {
      if (this.bossNameTag) this.bossNameTag.setVisible(false);
    });
  }

  bossFireProjectile(x, y, angle, speed) {
    const p = this.physics.add.image(x, y, 'bossShot');
    p._vx = Math.cos(angle) * speed;
    p._vy = Math.sin(angle) * speed;
    p.setDepth(25);
    this.bossProjectiles.add(p);
    this.tweens.add({ targets: p, angle: 360, duration: 800, repeat: -1 });
  }

  updateBoss(time, delta) {
    if (!this.boss || !this.boss.active) return;
    const dt = delta / 1000;
    this.bossTimer += dt;
    if (this.bossInvuln > 0) {
      this.bossInvuln -= delta;
      this.boss.setAlpha(Math.floor(time / 60) % 2 ? 0.5 : 1);
      if (this.bossInvuln <= 0) {
        this.boss.setAlpha(1);
        this.boss.clearTint();
      }
    }

    const cfg = this.bossCfg;
    const px = this.player.x;
    const py = this.player.y;

    // Flutuação base
    this.boss.y = this.bossBaseY + Math.sin(time / 400) * 10;

    // Intro: desce e ruge
    if (this.bossPattern === 'intro') {
      if (this.bossTimer > 1.2) {
        this.bossPattern = 'idle';
        this.bossTimer = 0;
        this.flashText(this.boss.x, this.boss.y - 70, '💀');
      }
      return;
    }

    // Troca de padrão por fase (mais agressivo com menos HP)
    const shootCd = this.bossPhase === 3 ? 0.9 : this.bossPhase === 2 ? 1.2 : 1.6;
    const patternDur = {
      idle: 0.8,
      shoot: shootCd,
      slam: 1.4,
      charge: 1.6,
      summon: 1.2,
    };

    if (this.bossPattern === 'idle') {
      // Olha pro jogador
      this.boss.setFlipX(px < this.boss.x);
      if (this.bossTimer > patternDur.idle) {
        // Escolhe próximo padrão
        const roll = Math.random();
        if (this.bossPhase >= 2 && roll < 0.25) this.bossPattern = 'summon';
        else if (roll < 0.4) this.bossPattern = 'shoot';
        else if (roll < 0.7) this.bossPattern = 'slam';
        else this.bossPattern = 'charge';
        this.bossTimer = 0;
        this._chargeDir = px >= this.boss.x ? 1 : -1;
        this._slamDone = false;
        this._shootStep = 0;
      }
    } else if (this.bossPattern === 'shoot') {
      // Rajada de projéteis em leque / mirados
      this.boss.setTint(0x9b59b6);
      if (this._shootStep === 0 && this.bossTimer > 0.25) {
        this._shootStep = 1;
        const baseAng = Math.atan2(py - this.boss.y, px - this.boss.x);
        const count = this.bossPhase === 3 ? 7 : this.bossPhase === 2 ? 5 : 3;
        const spread = 0.35;
        for (let i = 0; i < count; i++) {
          const a = baseAng + (i - (count - 1) / 2) * spread;
          this.bossFireProjectile(this.boss.x, this.boss.y, a, 180 + this.bossPhase * 30);
        }
        if (typeof playHurt === 'function') playHurt();
      }
      // segunda salva na fase 3
      if (this.bossPhase >= 3 && this._shootStep === 1 && this.bossTimer > 0.55) {
        this._shootStep = 2;
        const baseAng = Math.atan2(py - this.boss.y, px - this.boss.x);
        for (let i = -1; i <= 1; i++) {
          this.bossFireProjectile(this.boss.x, this.boss.y, baseAng + i * 0.2, 240);
        }
      }
      if (this.bossTimer > patternDur.shoot) {
        this.boss.clearTint();
        this.bossPattern = 'idle';
        this.bossTimer = 0;
      }
    } else if (this.bossPattern === 'slam') {
      // Sobe e desce com onda de choque (projéteis no chão)
      if (this.bossTimer < 0.35) {
        this.boss.y = this.bossBaseY - 50 * (this.bossTimer / 0.35);
      } else if (this.bossTimer < 0.55) {
        this.boss.y = this.bossBaseY - 50 + 50 * ((this.bossTimer - 0.35) / 0.2);
        if (!this._slamDone) {
          this._slamDone = true;
          this.cameras.main.shake(200, 0.015);
          const n = this.bossPhase >= 2 ? 6 : 4;
          for (let i = 0; i < n; i++) {
            const dir = i % 2 === 0 ? 1 : -1;
            const dist = 40 + Math.floor(i / 2) * 50;
            this.bossFireProjectile(this.boss.x + dir * 20, this.bossBaseY + 30, dir > 0 ? 0 : Math.PI, 140 + i * 15);
          }
          if (typeof playBreak === 'function') playBreak();
        }
      } else {
        this.boss.y = this.bossBaseY + Math.sin(time / 400) * 6;
      }
      if (this.bossTimer > patternDur.slam) {
        this.bossPattern = 'idle';
        this.bossTimer = 0;
      }
    } else if (this.bossPattern === 'charge') {
      // Investida horizontal
      this.boss.setTint(0xe63946);
      const spd = 220 + this.bossPhase * 40;
      this.boss.x += this._chargeDir * spd * dt;
      // limita à arena
      if (this.boss.x < cfg.arenaLeft) { this.boss.x = cfg.arenaLeft; this._chargeDir = 1; }
      if (this.boss.x > cfg.arenaRight) { this.boss.x = cfg.arenaRight; this._chargeDir = -1; }
      this.boss.setFlipX(this._chargeDir < 0);
      if (this.bossTimer > patternDur.charge) {
        this.boss.clearTint();
        this.bossPattern = 'idle';
        this.bossTimer = 0;
        // volta pro centro da arena
        this.tweens.add({ targets: this.boss, x: cfg.x, duration: 500, ease: 'Sine.easeInOut' });
      }
    } else if (this.bossPattern === 'summon') {
      // Invoca um walker temporário
      if (this.bossTimer > 0.3 && !this._summoned) {
        this._summoned = true;
        this.flashText(this.boss.x, this.boss.y - 60, '👻');
        const sx = Phaser.Math.Clamp(this.boss.x + (Math.random() < 0.5 ? -80 : 80), cfg.arenaLeft, cfg.arenaRight);
        const body = this.physics.add.image(sx, LEVELS[this.levelIndex].groundY - 20, 'enemy');
        body._data = {
          baseX: sx, range: 90, dir: Math.random() < 0.5 ? 1 : -1, x: sx,
          type: 'walker', jumpTimer: 0, chargeTimer: 0, baseY: LEVELS[this.levelIndex].groundY - 20,
        };
        this.enemiesGroup.add(body);
        if (typeof playCheckpoint === 'function') playCheckpoint();
      }
      if (this.bossTimer > patternDur.summon) {
        this._summoned = false;
        this.bossPattern = 'idle';
        this.bossTimer = 0;
      }
    }
  }

  drawBackground(lvl, theme) {
    this.add.image(W / 2, H / 2, 'sky_' + (lvl.theme || 'ilha')).setScrollFactor(0).setDisplaySize(W, H);
    this.add.image(680, 70, theme.sun ? 'sun' : 'moon').setScrollFactor(0);
    const cloudKey = theme.sun ? 'cloud' : 'cloud_night';
    for (let i = 0; i < 16; i++) this.add.image(i * 260 + 80, 80, cloudKey).setScrollFactor(0.3, 0);
    for (let i = 0; i < 20; i++) this.add.image(i * 220 + 110, H - 35, 'hill_' + (lvl.theme || 'ilha')).setScrollFactor(0.6, 0).setOrigin(0.5, 1);
    for (let i = 0; i < 14; i++) this.add.image(i * 300 + 150, H - 150, 'palm_' + (lvl.theme || 'ilha')).setScrollFactor(0.6, 0).setOrigin(0.5, 1);
  }

  buildTextures(theme) {
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const themeName = Object.keys(THEMES).find(k => THEMES[k] === theme);

    if (!this.textures.exists('sky_' + themeName)) {
      g.clear();
      g.fillGradientStyle(theme.skyTop, theme.skyTop, theme.skyBot, theme.skyBot, 1);
      g.fillRect(0, 0, W, H);
      g.generateTexture('sky_' + themeName, W, H);

      g.clear();
      g.fillStyle(theme.hill, 1);
      g.beginPath();
      g.moveTo(0, 140); g.lineTo(0, 60);
      g.arc(110, 60, 110, Math.PI, 0, false);
      g.lineTo(220, 140); g.closePath(); g.fillPath();
      g.generateTexture('hill_' + themeName, 220, 140);

      g.clear();
      g.lineStyle(6, theme.sun ? 0x6b4226 : 0x2b2040, 1);
      g.beginPath(); g.moveTo(4, 150); g.lineTo(14, 30); g.strokePath();
      g.fillStyle(theme.sun ? 0x4a9d5c : 0x4a3d78, 1);
      for (let j = 0; j < 5; j++) {
        const ang = (j / 5) * Math.PI * 2;
        g.fillEllipse(14 + Math.cos(ang) * 22, 26 + Math.sin(ang) * 12, 34, 14);
      }
      g.generateTexture('palm_' + themeName, 60, 160);

      g.clear();
      g.fillStyle(theme.ground, 1); g.fillRect(0, 0, 24, 24);
      g.fillStyle(theme.grass, 1); g.fillRect(0, 0, 24, 7);
      g.generateTexture('platformTile_' + themeName, 24, 24);

      g.clear();
      g.fillStyle(theme.ground, 1); g.fillRect(0, 0, 24, 70);
      g.fillStyle(theme.grass, 1); g.fillRect(0, 0, 24, 14);
      g.generateTexture('groundTile_' + themeName, 24, 70);
    }

    this._buildCommonTextures(g);
  }

  _buildCommonTextures(g) {
    if (!this.textures.exists('sun')) {
      g.clear();
      g.fillStyle(0xfff4be, 0.35); g.fillCircle(70, 70, 70);
      g.fillStyle(0xfff4be, 0.6); g.fillCircle(70, 70, 45);
      g.fillStyle(0xfff3b0, 1); g.fillCircle(70, 70, 26);
      g.generateTexture('sun', 140, 140);
    }
    if (!this.textures.exists('moon')) {
      g.clear();
      g.fillStyle(0xe6e6ff, 0.5); g.fillCircle(55, 55, 55);
      g.fillStyle(0xf4f4ff, 1); g.fillCircle(55, 55, 22);
      g.generateTexture('moon', 110, 110);
    }
    if (!this.textures.exists('cloud')) {
      g.clear();
      g.fillStyle(0xffffff, 0.85);
      g.fillEllipse(40, 20, 80, 40); g.fillEllipse(70, 15, 60, 36);
      g.generateTexture('cloud', 110, 45);
    }
    if (!this.textures.exists('cloud_night')) {
      g.clear();
      g.fillStyle(0xb4b4dc, 0.25);
      g.fillEllipse(40, 20, 80, 40); g.fillEllipse(70, 15, 60, 36);
      g.generateTexture('cloud_night', 110, 45);
    }
    if (!this.textures.exists('spikeTile')) {
      g.clear();
      g.fillStyle(0xd64550, 1);
      g.fillTriangle(0, 15, 6, 0, 12, 15);
      g.generateTexture('spikeTile', 12, 15);
    }
    if (!this.textures.exists('box')) {
      g.clear();
      g.fillStyle(0xb5772f, 1); g.fillRect(0, 0, 34, 34);
      g.lineStyle(2, 0x5c3a15, 1); g.strokeRect(1.5, 1.5, 31, 31);
      g.beginPath(); g.moveTo(4, 4); g.lineTo(30, 30); g.moveTo(30, 4); g.lineTo(4, 30); g.strokePath();
      g.generateTexture('box', 34, 34);
    }
    if (!this.textures.exists('gem')) {
      g.clear();
      g.fillStyle(0xc23f77, 1);
      g.fillTriangle(9, 2, 0, 9, 9, 18); g.fillTriangle(9, 2, 18, 9, 9, 18);
      g.fillStyle(0xff5fa2, 1);
      g.fillTriangle(9, 2, 3, 8, 9, 9); g.fillTriangle(9, 2, 15, 8, 9, 9);
      g.fillStyle(0xffd7e8, 0.9); g.fillTriangle(9, 2, 6, 6, 9, 7);
      g.generateTexture('gem', 18, 18);
    }
    if (!this.textures.exists('silverGem')) {
      g.clear();
      g.fillStyle(0xb9c4cc, 1);
      g.fillTriangle(13, 2, 0, 13, 13, 26); g.fillTriangle(13, 2, 26, 13, 13, 26);
      g.fillStyle(0xe8eef2, 1);
      g.fillTriangle(13, 2, 5, 12, 13, 13); g.fillTriangle(13, 2, 21, 12, 13, 13);
      g.fillStyle(0xffffff, 0.9); g.fillTriangle(13, 2, 8, 9, 13, 10);
      g.generateTexture('silverGem', 26, 26);
    }
    if (!this.textures.exists('glow')) {
      g.clear();
      g.fillStyle(0xffffff, 0.5); g.fillCircle(16, 16, 16);
      g.generateTexture('glow', 32, 32);
    }
    if (!this.textures.exists('shieldBubble')) {
      g.clear();
      g.fillStyle(0x8fe388, 0.25); g.fillCircle(24, 24, 24);
      g.lineStyle(2, 0x8fe388, 0.8); g.strokeCircle(24, 24, 22);
      g.generateTexture('shieldBubble', 48, 48);
    }
    if (!this.textures.exists('portal')) {
      g.clear();
      g.fillStyle(0xffb703, 0.25); g.fillEllipse(30, 60, 52, 120);
      g.fillStyle(0xfff2c2, 0.6); g.fillEllipse(30, 60, 30, 90);
      g.generateTexture('portal', 60, 120);
    }
    if (!this.textures.exists('enemy')) {
      // Walker — goblin roxo básico
      g.clear();
      g.fillStyle(0x4a3580, 1); g.fillEllipse(16, 22, 30, 24);
      g.fillStyle(0x6a4fb0, 1); g.fillEllipse(16, 18, 28, 20);
      g.fillStyle(0x3a2870, 1); g.fillTriangle(4, 12, 0, 2, 10, 10);
      g.fillTriangle(28, 12, 32, 2, 22, 10);
      g.fillStyle(0x2a1a45, 1); g.fillRect(9, 28, 5, 6); g.fillRect(18, 28, 5, 6);
      g.fillStyle(0xffffff, 1); g.fillCircle(21, 14, 6);
      g.fillStyle(0x1a1a1a, 1); g.fillCircle(23, 14, 3);
      g.fillStyle(0xff6b6b, 0.7); g.fillCircle(12, 18, 2);
      g.generateTexture('enemy', 34, 36);
    }
    if (!this.textures.exists('enemyJumper')) {
      // Jumper — mais alto, pernas molas
      g.clear();
      g.fillStyle(0x2d6a4f, 1); g.fillEllipse(16, 18, 28, 22);
      g.fillStyle(0x40916c, 1); g.fillEllipse(16, 15, 26, 18);
      g.fillStyle(0x1b4332, 1);
      g.fillRect(8, 26, 6, 10); g.fillRect(18, 26, 6, 10);
      g.fillStyle(0x52b788, 1); g.fillCircle(11, 36, 5); g.fillCircle(21, 36, 5);
      g.fillStyle(0xffffff, 1); g.fillCircle(20, 12, 6);
      g.fillStyle(0x081c15, 1); g.fillCircle(22, 12, 3);
      g.fillStyle(0xffd60a, 1); g.fillTriangle(10, 6, 16, 0, 22, 6);
      g.generateTexture('enemyJumper', 34, 42);
    }
    if (!this.textures.exists('enemyFlyer')) {
      // Flyer — morcego / espírito
      g.clear();
      g.fillStyle(0x7b2cbf, 0.9); g.fillEllipse(18, 16, 22, 18);
      g.fillStyle(0x9d4edd, 1); g.fillEllipse(18, 14, 18, 14);
      // asas
      g.fillStyle(0x5a189a, 0.85);
      g.fillTriangle(8, 14, -4, 4, 6, 20);
      g.fillTriangle(28, 14, 40, 4, 30, 20);
      g.fillStyle(0xffffff, 1); g.fillCircle(22, 12, 5);
      g.fillStyle(0xff006e, 1); g.fillCircle(23, 12, 2.5);
      g.generateTexture('enemyFlyer', 40, 28);
    }
    if (!this.textures.exists('enemyCharger')) {
      // Charger — armado, mais agressivo
      g.clear();
      g.fillStyle(0x6c2339, 1); g.fillEllipse(18, 20, 32, 24);
      g.fillStyle(0x9b2335, 1); g.fillEllipse(18, 17, 28, 20);
      g.fillStyle(0x3d0c11, 1); g.fillRect(10, 28, 6, 7); g.fillRect(20, 28, 6, 7);
      // chifres
      g.fillStyle(0x2b0a0e, 1);
      g.fillTriangle(8, 10, 4, 0, 14, 10);
      g.fillTriangle(28, 10, 32, 0, 22, 10);
      g.fillStyle(0xffffff, 1); g.fillCircle(24, 14, 6);
      g.fillStyle(0xff0000, 1); g.fillCircle(26, 14, 3);
      // escudo / placa
      g.fillStyle(0xc9a227, 1); g.fillRect(4, 16, 6, 12);
      g.generateTexture('enemyCharger', 36, 38);
    }
    if (!this.textures.exists('boss')) {
      // Barão Sombra — figura alta com capa e coroa
      g.clear();
      // capa
      g.fillStyle(0x1a0a2e, 1);
      g.fillTriangle(32, 20, 4, 70, 60, 70);
      g.fillStyle(0x2d1b4e, 1);
      g.fillTriangle(32, 24, 12, 68, 52, 68);
      // corpo
      g.fillStyle(0x3a1e5c, 1); g.fillEllipse(32, 40, 28, 36);
      g.fillStyle(0x5a3f8f, 1); g.fillEllipse(32, 36, 22, 28);
      // cabeça
      g.fillStyle(0x1a1a2e, 1); g.fillCircle(32, 18, 14);
      g.fillStyle(0x2a2a40, 1); g.fillCircle(32, 17, 12);
      // olhos vermelhos
      g.fillStyle(0xff0040, 1); g.fillCircle(27, 16, 3.5); g.fillCircle(37, 16, 3.5);
      g.fillStyle(0xffaaaa, 1); g.fillCircle(27, 15, 1.5); g.fillCircle(37, 15, 1.5);
      // coroa
      g.fillStyle(0xffd166, 1);
      g.fillRect(22, 4, 20, 6);
      g.fillTriangle(22, 4, 26, -4, 30, 4);
      g.fillTriangle(30, 4, 32, -6, 34, 4);
      g.fillTriangle(34, 4, 38, -4, 42, 4);
      // boca
      g.fillStyle(0x8b0000, 1); g.fillRect(28, 24, 8, 2);
      g.generateTexture('boss', 64, 72);
    }
    if (!this.textures.exists('bossShot')) {
      g.clear();
      g.fillStyle(0x9b59b6, 0.9); g.fillCircle(10, 10, 10);
      g.fillStyle(0xe0aaff, 1); g.fillCircle(10, 10, 6);
      g.fillStyle(0xffffff, 0.9); g.fillCircle(8, 8, 2.5);
      g.generateTexture('bossShot', 20, 20);
    }
    if (!this.textures.exists('playerRight')) this.drawPlayerTexture(g, 'playerRight', 0);
    if (!this.textures.exists('playerWalk')) this.drawPlayerTexture(g, 'playerWalk', 6);

    g.destroy();
  }

  // Personagem com mais detalhe (mais polígonos / formas)
  drawPlayerTexture(g, key, legOffset) {
    g.clear();
    const cx = 22, cy = 32;
    // sombra
    g.fillStyle(0x000000, 0.22); g.fillEllipse(cx, cy + 28, 26, 7);
    // pernas
    g.fillStyle(0x4a3220, 1);
    g.fillRect(cx - 13, cy + 6 - legOffset * 0.25, 10, 18);
    g.fillRect(cx + 3, cy + 6 + legOffset * 0.25, 10, 18);
    // botas
    g.fillStyle(0x2e1c10, 1);
    g.fillRect(cx - 14, cy + 20 - legOffset * 0.25, 12, 7);
    g.fillRect(cx + 2, cy + 20 + legOffset * 0.25, 12, 7);
    // corpo (tronco em camadas)
    g.fillStyle(0x2b6b37, 1); g.fillEllipse(cx, cy - 2, 28, 26);
    g.fillStyle(0x3f9a4f, 1); g.fillEllipse(cx, cy - 5, 24, 22);
    // colete / faixa
    g.fillStyle(0xc0392b, 1); g.fillRect(cx - 16, cy + 4, 32, 6);
    g.fillStyle(0x8f2419, 1); g.fillRect(cx - 3, cy + 4, 6, 6);
    // braços
    g.fillStyle(0x3f9a4f, 1);
    g.fillEllipse(cx - 16, cy + 2, 10, 8);
    g.fillEllipse(cx + 16, cy + 2, 10, 8);
    // cabeça
    g.fillStyle(0xf4c28a, 1); g.fillCircle(cx, cy - 24, 14);
    g.fillStyle(0xe6a878, 0.45); g.fillCircle(cx + 5, cy - 21, 8);
    // cabelo / topete em picos
    g.fillStyle(0x2a1810, 1);
    g.beginPath();
    g.moveTo(cx - 12, cy - 32);
    g.lineTo(cx - 10, cy - 48);
    g.lineTo(cx - 5, cy - 36);
    g.lineTo(cx - 1, cy - 50);
    g.lineTo(cx + 3, cy - 35);
    g.lineTo(cx + 7, cy - 47);
    g.lineTo(cx + 12, cy - 31);
    g.closePath(); g.fillPath();
    // bandana
    g.fillStyle(0xd62828, 1); g.fillEllipse(cx, cy - 33, 14, 5);
    g.beginPath();
    g.moveTo(cx - 12, cy - 32); g.lineTo(cx - 20, cy - 26); g.lineTo(cx - 11, cy - 26);
    g.closePath(); g.fillPath();
    // olho
    g.fillStyle(0xffffff, 1); g.fillCircle(cx + 6, cy - 25, 5.5);
    g.fillStyle(0x1a1a1a, 1); g.fillCircle(cx + 8, cy - 24, 3);
    g.fillStyle(0xffffff, 0.8); g.fillCircle(cx + 9, cy - 25, 1.2);
    // sobrancelha + boca
    g.fillStyle(0x2a1810, 1);
    g.fillRect(cx + 1, cy - 32, 10, 2);
    g.fillRect(cx + 3, cy - 16, 8, 1.8);
    // brinco / detalhe
    g.fillStyle(0xffd166, 1); g.fillCircle(cx - 12, cy - 22, 2);
    g.generateTexture(key, 48, 66);
  }
}

// Boot
loadProgress();
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#1b1030',
  pixelArt: false,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, IntroScene, MenuScene, HowToScene, LevelSelectScene, FaseScene],
});
