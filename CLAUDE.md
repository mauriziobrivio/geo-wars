# CLAUDE.md — Kontinue? Games / "Geo Wars" project

Read this top to bottom and you know where we are, what we're building, how to build
it, how to test it, and how to ship it. Keep it current: **whenever a game ships, a
mechanic changes, or a house rule is learned, update this file in the same commit.**

---

## 1. What this is

**Kontinue? Games** — a retro browser arcade of small, voxel-styled tributes to the
owner's early-gaming favorites. Owned by **Brivio Advisory OÜ** (Estonia), run by
Maurizio (GitHub `mauriziobrivio`, world-board tag **MRH**). Goal: pocket money via a
nostalgia catalog (tip jar live; portals later), one small game at a time, all carrying
the studio brand. Target audience: 30–50 year olds ("oh man, I remember this!").

Naming rules: the studio carries the "?" (**Kontinue?**); **game names never do**.
All game names must be non-trademarked originals (tributes, not clones by name).

- Live site: **https://kontinue.games** (domain at Porkbun, ALIAS → GitHub Pages)
- Repo: **github.com/mauriziobrivio/geo-wars** — `git push` to `main` **= deploy**
  (GitHub Pages serves the repo root; `CNAME` file holds the domain)
- Local folder: `/Users/cosmoalex/Desktop/Geo Wars`

## 2. Repo layout

```
index.html        ← arcade LANDING PAGE (cards, ticker, Hall of Fame marquee)
neonstorm/        ← NEONSTORM  (Geometry Wars tribute, twin-stick shooter)
pulsar/           ← PULSAR     (Frequency/Amplitude tribute, rhythm/track shooter)
ricochet/         ← RICOCHET   (Arkanoid tribute, block-breaker)
neonstorm.jpg / pulsar.jpg / ricochet.jpg   ← card thumbnails (1000px JPEG)
CNAME             ← "kontinue.games"
README.md         ← public readme (§9 below mirrors it — keep both in sync)
supabase/         ← IaC for the backend: migrations/*.sql + functions/*/index.ts
                    (suggestion box — deploy via Supabase MCP or `supabase` CLI)
.claude/serve.js  ← local static server, port 8741, + POST /save for screenshots
CLAUDE.md         ← this file
```

