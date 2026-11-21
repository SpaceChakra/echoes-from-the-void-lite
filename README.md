# Echoes from the Void (Lite Edition)

A text-based cosmic horror roguelike that runs entirely in the browser. There's no build step, no framework and no asset files: just HTML, CSS and vanilla JavaScript. Every sound is synthesized live, and the screen decays as your character's mind does.

**This is the Lite Edition**, the first five layers of the descent, with full source. The full game goes ten layers down, past the Final Gate to the Witness, with more encounters, items, hazards and endings. It's on [Patreon](https://patreon.com/spacechakra).

## Play

Open `index.html` in any modern browser and click **[ DESCEND ]**.

- Choose with the buttons or number keys **1–9**. It's fully keyboard-navigable.
- Progress saves automatically, and **[ CONTINUE ]** resumes your run.
- **♪** (top right) toggles sound.

## How it works (good code to learn from)

```
index.html      markup + screen containers
style.css       CRT theme, sanity-reactive degradation, animations
js/state.js     game state, stats, effects, save/load, hazard odds
js/data.js      encounters, hazards, items, effects (all the content is data)
js/audio.js     procedural Web Audio: a drone that sours as sanity falls + one-shot stingers
js/renderer.js  UI, skippable typewriter text, mood visuals
js/main.js      game loop and event wiring
```

- **Content is data.** Add an encounter by adding an object to `ENCOUNTERS` in `js/data.js`, with a depth range, choices and impacts. No code changes needed.
- **Procedural audio.** The drone detunes into audible beating as sanity drops. Every stinger is built from oscillators and noise.
- **The screen loses its mind.** Chromatic ghosting, jitter, a closing vignette and letters briefly corrupting into glyphs, all driven by stats, and all of it respects `prefers-reduced-motion`.

## Make it yours

Fork it and write your own descent: new encounters, a new theme, new stats. It's a great base for a jam game or an interactive-fiction experiment.

## License

Code: MIT (see [LICENSE](LICENSE)). The name "Echoes from the Void" and the SpaceChakra brand aren't covered, so please give your remix its own name.

Made by [SpaceChakra](https://patreon.com/spacechakra) · more games at [spacechakra.itch.io](https://spacechakra.itch.io)
