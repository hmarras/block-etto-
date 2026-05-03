// Constants
const GRID_SIZE = 8;
const PIECE_SHAPES = [
    { name: '1x1', shape: [[1]] },
    { name: '1x2', shape: [[1,1]] },
    { name: '2x1', shape: [[1],[1]] },
    { name: '1x3', shape: [[1,1,1]] },
    { name: '3x1', shape: [[1],[1],[1]] },
    { name: '2x2', shape: [[1,1],[1,1]] },
    { name: '1x4', shape: [[1,1,1,1]] },
    { name: '4x1', shape: [[1],[1],[1],[1]] },
    { name: 'L', shape: [[1,0],[1,1]] },
    { name: 'L↷', shape: [[1,1],[1,0]] },
    { name: 'L↶', shape: [[0,1],[1,1]] },
    { name: 'T', shape: [[1,1,1],[0,1,0]] },
];

// Game State
let grid = [];
let currentPieces = [];
let selectedPieceIndex = null;
let score = 0;
let bestScore = 0;
let playerName = '';
let pieceStats = {};
let linesCleared = 0;
let gameStartTime = null;
let activeSkin = 'classic';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPlayerData();
    loadTheme();
    setupWelcomeScreen();
    setupColorSelector();
    document.addEventListener('skinChanged', e => { activeSkin = e.detail; });

    const gridEl = document.getElementById('grid');
    gridEl.addEventListener('mouseleave', clearPreview);
    gridEl.addEventListener('touchmove', (e) => {
        if (selectedPieceIndex === null) return;
        e.preventDefault();
        const touch = e.touches[0];
        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        if (el && el.dataset.row !== undefined && el.dataset.col !== undefined) {
            showPreview(parseInt(el.dataset.row), parseInt(el.dataset.col));
        } else {
            clearPreview();
        }
    }, { passive: false });
    gridEl.addEventListener('touchend', clearPreview);
    gridEl.addEventListener('touchcancel', clearPreview);
});

function loadPlayerData() {
    playerName = localStorage.getItem('playerName') || '';
    bestScore = parseInt(localStorage.getItem('bestScore') || '0');
    loadActiveSkin();

    if (playerName) {
        document.getElementById('player-name').value = playerName;
    }
}

function loadActiveSkin() {
    activeSkin = localStorage.getItem('activeSkin') || 'classic';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('colorTheme') || 'purple';
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    // Remove all theme classes
    document.body.classList.remove('theme-purple', 'theme-pink', 'theme-blue', 'theme-green', 'theme-orange', 'theme-dark');

    // Add selected theme
    document.body.classList.add(`theme-${theme}`);

    // Save to localStorage
    localStorage.setItem('colorTheme', theme);

    // Update active button
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.theme === theme) {
            btn.classList.add('active');
        }
    });
}

function setupColorSelector() {
    document.querySelectorAll('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            applyTheme(btn.dataset.theme);
        });
    });
}

function setupWelcomeScreen() {
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('player-name').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startGame();
    });

    document.getElementById('how-to-play-button').addEventListener('click', () => {
        openTutorial();
    });

    document.getElementById('stats-button').addEventListener('click', openStatsModal);
    document.getElementById('stats-close-btn').addEventListener('click', () => {
        document.getElementById('stats-modal').style.display = 'none';
    });
}

