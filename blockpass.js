// ── Block Pass: livelli e ricompense ──────────────────────────────────────────

const BP_LEVELS = [
    { xp: 100,  reward: { type: 'coins',  amount: 50,  label: '50 🪙' } },
    { xp: 250,  reward: { type: 'potion', kind: 'points', multiplier: 1.5, emoji: '🫧', name: 'Pozione Punti', effect: '×1.5 punti', duration: 15 } },
    { xp: 450,  reward: { type: 'coins',  amount: 150, label: '150 🪙' } },
    { xp: 700,  reward: { type: 'potion', kind: 'money',  multiplier: 2,   emoji: '✨', name: 'Pozione Soldi', effect: '×2 monete',  duration: 15 } },
    { xp: 1000, reward: { type: 'coins',  amount: 300, label: '300 🪙' } },
    { xp: 1350, reward: { type: 'potion', kind: 'points', multiplier: 2,   emoji: '🫧', name: 'Pozione Punti', effect: '×2 punti',   duration: 30 } },
    { xp: 1750, reward: { type: 'coins',  amount: 500, label: '500 🪙' } },
    { xp: 2200, reward: { type: 'potion', kind: 'money',  multiplier: 3,   emoji: '✨', name: 'Pozione Soldi', effect: '×3 monete',  duration: 30 } },
    { xp: 2700, reward: { type: 'coins',  amount: 750, label: '750 🪙' } },
    { xp: 3300, reward: { type: 'skin',   key: 'paradise',     label: 'Skin ☁️ Paradiso' } },
];

// ── LocalStorage helpers: Block Pass ─────────────────────────────────────────

function bpGetXP() {
    return parseInt(localStorage.getItem('bpXP') || '0');
}

function bpSetXP(v) {
    localStorage.setItem('bpXP', Math.max(0, v));
}

function bpGetClaimed() {
    try { return JSON.parse(localStorage.getItem('bpClaimed') || '[]'); }
    catch { return []; }
}

function bpIsClaimed(i) {
    return bpGetClaimed().includes(i);
}

function bpMarkClaimed(i) {
    const claimed = bpGetClaimed();
    if (!claimed.includes(i)) {
        claimed.push(i);
        localStorage.setItem('bpClaimed', JSON.stringify(claimed));
    }
}

function bpIsUnlocked(i) {
    return bpGetXP() >= BP_LEVELS[i].xp;
}

function bpCurrentLevel() {
    const xp = bpGetXP();
    let lv = 0;
    for (let i = 0; i < BP_LEVELS.length; i++) {
        if (xp >= BP_LEVELS[i].xp) lv = i + 1;
    }
    return lv;
}

// ── LocalStorage helpers: Pozioni ────────────────────────────────────────────

function potionsGetInventory() {
    try { return JSON.parse(localStorage.getItem('potions') || '[]'); }
    catch { return []; }
}

function potionsSetInventory(arr) {
    localStorage.setItem('potions', JSON.stringify(arr));
}

function potionsGetActive() {
    try { return JSON.parse(localStorage.getItem('activePotions') || '[]'); }
    catch { return []; }
}

function potionsSetActive(arr) {
    localStorage.setItem('activePotions', JSON.stringify(arr));
}

function potionsCleanExpired() {
    const now = Date.now();
    const active = potionsGetActive().filter(p => p.expiresAt > now);
    potionsSetActive(active);
}

function potionAddToInventory(potion) {
    const inv = potionsGetInventory();
    inv.push({ ...potion, uid: Date.now() + Math.random() });
    potionsSetInventory(inv);
}

function potionActivate(uid) {
    potionsCleanExpired();
    const inv = potionsGetInventory();
    const idx = inv.findIndex(p => p.uid === uid);
    if (idx === -1) return false;
    const potion = inv[idx];

    const active = potionsGetActive();
    const expiresAt = Date.now() + potion.duration * 60 * 1000;
    active.push({ ...potion, expiresAt });
    potionsSetActive(active);

    inv.splice(idx, 1);
    potionsSetInventory(inv);
    return true;
}

// ── Moltiplicatori attivi ────────────────────────────────────────────────────

function getActivePointsMultiplier() {
    potionsCleanExpired();
    const active = potionsGetActive();
    let mult = 1;
    for (const p of active) {
        if (p.kind === 'points' && p.multiplier > mult) mult = p.multiplier;
    }
    return mult;
}

