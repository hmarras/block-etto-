// Tutorial System
let currentTutorialStep = 0;

const tutorialSteps = [
    {
        title: "Benvenuto in Block-etto! 🎮",
        content: "Block-etto è un puzzle game dove devi piazzare i blocchi sulla griglia. Completa righe e colonne per eliminarle e fare punti!",
        visual: null
    },
    {
        title: "La Griglia 8x8",
        content: "Questa è la griglia di gioco. È composta da 8 righe e 8 colonne dove potrai piazzare i tuoi blocchi.",
        visual: () => {
            return `
                <div class="tutorial-visual">
                    <div class="tutorial-grid" style="grid-template-columns: repeat(8, 1fr);">
                        ${Array(64).fill(0).map((_, i) => {
                            const row = Math.floor(i / 8);
                            const col = i % 8;
                            const isCenter = (row >= 3 && row <= 4) && (col >= 3 && col <= 4);
                            return `<div class="tutorial-cell ${isCenter ? 'filled' : ''}"></div>`;
                        }).join('')}
                    </div>
                    <p style="margin-top: 12px; font-size: 14px;">Griglia 8x8</p>
                </div>
            `;
        }
    },
    {
        title: "I Pezzi Disponibili",
        content: "Avrai sempre 3 pezzi disponibili da piazzare. Ogni pezzo ha una forma diversa. Quando li usi tutti e 3, ne ricevi altri 3 nuovi!",
        visual: () => {
            return `
                <div class="tutorial-visual">
                    <div style="display: flex; gap: 24px; justify-content: center;">
                        <div class="tutorial-piece" style="grid-template-columns: repeat(2, 1fr);">
                            <div class="tutorial-piece-cell"></div>
                            <div class="tutorial-piece-cell"></div>
                            <div class="tutorial-piece-cell"></div>
                            <div class="tutorial-piece-cell"></div>
                        </div>
                        <div class="tutorial-piece" style="grid-template-columns: repeat(3, 1fr);">
                            <div class="tutorial-piece-cell"></div>
                            <div class="tutorial-piece-cell"></div>
                            <div class="tutorial-piece-cell"></div>
                        </div>
                        <div class="tutorial-piece" style="grid-template-columns: repeat(2, 1fr);">
                            <div class="tutorial-piece-cell"></div>
                            <div style="width: 28px; height: 28px;"></div>
                            <div class="tutorial-piece-cell"></div>
                            <div class="tutorial-piece-cell"></div>
                        </div>
                    </div>
                    <p style="margin-top: 12px; font-size: 14px;">Esempi di pezzi</p>
                </div>
            `;
        }
    },
    {
        title: "Come Piazzare i Blocchi",
        content: "1. Clicca su un pezzo per selezionarlo<br>2. Clicca sulla griglia dove vuoi piazzarlo<br>3. Il pezzo verrà posizionato se c'è spazio!",
        visual: () => {
            return `
                <div class="tutorial-visual">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div class="tutorial-piece" style="grid-template-columns: repeat(2, 1fr); padding: 12px; background: rgba(255,255,255,0.2); border-radius: 12px; border: 2px solid white;">
                            <div class="tutorial-piece-cell"></div>
                            <div class="tutorial-piece-cell"></div>
                            <div class="tutorial-piece-cell"></div>
                            <div class="tutorial-piece-cell"></div>
                        </div>
                        <span style="font-size: 32px;">➡️</span>
                        <div class="tutorial-grid" style="grid-template-columns: repeat(5, 1fr);">
                            ${Array(25).fill(0).map((_, i) => {
                                const isTarget = i >= 6 && i <= 7 || i >= 11 && i <= 12;
                                return `<div class="tutorial-cell ${isTarget ? 'filled' : ''}"></div>`;
                            }).join('')}
                        </div>
                    </div>
                    <p style="margin-top: 16px; font-size: 14px;">Seleziona il pezzo e cliccalo sulla griglia</p>
                </div>
            `;
        }
    },
    {
        title: "Completa Righe e Colonne",
        content: "Quando completi un'intera riga o colonna, questa viene eliminata automaticamente! Le celle scompaiono e guadagni punti bonus.",
        visual: () => {
            return `
                <div class="tutorial-visual">
                    <div class="tutorial-grid" style="grid-template-columns: repeat(8, 1fr);">
                        ${Array(64).fill(0).map((_, i) => {
                            const row = Math.floor(i / 8);
                            const col = i % 8;
                            const isHighlightRow = row === 3;
                            const isHighlightCol = col === 5;
                            const isFilled = (row === 3) || (col === 5) || (row === 2 && col === 2) || (row === 4 && col === 3);
                            return `<div class="tutorial-cell ${isFilled ? 'filled' : ''} ${isHighlightRow || isHighlightCol ? 'highlight' : ''}"></div>`;
                        }).join('')}
                    </div>
                    <p style="margin-top: 12px; font-size: 14px;">✨ Riga e colonna complete = eliminate!</p>
                </div>
            `;
        }
    },
    {
        title: "Sistema di Punteggio 🏆",
        content: "Guadagni punti in diversi modi:<br>• 10 punti per ogni blocco piazzato<br>• 100 punti per ogni riga/colonna eliminata<br>• Bonus combo se elimini più linee insieme!",
        visual: () => {
            return `
                <div class="tutorial-visual">
                    <div class="tutorial-score-demo">
                        <div class="score-item">
                            <div class="label">Blocco piazzato</div>
                            <div class="value">+10</div>
                        </div>
                        <div class="score-item">
                            <div class="label">Riga/Colonna</div>
                            <div class="value">+100</div>
                        </div>
                        <div class="score-item">
                            <div class="label">Combo 3x</div>
                            <div class="value">+150</div>
                        </div>
                    </div>
                </div>
            `;
        }
    },
    {
        title: "Game Over",
        content: "Il gioco finisce quando non puoi più piazzare nessuno dei 3 pezzi disponibili sulla griglia. Pianifica bene le tue mosse!",
        visual: () => {
            return `
                <div class="tutorial-visual">
                    <div class="tutorial-grid" style="grid-template-columns: repeat(6, 1fr);">
                        ${Array(36).fill(0).map((_, i) => {
                            const row = Math.floor(i / 6);
                            const col = i % 6;
                            // Griglia quasi piena con spazi sparsi
                            const isEmpty = (row === 1 && col === 1) || (row === 3 && col === 4) || (row === 5 && col === 0);
                            return `<div class="tutorial-cell ${!isEmpty ? 'filled' : ''}"></div>`;
                        }).join('')}
                    </div>
                    <p style="margin-top: 16px; font-size: 14px; color: rgba(255,255,255,0.7);">⚠️ Nessun pezzo può essere piazzato = Game Over</p>
                </div>
            `;
        }
    },
    {
        title: "Pronto a Giocare! 🚀",
        content: "Ora sai tutto! Ricorda:<br>• Pianifica le tue mosse<br>• Cerca di completare più linee insieme<br>• Non lasciare la griglia troppo piena<br><br>Buon divertimento!",
        visual: () => {
            return `
                <div class="tutorial-visual">
                    <div style="font-size: 64px; margin: 24px 0;">🎮</div>
                    <p style="font-size: 18px; font-weight: bold; color: var(--block-color-start);">Sei pronto!</p>
                </div>
            `;
        }
    }
];

