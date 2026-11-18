# Claude review R3 — Farm Days

## Verdict
Most of the R2 work landed. Cocoa works, the late-plant warning exists, `npm test` exists and prints "unit tests ok", and landscape is fixed. Portrait is only partly fixed.

- **Portrait:** The HUD now sits at the top with date, time and gold on one line and energy on a second row. In `r4-phone-farm.png` (390×844) the empty band has moved to the bottom, not gone. About 35% of the screen below the d-pad is blank. Nothing is clipped, but the canvas is width-limited and the controls are not anchored to the bottom.
- **Landscape:** `r4-phone-landscape.png` shows the canvas centred with the d-pad on the left and A/B and the menu buttons on the right. Everything is on-screen. The A/B buttons are small, about 50 px.
- **Open gaps:** Chest UI, NPC collision and animal mood are all still unfinished (details below).

As a local playable it is ship-worthy for the cozy loop. The three open gaps are polish, not blockers. I am not recommending a public deploy.

## What was fixed well
- **Cocoa** (`actions.js:347`, `drinkCocoa` at ~365): it checks the held slot, refuses at full energy with `toast_cocoa_full` and keeps the item. Otherwise it consumes one, restores `COCOA_ENERGY` and plays a sound. `items.js:11` sets sell 30 against the 30 G shop price, so there is no loss. Tests cover drinking, the full-energy refusal and the price.
- **Late-plant warning:** `plant()` (`actions.js:219–220`) shows `toast_late_plant` with the last safe day and "needs watering every day". `cal_mark` says the same in the calendar. Both strings are bilingual. The seed still goes in, as intended.
- **Cocoa text:** It is consistent across `README`, `help_6`, `cocoa_desc`, `cal_none`, `board_winter` and the shop description.
- **Layout code:** `layout()` in `main.js` measures real HUD, hotbar and touch heights. It has a `fitSlack` loop that grows the canvas reserve until nothing overflows, and a `touch-sides` mode for landscape.
- **Tests:** `package.json` has `"test": "node tests/unit.test.mjs"`. I ran it and it passes.

## Remaining bugs and gaps
1. **Chest is just the bag.** `actions.js:926` sets `state.panel = 'inventory'` for tile `c`, and the sign says "Bag". There is no chest storage in state, save or snapshot. **Confirmed open.**
2. **NPCs overlap the player.** `wanderNpcs` (`sim.js:167`) walks straight waypoint-to-waypoint with no player check and no tile check. `movePlayer` only calls `bodyBlocked(map, …)`, which checks tiles and ignores NPCs. The player and an NPC can stand on the same spot. **Confirmed open.**
3. **Animal mood does nothing.** `mood` is written in `feed` (+1), `pet` (+1) and `sleep` (`actions.js:789`, floor 2 if unfed). Nothing reads it, and the render code has no mood cue. The README even says petting "does not change produce". **Confirmed open.**
4. **Portrait bottom band.** The remaining empty space is the unfinished half of the R2 layout item (see Verdict).
5. **`__farm` is not gated.** There is no `debug` check anywhere. `teleport`, `sleep`, `buy`, `give` and the rest are mutating hooks that are always callable from the console. This is harmless for a local game, but the verification hooks should be marked as such. README notes `__farm` is intended for automation, so this is P2.
6. **Shop perks are honest.** The README says the coop roof and window box are cosmetic, so there is no mislabelling. This item is closed. The perks are just thin.

## Prioritized fixes
1. **P0 – NPC collision (`sim.js`).**
   - In `wanderNpcs`, before applying a step, compute the candidate position. If it is within ~0.7 tiles of the player, set `n.pause = 0.3` and skip the move.
   - In `movePlayer`, reject a step that ends within ~0.6 of an NPC on the same map. Also don't let NPCs enter solid tiles.
   - Guard against both getting stuck. If the player is boxed in, allow movement away from the NPC.
2. **P0 – Real chest (`state.chest`).**
   - Add `state.chest = []` with a 12-slot fixed shape. Add it in `createState`, `save.js` migration (default `[]`, must not break v2 saves) and `snapshot.js`.
   - Add a panel `'chest'` in `ui.js` with two columns, bag and chest. Pressing A moves a stack across, and it respects `canFit`.
   - `actions.js:926` opens `'chest'` instead of `'inventory'`. Change the sign to "Chest / 箱子".
