# CHANGELOG (English)

User-visible changes. Versions follow [SemVer](https://semver.org/).
Versions before 4.19.2 are documented in the Chinese [CHANGELOG.md](CHANGELOG.md).

## 4.27.2 · 2026-10-27 · English truncation fixes + comparison screenshots

- **Two truncations in the English UI**: the `Ledger` tab collapsed to `Ledg…` and the title
  `Azure Cloud Sword Immortal` to `Azure Cloud Sword I…`. The English title bar was tightened (padding 13→10,
  gap 18→12, title 12→11.5px, About 11→10.5px); measured `clientWidth = scrollWidth = 169`, both now fit.
- **All of `docs/img` re-shot as comparison images**: `hero-compare` (white/light vs ink/dark), `hero-lang`
  (中文 / English), `panel-compare`, `panel-look-compare`, `about-compare` — labelled, equal height,
  captured at 2× and trimmed to content.
- Removed the superseded images: `hero-shot`, `panel`, `panel-look`, `hero-white`, `hero-ink`, `about`,
  `about-dark`, `panel-dark`.
- `npm test` exits 0.

## 4.27.1 · 2026-10-27 · Breathing room between the status dot and "About"

- In 4.27.0 the dot sat right against `About` (10px visual gap, reading like its own bullet). The title bar
  now uses `gap:18px`; the About button lost its left padding so the gap is the only spacing, and the English
  rule that added `margin-left:8px` to the money span is zeroed out.
- Measured: dot's right edge to About's left edge is **18px** (was 10px), the panel stays 272px wide, and both
  languages agree.
- `npm test` exits 0.

## 4.27.0 · 2026-10-27 · About moves to the title bar, money becomes a status dot, About page rewritten

- **Entry point**: `About` moved out of the More tab into the **right side of the panel title bar**, taking the
  slot the balance used to occupy (the More row is gone).
- **Money → status dot**: the title bar no longer prints `¥12.34`; a 6px dot carries the same green / yellow /
  red states, still pulsing when critical. The amount moved into the tooltip
  (`余额 ¥12.34 · 低于告急阈值 ¥10`), and the reclaimed width pays for `About`.
- **About page rewritten** in three sections — `<能做什么>` (5 rows quoting the real 23 / 24 / 14 / 10 figures),
  `<好在哪里>` (4 rows) and `<怎么用>` (3 rows) — laid out as a three-column grid of
  "number + category + detail" so nothing is aligned with spaces (a font swap cannot break it), with a
  separate column width for English.
- The subtitle is now "ink and white outfits · English and Chinese · a DSH desktop widget": the earlier
  "白发双版本" was inaccurate (both outfits are white-haired; what differs is the robe) and so was
  "supports switching languages" (there is no language switch — it follows the host UI via `props.lang`).
- **Doc fix along the way**: `plugin/README.md` / `.en.md` told people to "hover and click `⋯` in the top-right
  corner"; the real control is the **talisman icon above his head** (a `<img class="xjj-tal">` showing the
  currently selected talisman). Both files corrected.
- Verified: light / dark / English screenshots; detect reports **0** on each (the English pass first tripped
  `wide-tracking` and two `tiny-text` findings — the window title's letter-spacing is now zeroed and the
  fine print raised to 12px); the title bar measures `hasMoney=false`, a 6×6 dot and a 272px panel.
  `npm test` exits 0.

## 4.26.0 · 2026-10-27 · New "About" window (with the tip QR)

- The More tab gained a row `About | About this plugin` between `Self-check` and `Version`. It opens a
  420px floating window that reuses the editor shell and follows the light/dark theme.
- Contents: title + version line → one-line intro → local-only note → "How to use" with three entry points
  → `MIT licence · art made in-house` → the tip QR block.
- **Tip QR**: `assets/about/donate-qr.webp` (448px lossless webp, 77KB) inlined through the `__DONATE_QR__`
  token and rendered at 200px; it keeps its own white card and 6px padding so it stays scannable on the
  dark theme.
