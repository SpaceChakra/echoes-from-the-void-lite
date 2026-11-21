// LITE EDITION: the first five layers of the descent. See README.md.
Game.LITE_DEPTH = 5;

Game.Data = {

ITEMS: [
  {
    id: 'lantern',
    name: 'Flickering Lantern',
    desc: 'A rusted lantern that casts uncertain light. Its battery is running low.',
    starting: true,
    actions: [
      { text: 'Conserve battery (dim the light)', impact: { sanity: 3 } },
      { text: 'Burn bright (reveal hidden details)', impact: { lucidity: 5, entropy: 3 } }
    ]
  },
  {
    id: 'journal',
    name: 'Dog-eared Journal',
    desc: 'A leather-bound journal filled with cryptic notes in your own handwriting.',
    starting: true,
    actions: [
      { text: 'Study the fragmented notes', impact: { sanity: 5, lucidity: 3 } },
      { text: 'Write new observations', impact: { lucidity: 5 } }
    ]
  },
  {
    id: 'talisman',
    name: 'Protective Talisman',
    desc: 'A cold iron disc etched with warding symbols. It hums faintly.',
    actions: [
      { text: 'Clutch the talisman', impact: { sanity: 10, addEffect: 'empowered', effectDuration: 3 } }
    ]
  },
  {
    id: 'memory_shard',
    name: 'Memory Shard',
    desc: 'A crystalline fragment that pulses with stolen recollections.',
    actions: [
      { text: 'Absorb the memories', impact: { lucidity: 15, sanity: -8 } }
    ]
  }
],

EFFECTS: {
  shrouded: {
    name: 'Shrouded',
    desc: 'Your perception is clouded. Lucidity gains are halved.',
    modifiers: { lucidity: -5 },
    color: 'warning'
  },
  haunted: {
    name: 'Haunted',
    desc: 'Something follows. Sanity drains each turn.',
    modifiers: { sanity: -3 },
    color: 'danger'
  },
  empowered: {
    name: 'Empowered',
    desc: 'A surge of clarity. Hazard chance reduced.',
    modifiers: { sanity: 2, lucidity: 3 },
    color: 'safe'
  },
  cursed: {
    name: 'Cursed',
    desc: 'The void takes notice. Hazard chance doubled.',
    modifiers: { sanity: -2 },
    color: 'danger'
  },
  enlightened: {
    name: 'Enlightened',
    desc: 'You see clearly. But some things should remain unseen.',
    modifiers: { lucidity: 8, sanity: -2 },
    color: 'info'
  }
},

HAZARDS: [
  {
    id: 'reality_tear',
    title: 'Reality Tear',
    desc: 'The fabric of space splits before you. Impossible geometries pour through.',
    impact: { sanity: -12, entropy: 3 },
    minDepth: 0
  },
  {
    id: 'false_memory',
    title: 'False Memory',
    desc: 'You remember something that never happened. The memory feels more real than the present.',
    impact: { sanity: -8, lucidity: -5 },
    minDepth: 1
  },
  {
    id: 'spatial_loop',
    title: 'Spatial Loop',
    desc: 'You walk for what feels like hours. The same crack in the wall passes again. And again.',
    impact: { entropy: 8, sanity: -5 },
    minDepth: 0
  },
  {
    id: 'whispers',
    title: 'Whispers in the Static',
    desc: 'A thousand whispering voices converge into one message: your name.',
    impact: { sanity: -10, addEffect: 'haunted', effectDuration: 4 },
    minDepth: 2
  }
],

ENCOUNTERS: [
  {
    id: 'fissure',
    title: 'The Fissure',
    desc: 'The earth splits before you, a wound in the stone that exhales warm, damp air. Whatever lies below has been waiting. Your lantern flickers. Your journal feels heavier than it should.',
    minDepth: 0,
    maxDepth: 0,
    choices: [
      { text: 'Descend into the fissure', impact: { depth: 1, entropy: 2 }, log: 'You lower yourself into warm darkness. The fissure closes above you like a mouth.' }
    ]
  },
  {
    id: 'whisper_stone',
    title: 'The Whisper-Stone',
    desc: 'A stone pulsing with faint light pulses in the center of the chamber. The rhythm matches your heartbeat, then diverges. It speaks in a language that sounds like your own thoughts.',
    minDepth: 1,
    maxDepth: 2,
    tags: ['mystery'],
    choices: [
      { text: 'Touch the stone', impact: { sanity: -8, lucidity: 12 }, log: 'The stone is warm. Images flood your mind — places you have never been, things that have never lived. ' },
      { text: 'Press forward, ignoring it', impact: { entropy: 2 }, log: 'You leave the stone behind. Its light follows you for several steps before fading.' },
      { text: 'Consult your journal for similar symbols', impact: { sanity: 5, lucidity: 5 }, log: 'You find a sketch that matches the stones markings. The accompanying note reads: DO NOT TOUCH.' }
    ]
  },
  {
    id: 'gatekeeper',
    title: 'The Gatekeeper',
    desc: 'A figure stands where the corridor widens. It wears your face. It wears your clothes. It smiles with too many teeth and speaks in a voice that is yours but wrong.',
    minDepth: 1,
    maxDepth: 3,
    tags: ['entity'],
    choices: [
      { text: 'Demand passage', impact: { sanity: -10, lucidity: 5 }, log: 'Your voice echoes strangely. The figure steps aside, still smiling. As you pass, it whispers something you almost understand.' },
      { text: 'Show the talisman', impact: { removeItem: 'talisman', addEffect: 'empowered', effectDuration: 4 }, log: 'The talisman flares. The figure recoils, its face distorting into something less human. It dissolves into shadow.', requirements: { item: 'talisman' } },
      { text: 'Speak to it', impact: { lucidity: 8, entropy: 3 }, log: '"You are early," it says. "But the void is patient." It gestures down the corridor and fades.' }
    ]
  },
  {
    id: 'echoing_corridor',
    title: 'The Echoing Corridor',
    desc: 'The tunnel forks into three passages. From each comes a different sound: running water, a human voice reciting numbers, and a low, rhythmic thrum like a heartbeat.',
    minDepth: 1,
    maxDepth: 2,
    tags: ['navigation'],
    choices: [
      { text: 'Follow the sound of water', impact: { sanity: 5, entropy: -3 }, log: 'The passage opens to an underground stream. You drink. The water tastes like metal and memory.' },
      { text: 'Follow the voice', impact: { lucidity: 10, sanity: -5 }, log: 'The voice leads you to a chamber covered in chalk equations. They describe dimensions that should not exist.' },
      { text: 'Follow the heartbeat', impact: { sanity: -8, entropy: 5 }, log: 'The thrum grows louder until your bones vibrate. At the end, a wall of organic matter pulses. It knows you are here.' }
    ]
  },
  {
    id: 'library_skin',
    title: 'The Library of Skin',
    desc: 'Books line the walls, bound in pale leather. The titles are written in what appears to be dried blood. The room smells of salt and copper. A reading desk holds an open volume.',
    minDepth: 2,
    maxDepth: 4,
    tags: ['knowledge'],
    choices: [
      { text: 'Read the open book', impact: { sanity: -12, lucidity: 15 }, log: 'The text describes the history of the universe after its heat death. You are mentioned by name.' },
      { text: 'Search for a specific reference', impact: { sanity: -5, lucidity: 8 }, log: 'You find a passage about escaping the void. The page is torn. The next reader has underlined the word impossible.' },
      { text: 'Burn a book for light', impact: { sanity: 8, removeItem: 'lantern' }, log: 'The leather blackens and curls. The flame burns violet. For a moment, the shadows retreat.' }
    ]
  },
  {
    id: 'well_voices',
    title: 'The Well of Voices',
    desc: 'A stone well fills the center of the room. From its depths rise the murmurs of countless voices. They speak in fragments — prayers, curses, last words. A rope descends into the dark.',
    minDepth: 2,
    maxDepth: 4,
    tags: ['item', 'mystery'],
    choices: [
      { text: 'Lower an item into the well', impact: { removeItem: 'lantern', addItem: 'memory_shard' }, log: 'The voices surge as your lantern descends. They return it transformed — no longer a lantern but a crystalline shard humming with stolen memories.', requirements: { item: 'lantern' } },
      { text: 'Listen to the voices', impact: { lucidity: 8, sanity: -6 }, log: 'You hear your own voice among them, saying something you have not yet said. The well knows your future.' },
      { text: 'Seal the well', impact: { sanity: 5, entropy: -3 }, log: 'You drag a stone slab across the opening. The voices muffle but do not stop. They never stop.' }
    ]
  },
  {
    id: 'exit',
    title: 'The Surface',
    desc: 'A draft of cold air. Above you, a crack in the stone lets in pale light. You could climb out now — and never learn what waits on the deeper layers. Something down there is still calling your name.',
    minDepth: 5,
    maxDepth: 5,
    tags: ['exit', 'final'],
    choices: [
      { text: 'Step into the light', impact: { heal: 'sanity' }, log: 'The light is cold on your skin. You breathe air that has touched the sky. Behind you, the fissure is gone. You are not the same person who descended. But you are here. You survived.', isEscape: true }
    ]
  }
]
};
