# Claude review R1 — Farm Days

I read the code and the r2 screenshots, and I did not run the game or the tests. Everything below comes from reading source. Where I point to behavior, I traced it through the code. It was not observed live.

## Verdict

- **State of v1:** It is a coherent, cozy, small-scope farming game. It is complete as a v1 loop and fine to ship as a local playable for desktop. Phone is playable but cramped (see below).
- **What works:** The architecture is clean, the bilingual coverage is thorough, the save, settings and test-hook plumbing is sound, and the writing has real charm.
- **What is thin:** There is not enough game after the first week.
  - The economy runs out around spring day 8–10, because there is nothing left to buy.
  - Winter is empty.
  - Friendship has no payoff.
- **Weak spots:** The phone presentation is the weakest area. I also found a few real input and save defects, listed below.
- **Release call:** Ship-worthy as a "play it for a few days" toy. Fix P0 and P1 before calling it a game people keep.

## Game feel and fun

**What works**
- **Tone and writing.** The NPC lines are the best part ("Watching you work is like watching a very earnest vegetable", "Don't argue with frozen ground. Pine cones on the path still count as work"). The dry humor suits the cozy brief.
- **Forgiving rules.** Two dry days before wilting, a 10% capped passout penalty, and sunny first three days all suit a cozy game.
- **Short crop timings.** Turnip takes 2 days and the spring/summer/autumn crop pairs give choices, so the first hour pays off quickly.
- **Interaction hints.** The labels and E/B prompts on well, bin, bed and counter make the world self-explaining. The yellow aim box helps too.

**What feels thin**
1. **Hearts have no mechanical payoff.**
   - Hearts only rise through gifts (`give` in `actions.js`). Talking gives nothing, and there are no events or rewards.
   - Lines promise things that never happen. Aunt Hua says "I kept the freshest packet under the counter for you" and "I'll save you a bowl tonight". Granny Tao saves "a spot of pumpkin cake". None of it exists.
   - Dialogue varies only by `(day + hash) % 2` within three heart tiers. It ignores season, weather and what you are growing.
   - Players will reach 5 hearts and see no change.
2. **Animals out-earn crops.**
   - An egg sells for 60G and a turnip for 50G. Milk is 140G.
   - Two hens plus a cow earn about 260G a day for about 30G of feed and about 13 energy.
   - A full crop day costs about 100 energy and earns similar money.
   - The best strategy is "feed animals, ignore the field". That undercuts the crop loop the game is built around.
3. **No money sink after about a week.**
   - Everything in the shop is cheap relative to animal income. Sprinkler is 680, big can 420, bag 360. All are bought by roughly day 8–10, and then gold means nothing.
   - There is no house upgrade, no more animals, no decor and no festival.
4. **Winter is a dead month.**
   - `till` is blocked, and the shop sells no seeds in winter (`getStock`).
   - Wilted immature autumn crops cannot be cleared in winter, because the frozen check in `till()` comes before the wilt-clear branch. They sit as dead sprites for 28 days.
   - Only forage cones (25G) and animals remain.
5. **Calendar shows no events.** The 28-day seasons are just numbers. Nothing marks birthdays, festivals or days worth looking forward to.
6. **A cute unused hook.** Each NPC has `liked` and `disliked` items, and the player has no way to learn them except by trial. Players can only discover them by gifting, and a gift is allowed once per NPC per day.

**What would make the first 20 minutes more delightful**
- A tiny scripted "day 1" arc that uses the existing systems:
  - Aunt Hua's first visit gives a free packet and teaches the loop.
  - The first egg and first turnip get a short toast or dialogue.
  - The first full sleep pays out a modest sum.
- A "first harvest" jingle or sprite pop. `audio.js` already has sfx names.
- Mei and Granny Tao could walk by the farm on day 2–3, so the village feels close.
- A gentle reminder when the player is hungry for direction, for example a toast on day 1 evening: "Your turnips need water before bed."

## Bugs and sharp edges

**Real defects or likely defects**

