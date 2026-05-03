# Block-etto — Documentazione Tecnica per Claude Code

## Overview

Block-etto è un gioco puzzle a blocchi stile Block Blast, sviluppato in vanilla HTML/CSS/JS.
Supporta single player e multiplayer online (WebSocket su Render.com).

**Live:** https://hmarras.github.io/block-etto-/
**Server MP:** https://block-etto.onrender.com (WebSocket)

---

## Stack Tecnologico

| Layer | Tecnologia |
|---|---|
| Frontend | HTML5 / CSS3 / Vanilla JS (ES6+) |
| Persistenza | localStorage |
| Multiplayer | WebSocket nativo (client) + Python `websockets` (server) |
| Hosting statico | GitHub Pages (`main` branch) |
| Hosting server | Render.com free tier (auto-deploy da GitHub) |
| PWA | manifest.json + apple-touch-icon + service worker (`sw.js`) |

**Nessun framework, nessun build step.**

---

## Struttura File

```
/Users/hmarras/Documents/Personale/Progetti/Block etto/
├── index.html              # HTML: welcome screen, game screen, tutti i modali
├── style.css               # CSS: mobile-first, temi, animazioni
├── game.js                 # Logica di gioco + statistiche localStorage
├── multiplayer.js          # Client WebSocket multiplayer
├── multiplayer_server.py   # Server WebSocket (Render.com)
├── tutorial.js             # Tutorial interattivo a step
├── requirements.txt        # websockets==12.0
├── manifest.json           # PWA manifest (nome, icone, colori)
├── apple-touch-icon.png    # 180x180 per iOS
├── icon-192.png            # 192x192 per Android
├── icon-512.png            # 512x512 alta risoluzione
├── shop.js                 # Logica shop, wallet, guardaroba, skin, engagement
├── skins.css               # CSS delle 11 skin (Classic, Scacchi, Legno, Regali, Neon, Lego, Cristallo, 4 calcio)
├── sw.js                   # Service worker per cache management e aggiornamento automatico
├── mockup-skins.html       # Pagina di riferimento visivo delle skin (standalone, no deploy necessario)
├── create_icon.py          # Script Python per rigenerare le icone (PIL)
├── README.md               # Documentazione utente
└── CLAUDE.md               # Questo file
```

---

## Logica di Gioco (`game.js`)

### Costanti
- Griglia **8x8**
- **12 forme** di pezzi in `PIECE_SHAPES`
- 3 pezzi sempre disponibili; quando tutti usati → nuovi 3

### Stato globale
```javascript
let grid = [];              // Array 8x8: 0=vuoto, 1=pieno
let currentPieces = [];     // Array di 3 pezzi (null se usato)
let selectedPieceIndex = null;
let score = 0;
let bestScore = 0;
let playerName = '';
let linesCleared = 0;       // Contatore linee nella partita corrente
let gameStartTime = null;   // Timestamp inizio partita
```

### Punteggio
- **10 pt** per blocco piazzato
- **100 pt** per riga/colonna completata
- **Bonus combo**: `totalLines * 50` se più linee simultanee

### Animazione line clearing
**IMPORTANTE:** non chiamare `render()` tra l'aggiunta della classe `.clearing` e l'`await`, altrimenti il DOM viene ricreato e l'animazione non parte.

```javascript
async function clearLines() {
  // 1. Identifica righe/colonne complete
  // 2. Aggiungi classe 'clearing' alle celle
  // 3. await 500ms
  // 4. Pulisci grid data + aggiorna score + linesCleared
}
```

### Statistiche su localStorage

```javascript
// Schema playerStats (JSON)
{
  gamesPlayed: number,
  totalScore: number,
  totalLines: number,
  mpWins: number,
  mpLosses: number,
  mpDraws: number,
  history: [{ date: timestamp, score, lines, duration }]  // max 20
}
```