- Copy (same wording as the WeChat appreciation prompt): 「微信扫一扫，赏本座一碗清茶」 /
  「打赏自愿，不换取任何功能，也不影响使用」 — the second line is the guard rail that keeps this inside
  WeChat's "personal, non-commercial" rule for appreciation codes.
- About body text is **12px** throughout (11.5px body copy trips the tiny-text rule); detect reports **0**
  findings on both themes.
- English kept in sync (14 new strings); both plugin READMEs gained a section.

## 4.25.0 · 2026-10-27 · Editor module boxes flattened so they read as a level below the line cards

- Why: 4.23.1 dismissed `nested-cards` as "intentional", and measuring proved that wrong — `.xjj-ed-line`
  and `.xjj-ed-box` shared the same fill `#FAF5EA`, the same border `rgba(90,70,30,.14)` and the same 8px
  radius. Three layers, one colour: structure without hierarchy.
- Fix: `.xjj-ed-box` fill → **transparent**, radius → 0, border → a **2px left rule**
  (`--xjj-control-border-4`), padding `6px` → `4px 0 4px 8px`. The line cards are untouched: they are
  click targets, and flattening them would remove the "this is selectable" cue.
- Re-measured: `nested-cards` 4 → **2**. The two left are "line card inside the floating window"; the window
  must be a card and the line card must stay clickable, so that one cannot be removed structurally and is
  now a known item.
- `npm test` exits 0.

## 4.24.0 · 2026-10-27 · Ledger / Sound / Look / Alerts tabs put through the same pass

Same routine (measure → report → decide → fix → re-measure) for the remaining four tabs:

**Group A · contrast and type size**
- Ledger search placeholder used the UA grey `#757575` (4.1:1 light / 3.6:1 dark) → now `--xjj-muted`
  (5.18:1 / 5.25:1).
- Ledger `.xjj-ret` body small print 11 → **12px** (11px body copy trips the tiny-text rule).
- Look-tab segment buttons: the root cause was **JS constants, not CSS** — `SEG_MD` 10.5px and
  `SEG_SM` 9.5px are inline styles, so editing `.xjj-seg-b` in CSS never reached them. Both constants
  now sit at **11px** (7 `undersized-ui-text` findings gone). Measured in English: the longest chip
  `Match theme` is 90px and the six backlight chips total 249px, still one line inside the 274px panel.
- The disabled "Apply" button used `opacity:.45` (**2.4:1**); it now uses muted text with a faint border
  on a transparent fill — still unclickable, but readable.

**Group B · hit areas**
- `.xjj-sw` toggles 38×20 → **40×24** (knob 14 → 16px, `on` offset 20 → 21px).
- `SEG_SM` padding 3/4 → 5/5px, segment height 20 → **27px** (≥24).

**Re-measured**: four tabs × light/dark = 8 runs, **7 clean**; the dark Alerts tab keeps 2
`buried-raster` findings (character sprite preloads at `opacity:0` — false positives, confirmed and left
alone). `npm test` exits 0.

## 4.23.1 · 2026-10-27 · Editor micro-labels 10 → 11px

- `.xjj-ed-s` (target / variant / row N / module N - text / line style / saved lines) 10 → **11px**, matching
  the floor used elsewhere; the detector's 9 `undersized-ui-text` findings are gone.
- **Nesting kept on purpose**: line cards inside module boxes are intentional (his call) and are not being
  flattened; a comment in the CSS records that, so the 4 `nested-cards` findings are a known, accepted item.
- `npm test` exits 0.

## 4.23.0 · 2026-10-27 · Editor: per-target reset, confirm strip, theme-aware colours

- **Reset is per target now**: it no longer wipes the whole queue. It restores only what the editor has
  open (the first bubble, or one variant of one queue item), looked up by `id` in `DEFAULT_CONFIG.queue`;
  if no match is found it does nothing rather than touching something else.
- **Confirmation**: clicking Reset first turns into an inline `Reset to default? [Confirm] [Cancel]`
  strip. Switching target collapses it, so a confirm can never land on the wrong bubble.