function openStatsModal() {
    const name = localStorage.getItem('playerName') || 'Giocatore';
    const best = parseInt(localStorage.getItem('bestScore') || '0');
    const stats = loadAllStats();

    const played = stats.gamesPlayed || 0;
    const avg = played > 0 ? Math.round((stats.totalScore || 0) / played) : 0;
    const totalLines = stats.totalLines || 0;
    const mpWins = stats.mpWins || 0;
    const mpLosses = stats.mpLosses || 0;
    const mpDraws = stats.mpDraws || 0;
    const mpTotal = mpWins + mpLosses + mpDraws;
    const history = stats.history || [];

    const statBox = (label, value) =>
        `<div style="background:rgba(255,255,255,0.12);border-radius:12px;padding:14px;text-align:center;">
            <div style="color:rgba(255,255,255,0.7);font-size:11px;margin-bottom:4px;">${label}</div>
            <div style="color:white;font-size:22px;font-weight:900;">${value}</div>
        </div>`;

    const formatDuration = (s) => s < 60 ? `${s}s` : `${Math.floor(s/60)}m ${s%60}s`;
    const formatDate = (ts) => new Date(ts).toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit' });

    const historyRows = history.slice(0, 5).map(g =>
        `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.1);font-size:13px;color:rgba(255,255,255,0.9);">
            <span>${formatDate(g.date)}</span>
            <span style="font-weight:700;">${(g.score||0).toLocaleString()} pt</span>
            <span style="color:rgba(255,255,255,0.6);">${g.lines||0} linee · ${formatDuration(g.duration||0)}</span>
        </div>`
    ).join('');

    document.getElementById('stats-content').innerHTML = `
        <div style="text-align:center;margin-bottom:20px;">
            <div style="font-size:36px;margin-bottom:4px;">👤</div>
            <div style="color:white;font-size:20px;font-weight:800;">${name}</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
            ${statBox('Record', best.toLocaleString())}
            ${statBox('Partite', played)}
            ${statBox('Media', avg.toLocaleString())}
            ${statBox('Linee', totalLines.toLocaleString())}
        </div>
        ${mpTotal > 0 ? `
        <div style="background:rgba(255,255,255,0.1);border-radius:12px;padding:14px;margin-bottom:20px;">
            <div style="color:rgba(255,255,255,0.8);font-size:12px;text-align:center;margin-bottom:10px;">⚔️ MULTIPLAYER</div>
            <div style="display:flex;justify-content:space-around;text-align:center;">
                <div><div style="color:#4eff91;font-size:20px;font-weight:900;">${mpWins}</div><div style="color:rgba(255,255,255,0.6);font-size:11px;">Vittorie</div></div>
                <div><div style="color:#ff6b6b;font-size:20px;font-weight:900;">${mpLosses}</div><div style="color:rgba(255,255,255,0.6);font-size:11px;">Sconfitte</div></div>
                <div><div style="color:#ffd700;font-size:20px;font-weight:900;">${mpDraws}</div><div style="color:rgba(255,255,255,0.6);font-size:11px;">Pareggi</div></div>
            </div>
        </div>` : ''}
        ${history.length > 0 ? `
        <div>
            <div style="color:rgba(255,255,255,0.8);font-size:12px;margin-bottom:8px;">ULTIME PARTITE</div>
            ${historyRows}
        </div>` : '<p style="color:rgba(255,255,255,0.5);text-align:center;font-size:14px;">Gioca la tua prima partita!</p>'}
    `;

    document.getElementById('stats-modal').style.display = 'flex';
}

function startGame() {
    loadActiveSkin();
    playerName = document.getElementById('player-name').value.trim() || 'Giocatore';
    localStorage.setItem('playerName', playerName);

    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('game-screen').style.display = 'block';

    document.getElementById('current-player').textContent = playerName;
    document.getElementById('best-score').textContent = bestScore;

    initGame();
}

function initGame() {
    // Reset grid
    grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    score = 0;
    selectedPieceIndex = null;
    linesCleared = 0;
    gameStartTime = Date.now();

    // Reset piece statistics
    pieceStats = {};
    PIECE_SHAPES.forEach(p => {
        pieceStats[p.name] = 0;
    });

    // Generate pieces
    currentPieces = [
        randomPiece(),
        randomPiece(),
        randomPiece()
    ];

    render();

    document.getElementById('play-again-button').addEventListener('click', () => {
        document.getElementById('game-over-modal').style.display = 'none';
        initGame();
    });
}

function randomPiece() {
    const pieceData = PIECE_SHAPES[Math.floor(Math.random() * PIECE_SHAPES.length)];

    // Track statistics
    pieceStats[pieceData.name]++;

    return {
        shape: pieceData.shape,
        name: pieceData.name,
        id: Date.now() + Math.random()
    };
}

function render() {
    renderGrid();
    renderPieces();
    updateScore();
}

function renderGrid() {
    const gridEl = document.getElementById('grid');
    gridEl.innerHTML = '';
    gridEl.classList.toggle('skin-neon-active', activeSkin === 'neon');

    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (grid[row][col] === 1) {
                cell.classList.add('filled');
                applySkinToCell(cell, activeSkin, row, col, null);
            }
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => onCellClick(row, col));
            cell.addEventListener('mouseenter', () => showPreview(row, col));
            gridEl.appendChild(cell);
        }
    }
}

