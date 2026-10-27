# Azure Cloud Sword Immortal (dsh-jianxian-widget)

An always-on widget in the bottom-right corner of the DSH web UI: a white-haired, black-and-gold sword immortal.
He watches your balance, keeps the ledger, reminds you to sleep — and occasionally flies a lap around the screen.
One host plugin (8 routes, all on `webServer`) plus one pure front-end widget; **no agent tools are registered and no tokens are spent**.

> 中文版见 [README.md](README.md)。

| Item | Value |
|---|---|
| Version | **v4.27.2** |
| Poses | **23 standing poses** + **24-frame sword dance** |
| Talismans (menu button skins) | 14 |
| Sounds | 10, each with its own switch |
| Panel | 6 tabs (272 px wide) |
| Pop-up windows | Bubble editor (420 px), About (420 px, opened from the title bar), self-check |
| Data | `~/.dsh/` (host side; survives port changes and browser cache clears) |

---

## 1. Interface

### The widget

One character in the bottom-right corner, scalable 0.70–1.60×. **Drag = move** (snaps to a corner within 22 px on release); the position is written to config, so it returns to the same spot after a restart. Docked to the left edge, the sprite is mirrored horizontally (switchable).
Right-click the character, or hover and click the talisman icon above his head, to open the panel.

### Panel (6 tabs)

| Tab | Contents |
|---|---|
| **Data** | Balance, used today, turns today (with average per turn), latest charge, low-balance threshold, refresh now, last-7-days bar chart |
| **Ledger** | Today / last 7 days / all time; totals (¥ · turns · tokens), per-model share bars, per-turn details (date-time · model · amount), search, retention line |
| **Sound** | Master switch, volume slider, 10 individual sound switches |
| **Appearance** | 14 talismans, character size, bubble dwell 3–30 s, click bubbles, auto-mirror when docked left, back to bottom-right |
| **Notice** | Low balance → per-turn cost → question alert → approval alert → daily budget → wellness → late-night nudge → notice interval → chatter interval |
| **More** | Dance → **One lap** → Preview poses → Remind me → **Edit bubbles** → Copy path → Build / freshness → version (**Reset** sits in the editor header) |

### Two pop-up windows

- **Bubble editor** (More → Edit bubbles; **Reset** in its header, per-target and confirmed): pick target (first bubble / queue item / variant), add/remove lines with ↑↓, in-line modules (text / balance / today / peak-off-peak / random / image; ≤6 per line, ≤6 lines per bubble), line styles (size / colour / B / I / U), saved-line library (store / insert / delete), preview, save.
- **Self-check** (More → self-check): version, front-end bundle size, **whether the build lags behind the template**, today's ledger, current pending item. Data comes from `/xjj/about.json`.

---

## 2. Actions

### 23 standing poses

| # | Name | Key | Asset |
|---|---|---|---|
| 1 | Stand | `idle` | v7/idle.webp |
| 2 | Bow | `greet` | v12/greet.webp |
| 3 | Wipe the sword | `sword` | v7/sword.webp |
| 4 | Ride the sword | `fly` | v7/fly.webp |
| 5 | Read the jade slip | `ledger` | v7/ledger.webp |
| 6 | Shrug | `shrug` | v7/shrug.webp |
| 7 | Hand raised | `refuse` | v6/refuse2.webp |
| 8 | Sheathe | `bye` | v7/sheath.webp |
| 9 | Fist up | `win` | v8/win.webp |
| 10 | Cold anger | `angry` | v8/angry.webp |
| 11 | Empty the purse | `poor` | v8/poor.webp |
| 12 | Count spirit stones | `coins` | v8/coins.webp |
| 13 | Tend the furnace | `forge` | v4b/forge.webp |
| 14 | Doze | `doze` | v4b/doze.webp |
| 15 | Yawn | `yawn` | v12/yawn.webp |
| 16 | Offer tea | `tea` | v7/tea.webp |
| 17 | Meditate | `meditate` | v8/meditate.webp |
| 18 | Hands behind back | `back` | v7/back.webp |
| 19 | Look up | `sky` | v6/sky.webp |
| 20 | Stroll | `walk` | v6/walk.webp |
| 21 | Sip wine | `sip` | v11/sip.webp |
| 22 | Draw the sword | `wipe` | v11/wipe.webp |
| 23 | Stroke the chin | `chin` | v11/chin.webp |

