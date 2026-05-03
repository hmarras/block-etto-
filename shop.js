// ── Catalogo skin ─────────────────────────────────────────────────────────────

const SKIN_CATALOG = [
    { key: 'classic',  name: 'Classic',   price: 0,    section: 'main',   emoji: '⭐' },
    { key: 'chess',    name: 'Scacchi',   price: 300,  section: 'main',   emoji: '♟️' },
    { key: 'wood',     name: 'Legno',     price: 450,  section: 'main',   emoji: '🪵' },
    { key: 'gift',     name: 'Regali',    price: 600,  section: 'main',   emoji: '🎁' },
    { key: 'neon',     name: 'Neon',      price: 750,  section: 'main',   emoji: '💡' },
    { key: 'lego',     name: 'Lego',      price: 950,  section: 'main',   emoji: '🧱' },
    { key: 'crystal',  name: 'Cristallo', price: 1200, section: 'main',   emoji: '💎' },
    { key: 'juventus', name: 'Juventus',  price: 1500, section: 'calcio', emoji: '⚽' },
    { key: 'milan',    name: 'Milan',     price: 1500, section: 'calcio', emoji: '⚽' },
    { key: 'inter',    name: 'Inter',     price: 1500, section: 'calcio', emoji: '⚽' },
    { key: 'napoli',   name: 'Napoli',    price: 1500, section: 'calcio', emoji: '⚽' },
    { key: 'retro',   name: 'Retro',      price: 1600, section: 'games',  emoji: '👾' },
    { key: 'candy',   name: 'Candy',      price: 1800, section: 'games',  emoji: '🍬' },
    { key: 'mario',   name: 'Mario',      price: 1800, section: 'games',  emoji: '🧱' },
    { key: 'pixel',   name: 'Minecraft',  price: 2000, section: 'games',  emoji: '⛏️' },
    { key: 'tetris',  name: 'Tetris',     price: 2000, section: 'games',  emoji: '🟦' },
    { key: 'ice',     name: 'Ice',        price: 2200, section: 'games',  emoji: '❄️' },
    { key: 'fire',    name: 'Fuoco',      price: 2200, section: 'games',  emoji: '🔥' },
    { key: 'gem',     name: 'Gem',        price: 2600, section: 'games',  emoji: '💠' },
    { key: 'metal',   name: 'Metal',      price: 2800, section: 'games',  emoji: '⚙️' },
    { key: 'galaxy',  name: 'Galaxy',     price: 3200, section: 'games',  emoji: '🌌' },
];

// ── Wallet helpers ─────────────────────────────────────────────────────────────

function shopGetWallet() {
    return parseInt(localStorage.getItem('walletPoints') || '0');
}

function shopSetWallet(n) {
    localStorage.setItem('walletPoints', Math.max(0, n));
}

function shopGetOwned() {
    try { return JSON.parse(localStorage.getItem('ownedSkins') || '["classic"]'); }
    catch { return ['classic']; }
}

function shopIsOwned(key) {
    return shopGetOwned().includes(key);
}

function shopAddOwned(key) {
    const owned = shopGetOwned();
    if (!owned.includes(key)) {
        owned.push(key);
        localStorage.setItem('ownedSkins', JSON.stringify(owned));
    }
}

function shopGetActive() {
    return localStorage.getItem('activeSkin') || 'classic';
}

function shopSetActive(key) {
    localStorage.setItem('activeSkin', key);
    document.dispatchEvent(new CustomEvent('skinChanged', { detail: key }));
}

// ── Promo info ─────────────────────────────────────────────────────────────────

function shopGetPromoInfo() {
    try {
        const stats = JSON.parse(localStorage.getItem('playerStats') || '{}');
        const gamesPlayed = stats.gamesPlayed || 0;
        if (gamesPlayed < 5)  return { multiplier: 5, gamesLeft: 5  - gamesPlayed };
        if (gamesPlayed < 10) return { multiplier: 3, gamesLeft: 10 - gamesPlayed };
        if (gamesPlayed < 20) return { multiplier: 2, gamesLeft: 20 - gamesPlayed };
        return { multiplier: 1, gamesLeft: 0 };
    } catch { return { multiplier: 1, gamesLeft: 0 }; }
}

