# Claude review R2 — Farm Days

I read the code at 0ef7e22 and the r3 screenshots. I did not run anything. Playwright results below are the implementer's, not mine.

## Verdict

The R1 P0 and P1 items landed, and the code supports the claims. The three bugs that hurt most are fixed:

- **Aiming:** the faced tile wins over the underfoot tile.
- **Saves:** they migrate and are versioned.
- **Phone layout:** the touch buttons are unclipped.

The economy now has gold sinks and the calendar warns about late planting. This is noticeably more ship-worthy, and I'd call it a shareable alpha.

What's left is mostly polish:
- Layout dead space on phones, especially landscape.
- Cocoa has no use.
- Chest, NPC and debug leftovers.

I found no new P0 bugs.

## What was fixed well

- **Aiming (`actions.js:83`):** `pickPlotTile` takes the faced tile if it is soil and falls back to the underfoot tile otherwise. `aimTile` shares it, so the highlight matches what the tool hits. Till, plant, water and harvest all go through it. `tests/unit.test.mjs` covers the stand-on-A, face-B case.
- **Saves (`save.js`):**
  - `migrate()` accepts v1 and v2, then fills missing fields from `createState`.
  - It merges `upgrades`, `hearths` and `rewards`.
  - It pads the inventory.
  - It clamps animals into their pens with `clampAnimal`.
  - It repairs NPC waypoints.
  - It rejects malformed saves with `null` instead of throwing.
  - `saveGame` writes `v:2` and strips transient UI state.
- **Save triggers:**
  - It saves on sleep, passout and every upgrade purchase.
  - It also saves on `visibilitychange` and `beforeunload` (`main.js:161`), so a closed tab doesn't lose the day.
- **New Game guard:** `ui.js:150` shows the confirm when a save exists, and the strings are bilingual.
- **Hearts and rewards (`actions.js:512-560`):**
  - Hearts change in half steps and cap at 5.
  - Talking once per day gives half a heart, and `talked` resets in `endDay`.
  - `grantVisitReward` fires once at 4 hearts and is flagged in `rewards`.
  - If the bag is full, the reward is not marked as given, so it retries on the next talk.
- **Wilt and season rules:** `clearWilted` works in any season. `till` refuses on a living crop, and winter blocks only fresh tilling. Crops that can't finish before the season turns wilt at rollover.
- **Calendar and planting (`calendar.js`, `actions.js:218`):** `lastSafePlantDay` is correct (`28 - days + 1`). The calendar shows it, and a late plant gets a toast.
- **Economy:** egg 35 and milk 90, with the 125 G payout confirmed. Crop prices scale sensibly. By my arithmetic the gold per growing day is roughly flat, about 24 to 28 per tile-day, so no crop is a trap. The coop roof (1400) and window box (900) are visible sinks. The shop sells winter cocoa, and the shop stock `shop.js` is clean.
- **Tests:** `tests/unit.test.mjs` is a real Node test with a `localStorage` shim, not a smoke script.

## Remaining bugs and gaps

1. **Portrait phone layout (`r3-phone-farm.png`):**
   - About 40% of the screen above the HUD is empty. The HUD, canvas and controls are stacked at the bottom.
   - In the HUD, the date truncates to `春··` and `200金` wraps onto two lines.
   - A narrower HUD font or two rows would fix both.
2. **Phone landscape (`r3-phone-landscape.png`):**
   - The canvas is roughly 285 px tall in an 844×390 viewport, with large side margins.
   - The hotbar sits under the canvas and the d-pad and A/B sit far out at the edges.
   - Nothing is clipped, but the farm is small. Floating the controls over or beside a bigger canvas would help.
3. **Cocoa has no purpose.**
   - It costs 30 and sells for 18, and nothing consumes it (no `eat` or energy restore in `actions.js`).
   - It is only a gift item.
   - A winter shop line that loses money, with no explanation, looks like a bug to a player.
4. **The "last safe plant day" assumes you water every day.**
   - Growth only advances on watered days.
   - A plant on the last safe day that misses a watering still wilts at the season turn, with no extra warning.
   - The wording "can still finish" is optimistic.
5. **Coop roof and window box are cosmetic only.**
   - The `coop` flag only changes the barn drawing (`render.js:110`).
   - The `hearth` flag only draws the fireplace in the house (`render.js:100`).
   - That is fine as a sink, but the shop descriptions should say so. Better still, give each a tiny perk.
6. **Claimed but skipped (P2), still true:**
   - The chest opens the bag.
   - NPCs have no collision.
   - `window.__farm` is always exposed.
   - Some strings are unused.
   - `mood` is written but does nothing.