function openTutorial() {
    currentTutorialStep = 0;
    document.getElementById('tutorial-modal').style.display = 'flex';
    renderTutorialStep();

    // Event listeners
    document.getElementById('close-tutorial').addEventListener('click', closeTutorial);
    document.getElementById('prev-step').addEventListener('click', previousStep);
    document.getElementById('next-step').addEventListener('click', nextStep);
}

function closeTutorial() {
    document.getElementById('tutorial-modal').style.display = 'none';
}

function renderTutorialStep() {
    const step = tutorialSteps[currentTutorialStep];
    const stepContainer = document.getElementById('tutorial-step');

    let html = `<h3>${step.title}</h3>`;
    html += `<p>${step.content}</p>`;

    if (step.visual && typeof step.visual === 'function') {
        html += step.visual();
    }

    stepContainer.innerHTML = html;

    // Update navigation
    document.getElementById('step-indicator').textContent = `${currentTutorialStep + 1} / ${tutorialSteps.length}`;
    document.getElementById('prev-step').disabled = currentTutorialStep === 0;
    document.getElementById('next-step').textContent = currentTutorialStep === tutorialSteps.length - 1 ? 'Inizia!' : 'Avanti →';

    // Update button styles
    document.getElementById('prev-step').style.opacity = currentTutorialStep === 0 ? '0.3' : '1';
    document.getElementById('prev-step').style.cursor = currentTutorialStep === 0 ? 'not-allowed' : 'pointer';
}

function previousStep() {
    if (currentTutorialStep > 0) {
        currentTutorialStep--;
        renderTutorialStep();
    }
}

function nextStep() {
    if (currentTutorialStep < tutorialSteps.length - 1) {
        currentTutorialStep++;
        renderTutorialStep();
    } else {
        // Last step - close tutorial and maybe start game
        closeTutorial();
    }
}
