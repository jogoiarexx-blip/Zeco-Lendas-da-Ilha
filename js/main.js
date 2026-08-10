// =============================================================
// Zeco e a Ilha das Gemas — Protótipo Phaser
// =============================================================
// Física com as MESMAS constantes do jogo original (js/jogo.js:
// GRAVITY, MOVE_SPEED, FRICTION, MAX_SPEED, JUMP_FORCE), convertidas
// de "por frame a 60fps" pra "por segundo" (unidade do Arcade Physics).
const W = 800, H = 450;
const FPS_REF = 60;

const GRAVITY   = 0.6   * FPS_REF;
const MOVE_ACC  = 0.9   * FPS_REF;
const MAX_SPEED = 5.5   * FPS_REF;
const JUMP_VEL  = -12.5 * FPS_REF;
const FRICTION  = 0.82;

// Progresso que atravessa a troca de fase (score e objetivos acumulam,
// igual ao jogo original — só zeram quando a página recarrega).
const GameState = { score: 0, objectives: 0 };

class FaseScene extends Phaser.Scene {
  constructor() { super('Fase'); }

  init(data) {
    this.levelIndex = (data && data.levelIndex) || 0;
  }

  preload() {}

  create() {
    const lvl = LEVELS[this.levelIndex];
    this.buildTextures();
    this.cameras.main.fadeIn(300);

    this.physics.world.setBounds(0, 0, lvl.worldWidth, H);
    this.cameras.main.setBounds(0, 0, lvl.worldWidth, H);

    this.drawBackground(lvl);

    // ---------- Chão + plataformas ----------
    this.solids = this.physics.add.staticGroup();
    const ground = this.add.tileSprite(
      lvl.worldWidth / 2, lvl.groundY + (H - lvl.groundY) / 2,
      lvl.worldWidth, H - lvl.groundY, 'groundTile'
    );
    this.physics.add.existing(ground, true);
    this.solids.add(ground);
    for (const p of lvl.platforms) {
      const plat = this.add.tileSprite(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h, 'platformTile');
      this.physics.add.existing(plat, true);
      this.solids.add(plat);
    }

    // ---------- Espinhos (visual — dano entra na Fase 2 do plano) ----------
    for (const s of lvl.spikes) {
      this.add.tileSprite(s.x + s.w / 2, s.y + s.h / 2, s.w, s.h, 'spikeTile');
    }

    // ---------- Inimigos: só patrulha visual (colisão/dano = Fase 2 do plano) ----------
    this.enemies = lvl.enemies.map(e => {
      const body = this.add.image(e.x, e.y, 'enemy');
      body._data = { baseX: e.baseX, range: e.range, dir: e.dir, x: e.x };
      return body;
    });

    // ---------- Caixas quebráveis ----------
    this.boxesGroup = this.physics.add.staticGroup();
    for (const b of lvl.boxes) {
      const box = this.add.image(b.x + b.w / 2, b.y + b.h / 2, 'box');
      box._contents = b.contents;
      this.physics.add.existing(box, true);
      this.boxesGroup.add(box);
    }

    // ---------- Power-ups avulsos (cristais soltos no cenário) ----------
    this.powerupsGroup = this.physics.add.group({ allowGravity: false });
    for (const pu of lvl.powerups) {
      const icon = this.physics.add.image(pu.x, pu.y, 'glow').setTint(this.powerupColor(pu.type));
      icon._ptype = pu.type;
      const label = this.add.text(pu.x, pu.y, this.powerupEmoji(pu.type), { fontSize: '22px' }).setOrigin(0.5);
      icon._label = label;
      this.powerupsGroup.add(icon);
      this.tweens.add({ targets: [icon, label], y: '+=8', duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // ---------- Gemas coletáveis ----------
    this.gemsGroup = this.physics.add.group({ allowGravity: false });
    for (const g of lvl.gems) {
      const gem = this.physics.add.image(g.x, g.y, 'gem');
      this.gemsGroup.add(gem);
      this.tweens.add({ targets: gem, y: g.y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // ---------- Gema de prata (objetivo da fase) ----------
    const sg = lvl.silverGem;
    this.silverGem = this.physics.add.image(sg.x, sg.y, 'silverGem');
    this.tweens.add({ targets: this.silverGem, y: sg.y - 8, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.silverGem, angle: 360, duration: 4000, repeat: -1, ease: 'Linear' });

    // ---------- Checkpoint (visual — respawn entra na Fase 2 do plano) ----------
    for (const c of lvl.checkpoints) {
      this.add.rectangle(c.x, c.y - 30, 4, 60, 0x5a3f1a);
      this.add.triangle(c.x + 2, c.y - 55, 0, 0, 24, 8, 0, 16, 0xffd166).setStrokeStyle(1, 0xc9a13a);
    }

    // ---------- Portal de saída ----------
    this.add.image(lvl.portalX, lvl.groundY - 60, 'portal');

    // ---------- Jogador ----------
    this.player = this.physics.add.image(lvl.playerStart.x + 17, lvl.playerStart.y + 20, 'playerRight');
    this.player.body.setMaxVelocity(MAX_SPEED * 1.6, 900);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setSize(24, 40).setOffset(8, 6);
    this.vx = 0;
    this.squashX = 1; this.squashY = 1;
    this.facing = 1;
    this.starTimer = 0;
    this.wingTimer = 0;
    this.shield = false;
    this.doubleJumpUsed = false;

    this.shieldBubble = this.add.image(this.player.x, this.player.y, 'shieldBubble').setVisible(false);

    this.physics.add.collider(this.player, this.solids);

    this.physics.add.collider(this.player, this.boxesGroup, (_p, box) => this.tryBreakBox(box));

    this.physics.add.overlap(this.player, this.gemsGroup, (_p, gem) => {
      gem.destroy();
      GameState.score += 10;
      this.refreshHud();
    });
    this.physics.add.overlap(this.player, this.silverGem, () => {
      if (this.gotSilver) return;
      this.gotSilver = true;
      this.silverGem.destroy();
      GameState.score += 100;
      GameState.objectives++;
      this.refreshHud();
    });
    this.physics.add.overlap(this.player, this.powerupsGroup, (_p, icon) => {
      this.activatePowerUp(icon._ptype);
      icon._label.destroy();
      icon.destroy();
    });

    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
    this.cameras.main.setDeadzone(80, 100);

    this.hud = this.add.text(14, 12, '', {
      fontFamily: 'monospace', fontSize: '18px', color: '#fff',
      backgroundColor: 'rgba(0,0,0,0.35)', padding: { x: 8, y: 4 },
    }).setScrollFactor(0).setDepth(100);
    this.statusHud = this.add.text(14, 46, '', {
      fontFamily: 'monospace', fontSize: '20px',
    }).setScrollFactor(0).setDepth(100);
    this.refreshHud();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');

    this.birdsGfx = this.add.graphics().setScrollFactor(0).setDepth(5);
    this.levelDone = false;
  }

  refreshHud() {
    const total = LEVELS.length;
    this.hud.setText(`💎 ${GameState.score}   🥈 ${GameState.objectives}/${total}   Fase ${this.levelIndex + 1}`);
  }

  powerupColor(type) {
    return { star: 0xffd166, wing: 0xa0e8ff, shield: 0x8fe388 }[type];
  }
  powerupEmoji(type) {
    return { star: '⭐', wing: '🪽', shield: '🛡️' }[type];
  }

  activatePowerUp(type) {
    if (type === 'star') this.starTimer = STAR_MS;
    else if (type === 'wing') { this.wingTimer = WING_MS; this.doubleJumpUsed = false; }
    else if (type === 'shield') this.shield = true;
  }

  tryBreakBox(box) {
    if (!box.active) return;
    const fromAbove = this.player.body.touching.down;
    const fromBelow = this.player.body.touching.up;
    if (!fromAbove && !fromBelow) return; // toque lateral: caixa continua sólida, igual ao original

    const contents = box._contents;
    const bx = box.x, by = box.y;
    box.destroy();
    this.flashText(bx, by, '💥');

    if (contents === 'coin') {
      GameState.score += 15;
      this.flashText(this.player.x, this.player.y - 30, '+15');
    } else if (contents && contents.startsWith('powerup:')) {
      const type = contents.split(':')[1];
      this.activatePowerUp(type);
      this.flashText(this.player.x, this.player.y - 30, this.powerupEmoji(type));
    }
    this.refreshHud();

    if (fromAbove) this.player.body.setVelocityY(JUMP_VEL * 0.45);
    else this.player.body.setVelocityY(80);
  }

  flashText(x, y, str) {
    const t = this.add.text(x, y, str, { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  update(time, delta) {
    if (this.levelDone) return;
    const dt = delta / 1000;
    const framesElapsed = delta / (1000 / FPS_REF);
    const body = this.player.body;

    // ---------- Timers dos cristais ----------
    if (this.starTimer > 0) this.starTimer = Math.max(0, this.starTimer - delta);
    if (this.wingTimer > 0) this.wingTimer = Math.max(0, this.wingTimer - delta);

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const jumpHeld = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown;
    const wasOnGround = this.onGroundPrev;
    const onGround = body.blocked.down || body.touching.down;

    const effMax = this.starTimer > 0 ? MAX_SPEED * 1.6 : MAX_SPEED;

    if (left) { this.vx -= MOVE_ACC * dt; this.facing = -1; }
    if (right) { this.vx += MOVE_ACC * dt; this.facing = 1; }
    this.vx *= Math.pow(FRICTION, framesElapsed);
    if (this.vx > effMax) this.vx = effMax;
    if (this.vx < -effMax) this.vx = -effMax;

    if (jumpHeld && !this.jumpPrev && onGround) {
      body.setVelocityY(JUMP_VEL);
      this.squashY = 1.25; this.squashX = 0.8;
    } else if (jumpHeld && !this.jumpPrev && !onGround && this.wingTimer > 0 && !this.doubleJumpUsed) {
      body.setVelocityY(JUMP_VEL * 0.85);
      this.doubleJumpUsed = true;
      this.flashText(this.player.x, this.player.y, '🪽');
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

    // brilho arco-íris enquanto a estrela está ativa
    if (this.starTimer > 0) {
      const hue = (time / 5) % 360;
      this.player.setTint(Phaser.Display.Color.HSVToRGB(hue / 360, 0.9, 1).color);
    } else {
      this.player.clearTint();
    }

    // bolha do escudo segue o jogador
    this.shieldBubble.setVisible(this.shield);
    if (this.shield) {
      this.shieldBubble.setPosition(this.player.x, this.player.y);
      this.shieldBubble.setAlpha(0.5 + Math.sin(time / 150) * 0.15);
    }

    // status HUD (ícones dos cristais ativos)
    let status = '';
    if (this.starTimer > 0) status += '⭐ ' + Math.ceil(this.starTimer / 1000) + 's  ';
    if (this.wingTimer > 0) status += '🪽 ' + Math.ceil(this.wingTimer / 1000) + 's  ';
    if (this.shield) status += '🛡️';
    this.statusHud.setText(status);

    // ---------- Inimigos: patrulha visual (sem dano ainda) ----------
    for (const e of this.enemies) {
      const d = e._data;
      d.x += d.dir * 60 * dt;
      if (d.x > d.baseX + d.range || d.x < d.baseX - d.range) d.dir *= -1;
      e.x = d.x;
      e.setFlipX(d.dir < 0);
    }

    // ---------- pássaros ----------
    const g = this.birdsGfx;
    g.clear();
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

    // ---------- Portal / próxima fase ----------
    const lvl = LEVELS[this.levelIndex];
    if (this.player.x > lvl.portalX) this.completeLevel();
  }

  completeLevel() {
    this.levelDone = true;
    this.refreshHud();
    const next = this.levelIndex + 1;
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (next < LEVELS.length) {
        this.scene.restart({ levelIndex: next });
      } else {
        this.add.text(W / 2, H / 2, 'Fim do protótipo!\n(mais fases chegam nas próximas etapas)', {
          fontFamily: 'monospace', fontSize: '20px', color: '#fff', align: 'center',
        }).setOrigin(0.5).setScrollFactor(0);
        this.cameras.main.fadeIn(400);
      }
    });
  }

  drawBackground(lvl) {
    this.add.image(W / 2, H / 2, 'sky').setScrollFactor(0).setDisplaySize(W, H);
    this.add.image(680, 70, 'sun').setScrollFactor(0);
    for (let i = 0; i < 16; i++) this.add.image(i * 260 + 80, 80, 'cloud').setScrollFactor(0.3, 0);
    for (let i = 0; i < 20; i++) this.add.image(i * 220 + 110, H - 35, 'hill').setScrollFactor(0.6, 0).setOrigin(0.5, 1);
    for (let i = 0; i < 14; i++) this.add.image(i * 300 + 150, H - 150, 'palm').setScrollFactor(0.6, 0).setOrigin(0.5, 1);
  }

  // Gera todas as texturas do jogo via Graphics — sem nenhum arquivo de
  // imagem externo, no mesmo espírito 100%-vetorial do jogo original.
  buildTextures() {
    if (this.textures.exists('sky')) return; // já geradas numa fase anterior
    const g = this.make.graphics({ x: 0, y: 0, add: false });

    g.clear();
    g.fillGradientStyle(0x7ec8e3, 0x7ec8e3, 0xc9e8d8, 0xc9e8d8, 1);
    g.fillRect(0, 0, W, H);
    g.generateTexture('sky', W, H);

    g.clear();
    g.fillStyle(0xfff4be, 0.35); g.fillCircle(70, 70, 70);
    g.fillStyle(0xfff4be, 0.6); g.fillCircle(70, 70, 45);
    g.fillStyle(0xfff3b0, 1); g.fillCircle(70, 70, 26);
    g.generateTexture('sun', 140, 140);

    g.clear();
    g.fillStyle(0xffffff, 0.85);
    g.fillEllipse(40, 20, 80, 40);
    g.fillEllipse(70, 15, 60, 36);
    g.generateTexture('cloud', 110, 45);

    g.clear();
    g.fillStyle(0x8fc99b, 1);
    g.beginPath();
    g.moveTo(0, 140); g.lineTo(0, 60);
    g.arc(110, 60, 110, Math.PI, 0, false);
    g.lineTo(220, 140); g.closePath(); g.fillPath();
    g.generateTexture('hill', 220, 140);

    g.clear();
    g.lineStyle(6, 0x6b4226, 1);
    g.beginPath(); g.moveTo(4, 150); g.lineTo(14, 30); g.strokePath();
    g.fillStyle(0x4a9d5c, 1);
    for (let j = 0; j < 5; j++) {
      const ang = (j / 5) * Math.PI * 2;
      g.fillEllipse(14 + Math.cos(ang) * 22, 26 + Math.sin(ang) * 12, 34, 14);
    }
    g.generateTexture('palm', 60, 160);

    g.clear();
    g.fillStyle(0x8c5a2b, 1); g.fillRect(0, 0, 24, 24);
    g.fillStyle(0x4caf50, 1); g.fillRect(0, 0, 24, 7);
    g.fillStyle(0x3f9c4a, 1);
    g.fillTriangle(2, 7, 6, 0, 10, 7); g.fillTriangle(14, 7, 18, 1, 22, 7);
    g.generateTexture('platformTile', 24, 24);

    g.clear();
    g.fillStyle(0x8c5a2b, 1); g.fillRect(0, 0, 24, 70);
    g.fillStyle(0x4caf50, 1); g.fillRect(0, 0, 24, 14);
    g.fillStyle(0x3f9c4a, 1);
    g.fillTriangle(2, 14, 6, 4, 10, 14); g.fillTriangle(14, 14, 18, 6, 22, 14);
    g.generateTexture('groundTile', 24, 70);

    g.clear();
    g.fillStyle(0xd64550, 1);
    g.fillTriangle(0, 15, 6, 0, 12, 15);
    g.generateTexture('spikeTile', 12, 15);

    // Caixa de madeira quebrável (mesmo visual do original: X riscado + ponto
    // dourado no topo quando tem power-up dentro — o jogador não sabe qual)
    g.clear();
    g.fillStyle(0xb5772f, 1); g.fillRect(0, 0, 34, 34);
    g.lineStyle(2, 0x5c3a15, 1); g.strokeRect(1.5, 1.5, 31, 31);
    g.beginPath(); g.moveTo(4, 4); g.lineTo(30, 30); g.moveTo(30, 4); g.lineTo(4, 30); g.strokePath();
    g.generateTexture('box', 34, 34);

    g.clear();
    g.fillStyle(0xc23f77, 1);
    g.fillTriangle(9, 2, 0, 9, 9, 18); g.fillTriangle(9, 2, 18, 9, 9, 18);
    g.fillStyle(0xff5fa2, 1);
    g.fillTriangle(9, 2, 3, 8, 9, 9); g.fillTriangle(9, 2, 15, 8, 9, 9);
    g.fillStyle(0xffd7e8, 0.9); g.fillTriangle(9, 2, 6, 6, 9, 7);
    g.generateTexture('gem', 18, 18);

    g.clear();
    g.fillStyle(0xb9c4cc, 1);
    g.fillTriangle(13, 2, 0, 13, 13, 26); g.fillTriangle(13, 2, 26, 13, 13, 26);
    g.fillStyle(0xe8eef2, 1);
    g.fillTriangle(13, 2, 5, 12, 13, 13); g.fillTriangle(13, 2, 21, 12, 13, 13);
    g.fillStyle(0xffffff, 0.9); g.fillTriangle(13, 2, 8, 9, 13, 10);
    g.generateTexture('silverGem', 26, 26);

    // brilho circular usado atrás dos ícones de power-up avulsos
    g.clear();
    g.fillStyle(0xffffff, 0.5); g.fillCircle(16, 16, 16);
    g.generateTexture('glow', 32, 32);

    // bolha translúcida do escudo, ao redor do jogador
    g.clear();
    g.fillStyle(0x8fe388, 0.25); g.fillCircle(24, 24, 24);
    g.lineStyle(2, 0x8fe388, 0.8); g.strokeCircle(24, 24, 22);
    g.generateTexture('shieldBubble', 48, 48);

    // portal de saída da fase
    g.clear();
    g.fillStyle(0xffb703, 0.25); g.fillEllipse(30, 60, 52, 120);
    g.fillStyle(0xfff2c2, 0.6); g.fillEllipse(30, 60, 30, 90);
    g.generateTexture('portal', 60, 120);

    g.clear();
    g.fillStyle(0x5a3f8f, 1); g.fillEllipse(16, 20, 30, 22);
    g.fillStyle(0x6a4fb0, 1); g.fillEllipse(16, 17, 28, 20);
    g.fillStyle(0x2a1a45, 1); g.fillRect(9, 27, 5, 6); g.fillRect(18, 27, 5, 6);
    g.fillStyle(0xffffff, 1); g.fillCircle(21, 13, 7);
    g.fillStyle(0x1a1a1a, 1); g.fillCircle(23, 13, 3.5);
    g.generateTexture('enemy', 32, 34);

    this.drawPlayerTexture(g, 'playerRight', 0);
    this.drawPlayerTexture(g, 'playerWalk', 6);

    g.destroy();
  }

  drawPlayerTexture(g, key, legOffset) {
    g.clear();
    const cx = 20, cy = 30;
    g.fillStyle(0x000000, 0.2); g.fillEllipse(cx, cy + 24, 22, 6);
    g.fillStyle(0x4a3220, 1);
    g.fillRect(cx - 12, cy + 6 - legOffset * 0.2, 9, 16);
    g.fillRect(cx + 3, cy + 6 + legOffset * 0.2, 9, 16);
    g.fillStyle(0x2e1c10, 1);
    g.fillRect(cx - 12, cy + 17 - legOffset * 0.2, 9, 6);
    g.fillRect(cx + 3, cy + 17 + legOffset * 0.2, 9, 6);
    g.fillStyle(0x3f9a4f, 1); g.fillEllipse(cx, cy - 4, 24, 24);
    g.fillStyle(0x2b6b37, 1); g.fillTriangle(cx - 6, cy - 14, cx, cy - 4, cx + 6, cy - 14);
    g.fillStyle(0xc0392b, 1); g.fillRect(cx - 15, cy + 4, 30, 5);
    g.fillStyle(0x8f2419, 1); g.fillRect(cx - 3, cy + 4, 6, 5);
    g.fillStyle(0xf4c28a, 1); g.fillCircle(cx, cy - 22, 13);
    g.fillStyle(0xe6a878, 0.4); g.fillCircle(cx + 5, cy - 19, 8);
    g.fillStyle(0x2a1810, 1);
    g.beginPath();
    g.moveTo(cx - 11, cy - 30); g.lineTo(cx - 9, cy - 43); g.lineTo(cx - 4, cy - 34);
    g.lineTo(cx - 1, cy - 46); g.lineTo(cx + 3, cy - 33); g.lineTo(cx + 7, cy - 43);
    g.lineTo(cx + 11, cy - 29); g.closePath(); g.fillPath();
    g.fillStyle(0xd62828, 1); g.fillEllipse(cx, cy - 31, 12, 4.5);
    g.beginPath();
    g.moveTo(cx - 11, cy - 30); g.lineTo(cx - 19, cy - 24); g.lineTo(cx - 10, cy - 24);
    g.closePath(); g.fillPath();
    g.fillStyle(0xffffff, 1); g.fillCircle(cx + 6, cy - 23, 5.5);
    g.fillStyle(0x1a1a1a, 1); g.fillCircle(cx + 8, cy - 22, 3);
    g.fillStyle(0x2a1810, 1);
    g.fillRect(cx + 1, cy - 30, 9, 2); g.fillRect(cx + 3, cy - 15, 8, 1.5);
    g.generateTexture(key, 44, 60);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: W,
  height: H,
  backgroundColor: '#7ec8e3',
  pixelArt: false,
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: FaseScene,
});