> ⚠️ `sword` and `wipe` have **keys that are the opposite of their pictures** (`sword` is the sword-wiping pose, `wipe` is the blade-drawing pose). Display names follow the pictures, and the pointers have been swapped accordingly ("bring the sword" uses `wipe`, "keep the sword clean" uses `sword`). Do not read these two keys literally when editing config.

> `sleep` is **a state, not an extra pose**: at late night the character uses the doze picture (`v4b/doze.webp`), so there is no 24th image. That is why the pose count stays at 23 and the pose preview lists 23 items.

### Sword dance and flying

- **Sword dance**: 24 frames (`dance01`–`dance24`), More → Dance.
- **Flying**: two entry points — ① More → **One lap**; ② **click the character 5 times within 3 seconds**.
  Takes off from the current position → 1.35 laps around the screen centre → returns precisely to the same spot, about 6 s; cyan glow, ±7° bank, wind sound, **orientation flips with the direction of travel**; clicking the character or pressing lands it. Landing does not change the widget's real coordinates.

### When each pose appears

| Trigger | Pose |
|---|---|
| Default / hover | Stand / Bow (Empty the purse when balance is below threshold) |
| Task running | Tend the furnace |
| First click on the character ("Fellow Daoist, wait") | Bow |
| Click sequence reaches "bring the sword" | Draw the sword |
| 5 clicks within 3 s | **Fly a lap around the screen** |
| 3 clicks at late night (23:30–06:00) | Yawn + "stop clicking, go to sleep" |
| One late-night nudge | Yawn |
| Balance unreadable | Shrug |
| Long idle | Doze (late night: under the blanket = Meditate) |

The late-night 3-click bubble **fires only on the 3rd click and does not reset the counter** — keep clicking to the 5th and he takes off instead.

---

## 3. Notices and sounds

| Notice | Trigger | Switch |
|---|---|---|
| Low balance | Balance drops below threshold, once per day | `notice.lowBalance` |
| Per-turn cost | A turn ends; shows a "this turn" bubble | `notice.turnCost` |
| Question alert | DSH is waiting on `ask_user_question` | `notice.askWait` |
| Approval alert | DSH requests your approval | `notice.approveWait` |
| Daily budget | Today's spend reaches the budget, once per day | `budget.daily` (0 = off) |
| Wellness | Water / eyes / stretch / meals in rotation | `notice.wellness` + `wellness.everyMin` |
| Late-night nudge | 23:30–06:00, once per night | `notice.lateNight` |
| Chatter | One line every N minutes, never the same twice in a row | `chatter.on` + `chatter.everyMin` |

**Question/approval bubbles** use fixed styling: 15 px bright cyan `#7BEAFF` bold title with a glow, 14 px gold `#FFC247` body; the same pending item is announced only once (the front end polls `/xjj/wait.json` every 3 s and de-duplicates by `kind:id`).

**Sounds**: press / release / bubble / panel / talisman / cloth / wind / evening bell / alert / finish, each switchable, sharing one volume (0–1, default 0.5).

---

## 4. Bubbles

- Click sequence: the 1st click = first bubble, then the queue advances; at the end, another click dismisses.
- Modules: text / balance / used today / peak-off-peak / random line (weighted, no immediate repeat) / image.
- Styling is **line-level** (size, colour, bold, italic, underline, letter-spacing, line-height). Only lines with `oFloor: true` may go below 14 px (for secondary info such as the third line of a cost bubble).
- **Readability floor (enforced when rendering)**: font ≥ **14 px**; lightness < **0.82** is lifted; opacity < 0.92 is raised to 0.92; bubble width ≥ **296 px**. Your saved 11 px / dim grey are not rewritten — the floor only applies at render time.
- Background: `style.bg` (unset = built-in ink background; the bubble tail follows it). **If you switch to a light background, darken the text at the same time.**

---

## 5. Data and endpoints