**Mobile/touch:** every game detects a coarse pointer (`matchMedia('(pointer:coarse)')`
or `ontouchstart`), adds `body.touch`, and shows on-screen controls (`.touchonly`
elements). Game viewports are zoom-locked (`maximum-scale=1, user-scalable=no`);
the landing page is **not** (it's a normal scrollable page).

Every game is **one self-contained HTML file, zero dependencies, no build step**.
Canvas 2D + hand-rolled voxel renderer + WebAudio synthesis. localStorage is
per-origin (kontinue.games), so scores survive path moves within the domain.

## 3. The three live games (state: 2026-06-13)

### NEONSTORM (`/neonstorm/`)
Twin-stick voxel arena shooter. Ten enemy types via a credit-based spawn director
(commits to patterns, saves credits, pressure floor, wave bursts — naive greedy
spending caused the "only 1 enemy ever" bug). Three bosses rotate and scale per
generation (snake longer/faster/more HP; singularity larger/stronger). Gravity wells:
inverse-square-ish curve — brutal up close, gentle far. Economy: extra ship 200k,
extra bomb 300k. Gamepad + rumble, works in menus too. Debug object: `window.GW`
(bot, spawn, boom, state…). World leaderboard live. **Touch:** dual dynamic virtual
sticks — left half = move, right half = aim+fire — feeding the same `pad`-equivalent
path via a separate `touch` object (OR'd into movement/`aimPoint`/fire so `pollPad`'s
per-frame reset can't clobber it); BOMB + pause buttons; tap-to-cycle tag entry.
(Watch the TDZ: the touch block runs at module-eval time, *before* `const EL` is
declared near the bottom — it uses a local `gid()` instead.)

### PULSAR (`/pulsar/`)
Rhythm/track shooter. 5 instrument lanes (DRUMS/BASS/LEAD/SYNTH/FX), each with **3
sub-lanes** on HARD played LB=left / **RB=MIDDLE** / **RT=RIGHT** (user's deliberate
choice; keyboard J/K/L), lane-switch via arrows/A/D or D-pad/A/B. Phrase-capture
unmutes a stem (ghost mix 12% lowpassed until captured). Combo chains captures
across tracks; capture-progress ring around the ship. Difficulties set sub-lane
count (1/2/3) + note stride. Two original synth tracks (IGNITION 126 BPM, EVENT
HORIZON 100 BPM) **plus a built-in ProTracker .MOD engine** (`parseMOD`/`renderMOD`/
`modToComp`) — renders each channel to its own buffer so capture muting works per
lane; chart extracted from note triggers. User sources .MODs from modarchive.org
(license filter: CC0/CC-BY/commercial-OK only; NC/SA are traps). MOD runs stay on
LOCAL boards only ('mod:NAME' keys); synth tracks submit to the world board.
Debug object: `window.PL` (setClock, bot, diff, startMod…). **Touch:** bottom bar —
lane ◀▶ (`move ±1`) + sub-lane hit buttons (`fireCol 0/1/2`), button count synced
to the difficulty's `cols` via `syncTouchCols()`; touchstart (not click) for low
latency; canvas center-fire is suppressed when `TOUCH`.

### RICOCHET (`/ricochet/`)
Block-breaker. 10 sectors as 13-wide ASCII grids in `LEVELS` (digits 1-7 = colored
bricks hp1; `D` silver hp2 with visible crack; `X` steel indestructible; `B` bomb —
chains via `chainQ`). Bricks render via per-type sprite cache (`brickSprite`,
rebuilt on resize). Capsules: good W/T/L/S/E vs **bad N/F/X** (red, pulsing, ~38% of
the 26% drop rate — dodge them; NARROW shrinks paddle, FAST ×1.5 speed, BOMB ☠
steals a ball). SPLIT splits ALL live balls (cap `MAX_BALLS=9`). **Ball speed scales
with the live combo** (`×(1+min(combo,26)·.028)`, up to +73%) — combo resets on
paddle touch. Laser: gradient bolts, muzzle flash, recoil, shake, impact bursts.
Stall rescue: 30s without a break → free laser "SUPPLY DROP". Anti-lock nudges on
BOTH axes (pure-vertical ping-pong was a real trap). Mouse smoothed (0.78 sens +
soft follow via `mouseTX`/`usingMouse`); keyboard 620 px/s (user-approved feel).
Sub-stepped ball physics (no tunneling); paddle-offset deflection ±60°.
Debug object: `window.RC` (start, bot, skip(n), clearLevel, win, die, drop(type),
source('world'), stats…). World leaderboard live. **Touch:** drag anywhere to move
the paddle (absolute: `mouseTX = (touchX-ax)/sc`, finger under the paddle — no 0.78
bias), tap to launch/fire laser (`fire()`), tap to resume from pause; pause button +
tap-to-cycle tag entry. Open: more sectors / difficulty tiers / feel-tuning per user
playtests (touch feel included).

### Landing page (`index.html`)
90s/2000s web aesthetic: cabinet marquee, CRT scanlines, starfield, LCD visitor
counter, webring, ticker ("3 GAMES ONLINE NOW"), 3-up auto-fit card grid, coming-
soon strip, the **HALL OF FAME marquee** (`#hoftext`) — fetches top-3 from all
three score tables via anon REST, doubled-content -50% CSS loop, graceful "BE THE
FIRST" when a board is empty — and the **TIP JAR coin door** (`.coindoor`, above
the footer) — and the **SUGGESTION BOX** (`.suggest`, between the coming-soon strip
and the coin door): a moderated community idea box. Submit form (optional 3-letter
tag + category + 280-char idea) POSTs to the `submit-suggestion` edge function;
right pane shows the **curated feed** (anon REST, `approved=eq.true` only —
graceful "jar's empty" state). New suggestions land hidden; you flip `approved`
(and optionally `pinned`) on the good ones for them to appear. When adding a game:
new card (`.card.xx` hover color variants), thumbnail jpg at root, ticker text, Hall
of Fame fetch + `seg()` call, an exit pill *inside the game* (`#exit`, shown when HUD
is off) and a tip pill (`#tip`, same visibility, top-right, in the mousedown guard).

### Tip jar
Stripe Payment Link on the Brivio Advisory Stripe account (`acct_1RoUjSHMdwHMd3yH`),
"customers choose what to pay". Live link: `https://buy.stripe.com/fZubJ1bAfb1q1WF52l2Ry05`.
The same `buy.stripe.com` URL appears **4×**: landing `.coinslot` + the `#tip` pill
in each game — swap all with one sed over `grep -rl 'buy.stripe.com'`. **Copy rule:** "INSERT COIN" always means *play*
(card buttons, select header, HOF empty states) — money UI says **TIP JAR**;
never reuse INSERT COIN for payments. Tip pills are mouse/click-only (deliberate:
an outbound link has no business on the gamepad path).

## 4. Supabase backend (world leaderboards)

Project **TaleTree** — ref `artypnnxsdovgmsznlbg` (repurposed unused project; its
old schema was cleaned). Pattern per game (authless arcade boards, hardened):

| Game | Table (public SELECT via RLS) | Edge function (does the INSERT) |
|---|---|---|
| NEONSTORM | `geo_wars_scores` | `submit-score` |
| PULSAR | `pulsar_scores` | `submit-pulsar-score` |
| RICOCHET | `ricochet_scores` | `submit-ricochet-score` |
| Suggestion box | `suggestions` (SELECT **`approved=true` only**) | `submit-suggestion` |

Plus per-game `*_submissions` rate-limit ledgers (RLS deny-all: enabled, no
policies — the "RLS Enabled No Policy" advisor INFO on them is **intentional**).
`suggestion_submissions` is the same kind of ledger.

**Suggestion box** (community ideas, same hardening as the score boards): the
`submit-suggestion` fn validates an optional 3-letter tag, a whitelisted category
(GAME/FEATURE/FIX/OTHER) and a 4–280-char body, sha256 per-IP rate-limits (8/hr),
and inserts with `approved=false`. The public feed RLS only exposes approved rows,
so **nothing user-typed shows on the site until Maurizio flips `approved`** (and
optionally `pinned`) via the dashboard/MCP — moderate before it's visible. SQL +
function checked into `supabase/` (the score boards were deployed straight through
MCP and never checked in; these are in the repo because they were first authored
without MCP access). **Deployed + verified 2026-06-13** (migration `suggestions_box`,
edge fn `submit-suggestion` v1, `verify_jwt=false`): adversarially tested — valid
submit 200, bad category / over-length / bad tag all 400, forged direct anon insert
bounced 401 (RLS), public feed returns approved-only; test rows scrubbed. If the
backend is ever down the box degrades gracefully (feed "box is empty", friendly
retry on submit).

Edge functions: shape validation (3-letter A-Z tag), plausibility ceilings
(Ricochet: score ≤ 2M, sectors 1-10, combo ≤ 400; Pulsar: per-diff score ceilings,
whitelisted song/diff/grade), per-IP sha256 rate limit (12/hour), service-role
insert, returns world rank. Direct REST writes bounce off RLS (verified with forged
inserts). Honest caveat: plausible forgeries remain possible — accepted trade-off
for no-login play.

The **anon JWT is embedded in each game's source and the landing page** (safe by
design — anon role can only SELECT):
`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFydHlwbm54c2Rvdmdtc3pubGJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjc1NTQsImV4cCI6MjA5MDY0MzU1NH0.daE4ZNhyIM22l3tAR6EeQVcmDT8QEuDlosoPzgXiEkQ`

