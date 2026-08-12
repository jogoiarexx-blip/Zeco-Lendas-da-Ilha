# Zeco e a Ilha das Gemas — Phaser + PWA + Capacitor

Jogo de plataforma 2D com **8 fases**, 4 tipos de inimigos, temas visuais, PWA instalável e base pronta para APK Android via Capacitor.

## O que tem neste build

- 8 fases (ilha, gelo, vento, noite, vulcão, templo + final)
- Inimigos: **walker**, **jumper**, **flyer**, **charger**
- Personagem redesenhado (mais formas / detalhe)
- Cenários por tema (céu, colinas, palmeiras, sol/lua)
- Menu, seletor de fases, progresso em localStorage
- Áudio sintético + mute
- Controles touch + teclado
- Pause (ESC / P)
- PWA (manifest + service worker + botão instalar)
- Config Capacitor para gerar APK

---

## 1. Rodar como PWA (navegador)

```bash
# Qualquer servidor estático na pasta do projeto
npx serve .
# ou
python3 -m http.server 8080
```

Abra no celular Chrome/Edge → menu → **Instalar app** (ou use o botão 📲).

**Requisitos PWA:** HTTPS (ou localhost). Service worker registra em `sw.js`.

---

## 2. Gerar APK com Capacitor

### Pré-requisitos
- Node.js 18+
- Android Studio (SDK 34+, build-tools)
- Java 17

### Passos

```bash
cd zeco-phaser-completo

# Dependências
npm install

# Monta pasta www/
npm run build:www

# Inicializa Capacitor (só na primeira vez, se ainda não existir android/)
npx cap init "Zeco" "com.zecogames.ilha" --web-dir www
npx cap add android

# Sincroniza arquivos web → projeto Android
npx cap sync android

# Abre no Android Studio
npx cap open android
```

No Android Studio:
1. Aguarde o Gradle sync
2. **Build → Generate Signed Bundle / APK**
3. Crie um keystore (guarde a senha!)
4. Gere **Android App Bundle (.aab)** para a Play Store (ou APK para teste)

### Offline total (opcional)
Baixe o Phaser e sirva local:

```bash
curl -L -o www/js/phaser.min.js \
  https://cdnjs.cloudflare.com/ajax/libs/phaser/3.70.0/phaser.min.js
```

E troque no `index.html` o script do CDN por `js/phaser.min.js`. Depois `npx cap sync`.

---

## 3. Checklist — Publicação no Google Play

### Conta e app
- [ ] Conta Google Play Console (taxa única ~US$ 25)
- [ ] Criar app: nome **Zeco e a Ilha das Gemas**, idioma pt-BR
- [ ] Escolher tipo: **Jogo** → categoria **Ação** ou **Arcade**
- [ ] Declarar se tem anúncios (sim/não)
- [ ] Classificação etária (questionário IARC) — provável **Livre / 7+**

### Pacote técnico
- [ ] `applicationId` único: `com.zecogames.ilha` (ou o seu domínio)
- [ ] **versionCode** inteiro crescente (1, 2, 3…)
- [ ] **versionName** legível (`1.0.0`)
- [ ] AAB assinado com keystore de release (não usar debug)
- [ ] Target SDK exigido pela Play (acompanhe a política atual; em 2026 costuma ser API 34/35)
- [ ] Orientação landscape no manifest Android
- [ ] Ícone adaptativo 512×512 + feature graphic 1024×500

### Ficha da loja
- [ ] Título (≤ 30 caracteres)
- [ ] Descrição curta (≤ 80)
- [ ] Descrição longa
- [ ] Screenshots: mínimo 2 telefones (e tablet se declarar suporte)
  - Ideal: 16:9 ou 9:16 conforme orientação
- [ ] Ícone 512×512
- [ ] Feature graphic 1024×500
- [ ] (Opcional) vídeo YouTube

### Políticas e privacidade
- [ ] Política de privacidade (URL pública) — obrigatória se coletar dados/ads
- [ ] Data safety form preenchido
- [ ] Conteúdo sem violência gráfica extrema / sem abuso infantil etc.
- [ ] Se usar AdMob/IAP: declarar e configurar

### Testes antes do prod
- [ ] Internal testing track (testers por e-mail)
- [ ] Closed testing (opcional)
- [ ] Testar em 2–3 aparelhos reais (touch, landscape, áudio, pause, progresso)
- [ ] Verificar que o jogo não precisa de internet (exceto CDN se não embutir Phaser)

### Envio
- [ ] Upload do AAB na produção ou track de teste
- [ ] Preencher questionário de conteúdo
- [ ] Enviar para revisão (pode levar horas/dias)

---

## 4. Estrutura de pastas

```
zeco-phaser-completo/
├── index.html
├── manifest.json
├── sw.js
├── package.json
├── capacitor.config.json
├── icons/          (48…512)
├── js/
│   ├── levels-data.js   (8 fases + temas)
│   ├── audio.js
│   └── main.js          (Menu, HowTo, LevelSelect, Fase)
├── scripts/copy-www.js
└── README.md
```

---

## 5. Controles

| Ação | Teclado | Touch |
|------|---------|-------|
| Mover | A/D ou ←/→ | Botões ◀ ▶ |
| Pular | Espaço / W / ↑ | Botão ⤒ |
| Pausar | ESC ou P | — |
| Mute | Botão 🔊 | mesmo |

---

## 6. Próximas melhorias possíveis

- Boss final (Barão Sombra) na fase 8
- Partículas Phaser (poeira, gemas)
- Vibração no dano (Capacitor Haptics)
- Leaderboard online (Firebase)
- Ads rewarded (AdMob) entre fases
- Embutir Phaser para 100% offline

Boa sorte na ilha! 🌴💎