// ── Acquisto ───────────────────────────────────────────────────────────────────

function shopBuySkin(key) {
    if (shopIsOwned(key)) return { success: false, reason: 'already_owned' };
    const skin = SKIN_CATALOG.find(s => s.key === key);
    if (!skin) return { success: false, reason: 'not_found' };
    if (shopGetWallet() < skin.price) return { success: false, reason: 'insufficient_funds' };

    shopSetWallet(shopGetWallet() - skin.price);
    shopAddOwned(key);
    shopSetActive(key);
    shopRefreshUI();
    return { success: true };
}

// ── Stato card ─────────────────────────────────────────────────────────────────

function shopGetCardState(key) {
    if (key === 'classic') return 'free';
    const active = shopGetActive();
    if (shopIsOwned(key)) return active === key ? 'owned_active' : 'owned_inactive';
    const skin = SKIN_CATALOG.find(s => s.key === key);
    return shopGetWallet() >= (skin?.price || 0) ? 'locked_affordable' : 'locked_expensive';
}

// ── Preview celle ──────────────────────────────────────────────────────────────

function shopBuildPreviewCells(key) {
    // Griglia 3×3, forma a L: indici 3, 6, 7 sono filled
    const activeIndices = [3, 6, 7];
    let html = '';

    for (let i = 0; i < 9; i++) {
        if (!activeIndices.includes(i)) {
            html += `<div style="width:22px;height:22px;background:rgba(255,255,255,0.42);border-radius:4px;"></div>`;
            continue;
        }

        let classes = 'cell filled';
        if (key !== 'classic') classes += ` skin-${key}`;

        let extraClass = '';
        const idx = activeIndices.indexOf(i);
        if (key === 'chess') {
            const row = Math.floor(i / 3), col = i % 3;
            extraClass = (row + col) % 2 === 0 ? 'skin-chess--light' : 'skin-chess--dark';
        } else if (key === 'gift') {
            extraClass = ['skin-gift--r', 'skin-gift--g', 'skin-gift--b'][idx];
        } else if (key === 'neon') {
            extraClass = ['skin-neon--cyan', 'skin-neon--green', 'skin-neon--magenta'][idx];
        } else if (key === 'candy') {
            extraClass = ['skin-candy--red', 'skin-candy--blue', 'skin-candy--yellow'][idx];
        } else if (key === 'pixel') {
            extraClass = ['skin-pixel--dirt', 'skin-pixel--grass', 'skin-pixel--stone'][idx];
        } else if (key === 'tetris') {
            extraClass = ['skin-tetris--cyan', 'skin-tetris--yellow', 'skin-tetris--orange'][idx];
        } else if (key === 'gem') {
            extraClass = ['skin-gem--ruby', 'skin-gem--sapphire', 'skin-gem--emerald'][idx];
        } else if (key === 'retro') {
            extraClass = ['skin-retro--red', 'skin-retro--cyan', 'skin-retro--orange'][idx];
        }

        if (extraClass) classes += ` ${extraClass}`;
        html += `<div class="${classes}" style="width:22px;height:22px;border-radius:5px;"></div>`;
    }
    return html;
}

// ── Render card singola ────────────────────────────────────────────────────────