function renderPieces() {
    const piecesEl = document.getElementById('pieces');
    piecesEl.innerHTML = '';
    piecesEl.classList.toggle('skin-neon-active', activeSkin === 'neon');

    currentPieces.forEach((piece, index) => {
        if (!piece) return;

        const container = document.createElement('div');
        container.className = 'piece-container';
        if (selectedPieceIndex === index) {
            container.classList.add('selected');
        }

        const pieceGrid = document.createElement('div');
        pieceGrid.className = 'piece-grid';
        pieceGrid.style.gridTemplateColumns = `repeat(${piece.shape[0].length}, 20px)`;

        piece.shape.forEach(row => {
            row.forEach(cell => {
                const cellEl = document.createElement('div');
                if (cell === 1) {
                    cellEl.className = 'piece-cell';
                    applySkinToCell(cellEl, activeSkin, null, null, index);
                } else {
                    cellEl.style.width = '20px';
                    cellEl.style.height = '20px';
                }
                pieceGrid.appendChild(cellEl);
            });
        });

        container.appendChild(pieceGrid);
        container.addEventListener('click', () => selectPiece(index));
        piecesEl.appendChild(container);
    });
}

function selectPiece(index) {
    if (!currentPieces[index]) return;
    selectedPieceIndex = index;
    render();
}

async function onCellClick(row, col) {
    if (selectedPieceIndex === null) return;

    const piece = currentPieces[selectedPieceIndex];
    if (!piece) return;

    const off = getFirstFilledOffset(piece.shape);
    const startRow = row - off.r;
    const startCol = col - off.c;

    if (canPlacePiece(piece.shape, startRow, startCol)) {
        placePiece(piece.shape, startRow, startCol);
        currentPieces[selectedPieceIndex] = null;
        selectedPieceIndex = null;

        render();

        await clearLines();

        checkAndRefillPieces();

        if (!hasValidMoves()) {
            gameOver();
        }

        render();
    }
}

// Restituisce l'offset (r,c) della prima cella piena nel bounding box.
// Usato come ancora di piazzamento: il tap cade sulla prima cella piena,
// non sull'angolo top-left del bounding box (che può essere vuoto, es. L↶).
function getFirstFilledOffset(shape) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) return { r, c };
        }
    }
    return { r: 0, c: 0 };
}

function canPlacePiece(shape, startRow, startCol) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) {
                const gridRow = startRow + r;
                const gridCol = startCol + c;

                if (gridRow < 0 || gridRow >= GRID_SIZE || gridCol < 0 || gridCol >= GRID_SIZE) return false;
                if (grid[gridRow][gridCol] === 1) return false;
            }
        }
    }
    return true;
}

function placePiece(shape, startRow, startCol) {
    let blocksPlaced = 0;

    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) {
                grid[startRow + r][startCol + c] = 1;
                blocksPlaced++;
            }
        }
    }

    score += blocksPlaced * 10;
}

async function clearLines() {
    let rowsToClear = [];
    let colsToClear = [];

    // Check rows
    for (let r = 0; r < GRID_SIZE; r++) {
        if (grid[r].every(cell => cell === 1)) {
            rowsToClear.push(r);
        }
    }

    // Check columns
    for (let c = 0; c < GRID_SIZE; c++) {
        if (grid.every(row => row[c] === 1)) {
            colsToClear.push(c);
        }
    }

    const totalLines = rowsToClear.length + colsToClear.length;

    if (totalLines > 0) {
        // Add animation to cells that will be cleared
        rowsToClear.forEach(r => {
            for (let c = 0; c < GRID_SIZE; c++) {
                const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (cell) cell.classList.add('clearing');
            }
        });

        colsToClear.forEach(c => {
            for (let r = 0; r < GRID_SIZE; r++) {
                const cell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (cell && !cell.classList.contains('clearing')) {
                    cell.classList.add('clearing');
                }
            }
        });

        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Clear the grid data
        rowsToClear.forEach(r => grid[r].fill(0));
        colsToClear.forEach(c => grid.forEach(row => row[c] = 0));

        // Update score
        score += totalLines * 100;
        if (totalLines > 1) {
            score += totalLines * 50; // Combo bonus
        }
        linesCleared += totalLines;
    }
}

function checkAndRefillPieces() {
    const allUsed = currentPieces.every(p => p === null);
    if (allUsed) {
        currentPieces = [
            randomPiece(),
            randomPiece(),
            randomPiece()
        ];
    }
}

function hasValidMoves() {
    for (const piece of currentPieces) {
        if (!piece) continue;

        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (canPlacePiece(piece.shape, r, c)) {
                    return true;
                }
            }
        }
    }
    return false;
}

function updateScore() {
    document.getElementById('current-score').textContent = score;
    if (typeof MP !== 'undefined') MP.sendScore(score);
}

function saveGameStats() {
    const duration = Math.round((Date.now() - gameStartTime) / 1000);
    const stats = loadAllStats();

    stats.gamesPlayed = (stats.gamesPlayed || 0) + 1;
    stats.totalScore = (stats.totalScore || 0) + score;
    stats.totalLines = (stats.totalLines || 0) + linesCleared;

    const history = stats.history || [];
    history.unshift({ date: Date.now(), score, lines: linesCleared, duration });
    stats.history = history.slice(0, 20);

    localStorage.setItem('playerStats', JSON.stringify(stats));
}

