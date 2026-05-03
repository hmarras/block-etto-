// Tutorial System
let currentTutorialStep = 0;

const tutorialSteps = [
    {
        title: "Benvenuto in Block-etto! 🎮",
        content: "Block-etto è un puzzle game dove piazzi blocchi sulla griglia, completi righe e colonne e fai il record. Ci vogliono 2 minuti per imparare — e una vita per padroneggiarlo!",
        visual: null
    },
    {
        title: "La Griglia 8×8",
        content: "La griglia è composta da 8 righe e 8 colonne. Il tuo obiettivo: riempila strategicamente per eliminare quante più linee possibile!",
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
                    <p style="margin-top: 12px; font-size: 14px;">Griglia 8×8</p>
                </div>
            `;
        }
    },
    {
        title: "I 3 Pezzi",
        content: "Hai sempre 3 pezzi disponibili, usali nell'ordine che preferisci. Quando li usi tutti e 3, ne ricevi automaticamente 3 nuovi. Attenzione: non puoi scartarli!",
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
        content: "1. Tocca un pezzo per selezionarlo (si illumina)<br>2. Tocca la cella della griglia dove vuoi piazzarlo<br>3. Il pezzo viene posizionato solo se c'è spazio libero!",
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
                    <p style="margin-top: 16px; font-size: 14px;">Seleziona il pezzo → tocca la griglia</p>
                </div>
            `;
        }
    },
    {
        title: "Completa Righe e Colonne",
        content: "Quando completi un'intera riga o colonna, viene eliminata automaticamente! Puoi eliminare più linee contemporaneamente per guadagnare un bonus combo.",
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
        content: "Guadagni punti in diversi modi:<br>• 10 punti per ogni blocco piazzato<br>• 100 punti per ogni riga/colonna eliminata<br>• Bonus combo se elimini più linee insieme!<br>• In modalità PRO, bonus per velocità di reazione",
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
        title: "Monete e Collezione 🎨",
        content: "Ogni partita ti fa guadagnare monete in base al punteggio. Usa le monete nel negozio per sbloccare skin che cambiano l'aspetto della griglia e dei blocchi!",
        visual: () => {
            return `
                <div class="tutorial-visual">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <span style="font-size: 36px;">🎮</span>
                            <span style="font-size: 24px; color: rgba(255,255,255,0.6);">→</span>
                            <span style="font-size: 36px;">🪙</span>
                            <span style="font-size: 24px; color: rgba(255,255,255,0.6);">→</span>
                            <span style="font-size: 36px;">🎨</span>
                        </div>
                        <div style="background: rgba(255,255,255,0.1); border-radius: 12px; padding: 12px 20px; font-size: 13px; text-align: center;">
                            Partita → Monete → <strong>Collezione</strong><br>
                            <span style="color: rgba(255,255,255,0.7); font-size: 12px;">Sblocca skin nel negozio, equipaggiale nel guardaroba</span>
                        </div>
                    </div>
                </div>
            `;
        }
    },
    {
        title: "Sfida un Amico ⚔️",
        content: "Gioca contro un amico in tempo reale! Crea una partita e condividi il codice (o il QR). I punteggi si aggiornano live. Puoi anche mandargli emoji per provocarlo! 😜",
        visual: () => {
            return `
                <div class="tutorial-visual">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 14px;">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="background: rgba(255,255,255,0.15); border-radius: 12px; padding: 10px 16px; text-align: center;">
                                <div style="font-size: 22px;">📱</div>
                                <div style="font-size: 11px; margin-top: 4px;">Tu</div>
                            </div>
                            <div style="text-align: center;">
                                <div style="font-size: 20px;">⚔️</div>
                                <div style="font-size: 10px; color: rgba(255,255,255,0.5);">in tempo reale</div>
                            </div>
                            <div style="background: rgba(255,255,255,0.15); border-radius: 12px; padding: 10px 16px; text-align: center;">
                                <div style="font-size: 22px;">📱</div>
                                <div style="font-size: 11px; margin-top: 4px;">Amico</div>
                            </div>
                        </div>
                        <div style="font-size: 28px; letter-spacing: 4px;">😜 👊 🔥 💀 👏</div>
                        <p style="font-size: 12px; color: rgba(255,255,255,0.7); margin: 0;">Manda emoji al tuo avversario durante la partita</p>
                    </div>
                </div>
            `;
        }
    },
    {
        title: "Game Over",
        content: "Il gioco finisce quando non puoi più piazzare nessuno dei 3 pezzi sulla griglia. In modalità PRO finisce anche se lasci scadere il timer. Pianifica bene le tue mosse!",
        visual: () => {
            return `
                <div class="tutorial-visual">
                    <div class="tutorial-grid" style="grid-template-columns: repeat(6, 1fr);">
                        ${Array(36).fill(0).map((_, i) => {
                            const row = Math.floor(i / 6);
                            const col = i % 6;
                            const isEmpty =
                                (row === 0 && col === 1) ||
                                (row === 1 && col === 3) ||
                                (row === 2 && col === 0) ||
                                (row === 2 && col === 4) ||
                                (row === 3 && col === 2) ||
                                (row === 4 && col === 5) ||
                                (row === 5 && col === 1) ||
                                (row === 5 && col === 3);
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
        content: "Ora sai tutto! Ricorda:<br>• Pianifica le mosse e punta alle combo<br>• Guadagna monete e sblocca skin nella Collezione<br>• Sfida un amico con le emoji 😜<br>• Prova la modalità PRO per una sfida vera!",
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