function shopBuildCard(skin) {
    const state = shopGetCardState(skin.key);
    const isNeon = skin.key === 'neon';

    const previewBg = isNeon ? '#0a0a12' : 'rgba(0,0,0,0.32)';
    const cardBorder = state === 'owned_active' ? '2px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.15)';
    const cardBg = state === 'owned_active' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)';

    let actionHTML = '';
    if (state === 'free') {
        actionHTML = `<span style="font-size:10px;font-weight:800;color:#43e97b;">GRATIS</span>`;
    } else if (state === 'owned_active') {
        actionHTML = `<span style="font-size:10px;font-weight:800;color:white;">✓ In uso</span>`;
    } else if (state === 'owned_inactive') {
        actionHTML = `<button onclick="shopEquip('${skin.key}')" style="font-size:10px;font-weight:800;background:rgba(255,255,255,0.25);border:1px solid rgba(255,255,255,0.4);color:white;padding:4px 10px;border-radius:8px;cursor:pointer;min-width:0;">Equipaggia</button>`;
    } else if (state === 'locked_affordable') {
        actionHTML = `<button onclick="shopBuyAndRefresh('${skin.key}')" style="font-size:10px;font-weight:800;background:linear-gradient(135deg,#ffd700,#ffb300);border:none;color:#5a3a00;padding:4px 10px;border-radius:8px;cursor:pointer;min-width:0;">🪙 ${skin.price.toLocaleString()}</button>`;
    } else {
        actionHTML = `<span style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.4);">🪙 ${skin.price.toLocaleString()}</span>`;
    }

    return `
        <div id="shop-card-${skin.key}" style="background:${cardBg};border:${cardBorder};border-radius:14px;padding:10px 8px;display:flex;flex-direction:column;align-items:center;gap:8px;transition:opacity 0.2s;">
            <div style="display:grid;grid-template-columns:repeat(3,22px);grid-template-rows:repeat(3,22px);gap:3px;background:${previewBg};padding:8px;border-radius:10px;">
                ${shopBuildPreviewCells(skin.key)}
            </div>
            <div style="color:white;font-size:11px;font-weight:700;text-align:center;">${skin.emoji} ${skin.name}</div>
            <div id="shop-action-${skin.key}">${actionHTML}</div>
        </div>`;
}

// ── Render completo shop ───────────────────────────────────────────────────────

function shopRenderCards() {
    const main   = SKIN_CATALOG.filter(s => s.section === 'main');
    const calcio = SKIN_CATALOG.filter(s => s.section === 'calcio');
    const games  = SKIN_CATALOG.filter(s => s.section === 'games');

    document.getElementById('shop-skins-main').innerHTML   = main.map(shopBuildCard).join('');
    document.getElementById('shop-skins-calcio').innerHTML = calcio.map(shopBuildCard).join('');
    document.getElementById('shop-skins-games').innerHTML  = games.map(shopBuildCard).join('');
}

function shopRefreshUI() {
    const wallet = shopGetWallet();
    const promo = shopGetPromoInfo();

    let walletHTML = `<div style="color:#ffd700;font-size:26px;font-weight:900;">🪙 ${wallet.toLocaleString()}</div>`;
    if (promo.multiplier > 1) {
        walletHTML += `<div style="color:rgba(255,255,255,0.75);font-size:11px;margin-top:2px;">⭐ Promo ×${promo.multiplier} · ancora ${promo.gamesLeft} ${promo.gamesLeft === 1 ? 'partita' : 'partite'}</div>`;
    }
    document.getElementById('shop-wallet-display').innerHTML = walletHTML;

    SKIN_CATALOG.forEach(skin => {
        const card = document.getElementById(`shop-card-${skin.key}`);
        if (!card) return;
        const state = shopGetCardState(skin.key);
        card.style.border = state === 'owned_active' ? '2px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.15)';
        card.style.background = state === 'owned_active' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)';

        const actionEl = document.getElementById(`shop-action-${skin.key}`);
        if (!actionEl) return;
        if (state === 'free') {
            actionEl.innerHTML = `<span style="font-size:10px;font-weight:800;color:#43e97b;">GRATIS</span>`;
        } else if (state === 'owned_active') {
            actionEl.innerHTML = `<span style="font-size:10px;font-weight:800;color:white;">✓ In uso</span>`;
        } else if (state === 'owned_inactive') {
            actionEl.innerHTML = `<button onclick="shopEquip('${skin.key}')" style="font-size:10px;font-weight:800;background:rgba(255,255,255,0.25);border:1px solid rgba(255,255,255,0.4);color:white;padding:4px 10px;border-radius:8px;cursor:pointer;min-width:0;">Equipaggia</button>`;
        } else if (state === 'locked_affordable') {
            actionEl.innerHTML = `<button onclick="shopBuyAndRefresh('${skin.key}')" style="font-size:10px;font-weight:800;background:linear-gradient(135deg,#ffd700,#ffb300);border:none;color:#5a3a00;padding:4px 10px;border-radius:8px;cursor:pointer;min-width:0;">🪙 ${skin.price.toLocaleString()}</button>`;
        } else {
            actionEl.innerHTML = `<span style="font-size:10px;font-weight:700;color:rgba(255,255,255,0.4);">🪙 ${skin.price.toLocaleString()}</span>`;
        }
    });
}

