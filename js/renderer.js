Game.UI = {
  els: {},
  actionHandlers: [],
  activeReveals: new Set(),
  revealSpeed: 32,         // ms per character (lower = faster typing)
  reduceMotion: false,
  corruptTimer: null,

  init() {
    this.reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.els = {
      titleScreen: document.getElementById('title-screen'),
      titleAscii: document.getElementById('title-ascii'),
      gameContainer: document.getElementById('game-container'),
      gameOver: document.getElementById('game-over'),
      statusBar: document.getElementById('status-bar'),
      entropyFill: document.getElementById('entropy-fill'),
      chronicle: document.getElementById('chronicle'),
      actions: document.getElementById('actions'),
      epilogue: document.getElementById('epilogue'),
      loadBtn: document.getElementById('load-btn'),
      muteBtn: document.getElementById('mute-btn')
    };
    this.renderTitleAscii();
    this.setupReveal();
    this.setupMute();
    if (Game.State.hasSave()) {
      this.els.loadBtn.style.display = 'inline-block';
    }
    this.focusFirst(this.els.titleScreen);
  },

  // Tapping or pressing any key completes whatever text is still revealing.
  setupReveal() {
    const finishAll = () => this.finishReveals();
    document.addEventListener('keydown', finishAll);
    if (this.els.chronicle) this.els.chronicle.addEventListener('click', finishAll);
  },

  setupMute() {
    if (!this.els.muteBtn) return;
    Game.Audio.loadPref();
    this.updateMuteLabel();
    this.els.muteBtn.onclick = () => {
      Game.Audio.toggle();
      this.updateMuteLabel();
    };
  },

  updateMuteLabel() {
    if (this.els.muteBtn) this.els.muteBtn.textContent = Game.Audio.enabled ? '♪' : '✕';
  },

  finishReveals() {
    this.activeReveals.forEach(r => r.finish());
  },

  // Reveal HTML text one character at a time while preserving inline markup.
  // Renders the full markup first, blanks every text node, then fills back in.
  revealText(el, html, onDone) {
    el.innerHTML = html;
    // The typewriter is progressive text disclosure, not the kind of motion
    // that triggers vestibular issues, so it runs even under reduce-motion.
    // (The jitter/scanline/glyph-corruption effects stay gated separately.)

    const nodes = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let n;
    while ((n = walker.nextNode())) {
      nodes.push({ node: n, full: n.nodeValue });
      n.nodeValue = '';
    }
    const total = nodes.reduce((sum, x) => sum + x.full.length, 0);
    if (total === 0) { if (onDone) onDone(); return; }

    // A blinking caret that trails the revealed text (unrevealed nodes are
    // blank, so it visually sits right after the last typed character).
    const caret = document.createElement('span');
    caret.className = 'caret';
    caret.textContent = '▋';
    el.appendChild(caret);

    const reveal = {};
    let ni = 0, ci = 0, count = 0;
    const finish = () => {
      clearInterval(timer);
      nodes.forEach(x => { x.node.nodeValue = x.full; });
      if (caret.parentNode) caret.remove();
      this.activeReveals.delete(reveal);
      this.scrollToBottom();
      if (onDone) onDone();
    };
    reveal.finish = finish;
    this.activeReveals.add(reveal);

    const timer = setInterval(() => {
      // advance to the next non-empty node
      while (ni < nodes.length && ci >= nodes[ni].full.length) { ni++; ci = 0; }
      if (ni >= nodes.length) { finish(); return; }
      ci++;
      nodes[ni].node.nodeValue = nodes[ni].full.slice(0, ci);
      count++;
      if (count % 2 === 0) Game.Audio.click();
      if (count >= total) finish();
    }, this.revealSpeed);
  },

  renderTitleAscii() {
    const art = [
      '      ███████╗ ██████╗██╗  ██╗ ██████╗ ███████╗███████╗',
      '      ██╔════╝██╔════╝██║  ██║██╔═══██╗██╔════╝██╔════╝',
      '      █████╗  ██║     ███████║██║   ██║█████╗  █████╗  ',
      '      ██╔══╝  ██║     ██╔══██║██║   ██║██╔══╝  ██╔══╝  ',
      '      ███████╗╚██████╗██║  ██║╚██████╔╝███████╗███████╗',
      '      ╚══════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝',
      '',
      '               ██╗   ██╗ ██████╗ ██╗██████╗ ',
      '               ██║   ██║██╔═══██╗██║██╔══██╗',
      '               ██║   ██║██║   ██║██║██║  ██║',
      '               ╚██╗ ██╔╝██║   ██║██║██║  ██║',
      '                ╚████╔╝ ╚██████╔╝██║██████╔╝',
      '                 ╚═══╝   ╚═════╝ ╚═╝╚═════╝ ',
      '',
      '      ───  ䷀  ───  T H E   V O I D  ───  ䷀  ───'
    ].join('\n');
    this.els.titleAscii.textContent = art;
  },

  clearMood() {
    document.body.classList.remove('sanity-warn', 'sanity-low', 'entropy-high');
    if (this.corruptTimer) { clearInterval(this.corruptTimer); this.corruptTimer = null; }
  },

  // Move keyboard focus to the first visible, enabled button in a container so
  // keyboard users land somewhere actionable when a screen appears.
  focusFirst(container) {
    if (!container) return;
    setTimeout(() => {
      const btns = container.querySelectorAll('button');
      for (let i = 0; i < btns.length; i++) {
        if (btns[i].offsetParent !== null && !btns[i].disabled) {
          btns[i].focus();
          return;
        }
      }
    }, 0);
  },

  showTitle() {
    this.clearMood();
    this.els.titleScreen.style.display = '';
    this.els.gameContainer.style.display = 'none';
    this.els.gameOver.style.display = 'none';
    if (Game.State.hasSave()) {
      this.els.loadBtn.style.display = 'inline-block';
    }
    this.focusFirst(this.els.titleScreen);
  },

  showGame() {
    this.els.titleScreen.style.display = 'none';
    this.els.gameContainer.style.display = 'flex';
    this.els.gameOver.style.display = 'none';
  },

  showGameOver(reason, message) {
    this.clearMood();
    this.els.gameContainer.style.display = 'none';
    this.els.gameOver.style.display = 'block';
    const title = reason === 'escape' ? 'YOU SURVIVE' : 'YOU PERISH';
    const msg = message || 'The void claims another echo.';
    const epilogue = `${msg}\n\n─── ⋆⋅☆⋅⋆ ───\n\nDepth reached: ${Game.State.get('depth')}\nTurns survived: ${Game.State.get('turn')}\nFinal sanity: ${Game.State.get('sanity')}`;
    // LITE: point players at the full descent.
    const full = `<p class="lite-cta">This was the <b>Lite</b> edition: five layers deep.<br>` +
      `The full descent goes ten layers down, past the Final Gate, to the Witness.<br>` +
      `<a href="https://patreon.com/spacechakra" target="_blank" rel="noopener">Get the full game &amp; source on Patreon</a></p>`;
    this.els.epilogue.innerHTML = `<h1>${title}</h1><p>${epilogue}</p>${full}`;
    this.focusFirst(this.els.gameOver);
  },

  renderStatus() {
    const s = Game.State.data;
    const statusHTML = [
      this.statBlock('Ψ', 'SAN', s.sanity),
      this.statBlock('L', 'LUC', s.lucidity),
      this.statBlock('E', 'ENT', s.entropy),
      this.statBlock('D', 'DEP', s.depth),
      this.statBlock('T', 'TRN', s.turn),
      this.effectsDisplay(s.effects),
      this.inventoryDisplay(s.inventory)
    ].join('');
    this.els.statusBar.innerHTML = statusHTML;
    const pct = Math.min(100, (s.entropy + s.depth * 2) / 2);
    this.els.entropyFill.style.width = pct + '%';
    this.applyMood(s.sanity, s.entropy);
  },

  // Drive the whole-screen degradation + reactive drone from sanity/entropy.
  applyMood(sanity, entropy) {
    Game.Audio.setSanity(sanity);

    const b = document.body.classList;
    b.toggle('sanity-warn', sanity <= 60 && sanity > 30);
    b.toggle('sanity-low', sanity <= 30);
    b.toggle('entropy-high', entropy >= 60);

    // Glyph corruption only kicks in once the mind is failing.
    if (sanity <= 30 && !this.reduceMotion) {
      if (!this.corruptTimer) this.corruptTimer = setInterval(() => this.corruptTick(), 2600);
    } else if (this.corruptTimer) {
      clearInterval(this.corruptTimer);
      this.corruptTimer = null;
    }
  },

  // Briefly swap one rendered character for an eldritch glyph, then restore it.
  corruptTick() {
    if (this.activeReveals.size > 0) return; // never fight the typewriter
    const bodies = this.els.chronicle.querySelectorAll('.entry-body');
    if (!bodies.length) return;
    const host = bodies[Math.floor(Math.random() * bodies.length)];
    const texts = [];
    const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, null);
    let n;
    while ((n = walker.nextNode())) if (/[a-z]/i.test(n.nodeValue)) texts.push(n);
    if (!texts.length) return;

    const node = texts[Math.floor(Math.random() * texts.length)];
    const original = node.nodeValue;
    const idx = Math.floor(Math.random() * original.length);
    const glyphs = '̴҂░▓Ψ◊⸸ǂ';
    const g = glyphs[Math.floor(Math.random() * glyphs.length)];
    node.nodeValue = original.slice(0, idx) + g + original.slice(idx + 1);
    setTimeout(() => { node.nodeValue = original; }, 140);
  },

  statBlock(symbol, label, value) {
    let cls = 'safe';
    if (label === 'SAN' && value <= 30) cls = 'danger';
    else if (label === 'SAN' && value <= 60) cls = 'warning';
    else if (label === 'LUC' && value >= 80) cls = 'info';
    else if (label === 'ENT' && value >= 60) cls = 'danger';
    else if (label === 'ENT' && value >= 30) cls = 'warning';
    return `<span class="stat"><span class="stat-label">${symbol}</span><span class="stat-value ${cls}">${value}</span></span>`;
  },

  effectsDisplay(effects) {
    if (!effects || effects.length === 0) return '';
    return effects.map(e => {
      const def = Game.Data.EFFECTS[e.id];
      const color = def ? def.color : 'warning';
      return `<span class="stat"><span class="stat-label">◆</span><span class="stat-value ${color}">${def ? def.name : e.id}${e.duration > 0 ? '[' + (e.duration - e.turnsActive) + ']' : '∞'}</span></span>`;
    }).join('');
  },

  inventoryDisplay(inv) {
    if (!inv || inv.length === 0) return '';
    const items = inv.map(i => {
      const short = i.length > 18 ? i.slice(0, 16) + '…' : i;
      return short;
    }).join(' | ');
    return `<span class="stat" id="inventory-display"><span class="stat-label">▤</span><span class="stat-value">${items}</span></span>`;
  },

  renderEncounter(encounter) {
    this.actionHandlers = [];

    const entry = document.createElement('div');
    entry.className = 'entry';

    const title = document.createElement('div');
    title.className = 'entry-title';
    title.textContent = encounter.title;
    entry.appendChild(title);

    const body = document.createElement('div');
    body.className = 'entry-body';
    entry.appendChild(body);

    this.els.chronicle.appendChild(entry);
    this.revealText(body, this.formatText(encounter.desc));
    this.scrollToBottom();

    const separator = document.createElement('div');
    separator.className = 'history-divider';
    separator.textContent = '─'.repeat(30);
    this.els.chronicle.appendChild(separator);

    this.renderActions(encounter.choices);
    this.renderStatus();
  },

  renderLog(logText, impactLog, onComplete) {
    const entry = document.createElement('div');
    entry.className = 'entry';

    const body = document.createElement('div');
    body.className = 'entry-body';
    entry.appendChild(body);

    const appendImpact = () => {
      if (impactLog && impactLog.length > 0) {
        const impact = document.createElement('div');
        impact.style.cssText = 'color: #060; font-size: 0.85rem; margin-top: 0.3rem;';
        impact.textContent = impactLog.join(' · ');
        entry.appendChild(impact);
        this.scrollToBottom();
      }
      if (onComplete) onComplete();
    };

    this.els.chronicle.appendChild(entry);
    this.revealText(body, this.formatText(logText), appendImpact);
    this.scrollToBottom();
  },

  renderHazard(hazard, impactLog) {
    const entry = document.createElement('div');
    entry.className = 'entry hazard-entry';

    const title = document.createElement('div');
    title.className = 'entry-title';
    title.textContent = '⚠ ' + hazard.title;
    entry.appendChild(title);

    const body = document.createElement('div');
    body.className = 'entry-body';
    entry.appendChild(body);

    const appendImpact = () => {
      if (impactLog && impactLog.length > 0) {
        const impact = document.createElement('div');
        impact.style.cssText = 'color: #c00; font-size: 0.85rem; margin-top: 0.3rem;';
        impact.textContent = 'Hazard: ' + impactLog.join(' · ');
        entry.appendChild(impact);
        this.scrollToBottom();
      }
    };

    this.els.chronicle.appendChild(entry);
    this.revealText(body, this.formatText(hazard.desc), appendImpact);
    this.scrollToBottom();
  },

  renderActions(choices) {
    this.els.actions.innerHTML = '';
    this.actionHandlers = [];

    choices.forEach((choice, index) => {
      const btn = document.createElement('button');
      btn.className = 'action-btn';
      btn.innerHTML = `<span class="key-hint">[${index + 1}]</span> ${choice.text}`;

      const available = this.checkRequirements(choice);
      if (!available) {
        btn.classList.add('dimmed');
        btn.title = 'Requirements not met';
        btn.disabled = true; // skip dead choices in the keyboard tab order
      } else {
        btn.onclick = () => this.handleAction(index);
        this.actionHandlers.push((e) => {
          if (e.key === String(index + 1)) this.handleAction(index);
        });
      }

      this.els.actions.appendChild(btn);
    });
  },

  checkRequirements(choice) {
    if (!choice.requirements) return true;
    const r = choice.requirements;
    if (r.item && !Game.State.hasItem(r.item)) return false;
    if (r.sanityMin && Game.State.get('sanity') < r.sanityMin) return false;
    if (r.sanityMax && Game.State.get('sanity') > r.sanityMax) return false;
    if (r.lucidityMin && Game.State.get('lucidity') < r.lucidityMin) return false;
    if (r.minDepth && Game.State.get('depth') < r.minDepth) return false;
    if (r.maxDepth && Game.State.get('depth') > r.maxDepth) return false;
    return true;
  },

  getAvailableChoices(choices) {
    return choices.filter(c => this.checkRequirements(c));
  },

  handleAction(index) {
    Game.main.resolveChoice(index);
  },

  setupKeyboard() {
    document.addEventListener('keydown', (e) => {
      const key = e.key;
      if (key >= '1' && key <= '9') {
        this.actionHandlers.forEach(h => h(e));
      }
    });
  },

  formatText(text) {
    return text
      .replace(/\b(sanity|Ψ)\b/gi, '<span class="stat-value warning">$1</span>')
      .replace(/\b(lucidity|L)\b/gi, '<span class="stat-value info">$1</span>')
      .replace(/\b(entropy)\b/gi, '<span class="stat-value danger">$1</span>');
  },

  scrollToBottom() {
    setTimeout(() => {
      this.els.chronicle.scrollTop = this.els.chronicle.scrollHeight;
    }, 50);
  }
};
