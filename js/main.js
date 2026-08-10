// =============================================================
// Zeco e a Ilha das Gemas — Protótipo Phaser (Fase 1 do plano)
// =============================================================
// Objetivo desta etapa: só validar que o "feel" de mover e pular
// fica igual ao jogo vanilla, usando colisão de verdade do motor
// (Arcade Physics) em vez do código de colisão escrito à mão.
//
// Constantes de física abaixo são as MESMAS do jogo original
// (js/jogo.js: GRAVITY, MOVE_SPEED, FRICTION, MAX_SPEED, JUMP_FORCE),
// só convertidas de "por frame a 60fps" para "por segundo", que é
// a unidade que o Arcade Physics usa.
const W = 800, H = 450;
const FPS_REF = 60;

const GRAVITY   = 0.6   * FPS_REF; // px/s²  (era 0.6 px/frame²)
const MOVE_ACC  = 0.9   * FPS_REF; // px/s²  (era 0.9 px/frame, acumulado)
const MAX_SPEED = 5.5   * FPS_REF; // px/s   (era 5.5 px/frame)
const JUMP_VEL  = -12.5 * FPS_REF; // px/s   (era -12.5 px/frame)
const FRICTION  = 0.82;            // multiplicador por frame, mantido igual

class Fase1Scene extends Phaser.Scene {
  constructor() { super('Fase1'); }

  preload() {
    // Nenhum asset externo — o jogo original é 100% desenhado em canvas
    // (sem sprites), então geramos as mesmas formas via Graphics aqui.
  }

  create() {
    const lvl = FASE1;
    this.physics.world.setBounds(0, 0, lvl.worldWidth, H);
    this.cameras.main.setBounds(0, 0, lvl.worldWidth, H);

    this.drawBackground(lvl);

    // ---------- Chão + plataformas (corpos estáticos) ----------
    this.solids = this.physics.add.staticGroup();

    const ground = this.add.rectangle(
      lvl.worldWidth / 2, lvl.groundY + (H - lvl.groundY) / 2,
      lvl.worldWidth, H - lvl.groundY, THEME_ILHA.ground
    );
    this.add.rectangle(lvl.worldWidth / 2, lvl.groundY + 7, lvl.worldWidth, 14, THEME_ILHA.grass);
    this.solids.add(ground);

    for (const p of lvl.platforms) {
      const body = this.add.rectangle(p.x + p.w / 2, p.y + p.h / 2, p.w, p.h, THEME_ILHA.ground);
      this.add.rectangle(p.x + p.w / 2, p.y + 3, p.w, 6, THEME_ILHA.grass);
      this.solids.add(body);
    }

    // ---------- Espinhos (visual só por enquanto — dano entra na Fase 2) ----------
    for (const s of lvl.spikes) {
      const g = this.add.graphics();
      g.fillStyle(0xd64550, 1);
      const teeth = Math.floor(s.w / 12);
      for (let i = 0; i < teeth; i++) {
        const tx = s.x + i * 12;
        g.fillTriangle(tx, s.y + s.h, tx + 6, s.y, tx + 12, s.y + s.h);
      }
    }

    // ---------- Inimigos: só patrulha visual (colisão/dano = Fase 2) ----------
    this.enemies = lvl.enemies.map(e => {
      const body = this.add.ellipse(e.x, e.y, 32, 26, 0x6a4fb0);
      body._data = { baseX: e.baseX, range: e.range, dir: e.dir, x: e.x };
      return body;
    });

    // ---------- Gemas coletáveis (overlap real via Arcade Physics) ----------
    this.gemsGroup = this.physics.add.group({ allowGravity: false });
    for (const g of lvl.gems) {
      const gem = this.add.rectangle(g.x, g.y, 16, 16, 0xff5fa2).setAngle(45);
      this.physics.add.existing(gem);
      this.gemsGroup.add(gem);
    }

    // ---------- Gema de prata (objetivo da fase) ----------
    const sg = lvl.silverGem;
    this.silverGem = this.add.rectangle(sg.x, sg.y, 22, 22, 0xe8eef2).setAngle(45);
    this.physics.add.existing(this.silverGem);

    // ---------- Checkpoint (visual só por enquanto) ----------
    for (const c of lvl.checkpoints) {
      this.add.rectangle(c.x, c.y - 30, 4, 60, 0x5a3f1a);
      this.add.triangle(c.x + 2, c.y - 55, 0, 0, 24, 8, 0, 16, 0xffd166);
    }

    // ---------- Jogador ----------
    this.player = this.add.rectangle(lvl.playerStart.x + 17, lvl.playerStart.y + 20, 30, 40, 0x4caf50);
    this.physics.add.existing(this.player);
    this.player.body.setMaxVelocity(MAX_SPEED, 900);
    this.player.body.setCollideWorldBounds(true);
    this.player.body.setSize(30, 40);
    this.vx = 0; // velocidade horizontal "manual" — replica exatamente o modelo de aceleração/atrito do jogo original

    this.physics.add.collider(this.player, this.solids, () => {
      // onGround = corpo tocando embaixo (equivalente ao player.onGround do original)
    });
    this.physics.add.overlap(this.player, this.gemsGroup, (_p, gem) => {
      gem.destroy();
      this.gemCount = (this.gemCount || 0) + 1;
      this.hud.setText(`💎 ${this.gemCount}/${lvl.gems.length}   🥈 ${this.gotSilver ? 1 : 0}`);
    });
    this.physics.add.overlap(this.player, this.silverGem, () => {
      if (this.gotSilver) return;
      this.gotSilver = true;
      this.silverGem.destroy();
      this.hud.setText(`💎 ${this.gemCount || 0}/${lvl.gems.length}   🥈 1`);
    });

    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
    this.cameras.main.setDeadzone(80, 100);

    // ---------- HUD (fixo na tela, não rola com a câmera) ----------
    this.hud = this.add.text(14, 12, `💎 0/${lvl.gems.length}   🥈 0`, {
      fontFamily: 'monospace', fontSize: '18px', color: '#fff',
      backgroundColor: 'rgba(0,0,0,0.35)', padding: { x: 8, y: 4 },
    }).setScrollFactor(0).setDepth(100);

    // ---------- Controles ----------
    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys('W,A,S,D,SPACE');
  }