// ── Azioni utente ──────────────────────────────────────────────────────────────

function shopEquip(key) {
    shopSetActive(key);
    shopRefreshUI();
    wardrobeRender();
}

function shopBuyAndRefresh(key) {
    const result = shopBuySkin(key);
    if (!result.success && result.reason === 'insufficient_funds') {
        const el = document.getElementById(`shop-action-${key}`);
        if (el) {
            el.innerHTML = `<span style="font-size:10px;color:#ff6b6b;font-weight:700;">Fondi insufficienti</span>`;
            setTimeout(() => shopRefreshUI(), 1500);
        }
    }
}

// ── Guardaroba ─────────────────────────────────────────────────────────────────

function wardrobeRender() {
    const owned = shopGetOwned();
    const active = shopGetActive();
    const grid = document.getElementById('wardrobe-grid');
    const subtitle = document.getElementById('wardrobe-subtitle');

    subtitle.textContent = `${owned.length} skin sbloccate`;

    grid.innerHTML = owned.map(key => {
        const skin = SKIN_CATALOG.find(s => s.key === key);
        if (!skin) return '';
        const isActive = active === key;
        const isNeon = key === 'neon';
        const previewBg = isNeon ? '#0a0a12' : 'rgba(0,0,0,0.32)';
        const cardBorder = isActive ? '2px solid rgba(255,255,255,0.85)' : '1px solid rgba(255,255,255,0.18)';
        const cardBg = isActive ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.1)';

        const btn = isActive
            ? `<span style="font-size:10px;font-weight:800;color:#43e97b;">✓ Equipaggiata</span>`
            : `<button onclick="shopEquip('${key}');closeWardrobeModal();openWardrobeModal();" style="font-size:10px;font-weight:800;background:rgba(255,255,255,0.25);border:1px solid rgba(255,255,255,0.4);color:white;padding:5px 12px;border-radius:8px;cursor:pointer;min-width:0;">Equipaggia</button>`;

        return `
            <div style="background:${cardBg};border:${cardBorder};border-radius:16px;padding:14px 10px;display:flex;flex-direction:column;align-items:center;gap:10px;">
                <div style="display:grid;grid-template-columns:repeat(3,26px);grid-template-rows:repeat(3,26px);gap:3px;background:${previewBg};padding:10px;border-radius:12px;">
                    ${shopBuildPreviewCells(key)}
                </div>
                <div style="color:white;font-size:12px;font-weight:700;">${skin.emoji} ${skin.name}</div>
                ${btn}
            </div>`;
    }).join('');
}

// ── Modal open/close ───────────────────────────────────────────────────────────

function openShopModal() {
    shopRenderCards();
    shopRefreshUI();
    document.getElementById('shop-modal').style.display = 'flex';
}

function closeShopModal() {
    document.getElementById('shop-modal').style.display = 'none';
    showEngagementNotice('welcome-goal', true);
}

function openWardrobeModal() {
    wardrobeRender();
    document.getElementById('wardrobe-modal').style.display = 'flex';
}

function closeWardrobeModal() {
    document.getElementById('wardrobe-modal').style.display = 'none';
}

// ── Messaggi di engagement ─────────────────────────────────────────────────────

function _engagementStats() {
    try { return JSON.parse(localStorage.getItem('playerStats') || '{}'); } catch { return {}; }
}