- **Theme-aware**: the editor used to hard-code a dark fill (`rgba(26,21,16,.99)`) even in the light
  theme. Shell, header, footer, line cards, module boxes and inputs now use `--xjj-ed-*` plus the shared
  semantic variables; measured light theme gives `#FFFDF7→#F4EDDD` with `#2A2418` text.
- Two contrast fixes along the way: the Confirm button was `#D46A6A` on `#E2D6BC` (**2.4:1**) and is
  now `#C41E1E` on the light control background; input placeholders used the UA grey (**4.1:1**) and now
  use `--xjj-muted`.
- Verified in Playwright on both themes: the first bubble and queue item #1 were both dirtied
  ("脏A" / "脏B"); Reset → Confirm restored only the first bubble to 「道 友 ， 请 留 步 。」 while the queue
  stayed "脏B"; switching to 「本座在此」 and repeating restored just that item. `npm test` exits 0.

## 4.22.0 · 2026-10-27 · More-tab buttons normalised; Reset moved into the editor

- The seven More-tab buttons now follow the table he gave: Dance / One lap / **Preview poses** /
  **Remind me** / **Edit bubbles** / **Copy path** / **Build / freshness**. The ellipsis
  (`visual editor…`) and the odd 7-character outlier are gone.
- "Bubble" used to take two rows (edit + restore); it is **one row now**, and **Reset** moved into the
  bubble editor's header, next to Close.
- Behaviour is unchanged: it still restores the first bubble plus the whole queue at once
  (`resetBubbles()` is hoisted from an inline arrow so both call sites share it); the only addition is
  `setEditor(null)` so the editor closes after the reset.
- Verified in Playwright: all seven rows in both languages, no clipped labels (widest:
  `产物 / 构建` 80px, `Build / freshness` 113px); the first bubble's first line was dirtied to
  "弄脏测试", then **Reset** in the editor was clicked and `localStorage` was read back showing
  「道 友 ， 请 留 步 。」.
- `npm test` exits 0.

## 4.21.1 · 2026-10-27 · Two More-tab buttons shortened

- "Watch a sword dance (24 frames)" → **"Dance"**; "Fly a lap on the blade (~6 s)" → **"One lap"**.
  The row labels already say Sword dance / Fly, so the buttons keep only the action and no longer repeat
  it; the frame count and duration in brackets are gone as requested (the numbers still live in
  `DANCE_FRAMES` and the README).
- English kept in sync; the entry descriptions in `plugin/README.md` + `.en.md` changed with them.
- Copy only, no behaviour change; `npm test` exits 0.

## 4.21.0 · 2026-10-27 · Bubbles: defaults now match what renders, no black shadow on light, hard noFloor floor

- Trigger: measuring the default bubble (the four lines you get by clicking the character:
  greeting / balance / today / peak) with the same deterministic rules reports **0 findings** on both
  themes — contrast 5.54–16.96:1, every line at 14px. The bubble itself was not broken.
- The real problem was in the **defaults**: `DEFAULT_CONFIG.style.fontSize` said 13 while the render floor
  raised it to 14; 14 default lines carried 10.5 / 11 / 11.5 / 12.5 / 13 / 13.5 yet all rendered at 14;
  the radius said 10 while the CSS said 13; `maxWidth` said 276 while the render forced 296.
  So the number in the editor and the number on screen disagreed.
- Fixed: defaults now equal what renders — bubble base size 13 → **14**, radius 10 → **13**
  (matching the CSS), `maxWidth` 276 → **296**; the 14 default lines are all **14**, with hierarchy
  carried by colour and weight instead of size (gold + 700 from the second line on).
- The light theme no longer draws a black text shadow (`rgba(0,0,0,.45)` smears 14px KaiTi on cream);
  the dark theme keeps it.
- `noFloor` lines now clamp at **11px** instead of 8.
- Follow-up in the same round: the self-check bubble measures 0 findings on light and dark
  (14px, contrast 6.0–16.96:1); a static sweep of the whole file finds 27 declarations below 14px and
  every one is caught by the 14px floor or the 11px noFloor floor. Three places that had copied a
  dark-only treatment onto the light theme are fixed as well: the chatter bubble's third colour
  `#EFD9B8` sat at **1.35:1** on the cream bubble (light now uses ink / gold / grey);
  the hard-coded black shadow on the first chatter line and the cyan/gold glow on
  "waiting for your answer / approval" are now `none` in the light theme.