| Route | Purpose |
|---|---|
| `GET /xjj/state.json[?refresh=1]` | Balance, used today, peak/off-peak, busy, last 7 days |
| `GET /xjj/turn.json` | Latest turn cost (`seq` increments; the front end bubbles on change) |
| `GET /xjj/usage.json?range=today\|7d\|all&q=` | Ledger page data (totals / per model / details / retention) |
| `GET /xjj/wait.json` | Pending question/approval |
| `GET /xjj/config.json` / `POST` | Read / write config |
| `GET /xjj/about.json` | Self-check |
| `GET /xjj/ping.json` | Liveness probe (for manual checks; not called by the front end) |

**Write fence**: `POST /xjj/config.json` requires ① header `x-xjj-write: 1` ② loopback Host ③ loopback origin, and same-origin when `Origin` is present. To administer from another machine: `XJJ_ADMIN_HOSTS=192.168.1.16:12824`.

| File (`$DSH_HOME`, default `~/.dsh`) | Purpose |
|---|---|
| `.xjj-state.json` | Ledger: used today / turns / tokens / model mix, per-turn details, daily rollup, `turnSeq` |
| `.xjj-config.json` | Bubble and appearance config |
| `.xjj-usage-archive.json` | Per-turn details evicted from the main ledger (max 20,000) |
| `.xjj-post.log` | Config write-back diagnostics (reopened when > 200 KB) |

**Model display names**: deepseek-flash → DeepSeek-V4.1-Flash, deepseek-v4-pro → DeepSeek-V4 Pro (display only; the API and the ledger keep the ids).

**Billing**: summed from the model's real usage; cache writes are charged at the miss price; reasoning tokens are already inside output and are not counted twice.
Prices (CNY per million tokens, `[off-peak, peak]`): Flash hit 0.02/0.04, miss 1/2, output 4/8; Pro hit 0.15/0.30, miss 4.5/9.0, output 13.5/27.0.
Peak windows: weekdays 9–12 and 14–18; weekends and the statutory holidays listed in `PEAK_HOLIDAYS` are off-peak all day.

---

## 6. Configuration

`~/.dsh/.xjj-config.json` — default presets are written on first run and saved back automatically when you change the panel.

```jsonc
{
  "version": 10,
  "style":   { "bg": "linear-gradient(180deg,rgba(20,22,25,.985),rgba(7,8,10,.985))",
               "color": "#F3E6C8", "fontSize": 13, "radius": 10, "maxWidth": 276 },
  "sound":   { "on": true, "volume": 0.5, "press": true, "release": true, "turn": true,
               "bubble": true, "panel": true, "pick": true, "alert": true,
               "cloth": true, "wind": true, "bell": true },
  "warn":    { "balanceLow": 10 },
  "budget":  { "daily": 0 },
  "chatter": { "on": true, "everyMin": 10 },
  "wellness":{ "everyMin": 30 },
  "notice":  { "lateNight": true, "lowBalance": true, "turnCost": true,
               "wellness": true, "askWait": true, "approveWait": true },
  "bubbleOn": true,
  "bubbleHoldSec": 3,
  "ui":      { "scale": 1, "anchor": "br", "dx": 6, "dy": 10, "mirror": true,
               "talisman": "seal", "x": null, "y": null },
  "texts": {
    "lowBalance": "灵石不多了（{v}），省着点用。",
    "lateNight": "子时了。剑也该归鞘，你也该睡了。",
    "lateNag": "别点了，去睡。",
    "fly": "御剑去看看。",
    "turnTitle": "本轮消耗",
    "turnCost": "-{cost} · {tokens} tok",
    "busy": "炼丹中……别催。",
    "waitAsk": "东家，{session}在等你答话。",
    "waitApprove": "有件事要你点头（{session}）。",
    "budget": "今天已经用掉 {v}，到预算 {cap} 了。"
  },
  "lineLib": [],
  "idle":  [ { "text": "剑在鞘中，也在心里。", "pose": "idle" } ],
  "first": { "lines": [ /* line = { style, modules } */ ] },
  "queue": [ { "id": "present", "title": "本座在此", "pose": "greet",
               "variants": [ { "weight": 2, "lines": [] } ] } ]
}
```