7. **`package.json` has no `test` script.** The tests exist, but nobody will run them by habit.
8. **The save key is still `farm-days-save-v1`** while the payload is v2. That is harmless, but a v1-only build loading a v2 save would fail quietly. Note it in the README.
9. **Hua's reward is chosen at talk time** (`rewardItem`, `actions.js:517`). A winter reward is cocoa and a spring reward is a seed, which is odd if the player is mid-season. This is minor, but the toast should name the item clearly.

## Prioritized fixes

1. **P1: Portrait layout.**
   - Anchor the HUD and play view to the top, or center the whole stack vertically, so the dead band disappears.
   - Shorten the HUD so the date and gold don't truncate or wrap at 360 and 390 widths.
2. **P1: Landscape layout.**
   - Enlarge the canvas to the available height.
   - Put the d-pad on the left and A/B on the right, overlapping the canvas edge or in side gutters.
   - Keep all 10 buttons on-screen at 844×390 and 667×375.
3. **P1: Give cocoa a use.**
   - Either make it drinkable (restore some energy, bound to A while it is selected), or sell it for at least 30.
   - A drinkable cocoa is the cozy option.
4. **P2: Caution text on the safe-plant warning.**
   - Add a line like "needs watering every day" to `toast_late_plant` and the calendar row.
5. **P2: Small perks for the sinks, or honest descriptions.**
   - Coop roof: for example, eggs sell for slightly more, or chickens stay happy in rain.
   - Window box: a decorative flower with a heart bump.
   - Either way, make the shop text say what the item does.
6. **P2: `npm test` script** (`node tests/unit.test.mjs`) and a README line on running it.
7. **P2: Chest gets its own storage.** Alternatively, remove the chest tile and its sign.
8. **P2: Gate the debug surface.**
   - Keep `window.__farm` but expose the mutating methods only with `?debug`.
   - Keep the read-only ones, since the tests use them.
9. **P2: NPC collision.** Make NPCs block the player's movement so the player stops walking through them.
10. **P2: Remove unused strings and the unused `mood` field.** Avoid breaking migration when you do this.

## Suggested features

- A rain-day cozy touch: a short "rain" line from an NPC, or a bonus for talking indoors.
- A weekly shipping summary on the morning toast, or a small "best day" counter on the calendar.
- A small season-change festival: one tiny scene or a one-time item, no timers.
- Photo-style screenshot hotkey with the HUD hidden.
- A heart-level display on NPCs when talked to, since half hearts are now meaningful.

## What to keep

- **`window.__farm` API:** every existing method name and its return shape. The Playwright tests rely on them, and `__farm` logs the swallowed errors.
- **Bilingual strings:** every `STR` entry keeps both `zh` and `en`. New text must be added in both, and `new_confirm` stays.
- **Aiming rule:** the faced tile wins, and the underfoot tile is used only if the faced tile isn't soil. `aimTile` must keep sharing `pickPlotTile`.
- **Wilt rules:**
  - `dry >= 2` wilts a crop.
  - A crop that can't finish by the season turn wilts.
  - Wilted plots can be cleared in any season.
- **Touch buttons:** all 10 must stay on-screen at 390×844, 360×640 and 844×390.
- **Saves:**
  - `migrate()` and v2 saves, with v1 still readable.
  - `clampAnimal` and the `PEN` bounds.
  - Saving on sleep, passout, upgrades, `visibilitychange` and `beforeunload`.
- **Economy numbers:**
  - Egg 35 and milk 90.
  - Crop sell prices and seed prices.
  - Coop roof 1400 and window box 900.
  - Sprinkler 680, can 420, bag 360.
  - Don't change these without a play-through reason.
- **Social rules:**
  - Half a heart per daily talk.
  - The 4-heart reward fires once.
  - Hold-repeat applies only to hoe and can.
  - Shop ×1/×5/×10.
  - Clamped nameplates.
  - Panel routing.
- **Tests:** `tests/unit.test.mjs` stays green.

## Next step for the coding agent

Do one layout pass first. In portrait, remove the empty band above the HUD and make the HUD text fit without truncating or wrapping. In landscape, enlarge the canvas to the available height and move the d-pad and A/B to the sides, then re-run the 390×844, 360×640, 844×390 and 667×375 button checks. In the same pass, give cocoa a drinkable effect (or a sell price of at least 30), add the watering caveat to the late-plant toast and calendar, and add an `npm test` script. Leave the settled items alone: aiming, `migrate`, wilt rules, `__farm` names and the economy numbers. Then, if there is time, take the P2 cleanup items: chest storage, NPC collision, `?debug` gating, and the unused strings and `mood`.
