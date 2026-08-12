// Copia os arquivos do jogo para a pasta www/ usada pelo Capacitor
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const www = path.join(root, 'www');

function rmrf(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}
function copy(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const f of fs.readdirSync(src)) copy(path.join(src, f), path.join(dest, f));
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

rmrf(www);
fs.mkdirSync(www, { recursive: true });

const files = [
  'index.html', 'manifest.json', 'sw.js',
  'js', 'icons'
];
for (const f of files) {
  const s = path.join(root, f);
  if (fs.existsSync(s)) copy(s, path.join(www, f));
}
// Phaser via CDN continua online; para offline total, baixe phaser.min.js para www/js/
console.log('www/ atualizado para Capacitor');