function getEngagementMessage() {
    const wallet      = shopGetWallet();
    const owned       = shopGetOwned();
    const promo       = shopGetPromoInfo();
    const stats       = _engagementStats();
    const gamesPlayed = stats.gamesPlayed || 0;
    const avgScore    = gamesPlayed > 0 ? Math.floor((stats.totalScore || 1500) / gamesPlayed) : 1500;
    const avgEarnings = Math.max(1, Math.floor(avgScore / 30) * promo.multiplier);

    const locked = SKIN_CATALOG
        .filter(s => s.price > 0 && !owned.includes(s.key))
        .sort((a, b) => a.price - b.price);

    // Tutte le skin sbloccate
    if (locked.length === 0) {
        return { emoji: '🏆', title: 'Collezione completa!', sub: 'Hai sbloccato tutte le skin. Sei un vero campione del guardaroba!' };
    }

    const next = locked[0];
    const gap  = next.price - wallet;

    // Puoi già comprare la prossima
    if (gap <= 0) {
        return { emoji: '🎉', title: `Puoi comprare ${next.name}!`, sub: `Hai abbastanza monete per la skin ${next.emoji} ${next.name}. Apri lo shop e prendila!` };
    }

    const gamesNeeded = Math.ceil(gap / avgEarnings);

    // Promo alta attiva — spingi subito
    if (promo.multiplier >= 3) {
        return {
            emoji: '⭐',
            title: `Promo ×${promo.multiplier} attiva!`,
            sub: `Stai guadagnando ${promo.multiplier} volte i punti normali. Ancora ${promo.gamesLeft} ${promo.gamesLeft === 1 ? 'partita' : 'partite'} così — non sprecarle!`
        };
    }

    // Promo ×2 attiva
    if (promo.multiplier === 2) {
        return {
            emoji: '🚀',
            title: 'Punti doppi!',
            sub: `Hai ancora ${promo.gamesLeft} ${promo.gamesLeft === 1 ? 'partita' : 'partite'} al doppio dei punti. ${next.emoji} ${next.name} è a ${gap.toLocaleString()} 🪙 di distanza.`
        };
    }

    // Vicinissimo: 1 partita
    if (gamesNeeded === 1) {
        return { emoji: '🔥', title: 'Ancora una partita!', sub: `Ti mancano solo ${gap.toLocaleString()} 🪙 per sbloccare ${next.emoji} ${next.name}. Dai, una sola partita!` };
    }

    // Vicino: 2–3 partite
    if (gamesNeeded <= 3) {
        return { emoji: '💥', title: `${next.name} è quasi tua!`, sub: `Ancora ${gamesNeeded} partite e potrai sbloccare la skin ${next.emoji} ${next.name}. Ce la fai!` };
    }

    // Abbordabile: 4–7 partite
    if (gamesNeeded <= 7) {
        return { emoji: next.emoji, title: `Prossima tappa: ${next.name}`, sub: `Continua a giocare: in circa ${gamesNeeded} partite avrai abbastanza 🪙 per la skin ${next.name}.` };
    }

    // Prima partita in assoluto
    if (gamesPlayed === 0) {
        return { emoji: '👋', title: 'Benvenuto!', sub: 'Ogni partita ti porta monete per sbloccare skin esclusive. Inizia subito!' };
    }

    // Molte skin possedute
    if (owned.length >= 4) {
        return { emoji: '😎', title: `${owned.length} skin sbloccate!`, sub: `Stai costruendo una bella collezione. ${locked.length} skin ancora da conquistare.` };
    }

    // Skin calcio in vista
    const calcioPending = locked.filter(s => s.section === 'calcio');
    if (calcioPending.length > 0 && locked.length <= calcioPending.length + 1) {
        return { emoji: '⚽', title: 'Solo le skin calcio mancano!', sub: `Ci sono ${calcioPending.length} skin sportive da sbloccare. Tifo per te!` };
    }

    // Fallback variati per utenti in modalità normale
    const fallbacks = [
        { emoji: '💪', title: 'Continua così!',      sub: `Hai già ${wallet.toLocaleString()} 🪙 nel portafoglio. Ogni partita ti avvicina alla prossima skin.` },
        { emoji: '🎯', title: 'Tieni il ritmo!',     sub: `Più score fai, più 🪙 guadagni. La skin ${next.emoji} ${next.name} vale l'impegno!` },
        { emoji: '🌟', title: 'Gioca, accumula, vinci!', sub: `Con ${gamesNeeded} partite alla media attuale sblocchi ${next.emoji} ${next.name}. Partita dopo partita!` },
        { emoji: '🧩', title: 'Ogni blocco conta!', sub: `Score alto = più monete. Punta alle combo di righe per moltiplicare il guadagno.` },
    ];
    return fallbacks[gamesPlayed % fallbacks.length];
}