In-game UX: scores screen has LOCAL/WORLD tabs (`#srclocal`/`#srcworld`, ↑↓ keys,
D-pad, or click); submit fires on results (deferred to tag-commit when the score
qualifies for the local top-10); "WORLD RANK #n" banner on success; 30s world-cache;
7s fetch timeout; offline degrades silently to local. Manage via the Supabase MCP
tools (`apply_migration`, `deploy_edge_function`, `execute_sql`, `get_advisors`).
**Always delete test rows after testing** (`delete from ... where tag='XXX'`).

## 5. How to test (the established methodology)

- Server: `node ".claude/serve.js"` (or `preview_start`, name "geo-wars") →
  **http://127.0.0.1:8741/** — `localhost` does NOT resolve in the preview browser;
  external https is blocked there too (verify production with `curl` instead).
  python3 http.server is sandbox-blocked; use the node server.
- Hidden preview tabs don't run rAF → **drive the sim manually**: each game exposes
  a debug object (`GW` / `PL` / `RC`) with a bot; loop `update(1/60)` in
  `preview_eval` for deterministic headless play (4 sim-minutes ≈ 20ms real).
- Before screenshots of staged scenes set `paused = true` (and zero `flashA`/
  `shakeT` if you want clean colors). A frozen fake clock with the live rAF loop
  running marks Pulsar notes missed — pause first.