1. **Mouse/touch aiming is ignored when standing on soil.**
   - `pickPlotTile` in `actions.js` prefers the plot under the player over the faced tile.
   - `aimAt` in `input.js` turns the player toward the clicked adjacent tile, but `useTool` then acts on the tile underneath.
   - Standing in the field and clicking a neighbor tills or waters the wrong plot.
   - It also causes keyboard surprises when walking across the field facing a fresh row. `render()` draws the aim box on the standing tile, so it is visible.
   - Fix: prefer the faced tile, and fall back to the standing tile only if the faced tile is not a plot.
2. **Save has no migration.**
   - `loadGame` accepts `v === 1` and patches only `upgrades` and `hearts`.
   - Any saved game from before a newly added field (`sprinklers`, `forage`, `gifted`, `energyMax`, `mood`, `lastPayout`, animal fields) can crash in `endDay`, `water`, `plant` or the HUD. A missing `energyMax` makes the energy bar divide by undefined, and missing `sprinklers` makes `.some` throw.
   - Old-save cow position: the cow's `x`/`y` are only clamped into `PEN.cow` by `wanderAnimals` once the sim runs. In an old save the cow could draw outside the fence for the first frames.
   - Fix: a `migrate(data)` that merges defaults from `createState()` for all missing keys and re-clamps animals and NPC positions. Bump `v` and keep reading `v:1`.
3. **Phone is still letterboxed at integer 1×.**
   - `fitCanvas` floors the scale, and on a 390×844 viewport `(390−28)/320` floors to 1.
   - The r2 phone screenshot shows a roughly 330×230 CSS-px canvas centered in a large empty dark area, with about 450px of unused space above it.
   - On top of that, the HUD (date, location, energy bar, energy/tool/water row) overlays about a third of the 224px-high play view. Hotbar overlays the bottom.
   - Result: on a phone you see only a thin strip of farm.
   - Fix: allow fractional scale on touch/narrow screens (still `image-rendering: pixelated`), or give the canvas the full width and move the HUD out of the canvas area. On a phone the canvas should also sit higher, nearer the controls.
4. **Nameplates are softer than the pixel art.**
   - `render.js` around line 606 uses `bold 8px "Segoe UI", "PingFang SC", "Noto Sans SC"` on a 320×224 canvas that is upscaled.
   - CJK text at 8px is blurry, and in the desktop screenshot the "运送箱" label is clipped at the right edge.
   - Fix: bitmap-font labels, or draw labels in a separate overlay canvas or DOM layer at screen resolution, and clamp label x to the view.
5. **Gift prompt is missing on touch.**
   - Dialogue's give button only shows when the held item is giftable, and the player must open the dialogue first.
   - The hotbar item is visible in the HUD, but there is no hint explaining "pick an item, then talk". `help_2` mentions G or the button, but only the first time.
   - On a phone the hotbar slots are the only way to choose, so this is awkward but works.
6. **Shop is one tap per unit.** `buy` from the UI always passes qty 1 (`ui.js` `act === 'buy'`). Buying 6 seeds is 6 taps, 20 for feed. There is no ×5 or ×10 control.
7. **`seenHelp` is write-only.** It is set in several places and never read. The help panel appears on every New Game anyway, so the flag does nothing. Safe, but misleading.
8. **Stray keys during modal panels.**
   - `handleInput` lets `inv` and `cal` toggle while `sleep`, `passout` or `help` are open. Pressing I on the help card replaces it with the bag, and `seenHelp` is not set.
   - Pressing C or M in a dialogue discards it (`togglePanel` nulls `dialogue`).
