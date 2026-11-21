const Game = {};

Game.State = {
  DEFAULTS: {
    sanity: 100,
    lucidity: 50,
    entropy: 0,
    depth: 0,
    inventory: ['Flickering Lantern (battery: 3/5)', 'Dog-eared Journal (notes: fragmented)'],
    effects: [],
    history: [],
    currentNode: null,
    gameOver: false,
    escaped: false,
    turn: 0
  },

  data: null,

  init() {
    this.data = JSON.parse(JSON.stringify(this.DEFAULTS));
    this.save();
    return this.data;
  },

  get(key) { return this.data[key]; },
  set(key, val) { this.data[key] = val; },

  modify(key, delta) {
    if (key === 'sanity') {
      this.data.sanity = Math.max(0, Math.min(100, this.data.sanity + delta));
    } else if (key === 'lucidity') {
      this.data.lucidity = Math.max(0, Math.min(100, this.data.lucidity + delta));
    } else if (key === 'entropy') {
      this.data.entropy = Math.max(0, Math.min(100, this.data.entropy + delta));
    } else if (key === 'depth') {
      this.data.depth = Math.max(0, this.data.depth + delta);
    } else if (key === 'turn') {
      this.data.turn = Math.max(0, this.data.turn + delta);
    }
    return this.data[key];
  },

  hasItem(name) {
    return this.data.inventory.some(i => i.toLowerCase().startsWith(name.toLowerCase()));
  },

  addItem(item) {
    if (this.data.inventory.length < 6) {
      this.data.inventory.push(item);
      return true;
    }
    return false;
  },

  removeItem(name) {
    const idx = this.data.inventory.findIndex(i => i.toLowerCase().startsWith(name.toLowerCase()));
    if (idx !== -1) {
      this.data.inventory.splice(idx, 1);
      return true;
    }
    return false;
  },

  hasEffect(id) {
    return this.data.effects.some(e => e.id === id);
  },

  addEffect(id, duration) {
    if (!this.hasEffect(id)) {
      this.data.effects.push({ id, duration, turnsActive: 0 });
      return true;
    }
    return false;
  },

  removeEffect(id) {
    const idx = this.data.effects.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.data.effects.splice(idx, 1);
      return true;
    }
    return false;
  },

  tickEffects() {
    for (let i = this.data.effects.length - 1; i >= 0; i--) {
      this.data.effects[i].turnsActive++;
      if (this.data.effects[i].duration > 0 && this.data.effects[i].turnsActive >= this.data.effects[i].duration) {
        this.data.effects.splice(i, 1);
      }
    }
  },

  checkHazard() {
    const pBase = 0.05;
    const delta = 0.02;
    const depth = this.data.depth;
    const entropy = this.data.entropy;
    let chance = Math.min(0.95, pBase + (delta * depth) + (entropy * 0.002));
    if (this.hasEffect('cursed')) chance = Math.min(0.95, chance * 2);
    if (this.hasEffect('empowered')) chance = Math.max(0.05, chance * 0.5);
    return Math.random() < chance;
  },

  getHazard() {
    const pool = Game.Data.HAZARDS.filter(h => {
      if (h.minDepth && this.data.depth < h.minDepth) return false;
      if (h.maxDepth && this.data.depth > h.maxDepth) return false;
      return true;
    });
    if (pool.length === 0) return Game.Data.HAZARDS[0];
    return pool[Math.floor(Math.random() * pool.length)];
  },

  isGameOver() {
    if (this.data.sanity <= 0) return { over: true, reason: 'sanity', message: 'Your mind unravels. The void claims you.' };
    if (this.data.escaped) return { over: true, reason: 'escape', message: 'You emerge into daylight. The world is not as you left it.' };
    return { over: false };
  },

  resolveImpact(impact) {
    const log = [];
    if (!impact) return log;

    if (impact.sanity) {
      let mod = impact.sanity;
      if (this.hasEffect('shrouded') && mod > 0) mod = Math.floor(mod * 0.5);
      if (this.hasEffect('haunted')) mod = mod < 0 ? mod - 3 : mod;
      this.modify('sanity', mod);
      log.push(`Ψ ${mod >= 0 ? '+' : ''}${mod}`);
    }
    if (impact.lucidity) {
      let mod = impact.lucidity;
      if (this.hasEffect('shrouded') && mod > 0) mod = Math.floor(mod * 0.5);
      this.modify('lucidity', mod);
      log.push(`L ${mod >= 0 ? '+' : ''}${mod}`);
    }
    if (impact.entropy) {
      this.modify('entropy', impact.entropy);
      log.push(`Entropy +${impact.entropy}`);
    }
    if (impact.addItem) {
      if (this.addItem(impact.addItem)) log.push(`Got: ${impact.addItem}`);
      else log.push('Inventory full!');
    }
    if (impact.removeItem) {
      if (this.removeItem(impact.removeItem)) log.push(`Lost: ${impact.removeItem}`);
    }
    if (impact.addEffect) {
      this.addEffect(impact.addEffect, impact.effectDuration || 0);
      const def = Game.Data.EFFECTS[impact.addEffect];
      log.push(`Afflicted: ${def ? def.name : impact.addEffect}`);
    }
    if (impact.removeEffect) {
      this.removeEffect(impact.removeEffect);
      const def = Game.Data.EFFECTS[impact.removeEffect];
      log.push(`Cured: ${def ? def.name : impact.removeEffect}`);
    }
    if (impact.heal === 'sanity') {
      this.modify('sanity', 15);
      log.push('Ψ +15');
    }
    return log;
  },

  save() {
    try {
      localStorage.setItem('echoes_void_lite_save', JSON.stringify(this.data));
    } catch(e) {}
  },

  load() {
    try {
      const raw = localStorage.getItem('echoes_void_lite_save');
      if (raw) {
        this.data = JSON.parse(raw);
        if (this.data.gameOver) return false;
        return true;
      }
    } catch(e) {}
    return false;
  },

  hasSave() {
    try {
      const raw = localStorage.getItem('echoes_void_lite_save');
      if (!raw) return false;
      const d = JSON.parse(raw);
      return d && !d.gameOver;
    } catch(e) { return false; }
  },

  clearSave() {
    try { localStorage.removeItem('echoes_void_lite_save'); } catch(e) {}
  }
};