3. **P1 – Mood has a small effect.**
   - Add `moodTier(a)`: mood 5 is happy, 3–4 is normal, and 2 or below is low.
   - At the morning product roll, a happy animal gives a bonus. For hens, 25% chance of a second egg. For the cow, milk sells for a small bonus, e.g. 90→100.
   - Keep the egg 35 and milk 90 base prices unchanged.
   - Alternatively, a happy animal gives +0.5 heart to the owner NPC once a week.
   - Add one mood line when petting and a mood heart or icon above the animal in `render.js`.
   - Decay: lose 1 mood per unfed day, floor 1. Today the floor is 2.
4. **P1 – Portrait layout.** On narrow portrait, anchor `#touch` to the bottom with `margin-top: auto`, so it sits at the bottom edge and the canvas and hotbar sit above it. Verify at 390×844 and 360×640 that nothing clips.
5. **P2 – Rainy-day dialogue.** Add `weather === 'rain'` lines in `dialogues.js`, one per NPC, bilingual. This is a cheap, low-risk cozy gain.
6. **P2 – Weekly shipping summary.** On each day 7, 14, 21 and 28, after `sleep`, add a toast with the total value shipped that week. Store `state.weekShip` as a counter and reset it. This is small if you don't build a new panel.
7. **P2 – `?debug` gate.** Keep the `__farm` names. Only the mutating helpers `teleport`, `sleep`, `buy`, `give` and `go` should require `location.search` to include `debug`. Otherwise they return `false`, so the automation tests must pass `?debug`. If this would break the existing automation, skip it.
8. **Skip this round:** seasonal festivals. They need their own dialogue, scheduling and art.

## Suggested features
- A weekly summary toast and rainy dialogue (above).
- A season-day festival: one day per season where the shop gives a small discount or the NPCs hand out a gift.
- A coop-roof perk: eggs from a happy hen get a +5 G bonus.
- A scrapbook or collection page listing harvested crops and foraged items.
- A "petted today" icon over each animal.

## What to keep
- `window.__farm` method names and return shapes (`getState`, `newGame`, `till`, `sleep`, `buy`, `give`, `teleport`, and so on).
- Bilingual strings. Every new `S('中文', 'English')` needs both languages.
- The aiming rule: stand on plot A, face plot B, and act only on B.
- Wilt rules: two dry days wilt a crop, and the hoe or empty hand clears the stalk.
- Touch buttons fully on-screen at 390×844, 360×640 and 844×390.
- `migrate` and v2 saves: new fields must default safely (`chest: []`).
- Economy numbers: egg 35, milk 90, cocoa 30/30, and the sinks (sprinkler 680, can 420, backpack 360, coop roof 1400, window box 900).
- Social rules: one gift per day per NPC, half-heart talk, 4-heart rewards.
- `tests/unit.test.mjs` stays green via `npm test`.
- No public deploy.

## Spec for round 3
Do NPC collision, the chest and the mood effect, in that order. **(a) Collision:** in `sim.js`, make `wanderNpcs` skip a step that would end within 0.7 tiles of the player, setting a short `pause`, and make `movePlayer` reject a step that ends within 0.6 of any NPC on the same map. Add a `npcBlocked(state, x, y, r)` helper and a unit test that walks the player into an NPC and checks the distance stays at or above 0.6. **(b) Chest:** add `state.chest = Array(12).fill(null)` in `createState`, default it in `save.js` for older saves, and include it in `snapshot.js` (an additive field only). Add a `'chest'` panel in `ui.js` that shows bag and chest slots, and tapping a slot calls `chestMove(state, from, index)` in `actions.js`, which moves the whole stack. It checks capacity and merges equal stacks using the existing `canFit`/`addItem` helpers. Interacting with tile `c` opens it. Add a `__farm.chestMove` hook (new name, nothing renamed) and tests for round-trip storage and saving. **(c) Mood:** add `moodTier` in `pens.js`. In the sleep rollover (`actions.js` ~789), a tier-high hen gets a 25% chance of one extra egg, drawn from the seeded `rng.js` so tests are deterministic. A tier-high cow's milk sells for +10 G, with base prices unchanged. Decay is −1 mood per unfed day, floor 1. Add a bilingual hint string, a mood heart in `render.js`, and tests for tier thresholds and the extra egg. Finally, anchor `#touch` to the bottom in portrait. Re-check all three viewports, keep all hooks and the economy unchanged, and keep `npm test` green.
