// =============================================================
// Zeco e a Ilha das Gemas — Protótipo Phaser
// =============================================================
const W = 800, H = 450;
const FPS_REF = 60;

// GRAVITY e MOVE_ACC eram somados direto à velocidade a cada frame no jogo
// original (ex: vy += 0.6 a cada 1/60s) — ou seja, são ACELERAÇÕES em
// px/frame². Pra virar px/s² (unidade do Arcade Physics), multiplica por
// FPS_REF ao quadrado, não só por FPS_REF (esse era o bug: gravidade e
// aceleração horizontal ficavam 60× mais fracas que o original).
const GRAVITY   = 0.6   * FPS_REF * FPS_REF;
const MOVE_ACC  = 0.9   * FPS_REF * FPS_REF;
const MAX_SPEED = 5.5   * FPS_REF;
const JUMP_VEL  = -12.5 * FPS_REF;
const FRICTION  = 0.82;
const ICE_FRICTION = 0.97;
const STARTING_LIVES = 3;

// Progresso que atravessa a troca de fase (zera só se a página recarregar).
const GameState = { score: 0, objectives: 0, lives: STARTING_LIVES };

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
    this.gameTime = 0; // relógio de fase (só avança com o jogo rodando) — usado nas plataformas móveis

    this.physics.world.setBounds(0, 0, lvl.worldWidth, H);
    this.cameras.main.setBounds(0, 0, lvl.worldWidth, H);

    this.drawBackground(lvl, theme);

    // ---------- Chão + plataformas fixas ----------
    this.solids = this.physics.add.staticGroup();
    const ground = this.add.tileSprite(
      lvl.worldWidth / 2, lvl.groundY + (H - lvl.groundY) / 2,
      lvl.worldWidth, H - lvl.groundY, 'groundTile_' + lvl.theme
    );
    this.physics.add.existing(ground, true);
    this.solids.add(ground);

    // ---------- Plataformas móveis (vaivém, senoidal) ----------
    this.movingPlatforms = [];
    for (const p of lvl.platforms) {
      const plat = this.add.tileSprite(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h, 'platformTile_' + lvl.theme);
      this.physics.add.existing(plat, true);
      if (p.move) {
        plat._mp = { baseX: p.x + p.w / 2, baseY: p.y + p.h / 2, axis: p.move.axis, range: p.move.range, speed: p.move.speed, dx: 0, dy: 0 };
        this.movingPlatforms.push(plat);
      } else {
        this.solids.add(plat);
      }
    }
    // Plataformas móveis colidem à parte, pra podermos detectar quando o
    // jogador está "montado" nelas e aplicar o deslocamento (ver riddenPlatform).
    this.movingGroup = this.physics.add.staticGroup();
    this.movingPlatforms.forEach(p => this.movingGroup.add(p));
    this.riddenPlatform = null;

    // ---------- Espinhos (com dano) ----------
    this.spikesGroup = this.physics.add.staticGroup();
    for (const s of lvl.spikes) {
      const spike = this.add.tileSprite(s.x + s.w / 2, s.y + s.h / 2, s.w, s.h, 'spikeTile');
      this.physics.add.existing(spike, true);
      this.spikesGroup.add(spike);
    }

    // ---------- Inimigos (patrulha + dano/pisão) ----------
    this.enemiesGroup = this.physics.add.group({ allowGravity: false });
    for (const e of lvl.enemies) {
      const body = this.physics.add.image(e.x, e.y, 'enemy');
      body._data = { baseX: e.baseX, range: e.range, dir: e.dir, x: e.x };
      this.enemiesGroup.add(body);
    }

    // ---------- Caixas quebráveis ----------
    this.boxesGroup = this.physics.add.staticGroup();
    for (const b of lvl.boxes) {
      const box = this.add.image(b.x + b.w / 2, b.y + b.h / 2, 'box');
      box._contents = b.contents;
      this.physics.add.existing(box, true);
      this.boxesGroup.add(box);
    }

    // ---------- Power-ups avulsos ----------
    this.powerupsGroup = this.physics.add.group({ allowGravity: false });
    for (const pu of lvl.powerups) {
      const icon = this.physics.add.image(pu.x, pu.y, 'glow').setTint(this.powerupColor(pu.type));
      icon._ptype = pu.type;
      const label = this.add.text(pu.x, pu.y, this.powerupEmoji(pu.type), { fontSize: '22px' }).setOrigin(0.5);
      icon._label = label;
      this.powerupsGroup.add(icon);
      this.tweens.add({ targets: [icon, label], y: '+=8', duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // ---------- Gemas ----------
    this.gemsGroup = this.physics.add.group({ allowGravity: false });
    for (const g of lvl.gems) {
      const gem = this.physics.add.image(g.x, g.y, 'gem');
      this.gemsGroup.add(gem);
      this.tweens.add({ targets: gem, y: g.y - 6, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }

    // ---------- Gema de prata ----------
    const sg = lvl.silverGem;
    this.silverGem = this.physics.add.image(sg.x, sg.y, 'silverGem');
    this.tweens.add({ targets: this.silverGem, y: sg.y - 8, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: this.silverGem, angle: 360, duration: 4000, repeat: -1, ease: 'Linear' });

    // ---------- Checkpoints (respawn de verdade) ----------
    this.checkpoints = (lvl.checkpoints || []).map(c => {
      const pole = this.add.rectangle(c.x, c.y - 30, 4, 60, 0x5a3f1a);
      const flag = this.add.triangle(c.x + 2, c.y - 55, 0, 0, 24, 8, 0, 16, 0x8a8a8a).setStrokeStyle(1, 0x555);
      return { x: c.x, y: c.y, flag, active: false };
    });
    this.lastCheckpoint = null;

    // ---------- Portal de saída ----------
    this.add.image(lvl.portalX, lvl.groundY - 60, 'portal');

    // ---------- Zonas de vento / gelo (invisíveis, só física) ----------
    this.windZones = lvl.windZones || [];
    this.iceZones = lvl.iceZones || [];

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
    this.invulnMs = 0;
    this.dead = false;

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
      fontFamily: 'monospace', fontSize: '17px', color: '#fff',
      backgroundColor: 'rgba(0,0,0,0.35)', padding: { x: 8, y: 4 },
    }).setScrollFactor(0).setDepth(100);
    this.statusHud = this.add.text(14, 44, '', {
      fontFamily: 'monospace', fontSize: '20px',
    }).setScrollFactor(0).setDepth(100);
    this.refreshHud();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');

    if (theme.sun) this.birdsGfx = this.add.graphics().setScrollFactor(0).setDepth(5);
    else this.starsGfx = this.add.graphics().setScrollFactor(0).setDepth(5);

    this.levelDone = false;
  }

  refreshHud() {
    const total = LEVELS.length;
    const hearts = '❤️'.repeat(Math.max(0, GameState.lives));
    this.hud.setText(`${hearts}   💎 ${GameState.score}   🥈 ${GameState.objectives}/${total}   Fase ${this.levelIndex + 1}`);
  }

  powerupColor(type) { return { star: 0xffd166, wing: 0xa0e8ff, shield: 0x8fe388 }[type]; }
  powerupEmoji(type) { return { star: '⭐', wing: '🪽', shield: '🛡️' }[type]; }

  activatePowerUp(type) {
    if (type === 'star') this.starTimer = 6000;
    else if (type === 'wing') { this.wingTimer = 8000; this.doubleJumpUsed = false; }
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

  hitEnemy(enemy) {
    if (!enemy.active || this.dead) return;
    const stomping = this.player.body.velocity.y > 0 && this.player.y < enemy.y - 6;
    if (stomping || this.starTimer > 0) {
      enemy.destroy();
      GameState.score += 25;
      this.flashText(enemy.x, enemy.y, stomping ? '💥' : '⭐💥');
      if (stomping) this.player.body.setVelocityY(JUMP_VEL * 0.6);
      this.refreshHud();
    } else if (this.invulnMs <= 0) {
      this.damagePlayer();
    }
  }

  hitHazard() {
    if (this.starTimer > 0 || this.invulnMs > 0 || this.dead) return;
    this.damagePlayer();
  }

  // Dano "normal" (espinho/inimigo) — escudo absorve o golpe.
  damagePlayer() {
    if (this.shield) {
      this.shield = false;
      this.invulnMs = 1000;
      this.flashText(this.player.x, this.player.y - 30, '🛡️ quebrou!');
      return;
    }
    this.loseLife();
  }

  // Cair no vazio tira uma vida sempre, mesmo com escudo — igual ao original.
  loseLife() {
    if (this.dead) return;
    GameState.lives--;
    this.refreshHud();
    this.cameras.main.shake(180, 0.01);
    if (GameState.lives <= 0) {
      this.gameOverThenRestart();
      return;
    }
    const respawn = this.lastCheckpoint || LEVELS[this.levelIndex].playerStart;
    this.player.body.reset(respawn.x + 17, respawn.y + 20);
    this.vx = 0;
    this.invulnMs = 1500;
    this._rideCandidate = null;
    this.riddenPlatform = null;
  }

  gameOverThenRestart() {
    this.dead = true;
    this.add.text(W / 2, H / 2, 'Fim de jogo!\nO Barão Sombra venceu desta vez...', {
      fontFamily: 'monospace', fontSize: '20px', color: '#fff', align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);
    this.time.delayedCall(2200, () => {
      GameState.lives = STARTING_LIVES;
      GameState.score = 0;
      GameState.objectives = 0;
      this.scene.restart({ levelIndex: 0 });
    });
  }

  flashText(x, y, str) {
    const t = this.add.text(x, y, str, { fontSize: '18px', color: '#fff' }).setOrigin(0.5);
    this.tweens.add({ targets: t, y: y - 30, alpha: 0, duration: 700, onComplete: () => t.destroy() });
  }

  update(time, delta) {
    if (this.levelDone || this.dead) return;
    const dt = delta / 1000;
    const framesElapsed = delta / (1000 / FPS_REF);
    const body = this.player.body;

    this.gameTime += dt;

    // ---------- Aplica o deslocamento da plataforma móvel do frame anterior
    // (antes de mexer em qualquer física deste frame — mesma correção de
    // bug que fizemos no jogo vanilla: usa o delta já calculado, nunca o
    // tempo absoluto, então uma pausa/lag não "teleporta" ninguém) ----------
    if (this.riddenPlatform) {
      body.x += this.riddenPlatform.dx;
      body.y += this.riddenPlatform.dy;
    }

    // ---------- Atualiza posição das plataformas móveis ----------
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

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const jumpHeld = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown;
    const wasOnGround = this.onGroundPrev;
    const onGround = body.blocked.down || body.touching.down;

    const effMax = this.starTimer > 0 ? MAX_SPEED * 1.6 : MAX_SPEED;

    if (left) { this.vx -= MOVE_ACC * dt; this.facing = -1; }
    if (right) { this.vx += MOVE_ACC * dt; this.facing = 1; }

    // ---------- Vento (empurra) e gelo (derruba o atrito) ----------
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

    // ---------- Define quem vai carregar o jogador no PRÓXIMO frame ----------
    this.riddenPlatform = this._rideCandidate;
    this._rideCandidate = null;

    // ---------- Inimigos: patrulha ----------
    for (const enemy of this.enemiesGroup.getChildren()) {
      const d = enemy._data;
      d.x += d.dir * 60 * dt;
      if (d.x > d.baseX + d.range || d.x < d.baseX - d.range) d.dir *= -1;
      enemy.x = d.x;
      enemy.setFlipX(d.dir < 0);
    }

    // ---------- Checkpoints ----------
    for (const cp of this.checkpoints) {
      if (!cp.active && Math.abs(this.player.x - cp.x) < 20 && this.player.y > cp.y - 60) {
        cp.active = true;
        cp.flag.fillColor = 0xffd166;
        this.lastCheckpoint = { x: cp.x - 17, y: cp.y - 40 };
        this.flashText(cp.x, cp.y - 60, '🚩');
      }
    }

    // ---------- Decoração animada ----------
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

    // ---------- Cair no vazio ----------
    if (this.player.y > H + 100) { this.loseLife(); return; }

    // ---------- Portal / próxima fase ----------
    const lvl = LEVELS[this.levelIndex];
    if (this.player.x > lvl.portalX) this.completeLevel();
  }

  completeLevel() {
    this.levelDone = true;
    const next = this.levelIndex + 1;
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (next < LEVELS.length) {
        this.scene.restart({ levelIndex: next });
      } else {
        this.add.text(W / 2, H / 2, 'Zeco recuperou todas as gemas\ne salvou a ilha! 🎉\nPontuação final: ' + GameState.score, {
          fontFamily: 'monospace', fontSize: '18px', color: '#fff', align: 'center',
        }).setOrigin(0.5).setScrollFactor(0);
        this.cameras.main.fadeIn(400);
      }
    });
  }

  drawBackground(lvl, theme) {
    this.add.image(W / 2, H / 2, 'sky_' + lvl.theme).setScrollFactor(0).setDisplaySize(W, H);
    this.add.image(680, 70, theme.sun ? 'sun' : 'moon').setScrollFactor(0);
    const cloudKey = theme.sun ? 'cloud' : 'cloud_night';
    for (let i = 0; i < 16; i++) this.add.image(i * 260 + 80, 80, cloudKey).setScrollFactor(0.3, 0);
    for (let i = 0; i < 20; i++) this.add.image(i * 220 + 110, H - 35, 'hill_' + lvl.theme).setScrollFactor(0.6, 0).setOrigin(0.5, 1);
    for (let i = 0; i < 14; i++) this.add.image(i * 300 + 150, H - 150, 'palm_' + lvl.theme).setScrollFactor(0.6, 0).setOrigin(0.5, 1);
  }

  // Gera todas as texturas do jogo via Graphics — sem nenhum arquivo de
  // imagem externo. Texturas comuns são geradas uma vez só; as que mudam
  // de cor por tema (céu, colina, coqueiro, chão, plataforma) ganham uma
  // versão por tema, gerada sob demanda.
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

    if (this.textures.exists('sun')) { g.destroy(); return; } // resto já gerado numa fase anterior

    g.clear();
    g.fillStyle(0xfff4be, 0.35); g.fillCircle(70, 70, 70);
    g.fillStyle(0xfff4be, 0.6); g.fillCircle(70, 70, 45);
    g.fillStyle(0xfff3b0, 1); g.fillCircle(70, 70, 26);
    g.generateTexture('sun', 140, 140);

    g.clear();
    g.fillStyle(0xe6e6ff, 0.5); g.fillCircle(55, 55, 55);
    g.fillStyle(0xf4f4ff, 1); g.fillCircle(55, 55, 22);
    g.generateTexture('moon', 110, 110);

    g.clear();
    g.fillStyle(0xffffff, 0.85);
    g.fillEllipse(40, 20, 80, 40); g.fillEllipse(70, 15, 60, 36);
    g.generateTexture('cloud', 110, 45);

    g.clear();
    g.fillStyle(0xb4b4dc, 0.25);
    g.fillEllipse(40, 20, 80, 40); g.fillEllipse(70, 15, 60, 36);
    g.generateTexture('cloud_night', 110, 45);

    g.clear();
    g.fillStyle(0xd64550, 1);
    g.fillTriangle(0, 15, 6, 0, 12, 15);
    g.generateTexture('spikeTile', 12, 15);

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

    g.clear();
    g.fillStyle(0xffffff, 0.5); g.fillCircle(16, 16, 16);
    g.generateTexture('glow', 32, 32);

    g.clear();
    g.fillStyle(0x8fe388, 0.25); g.fillCircle(24, 24, 24);
    g.lineStyle(2, 0x8fe388, 0.8); g.strokeCircle(24, 24, 22);
    g.generateTexture('shieldBubble', 48, 48);

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
