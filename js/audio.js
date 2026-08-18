// =============================================================
// Zeco e a Ilha das Gemas — Áudio
// 100% sintetizado via Web Audio API — sem arquivos externos
// Depende de: muteBtn (definido em jogo.js)
// =============================================================
let audioCtx = null;
let masterGain = null;
let muted = (typeof safeStorageGet === 'function' ? safeStorageGet('zeco_muted', '0') : '0') === '1';
let musicInterval = null;

function initAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return;
  }
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = muted ? 0 : 0.7;
  masterGain.connect(audioCtx.destination);
  startMusic();
}

function tone(freq, start, dur, type='sine', vol=0.2, glideTo=null) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glideTo) osc.frequency.linearRampToValueAtTime(glideTo, start + dur);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

function playJump(double=false) {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  tone(double ? 520 : 340, t, 0.16, 'square', 0.15, double ? 900 : 620);
}
function playCoin() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  tone(880, t, 0.09, 'square', 0.13);
  tone(1320, t + 0.07, 0.14, 'square', 0.13);
}

function playAttack() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  tone(520, t, 0.07, 'sawtooth', 0.12, 180);
  tone(180, t + 0.025, 0.06, 'triangle', 0.08, 90);
}

function playStomp() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  tone(180, t, 0.13, 'triangle', 0.2, 60);
}
function playBreak() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  tone(220, t, 0.08, 'square', 0.16, 90);
  tone(140, t + 0.03, 0.11, 'triangle', 0.13, 55);
}
function playPowerUp() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  [523,659,784,1046].forEach((f,i) => tone(f, t + i*0.08, 0.16, 'square', 0.15));
}
function playHurt() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  tone(300, t, 0.28, 'sawtooth', 0.18, 90);
}
function playWin() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  [523,659,784,1046,1318].forEach((f,i) => tone(f, t + i*0.14, 0.2, 'square', 0.16));
}
function playGameOver() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  [392,349,294,220].forEach((f,i) => tone(f, t + i*0.22, 0.25, 'sawtooth', 0.15));
}
function playExtraLife() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  [523,659,784,1046,1318,1568].forEach((f,i) => tone(f, t + i*0.09, 0.18, 'square', 0.16));
}
function playCheckpoint() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  tone(440, t, 0.1, 'triangle', 0.14);
  tone(660, t + 0.08, 0.14, 'triangle', 0.14);
}
function playObjective() {
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  tone(660, t, 0.12, 'triangle', 0.18);
  tone(880, t + 0.1, 0.12, 'triangle', 0.18);
  tone(1320, t + 0.2, 0.28, 'square', 0.2);
}

// música de fundo: loop tropical simples em escala pentatônica
const musicScale = [261.6, 293.7, 329.6, 392.0, 440.0];
let musicStep = 0;
function startMusic() {
  if (musicInterval) return;
  musicInterval = setInterval(() => {
    if (!audioCtx || muted) return;
    if (typeof state !== 'undefined' && state.paused) return;
    const t = audioCtx.currentTime;
    const note = musicScale[musicStep % musicScale.length];
    tone(note / 2, t, 0.35, 'triangle', 0.05);
    if (musicStep % 4 === 2) tone(note, t + 0.1, 0.2, 'sine', 0.035);
    musicStep++;
  }, 420);
}

muteBtn.addEventListener('click', () => {
  muted = !muted;
  muteBtn.textContent = muted ? '🔇' : '🔊';
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.7;
  if (typeof safeStorageSet === 'function') safeStorageSet('zeco_muted', muted ? '1' : '0');
});

// Reflete o estado salvo de mudo no ícone assim que a página carrega,
// mesmo antes do áudio ser inicializado (que só acontece no primeiro clique/toque).
muteBtn.textContent = muted ? '🔇' : '🔊';