- Verified by re-measuring: 0 findings per theme; `textShadow` measured as `none` on light and preserved
  on dark; `npm test` exits 0. Anything you prefer differently is yours to change in the bubble editor;
  edited values override these defaults.

## 4.20.0 · 2026-10-27 · Panel legibility: text floor, contrast, hit areas, nested card

- Trigger: the deterministic impeccable detector reported 21 findings on this panel in light × Chinese —
  17 pieces of 10.5px functional text, 3 contrast failures at 3.3–3.8:1, 33×22 tab hit areas,
  and a card nested inside the panel.
- **Type floor**: tabs 10.5 → 11.5px (English 9.5 → 11px); row labels 10.5 → 11.5px;
  small print / summary / model rows / detail rows / return line / mini buttons / inline editors
  9.5~10.5 → 11px; chart axis 9 → 11px.
- **Width** 252 → 272px so the enlarged six tabs keep their room. Measured in English:
  `Data / Ledger / Sound / Look / Alerts / More` all render in full
  (`scrollWidth ≤ clientWidth`, no ellipsis).
- **Hit areas**: tabs 33×22 → 36×28, stepper `−/+` 22×22 → 26×26, segment buttons 5 → 6px padding.
- **Contrast**: light `--xjj-muted` `#8A7B5E → #74674E` (3.87:1 → **5.18:1**; 4.75:1 at the
  gradient's far end, still passing). Dark `--xjj-text-dim` `#7D8B96 → #8B98A4` (5.25 → **6.23:1**),
  `--xjj-muted` `#6F7D8A → #7C8B98` (4.35 → **5.25:1**).
- **Nested card**: "Last 7 days" used to be a second card inside the panel (fill + border + radius);
  it is now a single top divider plus 8px margin.
- Verified by measuring the DOM in Playwright and re-running detect element by element:
  **all four combinations (light/dark × zh/en) report 0 findings** (21 before); `npm test` exits 0.

## 4.19.36 · 2026-10-27 · Fix: character slid out of the window when docked left and enlarged

- Root cause: `--xjx-shift` (the horizontal overflow compensation) is applied inside the scaled container,
  so the visual displacement is shift × scale — and **reversed when the widget is mirrored on the left**.
  The previous version treated shift as visual pixels, both when subtracting it and when storing the result:
  removing the offset used the wrong direction, so the "unshifted edge" was wrong; and when docked left,
  every step of the size control pushed the sprite further left — eventually fully out of the window.
- Now converted with `k = scale × mirrorDirection` and solved directly from the unshifted edges, with no
  incremental accumulation, so it cannot drift and does not rely on repeated passes to converge.
- Verified by measuring the DOM in Playwright across six combinations: docked left `31..157` at 1.0,
  `12..176` at 1.3, `6..207` at 1.6; docked right `1123..1249` / `1104..1268` / `1073..1274` — all inside
  the viewport (6px margin). Right-docked at 1.6 now ends at 1274 instead of 1266 (exactly on the margin;
  the old code over-shifted by 8px). `npm test` exits 0.
- Side note: this change tripped the i18n gate in `build.py` — straight quotes around Chinese text in a
  comment are treated as an untranslated string; switching to 「」 passes. The gate is right, the comment was not.

## 4.19.35 · 2026-10-27 · Fix: menu opened on the right when the character sat on the left

- The panel's horizontal position was hard-wired to `vw - 14 - panelWidth`, so with the character
  docked left (`ui.anchor='bl'`, or dragged to x<240) the panel still stuck to the far right edge,
  a full screen away from him (reported bug).
- It now follows the half the character is in: **left half → 14px from the left; right half → the
  previous 14px from the right**. Horizontal only — the vertical rule (10px above the talisman
  button) is untouched, and right-docked / side-by-side placement behaves exactly as before.
- Verified by measuring the DOM in Playwright, not by eye: `anchor=bl` gives the panel
  `[14,135,266,561]` with the character at `[6,620]`; `anchor=br` gives `[1014,135,1268,561]`,
  pixel-identical to before; `npm test` exits 0.

## 4.19.34 · 2026-10-27 · Docs fix: README still claimed white had no sword dance

- 4.19.33 gave the white outfit its own 24-frame dance, but both READMEs still listed "falls back to
  ink" under known limitations. Stale.
- Both languages now say the two outfits each carry a 24-frame dance, switching outfit switches the
  dance, and the two choreographies are close but not identical.
- `check-docs` D5 only looks for the outfit/backlight keywords, so it cannot catch "feature shipped,
  docs stale" — this was caught by hand.

## 4.19.33 · 2026-10-27 · White sword dance, 24 frames

- The white outfit used to fall back to the ink dance; it now has its own 24 frames (same
  choreography, sampled from a Jimeng clip → cut out → 520 high).
- `POSES_WHITE` gains `dance01`–`dance24`; playback picks the table by outfit, so no more fallback.
- `client.js` grows by roughly 1 MB (24 white frames inlined).

## 4.19.32 · 2026-10-27 · New artwork for the white "standing" pose

- The white idle now uses a new illustration (1080×1920 → cut out → 8% padding → 520 high,
  242×520).
- The old file is backed up at `assets/white-idle-old/idle.webp`.
- The padding step is mandatory: without it `box.top≈0` and the talisman button overlaps the head
  (learned the hard way in 4.19.31).
- `src/hitboxes.json` regenerated.

## 4.19.31 · 2026-10-27 · Tool-surface lock, two more fence mutants, audit-failure evidence

- Added `scripts/tool-surface.mjs`: pins the model-visible surface (tools / commands / skills) in
  `scripts/tool-surface.json`, estimating tokens as JSON characters of name+description+parameters / 4
  against a 4000 budget (same measure as IG5). Any new tool, or any edit to a tool description, turns the
  gate red until `--update` is run with a stated reason. `--selftest` injects a probe tool to prove the
  gate can actually fail — with zero tools today it would otherwise be trivially green.
  Not a new user-facing capability: the widget still registers no agent tools and spends no tokens.
- `test-teeth.mjs` gained M12 (allow forged Host) and M13 (allow non-loopback source). M1 only proved the
  `x-xjj-write` marker check; the other two write-fence checks had no teeth.
- A failed audit write is no longer silent: it now goes to `~/.dsh/.xjj-diag.log`
  (where / route / code / error) while the response still succeeds. Mirrors IG5's post-execute discipline
  in `source/approval_gate.js`.
- No config-format, route or front-end behaviour changes; the panel version line follows the build to 4.19.31.

## 4.19.30 · 2026-10-27 · Sword dance re-choreographed: 16 → 24 frames

- New choreography (opening / chop / lift / sweep / spin / closing, four beats each), taken from a
  10-second sword-dance clip generated in Jimeng, sampled at 2.4fps into 24 frames, cut out and
  scaled to 520 high.
- `DANCE_FRAMES` extended to 24, 130ms per frame, roughly 3.1 seconds; the button now reads
  "Watch a sword dance (24 frames)".
- The old 16 frames are backed up under `assets/v10-old16/`, not deleted.
- Known: frames 9–12 keep a faint ground-shadow residue (the video background was not pure white);
  it is barely visible at 520 high on the dark panel.

## 4.19.29 · 2026-10-27 · Docs: README covers outfit and backlight

- Both READMEs gained an "Outfit & backlight" section: the three outfit modes, the white set covering
  all 23 poses, the sword dance falling back to ink, the backlight colours and strength, and the
  `ui.outfit` / `ui.glow` / `ui.glowAlpha` keys.
- `check-docs` gained a fifth gate (D5): both READMEs must mention outfit and backlight, or it fails.

## 4.19.28 · 2026-10-27 · Structural cleanup (no behaviour change)

- Preference parsing collapsed: theme / outfit / glow used to be six lines inside Widget; they are now
  a module-level pure function `readView(cfg, scheme)` returning
  `{ themePref, isLight, outfitPref, useWhite, glowPref, glowAlpha, glowRgb }`.
- `GLOW_RGB` moved to module level instead of being rebuilt on every render.
- The glow rgb is resolved once in `readView` (following the outfit when `auto`), so `rootStyle` no
  longer branches during render.
- Segmented-button styles became `SEG_MD` / `SEG_SM`, shared by the theme, outfit and backlight rows.
- No behaviour change: CSS palette untouched, no file split, no state refactor.

## 4.19.27 · 2026-10-27 · Fix: "Off" did not turn the backlight off

- The alpha inside `@keyframes xjj-breathe` was hard-coded (.42 / .74), so it overrode
  `--xjj-glow-a` no matter what, and "Off" had no effect.
- Both frames now read `var(--xjj-glow-a, .65)`; the breathing only changes the blur radius (9→21px).
- The flight drop-shadow also read a hard-coded .78 and now uses the same variable.

## 4.19.26 · 2026-10-27 · Backlight is configurable on the Look tab

- New `ui.glow`: `auto` (default: purple on ink, red on white) / `purple` / `red` / `cyan` / `gold` /
  `none` (off).
- New `ui.glowAlpha`: 0.35 low / 0.65 mid / 0.9 high, three buttons.
- Two new rows on the Look tab; turning it off drives `--xjj-glow-a` to 0 so the silhouette glow
  disappears.
- 10 new copy entries in each language.

## 4.19.24 · 2026-10-27 · Pose parade no longer prints the pose name

- Clicking "Preview all poses" used to pop a `1/23 · Standing` bubble on every switch; it now just
  changes the pose, with no text.

## 4.19.23 · 2026-10-27 · Halo is now a silhouette glow

- The circular blob behind the character is gone (the `.xjj-glow` div and its radial-gradient rule);
  the sprite itself now carries a `drop-shadow`, so the light runs along the hair, sleeves and sword
  instead of forming a disc.
- Breathing moved to `@keyframes xjj-breathe`: blur 9→20px, alpha .42→.74, 5.4s loop.
- Flying cancels the breathing and uses a steady 22px / .78 glow.
- Colour still follows the outfit: purple for ink, red for white (`--xjj-glow-rgb`).

## 4.19.22 · 2026-10-27 · Halo radius 240 → 220

- `.xjj-glow` width/height 240 → 220 and margin-left -120 → -110 to keep it centred.
- Opacity unchanged at 0.65.

## 4.19.21 · 2026-10-27 · Fix: flight glow stayed cyan

- The glow on the sprite while flying comes from
  `.xjj-stage.is-flying .xjj-sprite { filter: drop-shadow(...) }` and was hard-coded to
  `rgba(123,234,255,.55)`, independent of `--xjj-glow-rgb`, so the halo change never reached it.
- Now `rgba(var(--xjj-glow-rgb),.62)`: purple for ink, red for white.

## 4.19.20 · 2026-10-27 · Halo radius 210 → 240

- `.xjj-glow` width/height 210 → 240 and margin-left -105 → -120 to keep it centred.
- Opacity unchanged at 0.65; only the footprint grew. Applies to both colours.

## 4.19.19 · 2026-10-27 · Red and purple halos both at 0.65

- `--xjj-glow-a` raised from 0.56 to **0.65** (shared by both colours); both variable blocks updated.

## 4.19.18 · 2026-10-27 · Deeper purple halo

- Purple: `160,120,220` → `148,92,238`, more saturated.
- Opacity pulled out of the hard-coded `.40` into `--xjj-glow-a`: purple **0.56**, red stays 0.40
  (only the purple moved).
- The radial-gradient now reads `var(--xjj-glow-a, .40)`.

## 4.19.17 · 2026-10-27 · Fix: white-robe halo stayed purple in light mode

- Cause: `.xjj-root.is-light` and `.xjj-root.is-w-robe` have equal specificity (0,2,0) and the
  light rule came later, overriding the red back to purple.
- Fix: add `.xjj-root.is-light.is-w-robe` (0,3,0) so light mode with the white robe wins.

## 4.19.16 · 2026-10-27 · Backlight colour follows the outfit (purple / red)

- The halo used to be a fixed cyan. It now follows the outfit: purple for the ink robe, red for white.
- Implementation: a `--xjj-glow-rgb` variable, purple by default on `.xjj-root` and overridden to red
  by `.xjj-root.is-w-robe`; the radial-gradient reads it. The root adds `is-w-robe` when the white
  robe is active.

## 4.19.15 · 2026-10-27 · Fix: white "Look up" was drawn looking straight ahead

- The 23 originals had no look-up shot (only a level-gaze `gaze`), so white `sky` was recoloured
  from that one.
- The user supplied a 1440×2560 look-up original; re-cut into the bundle at 245×520.

## 4.19.14 · 2026-10-27 · Fix: four wrong white pose images

- The originals were misnamed: `xjj-doze-hd2` actually showed the furnace, `xjj-forge-hd2` the money
  pouch, and `sword`/`wipe` were swapped.
- Rebuilt four from the originals the user downloaded and verified: doze, poor, forge, sword, wipe.
- The other 19 are untouched.

## 4.19.13 · 2026-10-27 · Fix: `sleep` fell back to ink under the white outfit

- `sleep` already reuses the doze image in the ink set (`sleep → doze`); the white table was copied
  from filenames and missed that alias, so under white the doze pose was white and `sleep` snapped
  back to ink. Added `sleep: __POSE_WHITE_DOZE__`.
- The 16-frame sword dance still has no white assets and keeps falling back to ink.

## 4.19.12 · 2026-10-27 · White outfit: 23 poses + three-step outfit switch

- White-palette assets: all 23 standing poses recoloured from the ink originals (editing prompt,
  colour-only), 1440×2560 originals, 520-high in the bundle.
- Recolour spec: moon-white robe, silver trim, pale ice-blue inner collar, white sash with silver
  pattern, ivory scabbard with silver clouds, ivory hilt with silver cord, white boots.
- New `ui.outfit`: `auto` (default: white by day, ink by night) / `ink` / `white`, overridable on the
  Look tab only.
- The white set has no 16-frame sword dance and no `sleep`; those fall back to ink
  (`Object.assign({}, POSES, POSES_WHITE)`).
- 4 new i18n entries (Outfit / Match theme / Ink / White).

## 4.19.11 · 2026-10-27 · Fix: flight facing reversed when docked left

- Root cause: flight facing was `baseScaleX * facing`, and `baseScaleX` already carried `mirror`
  (−1 when docked left). `facing` flipped it a second time, so the figure flew right while facing left.
- Fix: flight facing is decided by `facing` alone; `baseScaleX` no longer applies `mirror`.
  Static mirroring still comes from `--xm` and is unaffected.

## 4.19.10 · 2026-10-27 · Three-step widget theme (System / Light / Dark)

- New theme switch on the Look tab, **scoped to the widget only**: it never calls `setTheme`
  and never changes the DSH appearance.
- `ui.theme`: `auto` (default, follows DSH) / `light` (forced paper) / `dark` (forced ink).
- In a forced step, changing the DSH appearance leaves the widget alone; `auto` follows DSH.
- Default lives in `DEFAULT_CONFIG.ui`; `mergeConfig` already merges `ui` wholesale.
- 4 new i18n entries (Theme / System / Light / Dark).

## 4.19.9 · 2026-10-27 · Fix: first bubble line brightened into pale grey in light mode

- Root cause: `style.color = brightenColor(style.color)` re-brightened the just-resolved ink colour
  `#2A2418` in light mode. Only the first line was affected, because it has no colour of its own and
  inherits the root colour; the other lines carry their own colour and bypass the brightening.
- Fix: skip brightening in light mode.

## 4.19.8 · 2026-10-27 · Fix: colours stored in the config must follow the theme too

- Real root cause: `mergeConfig` keeps the user's `first` / `queue` verbatim, so line colours were
  **old hex values**, not the new variables. Changing the template to variables did nothing for
  bubbles already saved in the config — that is why the first two attempts failed.
- Fix: `resolveBub` gained a legacy map; in light mode the old pale colours
  (#F3E6C8 / #F5C24B / #9FE7F5 / #C9D3E0 …) are mapped to their dark counterparts by role.
  No config change, no data migration.

## 4.19.7 · 2026-10-27 · Fix: bubble text unreadable in light mode

- Root cause: bubble text used `var(--xjj-bub-*)`, but that variable did not resolve to the day
  value in light mode (the inline background is computed in JS, so the two sides drifted apart);
  `brightenColor` also pushed dark colours toward white, making things worse.
- Fix: every bubble colour is now resolved in JS from the scheme (`BUB_COLORS` + `resolveBub`)
  instead of relying on CSS variable inheritance; brightening is skipped in light mode.
- The three hard-coded peak/off-peak label colours got light variants too.

## 4.19.6 · 2026-10-27 · Fix: bubble stayed ink-black in light mode

- Root cause: the bubble background came from an **inline style** (`cfg.style.bg`, a dark gradient),
  which overrode the CSS `background:var(--xjj-bub-bg)`. The theme variable never had a chance.
- Fix: default background and text colour follow the theme (light → off-white with ink text);
  values the user explicitly changed are kept.
- The tail (`--xjj-bubble-bg`) follows `userBg`, so no black triangle is left hanging.

## 4.19.5 · 2026-10-27 · Bubble and talisman caption follow the theme

- **Bubble**: dropped the dark gradient and paper texture; switched to `--xjj-bub-*` variables
  (ink background with gold text at night / off-white with ink text by day). 36 inline
  `color:'#xxx'` values were replaced by variables.
- **Talisman caption**: `.xjj-tals-name` was hard-coded `#FFFFFF`, invisible on a light panel → `--xjj-text-2`.
- **The version line on the More tab** was pure white too; fixed as well.
- Bubble shadow and border moved into variables.

## 4.19.4 · 2026-10-27 · Theme following: day palette (rice paper)

- The panel follows DSH Settings → General → Appearance (light / dark) and switches immediately,
  without a reload.
- Wiring: `inject` gained `theme`; reads `ctx.theme.getTheme().active.colorScheme` (not `preference`,
  which may be `system`); subscribes to `theme/change`; the root node gains `is-light`.
- CSS: 78 hard-coded colours replaced by two `--xjj-*` sets — night = ink jade (unchanged),
  day = rice paper (off-white ground, ink text, deep gold).
- Contrast: day primary text `#2A2418` on `#FBF7EE` ≈ 13:1, secondary ≈ 5.5:1, gold `#A9761F` ≈ 4.6:1.
- **Known gap at the time**: bubbles and the bubble editor were still ink-dark (addressed in 4.19.6–4.19.9).

## 4.19.3 · 2026-10-27 · Daily budget steps by 5

- The old `[0, 5, 10, 20, 50, 100]` ladder became ±5 per click: 0 → 5 → 10 → 15 … capped at 100.
- Functional state update, so rapid clicks no longer lose steps.
- Step logic only; the stored key (`budget.daily`) is unchanged.

## 4.19.2 · 2026-10-27 · Fix: daily budget / line library "saved but not read back"

- **The bug was in `mergeConfig`, not in saving**: `budget` and `lineLib` were never merged.
  The POST had succeeded (the file really held `budget.daily: 10`), but the next load started from
  `DEFAULT_CONFIG`, so `budget` fell back to 0 and the UI showed "Off".
- Both branches (legacy migration and normal merge) now merge `budget` and `lineLib`.
- New `test-config-merge.mjs`: extracts `DEFAULT_CONFIG` / `mergeConfig` and runs the real function
  in a VM; 5 cases (budget survives, default 0, lineLib survives, legacy branch, other keys intact).
- Mutation check: removing the merge line turns 2 cases red (normal and legacy branches), exit code 1.
- New `npm run test:config`, wired into the `npm test` chain.