function getActiveMoneyMultiplier() {
    potionsCleanExpired();
    const active = potionsGetActive();
    let mult = 1;
    for (const p of active) {
        if (p.kind === 'money' && p.multiplier > mult) mult = p.multiplier;
    }
    return mult;
}

// ── Aggiungi XP a fine partita ────────────────────────────────────────────────

function blockPassAddXP(score, linesCleared) {
    const gained = Math.floor(score / 50) + linesCleared * 5;
    if (gained <= 0) { bpUpdateWelcomeIndicator(); return; }

    const oldXP = bpGetXP();
    bpSetXP(oldXP + gained);
    const newLevel = bpCurrentLevel();

    const claimed = bpGetClaimed();
    const unclaimed = BP_LEVELS.filter((_, i) => bpIsUnlocked(i) && !bpIsClaimed(i)).length;

    const el = document.getElementById('bp-xp-notice');
    if (!el) { bpUpdateWelcomeIndicator(); return; }

    let html = `
        <div style="background:rgba(135,206,235,0.12);border:1px solid rgba(135,206,235,0.25);border-radius:14px;padding:14px 18px;margin:10px 0;text-align:center;">
            <div style="color:rgba(255,255,255,0.8);font-size:12px;margin-bottom:4px;">☁️ Block Pass</div>
            <div style="color:#7dd3fc;font-size:20px;font-weight:900;">+${gained} XP</div>
            <div style="color:rgba(255,255,255,0.65);font-size:11px;margin-top:4px;">Livello ${newLevel}/10 · ${bpGetXP().toLocaleString()} XP totali</div>`;

    if (unclaimed > 0) {
        html += `<div style="margin-top:8px;"><button onclick="openBlockPassModal()" style="background:linear-gradient(135deg,#fbbf24,#fde68a);border:none;color:#78350f;font-size:12px;font-weight:800;padding:6px 16px;border-radius:10px;cursor:pointer;">🎁 ${unclaimed} ${unclaimed === 1 ? 'ricompensa' : 'ricompense'} da riscattare!</button></div>`;
    }

    html += '</div>';
    el.innerHTML = html;

    bpUpdateWelcomeIndicator();
}

// ── Riscatta ricompensa ──────────────────────────────────────────────────────

function bpClaimReward(levelIdx) {
    if (!bpIsUnlocked(levelIdx) || bpIsClaimed(levelIdx)) return;
    const level = BP_LEVELS[levelIdx];
    const reward = level.reward;

    if (reward.type === 'coins') {
        if (typeof shopGetWallet === 'function' && typeof shopSetWallet === 'function') {
            shopSetWallet(shopGetWallet() + reward.amount);
        }
    } else if (reward.type === 'potion') {
        potionAddToInventory(reward);
    } else if (reward.type === 'skin') {
        if (typeof shopAddOwned === 'function') shopAddOwned(reward.key);
        if (typeof shopSetActive === 'function') shopSetActive(reward.key);
    }

    bpMarkClaimed(levelIdx);
    bpRenderModal();
}

// ── Modal Block Pass ──────────────────────────────────────────────────────────

function openBlockPassModal() {
    const modal = document.getElementById('bp-modal');
    if (!modal) return;
    bpRenderModal();
    modal.style.display = 'flex';
}

function closeBlockPassModal() {
    const modal = document.getElementById('bp-modal');
    if (modal) modal.style.display = 'none';
    bpUpdateWelcomeIndicator();
}

