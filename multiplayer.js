// ── Multiplayer Manager ──────────────────────────────────────────────────────

// URL del server WebSocket: localhost in sviluppo, Render in produzione
const WS_SERVER = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `ws://${window.location.hostname}:8765`
    : 'wss://block-etto.onrender.com';

// URL base del gioco (per il QR e il link di invito)
const GAME_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:8080`
    : 'https://hmarras.github.io/block-etto-';

const MP = {
    ws: null,
    active: false,
    playerIndex: null,
    opponentName: null,
    roomCode: null,
    opponentDone: false,
    opponentFinalScore: null,

    connect() {
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(WS_SERVER);
            this.ws.onopen = resolve;
            this.ws.onerror = reject;
            this.ws.onmessage = (e) => this.handleMessage(JSON.parse(e.data));
            this.ws.onclose = () => {
                if (this.active) this.showDisconnected();
            };
        });
    },

    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        }
    },

    async createRoom(name) {
        showMPConnecting('Il server si sta svegliando...\nAttendi qualche secondo ⏳');
        let attempts = 0;
        const maxAttempts = 6;
        while (attempts < maxAttempts) {
            try {
                await this.connect();
                this.send({ type: 'create_room', name });
                return;
            } catch {
                attempts++;
                if (attempts >= maxAttempts) {
                    showMPError('Impossibile connettersi al server. Riprova tra qualche secondo.');
                    return;
                }
                updateMPConnecting(`Il server si sta svegliando... (${attempts}/${maxAttempts}) ⏳`);
                await new Promise(r => setTimeout(r, 5000));
            }
        }
    },

    async joinRoom(roomCode, name) {
        showMPConnecting('Connessione in corso...');
        let attempts = 0;
        const maxAttempts = 4;
        while (attempts < maxAttempts) {
            try {
                await this.connect();
                this.send({ type: 'join_room', room: roomCode, name });
                return;
            } catch {
                attempts++;
                if (attempts >= maxAttempts) {
                    showMPError('Impossibile connettersi al server.');
                    return;
                }
                await new Promise(r => setTimeout(r, 3000));
            }
        }
    },

    sendScore(s) {
        if (this.active) this.send({ type: 'score_update', score: s });
    },

    sendGameOver(s) {
        if (this.active) this.send({ type: 'game_over', score: s });
    },

    sendEmoji(emoji) {
        if (!this.active) return;
        this.send({ type: 'emoji', emoji });
        showEmojiReaction(emoji, true);
    },

    handleMessage(msg) {
        switch (msg.type) {
            case 'room_created':
                this.roomCode = msg.room;
                this.playerIndex = 0;
                showQRScreen(msg.room);
                break;

            case 'opponent_joined':
                this.opponentName = msg.opponent_name;
                document.getElementById('mp-waiting-text').textContent =
                    `${msg.opponent_name} si è unito! La partita sta per iniziare...`;
                break;

            case 'joined':
                this.opponentName = msg.opponent_name;
                this.playerIndex = 1;
                document.getElementById('mp-modal').style.display = 'none';
                break;

            case 'game_start':
                this.active = true;
                this.opponentDone = false;
                this.opponentFinalScore = null;
                document.getElementById('mp-modal').style.display = 'none';
                document.getElementById('mp-result-modal').style.display = 'none';
                document.getElementById('mp-rematch-btn').textContent = '⚔️ Rivincita';
                startMultiplayerGame();
                break;

            case 'opponent_score':
                document.getElementById('mp-opponent-score').textContent =
                    (msg.score || 0).toLocaleString();
                break;

            case 'opponent_game_over':
                this.opponentDone = true;
                this.opponentFinalScore = msg.score;
                document.getElementById('mp-opponent-label').textContent =
                    `${this.opponentName} (finito)`;
                document.getElementById('mp-opponent-score').textContent =
                    (msg.score || 0).toLocaleString();
                break;

            case 'result':
                showMPResult(msg);
                break;

            case 'rematch_requested':
                document.getElementById('mp-rematch-btn').textContent = `⚔️ Rivincita (${MP.opponentName} è pronto!)`;
                break;

            case 'opponent_emoji':
                showEmojiReaction(msg.emoji, false);
                break;

            case 'opponent_disconnected':
                this.showDisconnected();
                break;

            case 'error':
                showMPError(msg.message);
                break;
        }
    },

    showDisconnected() {
        this.active = false;
        document.getElementById('emoji-tray').style.display = 'none';
        document.getElementById('game-over-modal').style.display = 'none';
        document.getElementById('mp-leave-button').style.display = 'none';
        document.getElementById('mp-opponent-bar').style.display = 'none';
        alert(`⚠️ ${this.opponentName || 'L\'avversario'} si è disconnesso.`);
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('welcome-screen').style.display = 'flex';
    },
};

// ── QR Code generato in browser ──────────────────────────────────────────────

function generateQRCode(text, container) {
    container.innerHTML = '';
    new QRCode(container, {
        text: text,
        width: 180,
        height: 180,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
    });
    // Arrotonda il canvas generato
    const canvas = container.querySelector('canvas');
    if (canvas) canvas.style.borderRadius = '12px';
}

// ── URL param: auto-join ─────────────────────────────────────────────────────

function getMPRoomFromURL() {
    return new URLSearchParams(window.location.search).get('room');
}

// ── UI helpers ───────────────────────────────────────────────────────────────

function showQRScreen(roomCode) {
    document.getElementById('mp-step-initial').style.display = 'none';
    document.getElementById('mp-step-connecting').style.display = 'none';
    document.getElementById('mp-step-waiting').style.display = 'none';
    document.getElementById('mp-step-qr').style.display = 'flex';

    const joinUrl = `${GAME_URL}?room=${roomCode}`;
    document.getElementById('mp-room-code').textContent = roomCode;
    document.getElementById('mp-url-text').textContent = joinUrl;
    document.getElementById('mp-waiting-text').textContent = 'In attesa che l\'avversario si connetta...';

    generateQRCode(joinUrl, document.getElementById('mp-qr-image'));
}

function showMPConnecting(text) {
    document.getElementById('mp-step-initial').style.display = 'none';
    document.getElementById('mp-step-qr').style.display = 'none';
    document.getElementById('mp-step-waiting').style.display = 'none';
    document.getElementById('mp-step-connecting').style.display = 'flex';
    document.getElementById('mp-connecting-text').textContent = text;
}

function updateMPConnecting(text) {
    const el = document.getElementById('mp-connecting-text');
    if (el) el.textContent = text;
}

function showMPError(msg) {
    document.getElementById('mp-modal').style.display = 'none';
    alert('⚠️ ' + msg);
}

function startMultiplayerGame() {
    document.getElementById('mp-opponent-bar').style.display = 'flex';
    document.getElementById('mp-opponent-label').textContent = MP.opponentName || 'Avversario';
    document.getElementById('mp-opponent-score').textContent = '0';
    document.getElementById('emoji-tray').style.display = 'flex';
    startGame();
}

function showEmojiReaction(emoji, isMine) {
    const anchor = isMine
        ? document.getElementById('emoji-tray')
        : document.getElementById('mp-opponent-bar');
    const rect = (anchor || document.getElementById('grid')).getBoundingClientRect();
    const el = document.createElement('div');
    el.textContent = emoji;
    el.className = 'emoji-float';
    el.style.left = (rect.left + rect.width / 2 - 28) + 'px';
    el.style.top  = (rect.top + rect.height / 2 - 28) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1400);
}

function saveMPResult(won, draw) {
    try {
        const stats = JSON.parse(localStorage.getItem('playerStats') || '{}');
        if (draw) {
            stats.mpDraws = (stats.mpDraws || 0) + 1;
        } else if (won) {
            stats.mpWins = (stats.mpWins || 0) + 1;
        } else {
            stats.mpLosses = (stats.mpLosses || 0) + 1;
        }
        localStorage.setItem('playerStats', JSON.stringify(stats));
    } catch {}
}

function showMPResult(msg) {
    document.getElementById('game-over-modal').style.display = 'none';
    document.getElementById('mp-opponent-bar').style.display = 'none';

    saveMPResult(msg.you_won, msg.draw);

    const modal = document.getElementById('mp-result-modal');

    if (msg.draw) {
        document.getElementById('mp-result-title').textContent = '🤝 Pareggio!';
    } else if (msg.you_won) {
        document.getElementById('mp-result-title').textContent = '🏆 Hai vinto!';
    } else {
        document.getElementById('mp-result-title').textContent = '😅 Hai perso!';
    }

    document.getElementById('mp-result-your-score').textContent = (msg.your_score || 0).toLocaleString();
    document.getElementById('mp-result-opp-score').textContent = (msg.opponent_score || 0).toLocaleString();
    document.getElementById('mp-result-opp-name').textContent = msg.opponent_name || 'Avversario';

    modal.style.display = 'flex';
}

// ── Setup ────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const roomFromURL = getMPRoomFromURL();

    if (roomFromURL) {
        document.getElementById('mp-join-code').value = roomFromURL.toUpperCase();
        setTimeout(() => openMPModal('join'), 200);
    }

    document.getElementById('mp-button').addEventListener('click', () => openMPModal('choose'));

    document.getElementById('mp-crea-btn').addEventListener('click', async () => {
        const name = document.getElementById('player-name').value.trim() || 'Giocatore 1';
        await MP.createRoom(name);
    });

    document.getElementById('mp-join-btn').addEventListener('click', async () => {
        const code = document.getElementById('mp-join-code').value.trim().toUpperCase();
        const name = document.getElementById('player-name').value.trim() || 'Giocatore 2';
        if (!code) { alert('Inserisci il codice stanza'); return; }
        document.getElementById('mp-step-initial').style.display = 'none';
        await MP.joinRoom(code, name);
    });

    document.getElementById('mp-close-btn').addEventListener('click', () => {
        document.getElementById('mp-modal').style.display = 'none';
        if (MP.ws) { MP.ws.close(); MP.ws = null; }
    });

    document.getElementById('mp-rematch-btn').addEventListener('click', () => {
        document.getElementById('mp-rematch-btn').textContent = '⏳ In attesa dell\'avversario...';
        document.getElementById('mp-rematch-btn').disabled = true;
        MP.send({ type: 'rematch_request' });
    });

    document.getElementById('mp-result-again').addEventListener('click', () => {
        document.getElementById('mp-result-modal').style.display = 'none';
        document.getElementById('emoji-tray').style.display = 'none';
        MP.active = false;
        if (MP.ws) { MP.ws.close(); MP.ws = null; }
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('welcome-screen').style.display = 'flex';
    });

    document.getElementById('mp-leave-button').addEventListener('click', () => {
        document.getElementById('game-over-modal').style.display = 'none';
        document.getElementById('mp-leave-button').style.display = 'none';
        document.getElementById('mp-opponent-bar').style.display = 'none';
        document.getElementById('emoji-tray').style.display = 'none';
        MP.active = false;
        if (MP.ws) { MP.ws.close(); MP.ws = null; }
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('welcome-screen').style.display = 'flex';
    });
});

function openMPModal(mode) {
    document.getElementById('mp-modal').style.display = 'flex';
    document.getElementById('mp-step-initial').style.display = 'flex';
    document.getElementById('mp-step-qr').style.display = 'none';
    document.getElementById('mp-step-waiting').style.display = 'none';
    document.getElementById('mp-step-connecting').style.display = 'none';
    if (mode === 'join') {
        document.getElementById('mp-join-btn').click();
    }
}
