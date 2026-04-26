# 🎮 Block-etto

Un gioco di puzzle a blocchi in italiano - HTML/CSS/JS vanilla, con modalità multiplayer online.

![Block-etto](https://img.shields.io/badge/Made%20with-Vanilla%20JS-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)

## 🎯 Come giocare

1. Inserisci il tuo nome
2. Scegli il tuo colore preferito
3. Usa **"Come funziona"** per il tutorial interattivo
4. Clicca un pezzo per selezionarlo, poi clicca sulla griglia per piazzarlo
5. Completa righe e colonne per eliminarle e fare punti!
6. Il gioco finisce quando non ci sono più mosse valide

## ✨ Features

- ⚔️ **Multiplayer online** — sfida un amico con QR code, rivincita immediata
- 📊 **Statistiche personali** — storico partite, media, linee, vittorie/sconfitte MP
- ❓ **Tutorial interattivo** — guida in 8 passi con animazioni
- 🎨 **6 temi colore** selezionabili
- 💾 **Salvataggio locale** — nome, record e stats persistono sul dispositivo
- 📱 **PWA-ready** — aggiungibile alla home screen iOS/Android con icona dedicata
- 🎲 **12 forme** di pezzi diversi
- 🎭 **Animazioni fluide** per linee eliminate e piazzamento blocchi

## 🎯 Punteggio

- **10 punti** per ogni blocco piazzato
- **100 punti** per ogni riga/colonna completata
- **Bonus combo** per eliminazioni multiple simultanee

## 🚀 Gioca Online

[https://hmarras.github.io/block-etto-/](https://hmarras.github.io/block-etto-/)

## ⚔️ Multiplayer

Il multiplayer usa un WebSocket server su Render.com. Player 1 crea la stanza e condivide il QR code; Player 2 lo scansiona e si unisce. Vince chi fa più punti. Alla fine è possibile fare rivincita senza ricominciare da zero.

**Nota:** il server free di Render dorme dopo 15 minuti di inattività — la prima connessione può richiedere ~30 secondi.

## 💻 Sviluppo Locale

### Solo single player
```bash
python3 -m http.server 8080
# Vai su http://localhost:8080
```

### Con multiplayer
```bash
python3 multiplayer_server.py
# Serve HTTP su :8080 e WebSocket su :8765
```

Richiede: `pip install websockets`

## 📁 Struttura Progetto

```
block-etto/
├── index.html              # Struttura HTML (welcome, game, modali)
├── style.css               # Stili e animazioni
├── game.js                 # Logica single player + statistiche localStorage
├── multiplayer.js          # Client WebSocket multiplayer
├── multiplayer_server.py   # Server WebSocket (deploy su Render.com)
├── tutorial.js             # Tutorial interattivo
├── requirements.txt        # Dipendenze Python (websockets)
├── manifest.json           # PWA manifest
├── apple-touch-icon.png    # Icona iOS home screen
├── icon-192.png            # Icona Android
├── icon-512.png            # Icona alta risoluzione
├── CLAUDE.md               # Documentazione tecnica per Claude Code
└── README.md               # Questo file
```

## 🛠️ Tecnologie

- HTML5 / CSS3 / JavaScript Vanilla (ES6+)
- WebSocket (client nativo + server Python `websockets`)
- LocalStorage API per persistenza dati
- GitHub Pages per hosting statico
- Render.com per il server WebSocket (free tier)

## 📜 Licenza

MIT License