function bpRenderModal() {
    const container = document.getElementById('bp-modal-content');
    if (!container) return;

    const xp = bpGetXP();
    const currentLv = bpCurrentLevel();
    const nextLvIdx = currentLv; // indice del prossimo livello (0-based)
    const maxXP = BP_LEVELS[BP_LEVELS.length - 1].xp;

    let xpBarPct, xpBarLabel;
    if (currentLv >= 10) {
        xpBarPct = 100;
        xpBarLabel = `${xp.toLocaleString()} XP · Livello massimo!`;
    } else {
        const prevXP = currentLv > 0 ? BP_LEVELS[currentLv - 1].xp : 0;
        const nextXP = BP_LEVELS[nextLvIdx].xp;
        xpBarPct = Math.min(100, Math.round(((xp - prevXP) / (nextXP - prevXP)) * 100));
        xpBarLabel = `${xp.toLocaleString()} / ${nextXP.toLocaleString()} XP`;
    }

    let cardsHTML = '';
    for (let i = 0; i < BP_LEVELS.length; i++) {
        const lv = BP_LEVELS[i];
        const unlocked = bpIsUnlocked(i);
        const claimed = bpIsClaimed(i);
        const reward = lv.reward;
        const opacity = unlocked ? '1' : '0.5';

        let rewardHTML = '';
        if (reward.type === 'coins') {
            rewardHTML = `<span style="font-size:13px;">🪙 ${reward.label}</span>`;
        } else if (reward.type === 'potion') {
            rewardHTML = `<span style="font-size:13px;">${reward.emoji} ${reward.name} ${reward.effect} (${reward.duration}min)</span>`;
        } else if (reward.type === 'skin') {
            rewardHTML = `<span style="font-size:13px;">☁️ ${reward.label}</span>`;
        }

        let actionHTML = '';
        if (claimed) {
            actionHTML = `<span style="color:#fbbf24;font-size:12px;font-weight:800;">✓ Riscattato</span>`;
        } else if (unlocked) {
            actionHTML = `<button onclick="bpClaimReward(${i})" style="background:linear-gradient(135deg,#fbbf24,#fde68a);border:none;color:#78350f;font-size:12px;font-weight:800;padding:6px 18px;border-radius:10px;cursor:pointer;">Riscatta</button>`;
        } else {
            actionHTML = `<span style="color:rgba(255,255,255,0.5);font-size:11px;">🔒 ${lv.xp.toLocaleString()} XP</span>`;
        }

        const circleBg = claimed ? 'linear-gradient(135deg,#fbbf24,#fde68a)' : 'rgba(255,255,255,0.15)';
        const circleColor = claimed ? '#78350f' : 'white';

        cardsHTML += `
            <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;opacity:${opacity};box-sizing:border-box;">
                <div style="flex-shrink:0;width:36px;height:36px;border-radius:50%;background:${circleBg};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:${circleColor};">${i + 1}</div>
                <div style="flex:1;min-width:0;">
                    <div style="color:rgba(255,255,255,0.65);font-size:10px;letter-spacing:0.8px;text-transform:uppercase;margin-bottom:2px;">Livello ${i + 1}</div>
                    <div style="color:white;font-size:13px;font-weight:700;">${rewardHTML}</div>
                </div>
                <div style="flex-shrink:0;">${actionHTML}</div>
            </div>`;
    }

    container.innerHTML = `
        <div style="text-align:center;margin-bottom:20px;">
            <div style="font-size:32px;">☁️✨</div>
            <div style="color:white;font-size:20px;font-weight:900;margin-top:6px;">Block Pass</div>
            <div style="color:rgba(255,255,255,0.75);font-size:13px;margin-top:2px;">Livello ${currentLv}/10</div>
        </div>

        <div style="margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;color:rgba(255,255,255,0.7);font-size:11px;margin-bottom:6px;">
                <span>XP</span><span>${xpBarLabel}</span>
            </div>
            <div style="height:10px;background:rgba(255,255,255,0.15);border-radius:8px;overflow:hidden;">
                <div style="height:100%;width:${xpBarPct}%;background:linear-gradient(90deg,#fbbf24,#fde68a);border-radius:8px;transition:width 0.5s ease;"></div>
            </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px;">
            ${cardsHTML}
        </div>

        <div style="text-align:center;color:rgba(255,255,255,0.45);font-size:10px;line-height:1.6;">
            Guadagni XP giocando. Ogni 50 pt = 1 XP · Ogni linea = 5 XP
        </div>`;
}

// ── Pozioni: render pannello ──────────────────────────────────────────────────