Funzioni: `saveGameStats()` (chiamata in `gameOver()`), `loadAllStats()`, `openStatsModal()`.

---

## Multiplayer (`multiplayer.js` + `multiplayer_server.py`)

### Architettura
```
Browser A ──WebSocket──▶ Render Server ◀──WebSocket── Browser B
GitHub Pages                                           GitHub Pages
```

### Auto-detect ambiente
```javascript
const WS_SERVER = window.location.hostname === 'localhost'
    ? `ws://localhost:8765`
    : 'wss://block-etto.onrender.com';

const GAME_URL = window.location.hostname === 'localhost'
    ? `http://localhost:8080`
    : 'https://hmarras.github.io/block-etto-';
```

### Flusso messaggi WebSocket

| Direzione | Tipo | Descrizione |
|---|---|---|
| Client → Server | `create_room` | Crea stanza, riceve codice 4 lettere |
| Client → Server | `join_room` | Entra in stanza con codice |
| Client → Server | `score_update` | Aggiorna punteggio in tempo reale |
| Client → Server | `game_over` | Fine partita, invia score finale |
| Client → Server | `rematch_request` | Richiede rivincita |
| Server → Client | `room_created` | Codice stanza assegnato |
| Server → Client | `opponent_joined` | L'avversario è entrato |
| Server → Client | `game_start` | Inizia partita (o rivincita) |
| Server → Client | `opponent_score` | Score live avversario |
| Server → Client | `opponent_game_over` | L'avversario ha finito |
| Server → Client | `result` | Risultati finali (you_won, draw, scores) |
| Server → Client | `rematch_requested` | L'avversario vuole rivincita |
| Server → Client | `opponent_disconnected` | L'avversario si è disconnesso |

### Schema stanza server
```python
rooms[code] = {
    'players': [ws0, ws1],
    'names': [name0, name1],
    'scores': [None, None],
    'done': [False, False],
    'rematch': [False, False],
}
```

### Rivincita
Quando entrambi cliccano "Rivincita", il server chiama `reset_room()` (azzera scores/done/rematch) e manda `game_start` a entrambi. La stanza rimane aperta senza ricreare il codice.

### Retry connessione (server dormiente)
`MP.createRoom()` riprova fino a 6 volte ogni 5 secondi mostrando un messaggio progressivo. Render free tier dorme dopo 15 min di inattività (cold start ~30s).

### QR Code
Generato client-side con la libreria `qrcodejs` (CDN jsdelivr). Punta a `GAME_URL?room=XXXX`.

---

## PWA / Home Screen

- `manifest.json` → nome "Block-etto", icone, `display: standalone`
- `<meta name="apple-mobile-web-app-title">` → nome su iOS
- `<link rel="apple-touch-icon">` → icona su iOS
- Icone generate da `create_icon.py` (richiede PIL): sfondo viola scuro, blocchi colorati a griglia

Per rigenerare le icone:
```bash
cd "/Users/hmarras/Documents/Personale/Progetti/Block etto"
python3 create_icon.py  # genera apple-touch-icon.png, icon-192.png, icon-512.png
```

### Service Worker (`sw.js`)

Gestisce la cache e forza il reload automatico su tutti i client (incluse PWA su iOS) quando viene deployata una nuova versione.

- **HTML**: strategia network-first (sempre aggiornato se online, fallback cache se offline)
- **Asset statici**: strategia cache-first
- `skipWaiting()` + `clients.claim()`: il nuovo SW si attiva subito
- `controllerchange` in `index.html`: la pagina si ricarica automaticamente quando il nuovo SW prende controllo

**Per forzare aggiornamento a tutti gli utenti:** incrementare `CACHE_VERSION` in `sw.js` e `APP_V` in `index.html` prima del push (vedi sezione Deploy).

---

## LocalStorage Schema Completo

```javascript
{
  playerName: string,       // Nome giocatore
  bestScore: number,        // Record personale
  colorTheme: string,       // 'purple'|'pink'|'blue'|'green'|'orange'|'dark'
  playerStats: {            // JSON stringificato
    gamesPlayed: number,
    totalScore: number,
    totalLines: number,
    mpWins: number,
    mpLosses: number,
    mpDraws: number,
    history: Array<{date, score, lines, duration}>
  },
  walletPoints: number,     // Punti-moneta accumulati
  ownedSkins: string[],     // JSON — es. '["classic","chess"]', default ["classic"]
  activeSkin: string,       // es. "chess", default "classic"
}
```

### Sistema Shop / Wallet / Skin (`shop.js` + `skins.css`)

**Economia:** `walletEarned = Math.floor(score / 30) × multiplier`

Moltiplicatori promo basati su `gamesPlayed`:
- Partite 1–5: ×5 | 6–10: ×3 | 11–20: ×2 | 21+: ×1

**Prezzi skin:** Classic 0pt · Scacchi 300 · Legno 450 · Regali 600 · Neon 750 · Lego 950 · Cristallo 1200 · Calcio 1500

**Skin con varianti posizionali** (applicate da `applySkinToCell()` in `game.js`):
- `chess`: `--light` / `--dark` alternati per (row+col) % 2
- `gift`: `--r` / `--g` / `--b` per pieceIndex % 3 oppure (row*8+col) % 3
- `neon`: `--cyan` / `--green` / `--magenta` per (row+col) % 3

**Skin neon** richiede griglia scura: classe `.skin-neon-active` su `#grid` e `#pieces` (togglata in `renderGrid()` e `renderPieces()`).