9. **Chest is a placebo.** Tile `c` opens the same inventory panel (`tileObject`, `ch === 'c'`). There is no storage. The label says "Chest" and a player will expect to put things in it.
10. **Winter wilted crops cannot be cleared** (see Game feel #4).
11. **Season rollover silently kills young crops.**
    - `endDay` wilts any immature crop whose season differs from the new one. Only the generic wilt toast appears, and the calendar panel does not warn.
    - Planting turnips on day 27 is a trap with no feedback. At minimum, warn on plant when `days` cannot finish before day 28, or show a "last safe planting day" in the calendar.
12. **Dead or inconsistent strings.**
    - `shop_closed` is never used. The shop shows `toast_shop_night` instead.
    - `toast_no_target` says "Face a tile of soil" even for `water()` on an untilled plot.
    - `mood` rises with feed and pet but is never read for anything. The line `if (!a.fed) a.mood = Math.max(2, ...)` can never lower it, and it looks like dead logic.
    - `hotbar`, `owned`, `sold_out`, `ship_put`, `ship_take` and `yes`/`no` may be unused. This needs a grep pass.
13. **`use` key K collides with `Tab`/`I` family expectations.** Keyboard is fine, but K is an unusual "use tool" key. J/Z/K all do the same, so no functional bug, just an oddity.
14. **Hold-to-use repeats tools.** `holdUse` fires `useTool` every 0.16s. Holding J on seeds or feed spends energy and time rapidly and cannot be cancelled except by releasing. `toast_tired` after a hold is harsh when the player did not intend it. Consider restricting hold-repeat to hoe and can.
15. **NPC and animal collision.** NPC waypoints walk through each other and through solid tiles, because there is no collision in `wanderNpcs`. Waypoints seem to have been picked to avoid walls, but changing a map will silently break it. The player can also stand on top of an NPC.
16. **Time cost versus energy.** `till`/`water` etc. cost 8 game-minutes each, and real time adds 4 min per second. A day lasts about 4.5 real minutes plus action time. This is fine, but time-of-day pressure and the 100 energy cap feel disconnected, and the late toast at 22:00 is the only signal. A visual darkening for evening and night exists (`SKY`), but I did not verify its strength.

## Code quality

**Architecture** is good for 5k lines.
- The layering is clean: `data/` for tables, `game/` for pure state transitions, `render/` and `ui/` for views, `input/` for devices.
- State is a single JSON-serializable object, and actions are plain functions on it. This makes the save, the test hook and snapshot easy.

**State and save**
- `saveGame` does a `JSON.parse(JSON.stringify(state))` deep copy every 20s. The state is small, so this is fine.
- It also stores transient fields (`_passout`, `sfxName`, `sfxN`, `useCd`, `linkLock`, `seasonNote`). Harmless, but a whitelist or schema would be safer.
- Autosave runs every 20s, on hide and on unload. Sleeping does not save directly except via `window.__farm.sleep()`. A crash right after the morning payout could lose a day, so save in `sleep()` and in `doPassout()`.
- `loadGame` returns `null` for any malformed save and the title silently shows no Continue, with no backup or recovery.
- New Game does not confirm before it overwrites an existing save. `onNew` calls `saveGame` immediately. This is a real data-loss risk.
- The save key is `farm-days-save-v1`, and the in-save `v` is also 1. Plan for `v: 2` and a migration table now.

**`window.__farm` hook**
- It is thorough and defensive. Every method is wrapped in try/catch and returns false.
- The try/catch swallows all errors, which makes real bugs invisible in tests. Consider logging to `console.error` or storing the last error in the snapshot so Playwright runs surface exceptions.
- `advanceTime` and `setTime` bypass `endDay` consistency, and `setMoney` and `setEnergy` are cheat paths. They are fine for tests but exposed to anyone. If the game is ever hosted, gate them behind `?debug=1`.
- `newGame()` sets `panel = null` and `seenHelp = true`, which differs from the real `onNew`. Tests can therefore pass without ever exercising the help panel path.

**Input and panel routing**
- Routing is a chain of `if (state.panel === ...)` branches duplicated in three places: `sim.handleInput`, `actions.interact` and `actions.closePanel`.
- `ui.js` click handlers duplicate some actions (`closehelp`, `sleep`). This is where bugs like item 8 appear.
- A single `panelHandlers[panel] = { interact, close, allowedToggles }` table would remove the duplication.
- Touch buttons mix `pointerdown` (inv, cal, menu, sleep) and `bindHold` (dir, use, interact). Mixed capture behavior can cause stuck movement if a finger slides off a d-pad button. `pointerleave` only releases if `e.buttons` is set. Test on a real phone with finger slides.
- Mouse: right-click means interact and left-click means use, and only when the clicked tile is within one tile of the player. Clicking far away does nothing, silently.

**Rendering**
- `render()` redraws every tile every frame and rebuilds an entity list, with sorting. At 32×20 tiles this is fine.
- `Object.values(state.plots)` is iterated per frame for crops. That is fine today, but cache if the farm grows.
- Procedural sprites are redrawn from `px()` rect calls each frame, with no sprite cache for items or crops. `iconURL` caches DOM icons only. Fine for now.
- `fitCanvas` resets canvas size only when scale changes. On fractional scaling you will need to handle device pixel ratio so text is crisp.
- The ground uses `hash(x, y)` for stable variation. This is good, and the grass flowers stay put.

**Bilingual strings**
- Coverage is thorough, and `t()` falls back to zh. Keys are centralized in `strings.js`.
- A few strings live outside it: the gift reply texts in `give()` (`'心意我领了…'`, `'这个我真喜欢…'`, `'谢谢你…'`), the title hint in `ui.js` `syncTitle`, and the HTML default text.
- `toast_plant` and similar pass `name: id`, and the UI resolves it. That resolve logic in `toastText` is slightly fragile: an animal id that equals an item id would collide.
- English plurals and zh measure words are not an issue yet.
- `help_2` says "A" and "B" for touch, but the touch buttons are labeled "使用工具", "互动" (`btn_use`, `btn_talk`) on the pad. The `label()` helper only sets visible text for inv/cal/sleep/menu, so A and B stay as letters. This is consistent but could be explained once.

**Performance risks**
- `signature()` does `JSON.stringify` of inventory, shipping, hearts and more every frame (`ui.sync()` called from `frame`). It is cheap now, and it also blocks the panel from re-rendering mid-tap if anything changes under the finger. Replace it with a dirty flag if it ever grows.
- `ui.sync()` updates many `textContent` nodes per frame. Only write when changed.

**Tests**
- There are no tests in the repo. The Playwright run described is not committed. Commit it as `tests/smoke.spec.js` with the `window.__farm` hook, plus a few pure-function unit tests (`endDay`, `nextDate`, `canFit`, `buy`, save round-trip).

## Prioritized fixes

1. **P0 — Fix `pickPlotTile` to prefer the faced tile**, so mouse/touch/keyboard act where the aim box shows. Add an assertion in the smoke test: stand on plot A, face plot B, till, and check B.
2. **P0 — Add `migrate()` to `loadGame`.** Merge defaults for all missing top-level keys, animals and NPCs. Re-clamp animal positions into their pens and ensure NPC waypoints exist. Save version 2 and keep reading version 1.
3. **P0 — Confirm New Game when a save exists** (title screen). A second tap or a small dialog is enough, and avoids wiping progress.
4. **P0 — Phone layout.**
   - Allow fractional canvas scale on touch or narrow screens, or fill the width.
   - Move the HUD off the play view, or make it one compact line.
   - Keep the 10 controls inside the viewport. Re-run the 390×844 check plus 360×640 and a landscape phone.
5. **P1 — Rebalance the economy.**
   - Lower egg and milk, for example egg 35 and milk 90, or add a feed cost increase.
   - Raise crop value a little, or add per-day animal caps.
   - Add one or two late-game sinks (see Features).
   - Target: a full field day beats an animal-only day by about 1.5×.
6. **P1 — Give hearts a payoff.**
   - Talking once a day gives +half a heart, or a small number of friendship points.
   - Make two or three of the existing promises real, such as a free seed packet or a gift item at 4 hearts.
7. **P1 — Fix winter.**
   - Let the hand or hoe clear wilted plots in any season, by moving the frozen check after the wilted branch.
   - Sell a winter forage tool or a cheap "winter" item, so players have something to do.
8. **P1 — Warn on season boundary.** Show the last safe planting day in the calendar panel and a toast when planting a crop that cannot finish before day 28.
9. **P1 — Crisp labels.** Draw nameplates at screen resolution or with a bitmap font, and clamp them to the view so "运送箱" is not cut off.
10. **P1 — Panel routing cleanup.**
    - Make `inv` and `cal` ignored while `sleep`, `passout`, `help` or `dialogue` is open.
    - Set `seenHelp` on close, and either use it or remove it.
    - Restrict hold-repeat to hoe and can.
11. **P1 — Save on sleep and passout**, and on any shop purchase of an upgrade.
12. **P1 — Shop quantity.** Add ×1, ×5 and ×10 buttons or press-and-hold on buy.
13. **P1 — Commit the smoke test and a few unit tests**, and make the `__farm` hook log swallowed errors.
14. **P2 — Dead code and strings pass:** `shop_closed`, `mood`, unused string keys, the `shipSlot` empty `if (state.hotbar === slot)` block, and `sprinkler` comment code.
15. **P2 — Move the remaining hard-coded strings** (gift replies, title hint) into `strings.js`.
16. **P2 — Chest.** Either make it real storage or relabel it "Bag".
17. **P2 — NPC collision and spacing** so they cannot overlap the player or walls if maps change.
18. **P2 — Gate debug hooks** (`setMoney`, `setEnergy`, `setTime`) behind `?debug`.

## Suggested features (after the fixes)

Keep these modest and in scope:

- **Seasonal festival days** (one per season, on a fixed calendar day). The calendar shows them, the village decorates, and a small shop or contest gives a gift reward. This uses existing NPCs and maps.
- **A few more animals or one coop upgrade** as the late-game money sink, with a visible barn or coop change.
- **A "daily wish" per NPC** (e.g. "Mei would love a turnip today") shown after the first talk, replacing blind gift guessing.
- **House upgrades or decor** (a rug, a plant, a window box) purchased with spare gold, drawn in the existing interior.
- **A weather moment:** a small rain sound and puddle on rainy days, plus one cozy line from an NPC when it rains.
- **A one-screen summary on waking:** gold earned, eggs and milk, crops ready. This replaces the single toast and gives each day a small payoff.
- **Winter things to do:** ice fishing is too big, but a winter forage spot, a snowman at the village, or a cooking-at-home recipe from eggs and milk would be small.
- **Mood that matters:** use animal `mood` for a small chance of a bonus egg or better milk, or remove it.

## What to keep

- **The bilingual design:** every player-facing string in both languages, with Chinese as the default and the toggle available on the title, HUD and settings.
- **Forgiving rules:** two dry days before wilting, sunny first three days, the capped passout penalty, and no failure states that wipe progress.
- **Simple farming:** till, plant, water, harvest with no quality tiers, plus the sprinkler as a purchase rather than a chore.
- **The single JSON state object** and plain-function actions, which keep save and test hooks simple.
- **`window.__farm`** and its method names, since the Playwright test depends on them (`newGame`, `getState`, `tick`, `till`, `plant`, `water`, `feed`, `talk`, `buy`, `sleep`, `interact`, `collectShipping`, `go`, `teleport`).
- **Interaction labels and prompts** on well, bin, bed and counter, the readable crop stages, and the larger cow.
- **Touch controls staying fully inside the viewport**, with all 10 buttons reachable.
- **The next-morning shipping payout,** which gives the nice "sleep to see what you earned" beat.
- **Save-on-hide and save-on-unload,** and the settings stored separately from the save.
- **The original art and the writing voice.** No branded names or assets.

## Next step

Start with the three correctness items. Fix `pickPlotTile` so the faced tile wins, add a `migrate()` step to `loadGame` that fills defaults and re-clamps animal and NPC positions, and add a New Game overwrite confirmation. Then do the phone layout pass, which is the largest visible weakness. Allow fractional scaling, move the HUD out of the play area, and check 390×844, 360×640 and landscape. After that, rebalance egg and milk against crops, make talking and a few of the promised rewards pay off in hearts, and fix the winter wilted-plot dead end. Commit the Playwright smoke test and a handful of pure-function tests as you go, so each change is checked. Do not touch the bilingual string structure, the `__farm` method names, the forgiving wilt rule or the touch buttons' on-screen placement.