function potionsRender() {
    const container = document.getElementById('collezione-potions-pane');
    if (!container) return;

    potionsCleanExpired();
    const active = potionsGetActive();
    const inv = potionsGetInventory();
    const now = Date.now();

    let html = '';

    if (active.length > 0) {
        html += `<div style="color:rgba(255,255,255,0.65);font-size:10px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:8px;">Attive ora</div>`;
        for (const p of active) {
            const minsLeft = Math.max(1, Math.ceil((p.expiresAt - now) / 60000));
            html += `
                <div style="background:rgba(135,206,235,0.15);border:1px solid rgba(135,206,235,0.3);border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                    <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#4ade80;box-shadow:0 0 6px #4ade80;animation:pulse 1.5s infinite;flex-shrink:0;"></span>
                    <div style="flex:1;">
                        <div style="color:white;font-size:13px;font-weight:700;">${p.emoji} ${p.name}</div>
                        <div style="color:rgba(255,255,255,0.6);font-size:11px;">${p.effect} · ${minsLeft} min rimanenti</div>
                    </div>
                </div>`;
        }
        html += `<div style="margin-bottom:16px;"></div>`;
    }

    html += `<div style="color:rgba(255,255,255,0.65);font-size:10px;letter-spacing:1.2px;text-transform:uppercase;margin-bottom:8px;">Inventario</div>`;

    if (inv.length === 0) {
        html += `<div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px;text-align:center;color:rgba(255,255,255,0.5);font-size:13px;">Sali di livello nel Block Pass!</div>`;
    } else {
        for (const p of inv) {
            html += `
                <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.15);border-radius:12px;padding:12px 14px;display:flex;align-items:center;gap:10px;margin-bottom:8px;">
                    <div style="font-size:24px;flex-shrink:0;">${p.emoji}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="color:white;font-size:13px;font-weight:700;">${p.name}</div>
                        <div style="color:rgba(255,255,255,0.6);font-size:11px;">${p.effect} · ${p.duration} min</div>
                    </div>
                    <button onclick="potionActivateAndRefresh(${p.uid})" style="flex-shrink:0;background:linear-gradient(135deg,#87CEEB,#4facfe);border:none;color:white;font-size:12px;font-weight:700;padding:7px 12px;border-radius:9px;cursor:pointer;white-space:nowrap;">✨ Attiva</button>
                </div>`;
        }
    }

    container.innerHTML = html;
}

function potionActivateAndRefresh(uid) {
    potionActivate(uid);
    potionsRender();
    bpUpdateActivePotionBar();

    const toast = document.createElement('div');
    toast.textContent = '✨ Pozione attivata!';
    toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:rgba(135,206,235,0.9);color:#0c4a6e;font-size:14px;font-weight:800;padding:10px 22px;border-radius:24px;z-index:9999;pointer-events:none;animation:fadeInUp 0.3s ease;';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2200);
}

// ── Indicatore welcome screen ─────────────────────────────────────────────────

function bpUpdateWelcomeIndicator() {
    const btn = document.getElementById('bp-welcome-btn');
    if (!btn) return;

    const unclaimed = BP_LEVELS.filter((_, i) => bpIsUnlocked(i) && !bpIsClaimed(i)).length;
    const lv = bpCurrentLevel();

    if (unclaimed > 0) {
        btn.textContent = `☁️ Block Pass · ${unclaimed} 🎁`;
    } else {
        btn.textContent = `☁️ Block Pass · Lv.${lv}/10`;
    }
}

// ── Barra pozioni attive in game screen ───────────────────────────────────────

function bpUpdateActivePotionBar() {
    const bar = document.getElementById('active-potion-bar');
    if (!bar) return;

    potionsCleanExpired();
    const active = potionsGetActive();
    const now = Date.now();

    if (active.length === 0) {
        bar.style.display = 'none';
        return;
    }

    bar.style.display = 'flex';
    bar.innerHTML = active.map(p => {
        const minsLeft = Math.max(1, Math.ceil((p.expiresAt - now) / 60000));
        return `<span>${p.emoji} ${p.name} ${p.effect} · ${minsLeft}min</span>`;
    }).join('<span style="opacity:0.4;">·</span>');
}

// ── DOMContentLoaded setup ────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    bpUpdateWelcomeIndicator();
    bpUpdateActivePotionBar();

    const bpWelcomeBtn = document.getElementById('bp-welcome-btn');
    if (bpWelcomeBtn) bpWelcomeBtn.addEventListener('click', openBlockPassModal);

    const bpModalClose = document.getElementById('bp-modal-close');
    if (bpModalClose) bpModalClose.addEventListener('click', closeBlockPassModal);

    const bpModal = document.getElementById('bp-modal');
    if (bpModal) {
        bpModal.addEventListener('click', e => {
            if (e.target === bpModal) closeBlockPassModal();
        });
    }

    setInterval(() => {
        potionsCleanExpired();
        bpUpdateActivePotionBar();
    }, 30000);
});