- Mute before bot runs (`toggleMute()`), neuter `togglePause` if driving updates
  while hidden (visibilitychange auto-pauses).
- Thumbnails: stage a lively frame, then POST a canvas dataURL to
  `/save?name=ricochet.jpg` (serve.js writes it to the repo root at 1000px wide).
- **Stop preview servers when done** — a live preview page once kept playing music
  after the game window closed ("phantom music").
- After every push: `curl -s https://kontinue.games/<path>/ | grep <marker>` until
  Pages deploys (usually < 1 min), then spot-check live.

## 6. House rules (hard-won — do not relearn these)

1. **Auto-bank scores at game over.** Tag entry only *renames* the already-saved
   row (via a pending timestamp). Escape during entry must never lose a score.
2. **Storage probe + in-memory fallback** (`MEMHS`) — localStorage can be dead
   (file://, private mode); warn, don't crash.
3. **Render never mutates state.** All aging/decay in update; and *visual-only*
   decay (`flashA`, `shakeT`) belongs in the **frame loop** so pause never freezes
   a flash overlay on screen (the sepia-wash bug, caught three games running).
4. **NaN guards** on shake/trauma/camera — one NaN silently blanks all rendering.
5. **`seq()`-split token patterns, never char-index** (Pulsar pattern parser bug).
6. **Hidden tab → `actx.suspend()`** on visibilitychange, resume on return.
7. Bots must aim **off-center** sweeps; a perfect bot exposes degenerate physics
   (vertical lock) but a dumb one stalls on sparse layouts — both are signals.
8. Voxel models: recolor/setup BEFORE `drawModel`, not after.
9. UI buttons need a `closest('.mbtn,.exitbtn,#exit,.hstab')` guard on the global
   mousedown-fires handler.
10. Adversarially test score gates after deploying them (forged direct insert,
    over-ceiling values, bad shapes) and clean up the test rows.
11. **Touch buttons are mutually exclusive with the `closest()` guard.** Add every
    new on-screen control class (`.tbtn,.tlane,.thit`, tag slots) to the global
    mousedown/touch guard so a tap doesn't *also* fire the canvas action underneath.
    Use `touchstart` (not click) for gameplay hits — clicks carry latency. `e.preventDefault()`
    on gameplay touches to kill synthetic mouse + scroll/zoom; **don't** preventDefault
    on menu taps (let synthetic clicks reach the DOM buttons).
12. **`const` helpers live in the TDZ until their line runs.** A block that executes
    at module-eval time (e.g. NEONSTORM's touch setup near the top) can't call `EL`
    if `const EL` is declared 1700 lines below — define a local `gid()` or move the
    block. A clean console at *load* (not just in-play) is the test that catches this.

## 7. Engine conventions (shared across games)

- Voxel renderer: ASCII-layer models → `compileModel()`; parallel projection
  `drawModel` with per-face lambert (`VCY=.86`, `VSZ=.51`), neighbor-mask face
  culling, insertion-sort depth, `shade()` color cache.
- Audio: WebAudio `tone()`/`noise()` helpers, lookahead scheduler loops, per-stem
  gain/lowpass buses (Pulsar), combo-pitched SFX (Ricochet bounce =
  `300 + min(combo,16)*45` Hz). `initAudio()` on first gesture; M = mute.
- Input: mouse + keyboard + gamepad everywhere, including menus; Start=pause,
  B=back; 3-letter arcade tag entry navigable by pad (↑↓ letter, ←→ position).
- HUD updates are dirty-checked (`_hS`-style caches), DOM only on change.
- Palette per game: NEONSTORM cyan/magenta on deep blue; PULSAR gold/violet;
  RICOCHET ember `#ff7847` / teal `#2ee6c8` / gold `#ffc23d`.

## 8. Roadmap / backlog

Next in catalog (names settled): **Stardust** (Lumines), **GlowMaze** (Pac-Man CE),
**Fathom** (R-Type, underwater), **Contrail** (Tron, space/rockets).
Backlog (names TBD): Bomberman→*Fuze?*, N+→*Vault?*, Castle Crashers→*Rampart?*
(the big one — flag scope before starting). Pulsar wants: more original tracks,
XM/IT support, surfacing MOD-run local boards. Ricochet wants: user feel-feedback,
maybe more sectors. Monetization: tip jar **live** (§3, real Stripe link in);
portals still parked. Community **suggestion box live** on the landing page (§3) —
watch it for incoming ideas and feed the catalog from real player requests.
**Mobile/touch shipped** across all three games (§2) — collect feel-feedback on the
control schemes (twin-stick sticks, rhythm hit-bar, paddle drag) like any other
playtest.

## 9. README.md (public copy — keep in sync with the repo file)

> # KONTINUE? GAMES
>
> A tiny browser arcade — voxel-built games you can play instantly, no install.
> A Brivio Advisory OÜ production, made in Estonia.
>
> ### ▶ Enter the arcade — kontinue.games
>
> ## Now playing
>
> | Game | Genre | |
> |---|---|---|
> | **NEONSTORM** | Voxel twin-stick shooter | A Geometry Wars tribute — ten enemy types, three escalating bosses, a warping neon grid, and a global leaderboard. |
> | **PULSAR** | Rhythm / track shooter | A Frequency/Amplitude tribute — ride five instrument lanes, capture each stem to build the song. Original synth tracks, or drop in your own `.MOD` files. |
> | **RICOCHET** | Voxel block-breaker | An Arkanoid tribute — ten hand-built sectors, chaining bombs, lasers, multi-ball, hazard capsules to dodge, and a world leaderboard. |
>
> *In development:* Stardust · GlowMaze · Fathom · Contrail.
>
> ## How it's built
>
> Every game is a **single self-contained HTML file** — the renderer, physics,
> particles, music and SFX are all hand-rolled JavaScript with zero dependencies
> and no build step. Each one runs straight from disk or off the web.
>
> Play anywhere: keyboard, mouse, and gamepad on desktop — and **full touch
> controls on phones and tablets** (twin-stick pads for NEONSTORM, a hit-bar for
> PULSAR, drag-the-paddle for RICOCHET).
>
> ```
> index.html        ← the arcade landing page
> neonstorm/        ← NEONSTORM
> pulsar/           ← PULSAR
> ricochet/         ← RICOCHET
> CNAME             ← kontinue.games (GitHub Pages)
> ```
>
> ## Run locally
>
> Clone and open `index.html`, or serve the folder with any static server and
> visit the root.
>
> ## Suggest a game
>
> Got an idea for the next tribute, or a feature you'd love? There's a **suggestion
> box** on the landing page — drop it in. The best ideas get pinned up for everyone
> to see.
>
> ## Tip jar
>
> Enjoying the arcade? There's a coin-door **tip jar** on the landing page — tips
> keep the neon on.
>
> © 2026 Kontinue? Games — a Brivio Advisory OÜ production. Made with ♥ and too
> many voxels. For a time long lost.

## 10. Shipping checklist (any change)

1. Edit the single HTML file(s); keep everything dependency-free.
2. Test locally per §5 (console clean at error AND warn level; bot run for
   gameplay changes; staged screenshot for visual changes).
3. New game? Landing card + thumbnail + ticker + Hall of Fame + exit pill (§3).
4. New leaderboard? Follow §4 pattern, adversarially test, scrub test rows.
5. Update README.md (and §9 here) if the public story changed.
6. **Update this CLAUDE.md** (§3 state, §6 lessons, §8 roadmap).
7. Commit with a descriptive message, push to `main`, verify live with curl.