function loadAllStats() {
    try {
        return JSON.parse(localStorage.getItem('playerStats') || '{}');
    } catch { return {}; }
}

function gameOver() {
    if (typeof MP !== 'undefined' && MP.active) {
        MP.sendGameOver(score);
        if (!MP.opponentDone) {
            document.getElementById('game-over-message').textContent = `Hai finito con ${score.toLocaleString()} punti! Attendi ${MP.opponentName}...`;
            document.getElementById('final-score').textContent = '';
            document.getElementById('piece-stats').innerHTML = '';
            document.getElementById('wallet-earned-notice').innerHTML = '';
            document.getElementById('engagement-notice').innerHTML = '';
            document.getElementById('game-over-modal').style.display = 'flex';
            document.getElementById('play-again-button').style.display = 'none';
            document.getElementById('mp-leave-button').style.display = '';
            return;
        }
    }

    saveGameStats();
    document.getElementById('mp-leave-button').style.display = 'none';
    const { earned, multiplier } = earnWalletPoints();

    document.getElementById('play-again-button').style.display = '';
    const isNewRecord = score > bestScore;

    if (isNewRecord) {
        bestScore = score;
        localStorage.setItem('bestScore', bestScore);
    }

    const message = isNewRecord
        ? `Bravo ${playerName}, hai fatto il record con ${score.toLocaleString()} punti!`
        : `Bravo ${playerName}, hai fatto ${score.toLocaleString()} punti.`;

    document.getElementById('game-over-message').textContent = message;
    document.getElementById('final-score').textContent = `Punteggio: ${score}`;

    const walletNotice = document.getElementById('wallet-earned-notice');
    if (walletNotice && earned > 0) {
        const promoLabel = multiplier > 1
            ? ` <span style="background:linear-gradient(135deg,#ffd700,#ffb300);color:#5a3a00;font-size:10px;font-weight:800;padding:2px 7px;border-radius:10px;letter-spacing:0.3px;">×${multiplier} PROMO!</span>`
            : '';
        const total = parseInt(localStorage.getItem('walletPoints') || '0');
        walletNotice.innerHTML = `
            <div style="background:rgba(255,255,255,0.12);border-radius:14px;padding:14px 20px;margin:16px 0;text-align:center;">
                <div style="color:rgba(255,255,255,0.7);font-size:12px;margin-bottom:4px;">Guadagnato${promoLabel}</div>
                <div style="color:#ffd700;font-size:28px;font-weight:900;">+${earned.toLocaleString()} 🪙</div>
                <div style="color:rgba(255,255,255,0.55);font-size:11px;margin-top:4px;">Saldo: ${total.toLocaleString()} pt</div>
            </div>`;
    } else if (walletNotice) {
        walletNotice.innerHTML = '';
    }

    // Show piece statistics
    const statsHTML = generateStatsHTML();
    const statsContainer = document.getElementById('piece-stats');
    if (statsContainer) {
        statsContainer.innerHTML = statsHTML;
    }

    if (typeof showEngagementNotice === 'function') {
        showEngagementNotice('engagement-notice');
    }

    document.getElementById('game-over-modal').style.display = 'flex';
}

function generateStatsHTML() {
    const total = Object.values(pieceStats).reduce((sum, count) => sum + count, 0);

    let html = '<div style="margin-top: 24px; text-align: center;">';
    html += '<h3 style="text-align: center; margin-bottom: 16px; color: white; font-size: 18px; font-weight: bold;">📊 Statistiche Forme</h3>';
    html += '<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; max-height: 300px; overflow-y: auto; padding: 8px;">';

    // Show all pieces in order
    PIECE_SHAPES.forEach(pieceData => {
        const count = pieceStats[pieceData.name] || 0;
        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;

        // Generate the visual representation of the piece
        const shapeHTML = generatePieceHTML(pieceData.shape);

        html += `
            <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <div style="display: flex; justify-content: center; align-items: center; min-height: 50px;">
                    ${shapeHTML}
                </div>
                <div style="color: white; font-weight: bold; font-size: 16px;">${count}x</div>
                <div style="color: rgba(255,255,255,0.7); font-size: 12px;">${percentage}%</div>
            </div>
        `;
    });

    html += '</div>';
    html += `<div style="text-align: center; margin-top: 16px; color: rgba(255,255,255,0.9); font-size: 14px;">Totale: ${total} forme</div>`;
    html += '</div>';

    return html;
}