function showEngagementNotice(containerId, compact = false) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const msg = getEngagementMessage();
    if (!msg) { el.innerHTML = ''; return; }

    if (compact) {
        // Versione compatta per la welcome screen
        const wallet = shopGetWallet();
        const owned  = shopGetOwned();
        const locked = SKIN_CATALOG.filter(s => s.price > 0 && !owned.includes(s.key)).sort((a, b) => a.price - b.price);
        const next   = locked[0];

        if (!next) { el.innerHTML = ''; return; }

        const gap         = Math.max(0, next.price - wallet);
        const pct         = Math.min(100, Math.round((wallet / next.price) * 100));
        const progressBar = `
            <div style="height:4px;background:rgba(255,255,255,0.18);border-radius:4px;overflow:hidden;margin-top:8px;">
                <div style="height:100%;width:${pct}%;background:rgba(255,255,255,0.75);border-radius:4px;transition:width 0.6s ease;"></div>
            </div>`;

        el.innerHTML = `
            <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.18);border-radius:14px;padding:12px 16px;text-align:left;cursor:pointer;" onclick="openShopModal()">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                    <span style="font-size:16px;">${msg.emoji}</span>
                    <span style="color:white;font-size:13px;font-weight:700;">${msg.title}</span>
                </div>
                <div style="color:rgba(255,255,255,0.7);font-size:11px;line-height:1.4;">${msg.sub}</div>
                ${gap > 0 && next ? progressBar : ''}
            </div>`;
    } else {
        // Versione completa per il game-over
        el.innerHTML = `
            <div style="background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:14px;padding:14px 18px;margin:12px 0;text-align:center;">
                <div style="font-size:28px;margin-bottom:6px;">${msg.emoji}</div>
                <div style="color:white;font-size:15px;font-weight:800;margin-bottom:4px;">${msg.title}</div>
                <div style="color:rgba(255,255,255,0.72);font-size:12px;line-height:1.5;">${msg.sub}</div>
            </div>`;
    }
}

// ── Codice promo segreto ───────────────────────────────────────────────────────

function shopCheckPromoCode(value) {
    const msg = document.getElementById('shop-promo-msg');
    const input = document.getElementById('shop-promo-input');
    if (value.trim() === '7556') {
        SKIN_CATALOG.forEach(s => shopAddOwned(s.key));
        shopRefreshUI();
        wardrobeRender();
        if (msg) {
            msg.innerHTML = '<span style="color:#ffd700;font-weight:800;">🎉 Tutte le skin sbloccate!</span>';
            setTimeout(() => { msg.innerHTML = ''; }, 3000);
        }
        if (input) input.value = '';
    } else {
        if (msg) {
            msg.innerHTML = '<span style="color:#ff8a8a;font-weight:600;">Codice non valido</span>';
            setTimeout(() => { msg.innerHTML = ''; }, 2000);
        }
    }
}

// ── Setup event listeners ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    showEngagementNotice('welcome-goal', true);

    document.getElementById('shop-button').addEventListener('click', openShopModal);
    document.getElementById('wardrobe-button').addEventListener('click', openWardrobeModal);

    document.getElementById('shop-close-btn').addEventListener('click', closeShopModal);
    document.getElementById('wardrobe-close-btn').addEventListener('click', closeWardrobeModal);
    document.getElementById('wardrobe-shop-link').addEventListener('click', () => {
        closeWardrobeModal();
        openShopModal();
    });

    // Chiudi cliccando sull'overlay
    document.getElementById('shop-modal').addEventListener('click', e => {
        if (e.target === document.getElementById('shop-modal')) closeShopModal();
    });
    document.getElementById('wardrobe-modal').addEventListener('click', e => {
        if (e.target === document.getElementById('wardrobe-modal')) closeWardrobeModal();
    });
});