  update(time, delta) {
    const dt = delta / 1000; // segundos desde o último frame (Phaser já trata variação de fps aqui)
    const body = this.player.body;

    const left = this.cursors.left.isDown || this.keys.A.isDown;
    const right = this.cursors.right.isDown || this.keys.D.isDown;
    const jumpHeld = this.cursors.up.isDown || this.keys.W.isDown || this.keys.SPACE.isDown;
    const onGround = body.blocked.down || body.touching.down;

    if (left) this.vx -= MOVE_ACC * dt;
    if (right) this.vx += MOVE_ACC * dt;

    // Atrito: no original é `vx *= FRICTION` uma vez por frame (~60x/s).
    // Elevamos à potência de (frames decorridos) pra ficar igual em
    // qualquer taxa de atualização, não só a 60fps.
    const framesElapsed = delta / (1000 / FPS_REF);
    this.vx *= Math.pow(FRICTION, framesElapsed);

    if (this.vx > MAX_SPEED) this.vx = MAX_SPEED;
    if (this.vx < -MAX_SPEED) this.vx = -MAX_SPEED;

    if (jumpHeld && !this.jumpPrev && onGround) {
      body.setVelocityY(JUMP_VEL);
    }
    this.jumpPrev = jumpHeld;

    body.setVelocityX(this.vx);
    if (!onGround) body.setVelocityY(body.velocity.y + GRAVITY * dt);

    if (this.vx > 5) this.player.fillColor = 0x4caf50;
    else if (this.vx < -5) this.player.fillColor = 0x3f9c4a;

    // Patrulha simples dos inimigos (visual — sem dano ainda, isso é Fase 2)
    for (const e of this.enemies) {
      const d = e._data;
      d.x += d.dir * 60 * dt;
      if (d.x > d.baseX + d.range || d.x < d.baseX - d.range) d.dir *= -1;
      e.x = d.x;
    }
  }

  drawBackground(lvl) {
    const g = this.add.graphics().setScrollFactor(0.3, 0);
    g.fillGradientStyle(THEME_ILHA.skyTop, THEME_ILHA.skyTop, THEME_ILHA.skyBot, THEME_ILHA.skyBot, 1);
    g.fillRect(0, 0, lvl.worldWidth * 1.5, H);
    g.fillStyle(THEME_ILHA.hill, 0.8);
    for (let i = 0; i < 12; i++) {
      g.fillEllipse(i * 260 + 100, H - 40, 220, 110);
    }
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
  scene: Fase1Scene,
});