function generatePieceHTML(shape) {
    const rows = shape.length;
    const cols = shape[0].length;

    // Get current theme colors
    const startColor = getComputedStyle(document.body).getPropertyValue('--block-color-start').trim();
    const endColor = getComputedStyle(document.body).getPropertyValue('--block-color-end').trim();

    let html = `<div style="display: grid; grid-template-columns: repeat(${cols}, 16px); gap: 2px;">`;

    shape.forEach(row => {
        row.forEach(cell => {
            if (cell === 1) {
                html += `<div style="width: 16px; height: 16px; background: linear-gradient(135deg, ${startColor} 0%, ${endColor} 100%); border-radius: 3px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`;
            } else {
                html += '<div style="width: 16px; height: 16px;"></div>';
            }
        });
    });

    html += '</div>';
    return html;
}

function clearPreview() {
    document.querySelectorAll('.cell.preview').forEach(c => c.classList.remove('preview'));
}

function showPreview(row, col) {
    clearPreview();
    if (selectedPieceIndex === null) return;
    const piece = currentPieces[selectedPieceIndex];
    if (!piece) return;
    const off = getFirstFilledOffset(piece.shape);
    const startRow = row - off.r;
    const startCol = col - off.c;
    if (!canPlacePiece(piece.shape, startRow, startCol)) return;
    piece.shape.forEach((r, ri) => {
        r.forEach((cell, ci) => {
            if (cell === 1) {
                const el = document.querySelector(`[data-row="${startRow + ri}"][data-col="${startCol + ci}"]`);
                if (el) el.classList.add('preview');
            }
        });
    });
}

function applySkinToCell(el, skin, row, col, pieceIndex) {
    [...el.classList].forEach(c => { if (c.startsWith('skin-')) el.classList.remove(c); });

    if (!skin || skin === 'classic') return;

    el.classList.add(`skin-${skin}`);

    if (skin === 'chess' && row !== null) {
        el.classList.add((row + col) % 2 === 0 ? 'skin-chess--light' : 'skin-chess--dark');
    }
    if (skin === 'gift') {
        const i = pieceIndex !== null ? pieceIndex % 3 : (row * GRID_SIZE + col) % 3;
        el.classList.add(['skin-gift--r', 'skin-gift--g', 'skin-gift--b'][i]);
    }
    if (skin === 'neon') {
        const i = pieceIndex !== null ? pieceIndex % 3 : (row + col) % 3;
        el.classList.add(['skin-neon--cyan', 'skin-neon--green', 'skin-neon--magenta'][i]);
    }
    if (skin === 'candy') {
        const colors = ['skin-candy--red','skin-candy--orange','skin-candy--yellow','skin-candy--green','skin-candy--blue','skin-candy--purple'];
        const i = pieceIndex !== null ? pieceIndex % 6 : (row + col) % 6;
        el.classList.add(colors[i]);
    }
    if (skin === 'pixel') {
        const variants = ['skin-pixel--dirt','skin-pixel--grass','skin-pixel--stone','skin-pixel--log'];
        const i = pieceIndex !== null ? pieceIndex % 4 : (row + col) % 4;
        el.classList.add(variants[i]);
    }
    if (skin === 'tetris') {
        const colors = ['skin-tetris--cyan','skin-tetris--yellow','skin-tetris--purple','skin-tetris--green','skin-tetris--red','skin-tetris--blue','skin-tetris--orange'];
        const i = pieceIndex !== null ? pieceIndex % 7 : (row + col) % 7;
        el.classList.add(colors[i]);
    }
    if (skin === 'gem') {
        const variants = ['skin-gem--ruby','skin-gem--sapphire','skin-gem--emerald','skin-gem--amethyst'];
        const i = pieceIndex !== null ? pieceIndex % 4 : (row + col) % 4;
        el.classList.add(variants[i]);
    }
    if (skin === 'retro') {
        const variants = ['skin-retro--red','skin-retro--cyan','skin-retro--orange','skin-retro--pink'];
        const i = pieceIndex !== null ? pieceIndex % 4 : (row + col) % 4;
        el.classList.add(variants[i]);
    }
}

function earnWalletPoints() {
    const stats = loadAllStats();
    const gamesPlayed = stats.gamesPlayed || 1;
    const multiplier = gamesPlayed <= 5 ? 5 : gamesPlayed <= 10 ? 3 : gamesPlayed <= 20 ? 2 : 1;
    const base = Math.floor(score / 30);
    const earned = base * multiplier;
    const current = parseInt(localStorage.getItem('walletPoints') || '0');
    localStorage.setItem('walletPoints', current + earned);
    return { earned, multiplier };
}
