# Block-etto - Documentazione Progetto

## Descrizione
Block-etto è un gioco puzzle a blocchi stile Block Blast, sviluppato in vanilla HTML/CSS/JavaScript.
Il gioco è ottimizzato per mobile e desktop, con 6 temi colore selezionabili e statistiche dettagliate.

**Live:** https://hmarras.github.io/block-etto-/

## Stack Tecnologico
- **HTML5** - Struttura
- **CSS3** - Stili, animazioni, gradients
- **JavaScript Vanilla (ES6+)** - Logica di gioco
- **LocalStorage API** - Persistenza dati (nome giocatore, record, tema)
- **GitHub Pages** - Hosting

**Nessuna dipendenza esterna, nessun build step.**

## Struttura File
```
/Users/hmarras/Desktop/blok blast/
├── index.html          # HTML principale (welcome + game screen)
├── style.css           # Tutti gli stili (mobile-first)
├── game.js             # Logica di gioco completa
├── README.md           # Documentazione per utenti
└── CLAUDE.md           # Questo file
```

## Convenzioni di Codice

### CSS
- **Mobile-first approach** - base styles per mobile, `@media` per desktop
- **CSS Custom Properties** per temi:
  ```css
  --block-color-start: #ffd700;
  --block-color-end: #ffed4e;
  ```
- Ogni tema ha colori blocchi **complementari** allo sfondo
- Usare `linear-gradient(135deg, ...)` per consistenza

### JavaScript
- **Vanilla JS puro** - no framework, no jQuery
- **async/await** per animazioni che richiedono timing:
  ```javascript
  await new Promise(resolve => setTimeout(resolve, 500));
  ```
- **Naming conventions**: camelCase per funzioni e variabili
- Mantenere logica semplice e leggibile

### HTML
- Usare `data-*` attributes per riferimenti DOM (es: `data-row`, `data-col`, `data-theme`)
- Inline styles solo per elementi dinamici del color selector

## Sistema di Temi

**6 temi disponibili:**
1. **Purple** (default) - blocchi gialli
2. **Pink** - blocchi verdi
3. **Blue** - blocchi rosso/arancio
4. **Green** - blocchi rosa
5. **Orange** - blocchi viola
6. **Dark** - blocchi cyan/oro

**Implementazione:**
- Body class: `theme-{nome}`
- CSS variables cambiano automaticamente
- Salvato in localStorage come `colorTheme`

## Logica di Gioco

### Griglia
- 8x8 celle
- Array bidimensionale: `grid[row][col]` (0 = vuoto, 1 = pieno)

### Pezzi
- 12 forme definite in `PIECE_SHAPES`
- 3 pezzi sempre disponibili
- Quando tutti e 3 usati → genera nuovi 3

### Punteggio
- **10 punti** per blocco piazzato
- **100 punti** per riga/colonna completata
- **Bonus combo** per multiple linee: `totalLines * 50`

### Line Clearing con Animazione
```javascript
async function clearLines() {
  // 1. Identifica righe/colonne complete
  // 2. Aggiungi classe 'clearing' alle celle
  // 3. await 500ms per animazione CSS
  // 4. Pulisci grid data
  // 5. Aggiorna score
}
```

**IMPORTANTE:** Non chiamare `render()` tra l'aggiunta della classe e l'await, altrimenti il DOM viene ricreato e l'animazione non parte.

### Game Over
- Triggered quando nessuno dei 3 pezzi può essere piazzato
- Mostra statistiche di tutte le 12 forme
- Messaggio personalizzato con nome giocatore
- Salva best score in localStorage

## LocalStorage Schema

```javascript
{
  playerName: string,        // Nome giocatore
  bestScore: number,         // Record personale
  colorTheme: string         // 'purple' | 'pink' | 'blue' | 'green' | 'orange' | 'dark'
}
```

## Workflow Git

**Pubblicazione modifiche:**
```bash
cd "/Users/hmarras/Desktop/blok blast"
git add .
git commit -m "Descrizione modifiche"
git push origin main
```

**Note:**
- Token GitHub configurato nel remote URL
- Dopo il push, GitHub Pages si aggiorna automaticamente in 1-2 minuti
- Branch: `main`
- Repository: https://github.com/hmarras/block-etto-.git

## Note Importanti

### Performance
- `render()` ricrea l'intera griglia e i pezzi → chiamare solo quando necessario
- Animazioni CSS preferite a JavaScript animations
- `touch-action: manipulation` per evitare zoom su mobile

### Mobile Optimization
- Touch targets minimo 44x44px (iOS guidelines)
- `user-select: none` per evitare selezione testo
- `aspect-ratio: 1` per mantenere griglia quadrata
- Responsive con max-width e flexbox

### Future Enhancement Ideas
- PWA (manifest.json + service worker)
- Suoni
- Modalità a tempo
- Leaderboard online
- Più forme/pezzi

## Autore
**Dario Marras**

Progetto creato: Aprile 2026
