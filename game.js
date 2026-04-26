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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPlayerData();
    loadTheme();
    setupWelcomeScreen();
    setupColorSelector();
});

function loadPlayerData() {
    playerName = localStorage.getItem('playerName') || '';
    bestScore = parseInt(localStorage.getItem('bestScore') || '0');

    if (playerName) {
        document.getElementById('player-name').value = playerName;
    }
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

    // Tutorial button
    document.getElementById('how-to-play-button').addEventListener('click', () => {
        openTutorial();
    });
}

function startGame() {
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

    for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            if (grid[row][col] === 1) {
                cell.classList.add('filled');
            }
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => onCellClick(row, col));
            gridEl.appendChild(cell);
        }
    }
}

function renderPieces() {
    const piecesEl = document.getElementById('pieces');
    piecesEl.innerHTML = '';

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

    if (canPlacePiece(piece.shape, row, col)) {
        placePiece(piece.shape, row, col);
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

function canPlacePiece(shape, startRow, startCol) {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) {
                const gridRow = startRow + r;
                const gridCol = startCol + c;

                if (gridRow >= GRID_SIZE || gridCol >= GRID_SIZE) return false;
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

function gameOver() {
    if (typeof MP !== 'undefined' && MP.active) {
        MP.sendGameOver(score);
        if (!MP.opponentDone) {
            // Mostra messaggio di attesa avversario
            document.getElementById('game-over-message').textContent = `Hai finito con ${score.toLocaleString()} punti! Attendi ${MP.opponentName}...`;
            document.getElementById('final-score').textContent = '';
            document.getElementById('piece-stats').innerHTML = '';
            document.getElementById('game-over-modal').style.display = 'flex';
            document.getElementById('play-again-button').style.display = 'none';
            return;
        }
    }
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

    // Show piece statistics
    const statsHTML = generateStatsHTML();
    const statsContainer = document.getElementById('piece-stats');
    if (statsContainer) {
        statsContainer.innerHTML = statsHTML;
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
