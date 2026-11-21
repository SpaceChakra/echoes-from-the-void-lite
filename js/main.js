Game.main = {
  pendingEncounter: null,

  init() {
    Game.UI.init();
    Game.UI.setupKeyboard();
  },

  showTitle() {
    Game.UI.showTitle();
  },

  newGame() {
    Game.Audio.init();
    Game.Audio.startDrone();
    Game.State.clearSave();
    Game.State.init();
    Game.UI.showGame();
    Game.UI.els.chronicle.innerHTML = '';
    this.pendingEncounter = null;
    this.runIntro();
  },

  loadGame() {
    if (Game.State.load()) {
      Game.Audio.init();
      Game.Audio.startDrone();
      Game.UI.showGame();
      Game.UI.els.chronicle.innerHTML = '';
      Game.UI.renderStatus();
      Game.UI.renderLog('<span class="dim">─── Game restored from memory ───</span>', []);
      this.enterNextEncounter();
    }
  },

  runIntro() {
    const lines = [
      '<span class="dim">─── Initializing descent ───</span>',
      '',
      '<span class="highlight">You stand at the edge of the world.</span>',
      'The ground is cold beneath your feet. Above, the sky is the color of a bruise.',
      'You have been here before. You will be here again.',
      'But this time feels different.',
      '',
      '<span class="dim">Something has changed in the deep places.</span>',
      '<span class="dim">Something is waiting.</span>',
      '',
      'Your lantern swings at your belt. Your journal is heavy with warnings',
      'you do not remember writing. The air smells of ozone and wet stone.',
      '',
      '─'
    ];

    // Type the lines one at a time: each line begins only after the previous
    // one has finished revealing, so the intro reads as a single stream.
    const typeLine = (idx) => {
      if (idx >= lines.length) {
        setTimeout(() => this.enterNextEncounter(), 300);
        return;
      }
      Game.UI.renderLog(lines[idx], [], () => {
        setTimeout(() => typeLine(idx + 1), 120);
      });
    };
    typeLine(0);
  },

  enterNextEncounter() {
    const state = Game.State;
    state.tickEffects();
    state.modify('turn', 1);

    const go = state.isGameOver();
    if (go.over) {
      this.endGame(go.reason, go.message);
      return;
    }

    if (state.checkHazard()) {
      const hazard = state.getHazard();
      const impactLog = state.resolveImpact(hazard.impact);
      Game.Audio.stinger('hazard');
      Game.UI.renderHazard(hazard, impactLog);
      state.save();

      const go2 = state.isGameOver();
      if (go2.over) {
        setTimeout(() => this.endGame(go2.reason, go2.message), 500);
        return;
      }
    }

    const encounter = this.pickEncounter();
    if (!encounter) {
      this.endGame('sanity', 'The void has no more paths for you.');
      return;
    }

    state.set('currentNode', encounter.id);
    state.save();
    Game.UI.renderEncounter(encounter);
    this.pendingEncounter = encounter;
  },

  pickEncounter() {
    const state = Game.State;
    const depth = state.get('depth');
    const lastNode = state.get('currentNode');

    if (depth === 0) {
      return Game.Data.ENCOUNTERS.find(e => e.id === 'fissure');
    }

    // LITE: the first five layers, then a way up. The full game goes ten
    // layers down, through the Final Gate and past the Witness.
    if (depth >= Game.LITE_DEPTH) {
      return Game.Data.ENCOUNTERS.find(e => e.id === 'exit');
    }

    const pool = Game.Data.ENCOUNTERS.filter(e => {
      if (['exit', 'fissure'].includes(e.id)) return false;
      if (depth < e.minDepth || depth > e.maxDepth) return false;
      if (e.id === lastNode) return false;
      return true;
    });

    if (pool.length === 0) {
      return Game.Data.ENCOUNTERS.find(e => e.id === 'exit');
    }
    return pool[Math.floor(Math.random() * pool.length)];
  },

  resolveChoice(index) {
    const encounter = this.pendingEncounter;
    if (!encounter) return;

    const choices = encounter.choices;
    if (index < 0 || index >= choices.length) return;

    const choice = choices[index];
    if (!Game.UI.checkRequirements(choice)) return;

    const impactLog = Game.State.resolveImpact(choice.impact);

    // Event sound chosen from the most salient consequence of the choice.
    const imp = choice.impact || {};
    if (imp.addItem) Game.Audio.stinger('item');
    else if (imp.sanity && imp.sanity <= -10) Game.Audio.stinger('sanity');

    Game.UI.renderLog(choice.log || choice.text, impactLog);

    if (choice.impact && choice.impact.depth) {
      Game.State.modify('depth', choice.impact.depth);
      if (choice.impact.depth > 0) Game.Audio.stinger('descend');
    } else if (encounter.id !== 'exit') {
      Game.State.modify('depth', 1);
      Game.Audio.stinger('descend');
    }

    if (choice.isEscape) {
      Game.State.set('escaped', true);
    }

    Game.State.save();

    const go = Game.State.isGameOver();
    if (go.over) {
      setTimeout(() => this.endGame(go.reason, go.message), 500);
      return;
    }

    Game.UI.els.actions.innerHTML = '';
    this.pendingEncounter = null;

    setTimeout(() => this.enterNextEncounter(), 400);
  },

  endGame(reason, message) {
    Game.State.set('gameOver', true);
    Game.State.save();
    Game.Audio.stinger(reason === 'escape' ? 'escape' : 'death');
    Game.Audio.stopDrone();
    Game.UI.showGameOver(reason, message);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Game.main.init();
});