**CustomEvent `skinChanged`**: dispatchato da `shopSetActive()`, ascoltato in `game.js` DOMContentLoaded per aggiornare `activeSkin` senza ricaricare.

---

## Temi CSS

6 temi via classe su `body` (`theme-purple` ecc.) + CSS custom properties:
```css
--block-color-start: #ffd700;
--block-color-end: #ffed4e;
```
Ogni tema ha colori blocchi complementari allo sfondo. Salvato in localStorage.

---

## Deploy

### GitHub Pages (frontend)

**IMPORTANTE — Prima di ogni push, Claude deve aggiornare in automatico queste 3 cose:**

1. `sw.js` → incrementare `CACHE_VERSION` (es. `'v3'` → `'v4'`)
2. `index.html` → aggiornare `APP_V` con la data odierna in formato `'YYYYMMDD'` (es. `'20260503'`)
3. `index.html` → aggiornare la stringa visibile in fondo alla welcome screen con data e orario del commit (es. `v 3 maggio 2026 · 14:32`)

Per l'orario usare l'output di `git log -1 --format="%ci"` dopo il commit, oppure l'orario corrente al momento del push.

```bash
cd "/Users/hmarras/Documents/Personale/Progetti/Block etto"
git add .
git commit -m "..."
git push origin main
# GitHub Pages aggiorna in ~1-2 minuti
```

### Render.com (server WebSocket)
- Auto-deploy attivo su push a `main`
- Build: `pip install -r requirements.txt`
- Start: `python multiplayer_server.py`
- Porta: `$PORT` (env var Render) con fallback 8765
- Dashboard: https://dashboard.render.com

**Per forzare redeploy manuale:** Dashboard Render → Manual Deploy.

---

## Note Importanti

- `render()` ricrea l'intero DOM — chiamare solo quando necessario
- Il modal multiplayer usa `display:flex/none` per mostrare/nascondere i 4 step
- `MP.active` è `true` solo durante una partita multiplayer in corso
- `saveGameStats()` è chiamata in `gameOver()` anche in modalità multiplayer (prima del check MP)
- Il risultato multiplayer (`showMPResult`) chiama anche `saveMPResult()` per tracciare vittorie/sconfitte

---

## Autore

**Dario Marras** — Aprile 2026