Placeholders: `{v}` `{bal}` `{today}` `{todayRaw}` `{turns}` `{avg}` `{last}` `{label}` `{next}` `{window}` `{cd}` `{day}` `{cost}` `{tokens}` `{session}` `{cap}`.

---

## 7. Verification (three layers)

```sh
cd _tools/jianxian-widget
npm test        # copy → i18n → config → surface → audit → two guard suites → geometry → 11 mutants, about 1 minute
```

| Layer | Command | What it proves |
|---|---|---|
| Pre-checks | `npm run test:copy` / `test:i18n` / `test:config` / `test:surface` | Copy consistency, translation coverage (source + built bundle), config-merge coverage, structural completeness. If this layer fails, the rest is not worth running. |
| Static audit | `node audit-teeth.mjs` / `--selftest` | Guards still have teeth (no always-true assertions / no log-only assertions / no missing red exit / no zero-reference checks) |
| Logic guards | `node test-routes.mjs` (45 assertions), `node test-billing.mjs` (28) | Write fence, pending state machine, ledger, archive, billing, build freshness |
| Teeth acceptance | `node test-teeth.mjs` | After 11 mutants break copies, the guards must **go red and hit the expected label** |

To make a front-end change take effect: `python build.py` → **Ctrl+F5** → check the version on the More tab. If the version did not change, the new bundle is not loaded yet.

---

## 8. Development rules

1. **Edit only the source**: `src/client.template.js` → `build.py` produces `plugin/client.js` (assets inlined as data URIs). **Never hand-edit the artifact.**
2. **Host changes require a client restart** (`plugin/index.js`); pure front-end changes only need a page refresh.
3. **Bump the version on every change** (`plugin/package.json` plus the panel version line); report by version number.
4. **Poses may only change through `setPose`**: it wraps a hard guard — **while flying, only `'fly'` is allowed and everything else is blocked**. Any new "change pose on a timer" logic must check `flyingRef.current` first; do not rely on callers being disciplined.
5. Test hook: `XJJ_TEMPLATE_FILE` overrides the template path, used only by the guards to simulate "template newer than artifact".
6. Assets: pose images and sounds are generated locally and stored in `assets/`; the generation scripts are dev tools under `tools/` and are not published with the package.

---

## 9. Known limitations

- **UI language follows the DSH language setting** (Chinese / English); there is no separate switch. The translation table is `src/i18n/en.json`.
- **Flying duration (6 s) is hard-coded**; the click window is fixed at 3 s (the late-night 3-click nudge is separate).
- Bubble styling is **line-level**, not per-module; to reorder modules you have to delete and re-add them.
- The editor has no drag-to-reorder (use the ↑↓ buttons); random modules are stored with weight 1, so raising a weight means editing the JSON.
- `sword` / `wipe` keys are inverted relative to the pictures (see section 2).
- A light bubble background makes text hard to read — the renderer is tuned for dark; change `style.color` manually.
- Balance comes from `DEEPSEEK_API_KEY` first and falls back to the DSH account session; the two have different ledgers, so switching source restarts the day's numbers.

---

## 9.5 Web edition (same front end, another shell)

Usable outside DSH as well: `python build.py --target web` emits `dist/xjj.user.js` from **the same template**; install it in Tampermonkey and the character appears in the bottom-right of ordinary web pages.

- Shared: 23 poses / 24-frame dance / 14 talismans / 10 sounds / bubbles / panel / notices / peak-off-peak;
- Degraded: balance, used today, ledger, per-turn cost, question/approval alerts (only the DSH host has these data sources; the web edition shows `—`);
- Config lives in `localStorage` (per site), and `src/host.web.js` re-implements the six `/xjj/*.json` endpoints.

Details and limits: [`../docs/userscript.md`](../docs/userscript.md).

---

## 10. License

Code is **MIT**; pose images, talisman icons and sounds are **not** under MIT — using them with the plugin as-is is fine, extracting and redistributing them alone is not.
Both licenses are in the repository root: `LICENSE` and `LICENSE-ASSETS`; provenance is described in `NOTICE.md`.






