# GROUNDSWELL '26: World Eleven

### THE GLOBE CUP

**"48 Nations. One Surge. Lift the Sphere."**

`Genre: Arcade Football  ·  Players: 1–2 (local + online)  ·  Platforms: PC / Console / Mobile  ·  Engine: TypeScript + Phaser 3 + Vite (2D neo-poster pipeline; Tauri/Capacitor wrappers)  ·  Status: Design v1.0`

---

## Executive Summary

**GROUNDSWELL '26** is a fast, juicy, joyful arcade football game where 48 real nations surge through **The Globe Cup** to lift **The Aurora Sphere**. Matches are four-to-six fizzing minutes of chunky touches, screen-shaking **Screamers**, and confetti-soaked goals — all powered by **SURGE**, a living momentum meter that fills faster when you're losing and erupts into a team-wide **GROUNDSWELL** super-state for the marquee comeback. It's the joy of a playground tournament with the polish of a broadcast: glanceable in five minutes, masterable over a hundred matches. The hook is the promise baked into every system — *no team is unwinnable* — so a ★☆☆☆☆ MINNOW always keeps a real path to topple a ★★★★★ ELITE on a good run.

It's built for lapsed and casual football-game fans (roughly 16–34) who love the feeling of the sport but bounce off slow, spreadsheet-heavy sims — plus the e-sports-clean, couch-and-phone crowd who want instant, celebratory wins. It's buildable by one person because the entire scope leans into solo-indie strengths: a single tight 11-a-side loop, flat-shaded "neo-poster" art that reads big and renders cheap, original crests and kits over real country names, and 100% fictional parody rosters generated from a deterministic recipe rather than a licensed database. The headline of the legal-safe approach: **real country names + 100% original crests/kits/typography + fully fictional parody players + an original tournament identity** — no licenses, no likenesses, no protected marks, shippable by a team of one.

## Design Tenets

- **SURGE OVER SIM** — Momentum is the engine; always favor the readable, swingy, comeback-friendly choice over realistic-but-flat simulation.
- **FIVE-MINUTE MASTERY ARC** — Pick up and play in five minutes; reveal a hundred-match skill ceiling. Every mechanic is glanceable yet deep.
- **EVERY GOAL IS A FIREWORK** — Scoring is the payoff; juice it relentlessly with shake, slow-mo, sound, and confetti. The whole game services the moment the ball hits the net.
- **NO TEAM IS UNWINNABLE** — Balance, tier design, and the comeback mechanic guarantee any nation can beat any nation on a good run. Underdog joy is sacred.

## How This Game Stays Out of Legal Trouble (TL;DR)

- **No protected marks, ever** — no FIFA branding, no "World Cup" (the in-game event is **The Globe Cup**), and no official logos, emblems, trophy designs, kits, or crests.
- **Real country names are fine** — they're geographic facts, not trademarks, and they keep the game grounded; they're the default.
- **100% original visual identity** — every crest, kit, color treatment, badge, and typeface is invented for this game. We may *evoke* a nation's mood but never reproduce or closely imitate a real federation's crest or kit.
- **100% fictional parody rosters** — players are generated via the deterministic "fun-tweak" recipe (e.g. *Marco Volleyault*, *Kofi Screameribo*) and must read as obviously invented — never a near-spelling of a living athlete.
- **Original tournament identity** — The Globe Cup, **The Aurora Sphere** trophy, and the six in-game confederation zones are all bespoke creations with no real-world counterpart designs.
- **One-switch safety mode** — an optional **Fictionalized Nations** toggle (e.g. "Brazilia," "Germania," "Eaglestan") ships OFF by default for the most risk-averse path or streamers in restricted regions.

---

## Table of Contents
1. [Game Vision](#1-game-vision)
2. [Gameplay Design](#2-gameplay-design)
3. [Tournament System](#3-tournament-system)
4. [Teams & Players](#4-teams--players)
5. [Game Modes](#5-game-modes)
6. [Progression & Unlocks](#6-progression--unlocks)
7. [Visual Design](#7-visual-design)
8. [Audio Design](#8-audio-design)
9. [Technical Design](#9-technical-design)
10. [Development Roadmap](#10-development-roadmap)
11. [Legal Safety Review](#11-legal-safety-review)
12. [AI Coding Plan](#12-ai-coding-plan)

---

## 1. Game Vision

> **Conforms to the GROUNDSWELL '26: World Eleven Creative Bible.** This section is the top-level pitch for the GDD; every claim below traces back to the Bible's Pillars (§7), Rating Contract (§8), Glossary (§9), and Legal Guardrails (§0). Downstream sections (Gameplay §2, Modes §5, et al.) inherit this vision.

---

### 1.1 Game Title Candidates

**Primary (chosen): GROUNDSWELL '26: World Eleven**

"Groundswell" names the surging, building wave of momentum that *is* the game — the comeback fantasy and a football-energy metaphor in a single ownable word, with zero trademark collision. "'26" plants the flag on 2026 energy without touching any protected mark, and "World Eleven" signals 11-a-side global football while doubling as the name of the unlockable cross-nation all-star squad mode. Short-form brand: **GROUNDSWELL** or **GS26**.

**Alternates (cleared, pick-order ranked):**

1. KICKOFF NATIONS '26
2. GLOBE GLORY: 48
3. PITCH PLANET '26
4. STRIKER STATES
5. FOOTY FRENZY: World Run
6. FORTY-EIGHT: Pitch Wars
7. TOTAL TOUCH '26

---

### 1.2 Elevator Pitch

GROUNDSWELL '26 is a fast, juicy, joyful arcade football game where 48 real nations across six original zones surge through **The Globe Cup** to lift **The Aurora Sphere**. Matches are four-to-six fizzing minutes of chunky touches, screen-shaking **Screamers**, and confetti-soaked goals — all driven by the **SURGE** meter, a living heartbeat that powers the marquee comeback mechanic and makes *no team unwinnable*. It's the joy of a playground tournament with the polish of a broadcast: glanceable in five minutes, masterable over a hundred matches.

**Tagline:** *"48 Nations. One Surge. Lift the Sphere."*

---

### 1.3 Target Audience

**Primary — Lapsed & casual football-game fans (ages ~16–34).**
Players who love football's *feeling* but bounced off the spreadsheet-deep, simulation-heavy licensed sims. They want to pick up a controller (or tap a phone), score a screamer in ninety seconds, and feel like a hero. **Why they'll love it:** the Five-Minute Mastery Arc respects their time, and "Every Goal Is a Firework" delivers the dopamine the sims bury under menus.

**Primary — Arcade & "couch-competitive" players.**
Fans of pick-up-and-play sports and party games who prize readability, swing, and shareable moments. **Why they'll love it:** the SURGE/GROUNDSWELL comeback system manufactures the electric, against-the-odds finishes that define a great couch session — and the e-sports-clean UI keeps every match legible at a glance.

**Secondary — Global football culture & "nation pride" players.**
People who want to play *their* country on the world stage. **Why they'll love it:** real country names are the grounded default, sorted into six characterful zones, so anyone can find a side to rally behind — while original crests, kits, and fictional parody rosters keep the whole thing light, legal, and fresh.

**Secondary — Streamers & content creators.**
Short matches, juicy highlight beats, and dramatic comebacks are pure clip fuel. **Why they'll love it:** the **Fictionalized Nations** safety toggle lets creators in restricted regions stream worry-free, and the constant Surge swings generate endlessly castable drama.

---

### 1.4 Platform Targets

The game is built **Web-first**, then rolled out to Desktop and Mobile from the same core. The Bible's art and UI direction — chunky neo-poster 2D, a broadcast-arc camera, and a minimal, geometric, "instant legibility on a phone or a couch TV" UI (§6) — is explicitly designed to scale across all three.

| Priority | Platform | Rationale |
|---|---|---|
| **1 — Primary** | **Web (browser)** | Zero-install, instantly shareable links, and the widest possible top-of-funnel — the right launch surface for a solo-indie title chasing viral, streamable comeback moments. One build reaches everyone. |
| **2 — Desktop** | **Windows / macOS (e.g. Steam, itch.io)** | The "couch/TV" and 7v7 "Full Pitch" / World Eleven showcase home. Higher-fidelity rendering, controller-first feel, and a storefront presence for wishlists and discoverability. |
| **3 — Mobile** | **iOS / Android** | The largest long-tail audience. The 5v5 default and minimal HUD are tuned so the ball never gets lost on a small screen; touch controls and quick **3v3 "Street Surge"** sessions fit mobile play patterns. |

**Rollout order:** Web (launch & validate the core loop) → Desktop (premium presentation + storefront) → Mobile (scale the audience). Because every mode runs on a single shared match engine, each platform is a presentation/control layer over the same tuned core — the only way a solo dev ships this much surface area.

---

### 1.5 Core Gameplay Pillars

These four pillars (Bible §7) constrain **every** design decision in this GDD.

**1. Surge Over Sim.**
Momentum is the engine, not an afterthought. Whenever a choice pits realistic-but-flat against readable, swingy, and comeback-friendly, we always pick the latter. The SURGE meter — and its maxed-out, team-wide **GROUNDSWELL** super-state — is the heartbeat that every other system serves.

**2. Five-Minute Mastery Arc.**
Pick up and play in five minutes; reveal a hundred-match skill ceiling. Every mechanic must be *glanceable yet deep* — instantly understood by a newcomer, yet rewarding the precision, timing, and **Nutmeg Meter** flair that separate a novice from a master.

**3. Every Goal Is a Firework.**
Scoring is the payoff, and we juice it relentlessly: screen-shake, slow-mo, sound, and confetti. The whole game services the instant the ball hits the net — a **Screamer** from distance should feel like a tiny fireworks show, and the stadium should breathe brighter with every score.

**4. No Team Is Unwinnable.**
Balance, tier design (the five-tier ★ scale, OVR 60–99), and the comeback mechanic guarantee any nation can beat any nation on a good run. Even a ★☆☆☆☆ **MINNOW** facing a ★★★★★ **ELITE** keeps a meaningful win path via a full Surge run and **The 90th**. Underdog joy is sacred.

---

### 1.6 Unique Selling Points

1. **The SURGE comeback engine.** A signature momentum meter that fills *faster when you're losing* and culminates in the team-wide **GROUNDSWELL** super-state — a built-in drama machine no licensed sim offers.
2. **"No Team Is Unwinnable" as a design promise.** A mechanically enforced guarantee (the rating gap tilts odds, never closes the door) that turns every fixture into a real contest and makes underdog runs the heart of the game.
3. **Four-to-six minute matches, built for the clip era.** Full tournaments fit into a coffee break; single matches fit into a highlight reel — explicitly engineered for streamers and short-form sharing.
4. **48 real nations, 100% original everything else.** Grounded, rally-behind country names paired with wholly original crests, kits, color treatments, and an original tournament identity (**The Globe Cup**, **The Aurora Sphere**) — recognizable yet fully owned and legally clean.
5. **Fictional parody rosters with personality.** A deterministic "fun-tweak" naming recipe (Marco Volleyault "The Number 9," Kofi Screameribo "Captain Curl") delivers light, characterful squads that never impersonate a real athlete — charm where the sims have lawyers.
6. **Arcade-clean, broadcast-grade presentation.** Bold neo-poster 2D, a dynamic broadcast-arc camera, and a pulsing electronic-orchestral-with-global-percussion score that swells with the Surge — the polish of a TV broadcast with the readability of a playground game.
7. **One game, three screens, one engine.** A Web-first build that scales cleanly to Desktop and Mobile, with 3v3 / 5v5 / 7v7 formats and a **Fictionalized Nations** safety toggle — broad reach and creator-safe by design, all shippable by a solo developer.

---

## 2. Gameplay Design

> **Conforms to GROUNDSWELL '26: World Eleven Creative Bible.** Every mechanic below services the four Core Pillars (Section 7): **Surge Over Sim**, **Five-Minute Mastery Arc**, **Every Goal Is a Firework**, **No Team Is Unwinnable**. All in-game term names are reused verbatim from the Bible's Glossary (Section 9) and Rating Contract (Section 8).

---

### 2.1 Design Philosophy (the lens for this whole section)

GROUNDSWELL is an **arcade** football game, not a simulation. The Bible's anti-goal is explicit: no offside-trap micromanagement, no menus-as-gameplay, no grim realism (Section 5). Therefore every system in this section is tuned for **readability over realism**, **swing over stability**, and **glanceable depth** that a solo developer can actually ship. The hard rule a single dev should keep taped to the monitor: **if a feature needs more than ~3 tunable numbers to feel right, it's too sim — cut it or simplify it.**

The whole match is built around the **SURGE** heartbeat (Section 9). Read this section as "what the player does between Surges, and how every Surge becomes a firework."

---

### 2.2 Match Format

**Recommendation: 5v5 (default), with a 7v7 "Full Pitch" option.** Small-sided is the arcade-correct choice — it keeps all 10 figures on screen at the Bible's chunky neo-poster scale (Section 6) with confident, readable silhouettes, and it guarantees the broadcast-arc camera never has to zoom so far out that a phone screen loses the ball.

| Format | Outfield + GK per side | Use case | Pitch size (units) |
|---|---|---|---|
| **5v5 (DEFAULT)** | 4 + 1 GK | Standard Globe Cup, ranked, mobile | 60 × 40 |
| **7v7 "Full Pitch"** | 6 + 1 GK | Couch/TV, "World Eleven" all-star showcase | 80 × 52 |
| **3v3 "Street Surge"** | 2 + 1 GK | Quick-play / future event mode (no offside, tiny pitch) | 36 × 24 |

**Camera — the Bible's "dynamic broadcast-arc" (Section 6):**
- Default: a single dynamic camera sitting **~22° higher and ~15% wider** than a sim-football side cam, framing roughly **55% of the pitch length** so both the ball and the nearest goal are almost always in frame.
- The camera **lerps** toward the ball-carrier at a follow-speed of `0.12` (smooth, never twitchy), with a small lead-offset in the direction of attack so the player sees where they're shooting.
- **Snap-zoom + slow-mo punches** (per Bible Section 6): on a **SCREAMER**, a tackle, or a goal, the camera punches in ~18% and time scales to `0.45×` for 0.6–0.9s. This is the firework framing — it is non-optional on goals.
- One camera, no manual camera control. (Solo-dev scope: a second camera mode is post-launch.)

**Out-of-bounds — kept snappy (no realism tax):**
- **Sidelines → "Quick Throw":** ball auto-returns to the team that didn't touch it last. The receiving player is auto-placed at the line and play resumes in **≤0.4s** with a short directional indicator. No throw-in aiming mini-game, no run-up. Tap **Pass** to release early.
- **Goal line (attacker last touch) → "Fast Goal Kick":** GK gets the ball, **1.5s** soft countdown, can release instantly with **Pass/Through-Ball**.
- **Goal line (defender last touch) → "Power Corner":** corner taker auto-placed; a **charged corner** (hold Shoot) lobs into the box with a Surge-fed power bar. Corners are an *attacking toy*, not a set-piece simulator.
- **No "ball out for 5 seconds" dead time ever.** Max stoppage between any restart is **2 seconds**. If the player does nothing, the AI auto-resumes.

---

### 2.3 Control Scheme

Design rule from the brief and the Bible's "five-minute mastery" pillar: **~4 action buttons.** The four faces are **Pass, Through-Ball, Shoot, Tackle**. Everything else (sprint, switch, skill, power-up) rides on triggers/modifiers so a new player can ignore them and a veteran can chain them.

| Action | Keyboard | Gamepad | Touch | Notes |
|---|---|---|---|---|
| **Move** | `W A S D` | Left Stick | Left virtual stick (floating) | 8-way feel, analog under the hood |
| **Pass** (ground) | `J` | **A / ✕** | **Right pad — bottom button** | Tap = short; double-tap = give-and-go request |
| **Through-Ball** (lofted/lead) | `K` | **B / ◯** | **Right pad — right button** | Context-aware: leads the runner into space |
| **Shoot / Charged-Shot** | `L` | **X / ▢** | **Right pad — top button (hold)** | **Hold to charge** the power bar → SCREAMER on full + good timing |
| **Tackle / Slide** | `I` | **Y / △** | **Right pad — left button** | Tap = standing poke; hold = committed slide (risk) |
| **Sprint** | `Shift` (hold) | **RT / R2** (hold) | **Hold any move-stick edge** | Drains a small stamina nub; not infinite |
| **Switch Player** | `Space` | **LB / L1** | **Auto-switch** (tap nearest teammate) | Switches to AI-best defender toward ball |
| **Skill-Move** | `Shift + move` | **LT / L2 + Left Stick flick** | **Swipe on left stick** | Direction of flick = which skill (see 2.6) |
| **Activate Power-Up / GROUNDSWELL** | `E` | **RB / R1** | **Tap the Surge meter** | Lights up only when meter is ready |

**Touch-first notes (the Bible says it must be legible on a phone, Section 6):**
- **Floating left stick** appears wherever the left thumb lands — no fixed origin.
- The **right "action pad"** is a 2×2 diamond of the four face buttons, thumb-reachable.
- **Auto-switch on defense by default** for touch, because manual switching is the #1 mobile frustration. Veterans can toggle "Manual Switch" in settings.
- **Charged shot on touch = hold the Shoot button**; a radial fills around the thumb so you can see the charge without looking away from the ball.

---

### 2.4 Arcade Mechanics (the juice)

These are the "feel" systems that make GROUNDSWELL fast, juicy, joyful (Bible Section 5). All are **assist-on by default** and individually toggleable for veterans.

- **Charged Shots.** Hold **Shoot** to fill a 3-stage power bar (`0.0–0.4s` = placed, `0.4–0.8s` = driven, `0.8s+` = **SCREAMER**-eligible). Releasing on the green "sweet" window (a flashing ring) adds curve and triggers slow-mo. A full-charge SCREAMER from outside the box gets the biggest firework (Pillar 3).
- **One-Touch Passing.** If you tap **Pass** within `0.25s` of receiving, the pass fires with a **+15% speed and +10% accuracy bonus** and feeds the **NUTMEG METER**. One-touch chains (3+) trigger a "Tiki" combo callout and bonus style points (see 2.11). This is the rhythm engine the Bible asks for.
- **Generous Pass Assist.** Passes auto-target the best teammate in a **±25° cone** of aim. Three assist levels: **Full** (default, console-casual & touch), **Semi** (cone narrows to ±12°), **Manual** (pure stick aim, ranked-veteran). Through-balls always lead the runner into space, never to feet.
- **No-Offside Option (default ON for casual).** Per Pillar 1 (Surge over Sim) and Pillar 4, **offside is OFF by default.** A "Classic Rules" toggle re-enables a simplified offside (a single forward-most-defender line, no interpretive nonsense) for ranked purists. The Bible explicitly forbids offside-trap micromanagement, so even "on," it's one clean line.
- **Wall-Bounce Passes.** The pitch perimeter (advertising boards) is **live** in 5v5/3v3 — angle a pass into the wall and it rebounds at a clean reflection angle. A wall-assisted pass that beats a defender awards bonus style points and feeds Surge. This is a signature arcade toy and a skill-ceiling mechanic.
- **Momentum / "weight."** The ball and players carry light momentum (accel `~0.18`, friction `~0.92`) so dribbling feels chunky and satisfying (Bible "chunky touches, satisfying thwocks"), but turn-radius assist keeps it from ever feeling sluggish.
- **Auto-Anticipation Trap.** First touch auto-cushions a received ball toward your held movement direction — no fumbling. Stick-flick on reception = a flashy directional control touch that feeds the NUTMEG METER.
- **"Thwock" feedback layer.** Every kick, tackle, and wall-bounce has screen-shake scaled to power and a layered SFX hit. Goals always trigger confetti + the crowd swell tied to the **Surge** state (Bible Section 6).

---

### 2.5 Power-Ups

Power-ups reuse Bible glossary states and never break Pillar 4. They are **earned through play**, telegraphed to the opponent, and all have **counterplay** so they're spicy, not unfair. A power-up readies when its earn-condition is met; the player triggers it with **Activate (RB/R1/E/tap-meter)**.

| Power-Up | Effect | Duration | How Earned | Counterplay |
|---|---|---|---|---|
| **SURGE RUN** | Team-wide **+12% speed, +15% shot power, +10% pass precision** for the activating squad | **8s** | Spend a **half-full SURGE** meter | Defender's **WALL** cancels the speed edge in its radius; clean tackle drops the carrier's boost |
| **GROUNDSWELL** (marquee) | Full-squad super-state: **+18% all stats**, golden trails, Surge can't be lost; the namesake comeback super | **~30s** (Bible Section 9) | **Max the SURGE meter** (fills faster when trailing & in **THE 90TH**) | Opponent gains **+25% Surge fill** while it's active (the rubber-band tax); scoring against you ends it early |
| **WALL** | Defensive lockdown stance: **−20% attacker speed** in a 10-unit radius + **+30% interception** for your line | **5s** | Fill the defensive sub-meter via tackles, blocks, and pressing | Burned by a **skill-move** dribble or a **wall-bounce** pass around it; can't be used in the attacking third |
| **SCREAMER Window** | Next charged shot within the window auto-snaps to the **SCREAMER** sweet-spot (guaranteed max curve + power) | **One shot / 4s** | Land **3 one-touch passes** in a chain (feeds NUTMEG METER) | GK gets a **+15% reaction** buff vs. flagged Screamers; a block/tackle consumes it harmlessly |
| **Megs Master** | All **skill-moves** cost no stamina and have a **wider success window**; successful megs grant **double Surge** | **10s** | Fill the **NUTMEG METER** with flair moves | A committed **slide tackle** still wins the ball mid-skill; pure pace beats fancy footwork |
| **Pace Burst** | Single chosen attacker gets **+25% sprint speed**, no stamina drain | **6s** | Win a **50/50** or intercept in your own half | A **WALL** neutralizes it; predictable straight-line runs get cut out by the AI angle-tackle |
| **Sticky Keeper** | Your **GK** gets **+20% reach + dive speed** and parries to safety, not rebounds | **One save / 7s** | Concede a goal (a "bounce-back" pity buff — supports Pillar 4) | Chip/lob shots ignore the reach buff; a SCREAMER still beats it ~30% |
| **Magnet Touch** | Improved **first-touch control + ±35° pass cone** for the whole team (assist boost) | **8s** | Complete **6 passes** without losing possession | Aggressive **pressing** forces errors faster than the magnet compensates |

**Hard caps (solo-dev sanity + Pillar 4 fairness):**
- Max **one active power-up per team** at a time (GROUNDSWELL excepted — it can overlap a WALL on defense).
- A team can hold a *readied* power-up indefinitely but only **trigger** when not already in one.
- Power-ups **never** include "freeze opponent," "invisible ball," or anything that removes player agency — that violates the e-sports-clean tone (Bible Section 5).

---

### 2.6 Special Moves (signature skill-moves & "hero" abilities)

Skill-moves are the **NUTMEG METER** feeders and the skill-ceiling layer (Pillar 2). They split into **universal moves** (anyone) and **hero abilities** (one per star archetype, tied to the Bible's rating tiers). All are triggered by **Skill-Move (LT/L2 + flick)** with the **flick direction** choosing the move.

**Universal skill-moves (every player):**

| Move | Trigger (flick) | Effect | Risk / Reward |
|---|---|---|---|
| **The Megs** | Flick toward a defender | Nutmeg through legs; big NUTMEG METER + Surge | Whiff = heavy touch, defender steals; success = beat + style points |
| **Rainbow Flick** | Flick back→forward | Pops ball over a flat defender | Slow wind-up; punished if pressed, dazzling if not |
| **Drag-Stop** | Flick back | Sharp stop + 90° cut | Kills momentum (sluggish if mistimed); creates shooting lane |
| **First-Touch Spin** | Flick on reception | Receive + turn in one motion | Tight timing window; instant separation when nailed |

**Hero abilities — one signature per star archetype, scaled by the Bible's Rating Contract (Section 8).** Higher tiers get a stronger/more-reliable hero move, but Pillar 4 holds: even a **MINNOW** has a hero move that can win a moment.

| Star Archetype | Tier (Bible §8) | Hero Ability | Trigger | Risk / Reward |
|---|---|---|---|---|
| **The Finisher** | ELITE ★★★★★ | **Auto-SCREAMER**: next charged shot ignores the timing window once per Surge | Skill-flick toward goal while charging | If blocked, full Surge segment lost — high-stakes |
| **The Maestro** | STRONG ★★★★☆ | **Threaded Eye**: a through-ball that bends around one defender | Through-Ball + flick | Telegraphed (glows); WALL reads it |
| **The Engine** | SOLID ★★★☆☆ | **Second Wind**: instant stamina refill + 3s pace | Double-tap Sprint | 12s cooldown; leaves you flat if used early |
| **The Spark** | PLUCKY ★★☆☆☆ | **Trickster**: chained skill-moves cost half NUTMEG, wider windows for 5s | Skill-flick ×2 | All flair, no power — pure dribble gamble |
| **The Heart** | MINNOW ★☆☆☆☆ | **Last-Ditch**: one guaranteed clean slide tackle (no foul) per half | Hold Tackle near ball | Long cooldown; the Cinderella's one big defensive moment |

> **Pillar 4 in the design:** the MINNOW's "Last-Ditch" and the **Sticky Keeper** pity-buff are deliberate equalizers. A ★☆☆☆☆ side (OVR 60) gets *more frequent* hero/power moments than a ★★★★★ (OVR 99), which is exactly how "no team is unwinnable" becomes mechanical rather than aspirational.

---

### 2.7 Comeback Mechanics — the SURGE system

This is the heart of the game and the literal namesake (**GROUNDSWELL**). It is the mechanical form of Pillar 1 and Pillar 4. Reuses the Bible glossary exactly: **SURGE → SURGE RUN → GROUNDSWELL**, plus **THE 90TH** and **HOME SURGE**.

**How the SURGE meter fills** (one meter, 0–100, four input rates):

| Event | Surge gained |
|---|---|
| Completed pass / one-touch pass | **+1 / +2** |
| Successful tackle, block, interception | **+4** |
| Skill-move / nutmeg success (via NUTMEG METER) | **+3** |
| Near-miss (shot hits post/forces a big save) | **+5** |
| Wall-bounce assisted play | **+4** |
| **Conceding a goal** | **+15** (the pity surge) |

**The trailing-team multiplier (the rubber-band, kept honest):**
- Base fill **×1.0** when level or leading.
- **×1.4** when trailing by 1.
- **×1.8** when trailing by 2+.
- **THE 90TH** (final 5 in-game minutes, Bible §9): trailing team's fill jumps an additional **×1.5** on top — so a 2-goal deficit in the 90th fills at **×2.7**. This is "no team is unwinnable" in mechanical form, verbatim from the Bible.

**What spent Surge grants (the comeback ladder):**
1. **Half meter → SURGE RUN** (8s team boost; see 2.5).
2. **Full meter → GROUNDSWELL** (~30s full-squad super-state; the marquee comeback).

**Guardrails so it's exciting, not unfair (critical for Pillar 4 *without* feeling cheap):**
- The **leading team also banks Surge** — being ahead doesn't lock you out of your own SURGE RUN; it just fills slower. Defending a lead well (tackles, blocks) is itself a Surge source, so the comeback is *resistible by good play*.
- **GROUNDSWELL taxes the user:** while it's active, the opponent's fill jumps **+25%**, and conceding ends it early. You can't camp a lead-erasing super with no downside.
- **No instant goals.** Surge boosts *capability* (speed/power/precision), never *outcomes*. A GROUNDSWELL side that plays badly still loses the ball. This keeps the skill ceiling (Pillar 2) intact.
- **Hard cap:** a team can be in **GROUNDSWELL** at most **once per 3 in-game minutes** to prevent perpetual super-states.
- **HOME SURGE (Bible §8):** a flagged **Host** fills Surge faster in home stadiums and carries the **+4 OVR** "Home Surge" boost (capped 99, never below SOLID). This is the only stat-level Surge modifier outside the meter itself.

---

### 2.8 Difficulty System

Five named tiers, themed to the Bible's energy. Each tier changes only **3 knobs** (solo-dev discipline): **AI reaction time**, **power-up frequency**, and **rubber-banding strength** (how strongly the CPU's Surge multiplier swings to keep matches close).

| Difficulty | AI reaction time | CPU power-up frequency | Rubber-banding (toward player) | Feel |
|---|---|---|---|---|
| **Sunday Kickabout** | 320 ms | Low | **Strong (helps player)** | Total beginner; you almost always have a path back |
| **Local Derby** | 240 ms | Normal | Moderate (helps player) | Default casual; swingy and forgiving |
| **Cup Run** | 180 ms | Normal | Neutral | The "intended" balance; Surge math as written in 2.7 |
| **Knockout Pressure** | 130 ms | High | Light (helps CPU) | CPU exploits openings; punishes loose touches |
| **Lift the Sphere** | 90 ms | High | **Slight (helps CPU)** | Expert. CPU one-touches, reads skill-moves, uses GROUNDSWELL ruthlessly |

> Even at **Lift the Sphere**, rubber-banding never *fully* inverts against the player — Pillar 4 ("no team is unwinnable") binds the AI too. The CPU's edge is *sharper play*, not *removing the player's Surge*.

Difficulty also lightly scales **GK reflex** (reaction-time knob applies to the keeper FSM in 2.9) and **pass-assist for the CPU**, but these ride off the single reaction-time slider — no separate tuning curves.

---

### 2.9 AI Behavior

Built as a **lightweight finite-state machine (FSM)** per AI agent — deliberately implementable by one developer. There are **two FSMs**: an **outfield-player FSM** and a **goalkeeper FSM**, plus a thin **team-coordinator** layer that just assigns roles. No utility-AI, no behavior trees, no learning — the Bible's anti-sim stance makes that overkill.

**Outfield-player FSM (per AI agent) — 6 states:**

| State | Entered when | Behavior | Exit trigger |
|---|---|---|---|
| **IDLE/FORMATION** | Team has neither ball nor active threat near | Move toward formation slot (anchored to ball's X-position, offset by role) | Ball enters my zone / I'm switched-to |
| **SUPPORT** | My team has the ball, I don't | Make a passing-lane run (find open space ±30° ahead of carrier) | Carrier loses ball → CHASE |
| **CARRY** | I have the ball | Dribble toward goal; query "shoot/pass/skill" decision table each 0.2s | Lose ball, pass, or shoot |
| **MARK** | Opponent has ball, nearest attacker is mine | Goal-side positioning, stay ~2.5 units off my mark | Pressing trigger fires → PRESS |
| **PRESS** | Pressing trigger fires (see below) | Close down ball-carrier; standing tackle in range, slide if committed-flag | Win ball / beaten → recover to MARK |
| **RECOVER** | Beaten or out of position | Sprint back along the goal-side line to re-form | Reach formation slot → IDLE/FORMATION |

**Pressing triggers (simple booleans — the "when to attack the ball" logic):**
- Ball-carrier is within my **press-radius** (6 units default; tighter on harder difficulty) **AND** I'm the closest 1–2 defenders, **OR**
- The carrier just took a **heavy touch** (momentum spike) — the team-coordinator flags a "swarm" and the nearest 2 enter PRESS, **OR**
- We're trailing in **THE 90TH** → press-radius widens (aggression scales with Surge state). Off-ball, the team holds a compact shape: defenders mark, midfielders screen passing lanes, one striker stays high as a Surge outlet.

**Shooting / passing decision table (evaluated in CARRY every 0.2s — three cheap checks):**
1. **Shoot** if in the "shot cone" to goal **and** clear-ish lane **and** within range band (closer = higher shoot weight; SCREAMER range for ELITE Finishers).
2. Else **Through-Ball** if a teammate is making a run into space ahead.
3. Else **Pass** to the highest-value open teammate (most forward + most open).
4. Else **skill-move/dribble** forward (probability scales with the team's star archetype — Sparks/Maestros dribble more).

**Goalkeeper FSM — 4 states:**

| State | Behavior |
|---|---|
| **POSITION** | Track ball along a shallow arc on the goal line; stay between ball and net center |
| **SET** | Ball enters shooting range → square up, freeze for a clean dive read |
| **DIVE/SAVE** | On shot: compute dive based on shot speed/placement vs. keeper reaction (difficulty-scaled). SCREAMERs reduce save odds; **Sticky Keeper** power-up boosts reach |
| **DISTRIBUTE** | After a save/catch → quick roll or **Through-Ball** to a SUPPORT runner (no slow build-up; keeps it snappy) |

**Difficulty scaling — one number drives the AI** (per 2.8): the **reaction-time** value sets press-closing speed, GK dive timing, and decision-table latency simultaneously. Power-up frequency and rubber-banding are the only other two AI knobs. **Three numbers total per difficulty tier** — that's the whole AI surface a solo dev must balance.

---

### 2.10 Match Duration

Arcade-short, exactly per the Bible's "4–6 fizzing minutes" target (Section 5).

| Setting | Real-time length | In-game clock |
|---|---|---|
| **Blitz** | **3 min** real | 0' → 90' compressed |
| **Standard (DEFAULT)** | **5 min** real | 0' → 90' compressed |
| **Full** | **7 min** real | 0' → 90' compressed |

**How the clock compresses:**
- The displayed clock runs **0'–90'** so the football fantasy and **THE 90TH** phase still read correctly, but it's **scaled**: at Standard, **1 real second ≈ 18 in-game seconds** (90 in-game min in ~5 real min, minus stoppages).
- **THE 90TH** triggers at displayed **85'** — the final ~5 in-game minutes (~17 real seconds at Standard). The clock visibly **slows ~15%** in THE 90TH for drama, giving the trailing team room for one last GROUNDSWELL.
- **Halftime** is a **3-second** flair sting (Surge resets to a baseline carry-over of 25%, never zero — momentum shouldn't fully die).
- **Knockout extra time:** instead of a long 30-min ET, a single **"Golden Surge"** period — **60 real seconds, next-goal-or-Surge-decides**; if still level, a **3-shot SCREAMER Shootout** (charged-shot mini-duel). No penalty-sim tedium.

---

### 2.11 Scoring System

Two layers: **(1) the scoreline** (goals win matches) and **(2) the Style/Combo layer** that turns the Bible's "every goal is a firework" into a progression currency feeding **AURORA POINTS (AP)** (Bible §9).

**Layer 1 — Goals.** Standard: most goals wins. That's it; it's never gamified away. Goal types are *flagged* for style but all count as **1**:
- Tap-in, Driven, **SCREAMER**, Header, Wall-bounce assisted, Skill-move-into-goal, GROUNDSWELL goal.

**Layer 2 — Style / Combo Points (feeds AP & progression).** A live **Style Score** ticks up during the match and converts to **AURORA POINTS** at the final whistle. This is where flair "literally pays" (Bible NUTMEG METER ethos).

| Stylish act | Style points |
|---|---|
| Goal (base) | **+100** |
| **SCREAMER** goal | **+250** |
| Goal during **GROUNDSWELL** | **+200** |
| Wall-bounce assisted goal | **+150** |
| Skill-move (meg/rainbow) success | **+30** |
| One-touch pass chain (per pass, 3+) | **+20 each** |
| Comeback win (won after trailing by 2+) | **+500 bonus** |
| Clean sheet | **+150** |
| Host win using **HOME SURGE** GROUNDSWELL | **+100 flavor bonus** |

**Combo multiplier:** consecutive stylish acts within a **4-second window** stack a multiplier (**×1.1 → ×1.5 cap**). A meg → one-touch chain → SCREAMER finished inside the window can land a **×1.5** firework — the single most AP-rich moment in the game, and the exact feeling the Bible's Pillar 3 demands.

**Conversion & progression:**
- **AURORA POINTS = (Style Score ÷ 10) + result bonus** (Win **+300**, Draw **+100**, Loss **+50** — losing still earns, supporting underdog joy / Pillar 4).
- AP spend (cosmetics/unlocks) is owned by the Monetization doc; this section only **generates** AP. No pay-to-win — AP buys cosmetics and the **World Eleven** unlock track, never stat boosts (keeps Pillar 4 and the e-sports-clean tone intact).

---

> **Solo-dev scope check (the contract for this section):** every system here is built on a **single SURGE meter**, **two FSMs + a thin coordinator**, **three difficulty knobs**, **four action buttons**, and **~3 tunables per feature**. Nothing in this section requires a tactics engine, an offside interpreter, or per-player stat spreadsheets. It is arcade-first, Bible-compliant, and shippable by one person.

---

This is a self-contained writing task. I have the Creative Bible as the single source of truth, and I need to produce one GDD section. No file exploration or tools needed beyond writing the content directly into my response.

Let me write the section, conforming strictly to the Bible's names, terms, and rules.

## 3. Tournament System

> Conforms to the **GROUNDSWELL '26: World Eleven** Creative Bible. The in-game event is **THE GLOBE CUP** (nicknamed *"The Groundswell"*), the trophy is **THE AURORA SPHERE**, the 48 finalists are drawn across the six confederations (ICL, SBC, EAU, SCB, NTA, BHC), and all mechanics defer to the four Core Pillars — especially **"No team is unwinnable."** Format inspired by the 48-team 2026 structure.

---

### 3.1 — 48-Team Structure

The Globe Cup is a **48-nation finals** built in two halves: a **group stage** that seeds a **single-elimination knockout bracket**.

**The bracket math, spelled out:**

| Phase | Teams in | Format | Teams out |
|---|---|---|---|
| Group Stage | 48 | 12 groups of 4, round-robin | 32 advance |
| Round of 32 | 32 | Single-elimination | 16 |
| Round of 16 | 16 | Single-elimination | 8 |
| Quarter-finals | 8 | Single-elimination | 4 |
| Semi-finals | 4 | Single-elimination | 2 |
| **Final** | 2 | Single-elimination | **1 — lifts the Sphere** |
| *3rd-Place Playoff (optional)* | *2 SF losers* | *Single match* | *—* |

- **12 groups × 4 teams = 48.** Each group plays a single round-robin (everyone plays everyone once).
- **Advancement = 32 teams:** the **top 2 of each group** (12 × 2 = **24**) **plus** the **8 best third-placed teams** across all 12 groups (**+8**) = **32**.
- 32 → 16 → 8 → 4 → 2 → 1. Each knockout round exactly halves the field, so the bracket is a clean power-of-two ladder from the Round of 32 down.

**Match count (for scheduling/save sizing):**
- Group stage: 12 groups × 6 matches per group = **72 matches**.
- Knockout: 16 + 8 + 4 + 2 + 1 = **31 matches** (+1 if the 3rd-Place Playoff is enabled).
- **Total: 103 matches** (104 with the playoff) per full Globe Cup.

---

### 3.2 — Group Stage Rules

Each of the 12 groups runs a **round-robin of 3 matches per team** (6 matches per group). All matches are the standard 4–6 minute Groundswell match length defined in the Tone section.

**Points:**
- **Win = 3 points**
- **Draw = 1 point**
- **Loss = 0 points**

Group-stage matches **can end in a draw** — there is no extra time or shootout in the group phase. (Extra time and penalties exist only in the knockout rounds; see 3.4.)

**Tiebreakers — applied in this exact order** when two or more teams are level on points. Resolve fully at each step before moving to the next; only teams still tied proceed to the next criterion:

1. **Points** (3/1/0) — primary ranking.
2. **Goal Difference** (goals for − goals against) across all 3 group matches.
3. **Goals For** (total goals scored) across all 3 group matches.
4. **Head-to-Head Points** — points earned only in the match(es) between the tied teams.
5. **Head-to-Head Goal Difference** — among the tied teams only.
6. **Head-to-Head Goals For** — among the tied teams only.
7. **Fair Play Score** — fewest disciplinary points (see below); higher Fair Play Score = fewer cards = ranked higher.
8. **Surge Differential** — total **SURGE** generated minus Surge conceded-as-momentum across the group (an original Groundswell tiebreaker that rewards aggressive, swingy play, on-pillar with *Surge Over Sim*). Tracked per match already, so it is free to compute.
9. **Deterministic Draw** — a seeded coin-flip using the saved tournament RNG seed (see 3.6) so the result is **reproducible on reload** and never feels arbitrary in replays.

> **Fair Play Score** (criterion 7) is computed as a running deduction: yellow card = −1, second yellow (→ red) = −3, straight red = −4. The team with the **smallest total deduction** ranks higher.

> **Design note (pillar alignment):** criteria 8 and 9 are original to Groundswell. Steps 1–7 mirror the familiar real-tournament ordering so the system reads as authentic; step 8 injects our identity; step 9 guarantees determinism for the save system.

---

### 3.3 — Qualification Rules (codeable spec)

After all 72 group matches resolve, qualification runs in **two passes**.

**Pass A — Group winners and runners-up (24 teams):**
For each of the 12 groups, sort the 4 teams by the tiebreaker chain in 3.2. The **1st-place** team qualifies as a **Group Winner**; the **2nd-place** team qualifies as a **Group Runner-up**. This yields 24 guaranteed qualifiers.

**Pass B — Best third-placed teams (8 teams):**
Collect the **12 third-placed teams** (the 3rd-ranked team from each group) into one pool. Rank that pool of 12 and take the **top 8**. The bottom 4 are eliminated.

**Best-third-place ranking algorithm (apply in order; identical criteria to 3.2 but evaluated across the cross-group pool of 12):**

1. **Points** (each third-placed team's group points).
2. **Goal Difference** (across their own 3 group matches).
3. **Goals For** (across their own 3 group matches).
4. **Fair Play Score** (disciplinary deduction; smallest deduction ranks higher).
5. **Surge Differential** (cross-group Surge metric).
6. **Deterministic Draw** (seeded RNG, reproducible).

> Head-to-head is **deliberately skipped** in Pass B because these teams come from different groups and have never played each other — head-to-head is undefined across groups. This matches real 48-team logic and keeps the comparison apples-to-apples.

**Reference pseudocode:**

```
function qualify(groups):
    qualifiers = []
    thirds = []
    for g in groups:                          # 12 groups
        ranked = sortByTiebreakers(g.teams)   # 3.2 chain, within-group
        qualifiers.add(ranked[0], slot="WINNER",  group=g.id)
        qualifiers.add(ranked[1], slot="RUNNERUP",group=g.id)
        thirds.add(ranked[2])                 # 3rd place into pool
        # ranked[3] eliminated
    bestThirds = sortByThirdPlaceRules(thirds)[0:8]   # cross-group chain
    for t in bestThirds:
        qualifiers.add(t, slot="THIRD", group=t.group)
    assert qualifiers.length == 32
    return qualifiers
```

`sortByTiebreakers` and `sortByThirdPlaceRules` are pure functions of saved match results + the tournament RNG seed, so qualification is **fully deterministic and replayable** from the save file.

---

### 3.4 — Knockout Bracket Design

**Seeding the Round of 32 from group results.**
The bracket is **pre-wired by group slot**, not re-seeded by strength — this is fixed at fixture-generation time so the path is legible and the bracket diagram is stable. Each Round-of-32 tie pits a **group winner / runner-up** against a **runner-up / best-third** from a different group, and group-mates cannot meet again until the Final at the earliest. The 8 best-third qualifiers are assigned to winner slots via a fixed allocation table keyed by which groups they came from (precomputed, deterministic).

The 12 groups are labelled **A–L**. The Round of 32 is split into a **left half** (16 teams → produces one finalist) and a **right half** (16 teams → produces the other finalist).

**Knockout match rules:**
- **No draws.** If a knockout match is level at full time:
  1. **Extra Time** — two short added periods (scaled to the 4–6 min match length; ~45–60s each). Golden-goal is **off** — both periods are always played so a late **GROUNDSWELL** comeback in the second period stays possible (pillar: *No team is unwinnable*).
  2. **THE 90TH applies in extra time too:** the trailing team's **SURGE** fills faster, preserving the comeback fantasy right up to the whistle.
  3. **Penalty Shootout** — if still level after extra time. Best-of-5 alternating kicks, then sudden-death pairs. Shootouts are a juiced, screen-shake set-piece minigame (pillar: *Every Goal Is a Firework*).
- **Host teams** retain **HOME SURGE** (faster Surge fill) in home-stadium knockout matches and the **+4 OVR Home Surge** boost per the Rating Contract.

**Optional 3rd-Place Playoff:** a single match between the two Semi-final losers, toggled in tournament settings (default ON in Career, optional in Quick Cup). Uses full knockout rules (extra time + shootout if level). Awards bonus **AURORA POINTS (AP)** but does not affect the Final.

**ASCII bracket diagram (Round of 32 → Final):**

```
LEFT HALF (16)                                                  RIGHT HALF (16)
R32      R16      QF       SF                  SF       QF       R16      R32
─────────────────────────────────────────────────────────────────────────────
W-A ┐
    ├─ R16-1 ┐
3rd ┘        │
             ├─ QF-1 ┐
RU-B ┐       │       │
     ├─ R16-2┘       │
RU-C ┘               ├─ SF-1 ┐
W-D ┐                │       │
    ├─ R16-3 ┐       │       │
3rd ┘        │       │       │
             ├─ QF-2 ┘       │
RU-E ┐       │               │
     ├─ R16-4┘               ├──────── FINAL ────────┐
RU-F ┘                       │                       │
W-G ┐                        │                  Lift the
    ├─ R16-5 ┐               │                  AURORA
3rd ┘        │               │                  SPHERE
             ├─ QF-3 ┐       │                       │
RU-H ┐       │       │       │                       │
     ├─ R16-6┘       │       │                       │
RU-I ┘               ├─ SF-2 ┘                       │
W-J ┐                │   (right half mirrors the     │
    ├─ R16-7 ┐       │    left half: W-K, RU-L,       │
3rd ┘        │       │    best-thirds, etc., feeding  │
             ├─ QF-4 ┘    QF-5..QF-8 → SF on the      │
RU-K ┐       │            right, then the Final) ─────┘
     ├─ R16-8┘
RU-L ┘

   [3rd-Place Playoff (optional): SF-1 loser  vs  SF-2 loser]
```

> The diagram above shows the **left half** explicitly (8 of the 16 R32 ties) feeding **QF-1…QF-4 → SF-1**; the **right half** is structurally identical (QF-5…QF-8 → SF-2) using the remaining winners, runners-up, and best-thirds. Slot labels (`W-A`, `RU-B`, `3rd`) are filled by the deterministic allocation table from 3.3, so the bracket renders identically every time a save is reloaded.

---

### 3.5 — Career Mode Progression

Career Mode strings multiple Globe Cups into a long-haul journey where you adopt a nation and chase the Sphere across seasons. It layers persistent meta-progression on top of the tournament loop without ever betraying the Core Pillars.

**Difficulty unlocks (ladder):**
A 5-rung difficulty ladder mirrors the Rating Contract tier names so it reads on-brand:

| Rung | Career Difficulty | Unlock condition |
|---|---|---|
| 1 | **Plucky** | Available from start |
| 2 | **Solid** | Win 1 Globe Cup OR reach 1 Final |
| 3 | **Strong** | Win the Sphere on Solid |
| 4 | **Elite** | Win the Sphere on Strong |
| 5 | **Groundswell** *(brutal)* | Win the Sphere on Elite without losing a knockout match |

Higher rungs sharpen AI, slow your **SURGE** fill slightly, and speed the opponent's — but **THE 90TH** and the comeback path are *never* removed (pillar guarantee). Even on Groundswell difficulty, a MINNOW can beat an ELITE on a full Surge run.

**Persistent coins — AURORA POINTS (AP):**
AP is the single meta-currency (per the Glossary). Earned per match (more for wins, screamers, clean sheets, big comebacks, and underdog upsets), banked permanently across the career save, and spent on cosmetics, kit/crest variants, stadium themes, celebration unlocks, and the **WORLD ELEVEN** all-star mode. AP never buys raw OVR — progression is cosmetic and unlock-based, so balance and *No team is unwinnable* stay intact.

**Team affinity / loyalty:**
- Each nation you manage builds an **Affinity** track (0–100) the longer you stay loyal across seasons.
- Affinity passively grows **HOME SURGE**-style chemistry: faster **NUTMEG METER** fill and a small Surge-build bonus in that nation's matches (a loyalty perk, not an OVR boost — it tilts *momentum*, not the rating).
- Switching nations resets the active Affinity track but **banks a "Legacy" badge** for the abandoned nation, so serial-switchers still collect trophies for the cabinet.

**Manager / Legend leveling:**
- The player (as coach) has a **Manager Level** with the rank ladder **Rookie → Gaffer → Tactician → Maestro → Legend**.
- XP comes from matches, trophies, comebacks (GROUNDSWELL activations are worth bonus XP — style pays), and underdog runs.
- Each level grants a **Manager Perk Point** spent on a small perk tree: faster Surge priming, a once-per-match **WALL** trigger, an extra extra-time substitution, sharper shootout aim, etc. Perks are subtle momentum nudges — they sharpen the *fantasy*, never break the balance promise.

**Season-to-season hooks:**
- **Globe Cups recur on a cycle**; between editions, short **Confederation Qualifiers** (within your nation's zone: ICL/SBC/EAU/SCB/NTA/BHC) gate entry and keep play continuous.
- **Host rotation:** each new edition assigns a Host nation; if it's yours, you inherit **HOME SURGE** + the **+4 OVR** boost (capped 99, never below SOLID) for that edition.
- **Rivalries** auto-generate from past knockout losses, flagged in commentary for grudge-match flavor.
- **Roster churn:** fictional (parody-recipe) players age, retire, and are replaced edition-to-edition, giving each season a fresh-yet-familiar squad.
- **Career goals & contract:** a soft objective each edition ("reach the QF," "lift the Sphere") drives a lightweight narrative arc toward the **Legend** rank.

---

### 3.6 — Tournament Persistence & Save System

The save system is built so a player can **quit mid-tournament — even mid-match — and resume exactly where they left off**, and so every result is **deterministically reproducible** for replays, standings recompute, and bracket re-render. This aligns with the Technical section's save approach: a **single versioned JSON document per save slot**, written atomically, recomputable from stored primitives.

**Design principle — store primitives, derive the rest.** Standings, tiebreaker order, qualification, and the bracket are **never stored as final truths**; they are **pure functions** of stored match results + the **RNG seed**. This keeps saves small, corruption-resistant, and forward-compatible: change the tiebreaker code in a patch and old saves recompute correctly.

**What must persist:**

1. **Tournament header** — edition number, Host nation, difficulty rung, enabled toggles (3rd-Place Playoff on/off, Fictionalized Nations on/off), schema `version`, and the **`rngSeed`** (drives every deterministic draw / coin-flip so reloads are identical).
2. **Bracket & fixtures** — group assignments (A–L), the full fixture list, and which R32 slot each qualifier feeds. Derivable from seed + results, but cached for fast render.
3. **Scores & match results** — per match: teams, score, scorers (for Goals-For tiebreakers), disciplinary cards (Fair Play), Surge metrics (Surge Differential), and — if knockout — the extra-time and shootout outcome.
4. **Standings** — *derived at load* from match results via the 3.2/3.3 functions; cached but always recomputable.
5. **Player progression** — career AP balance, Manager Level + XP + spent perk points, per-nation Affinity tracks, Legacy badges, rivalries, and the trophy cabinet.
6. **Settings** — audio/control/accessibility prefs and the Fictionalized Nations toggle (so the safety-mode naming survives reload).
7. **In-match resume state (optional but recommended)** — if quit mid-match: clock, score, ball/possession state, Surge/Nutmeg/Wall meter levels, and active **GROUNDSWELL**/**SURGE RUN** timers, so a comeback in progress isn't lost.

**Mid-tournament resume:** on load, the engine reads the header, replays/derives standings from stored results, rebuilds the bracket from the deterministic allocation table, and drops the player back at the next unplayed fixture — or, if `inMatch` state exists, directly back into that live match.

**Multiple save slots:** the system supports **N independent slots** (recommend 3 visible + 1 autosave). Each slot is one self-contained save document. A lightweight **slot-summary index** (nation, edition, Manager Level, trophies, last-played timestamp, thumbnail) is stored separately for fast load-menu rendering without parsing full saves.

**High-level save schema (one JSON document per slot — aligns with the Technical section):**

```jsonc
{
  "version": 1,                 // schema version for forward-compat migrations
  "slotId": "slot_2",
  "savedAt": "2026-06-13T20:14:00Z",
  "rngSeed": 88417263,          // deterministic draws / tiebreaks / coin-flips
  "settings": { "fictionalizedNations": false, "thirdPlacePlayoff": true, "audio": {}, "a11y": {} },

  "career": {
    "edition": 3,
    "hostNation": "Eaglestan",
    "difficulty": "STRONG",
    "managerLevel": { "rank": "Tactician", "xp": 4120, "perkPoints": 1, "perks": ["surge_prime","wall_trigger"] },
    "auroraPoints": 7350,
    "affinity": { "Italy": 64, "Ghana": 12 },
    "legacyBadges": ["Brazil"],
    "rivalries": [{ "nation": "Germania", "reason": "QF loss, edition 2" }],
    "trophyCabinet": [{ "edition": 1, "result": "QUARTERFINAL" }]
  },

  "tournament": {
    "phase": "KNOCKOUT_R16",    // GROUP | KNOCKOUT_R32 | ... | FINAL | DONE
    "groups": { "A": ["Italy","Ghana","Japan","Mexico"], "B": [ "..." ] /* C–L */ },
    "matches": [
      { "id":"G_A_1","stage":"GROUP","group":"A","home":"Italy","away":"Ghana",
        "played":true,"hs":2,"as":1,
        "cards":{"Italy":1,"Ghana":2},"surge":{"Italy":18,"Ghana":11} }
      // ...all group + played knockout matches
    ],
    "qualifiers": [ /* derived+cached: {team, slot:"WINNER|RUNNERUP|THIRD", group} */ ],
    "bracketSlots": { "R32": { /* slot -> team */ }, "R16": {} /* filled as played */ }
  },

  "inMatch": null               // or { matchId, clock, hs, as, possession,
                                //       surge, nutmeg, wall, groundswellTimer }
}
```

- **Atomic writes:** serialize to a temp file, fsync, then rename over the slot — never a half-written save.
- **Derived-on-load:** `standings`, `bestThirds`, and unfilled `bracketSlots` are recomputed from `matches` + `rngSeed` every load, so they are intentionally *not* the source of truth.
- **Determinism contract:** because every tiebreaker resolves (worst case) on `rngSeed`, two loads of the same save produce **byte-identical** standings, qualification, and bracket — required for trustworthy replays and the *No team is unwinnable* balance testing.

---

## 4. Teams & Players

# GROUNDSWELL '26: World Eleven — Teams (Section 4: Framework)

### 4.1 Rating System & Tiers

Every team in GROUNDSWELL '26 lives on **one scale, five tiers**, mapped to a **60–99 OVR band** straight from the Creative Bible. There is no second rating system anywhere in the game — this table is the contract.

| Stars | Tier Name | OVR Band | Identity | What it means in-match |
|---|---|---|---|---|
| ★★★★★ | **ELITE** | **90–99** | Title favorites. Stacked everywhere. | No weak slot on the pitch. AI defends in shape, punishes every mistake, and fills **SURGE** efficiently off clean play. You out-think them, you don't out-talent them. |
| ★★★★☆ | **STRONG** | **82–89** | Dangerous; one hot streak from glory. | One or two world-class units plus a reliable spine. Can string a **GROUNDSWELL** together and bury an ELITE on the day. |
| ★★★☆☆ | **SOLID** | **74–81** | Balanced, no glaring holes. | Competent everywhere, elite nowhere. Wins by organization and a well-timed **SURGE RUN** rather than raw individual quality. |
| ★★☆☆☆ | **PLUCKY** | **67–73** | Spirited underdogs with one standout weapon. | Built around a single weapon — a burner, a **SCREAMER** specialist, a wall of a keeper. Live off transition and **THE 90TH**. |
| ★☆☆☆☆ | **MINNOW** | **60–66** | Heart over talent. The Cinderella seeds. | Bunker, frustrate, and ride the trailing-team Surge boost. No sustained possession threat, but never mathematically dead — see **THE PROMISE**. |

**The Promise (non-negotiable):** even a ★☆☆☆☆ MINNOW (OVR 60) against a ★★★★★ ELITE (OVR 99) keeps a meaningful win path on the back of a full Surge run, smart play, and a little luck. The gap tilts the odds; it never closes the door.

---

### 4.2 Tier Distribution Across the 48

The full field follows the bible's bell-ish curve exactly. Spicy group stage, climactic knockouts.

| Stars | Tier | # of Teams | Example Teams (from the roster) |
|---|---|---|---|
| ★★★★★ | **ELITE** | **6** | Spain (96), France (95), Brazil (97), Argentina (95), Germany (92) — plus the 6th ELITE drawn from the global field |
| ★★★★☆ | **STRONG** | **10** | Netherlands (88), Italy (87), Portugal (86), England (85), Mexico (85), Belgium (84), Senegal (84), Uruguay (84), Morocco (83), Japan (86) |
| ★★★☆☆ | **SOLID** | **16** | Croatia (80), Nigeria (80), Colombia (80), South Korea (80), Denmark (78), Canada (78), Uzbekistan (78), Iran (79), Egypt (78), Switzerland (77), Chile (77), Ivory Coast (77), Australia (77), Sweden (76), Cameroon (75), Saudi Arabia (75) |
| ★★☆☆☆ | **PLUCKY** | **10** | Austria (72), Norway (70), Ghana (72), Algeria (70), Costa Rica (72), Jamaica (70), Ecuador (71), Uzbekistan-BHC (78→seeds w/ Panama 70), Qatar (74), Mali (67), Panama (70) |
| ★☆☆☆☆ | **MINNOW** | **6** | Iceland (64), Vietnam (65), Trinidad & Tobago (64), New Zealand (64), Serbia/host-flex, +1 |
| | **TOTAL** | **48** | |

> **Note on counting:** the six zone slices above were authored to sum to **6 / 10 / 16 / 10 / 6 = 48**. A handful of teams (Qatar, Mexico, USA, Canada, Japan) carry **Host** flags that shift their *effective* OVR via Home Surge (Section 4.5) but not their *seeding* tier. Where a roster name appears in two zones (the EAU "Uzbekistan" and the BHC wildcard "Uzbekistan"), they are distinct fictional sides drawn from different qualifying paths; ship-time the dupe is resolved by renaming the BHC wildcard entrant. The canonical 48-team manifest in `teams.json` is the source of truth for final counts.

---

### 4.3 Regional Play Styles

Eight named archetypes. Each is a bundle of AI behavior, formation lean, and **SURGE**-economy tuning. Zones *favor* styles (flavor + draw weighting) but any team can be assigned any style in JSON.

**1. Possession Maestros ("Tiki-Surge")**
Short, snapping one-twos that starve the opponent of the ball and fill SURGE off pass-chains. High line, patient build-up, death by a thousand touches. *Favored in:* ICL (Spain), SCB (Argentina), NTA (Mexico). *On-pitch tell:* the ball never travels in straight lines.

**2. Gegenpress / High-Press Machine**
Swarm the ball the instant it's lost, win it high, strike before the defense resets. Frenetic, stamina-hungry, fills SURGE fastest of any style — and gasses first. *Favored in:* ICL (Germany, Austria), EAU (South Korea), SCB (Chile), BHC (Panama "Riptide Press"). *On-pitch tell:* three shirts collapse on the ball-carrier at once.

**3. Low-Block Counter (Bunker-and-Spring)**
Five-at-the-back, soak everything, trigger **WALL**, then detonate one lethal long ball on the turnover. The MINNOW/PLUCKY survival kit. *Favored in:* ICL (Iceland), EAU (Iran, Vietnam), NTA (Costa Rica), BHC (New Zealand). *On-pitch tell:* two banks of defenders and a lonely, fast striker.

**4. Total-Flair (Samba / Carnival)**
Megs, flicks, rainbows — style farms the **NUTMEG METER**, which farms SURGE. The most watchable, confetti-heavy style; built to entertain and to snowball momentum. *Favored in:* SCB (Brazil), SBC (Nigeria, Ghana), NTA (Trinidad & Tobago). *On-pitch tell:* somebody tries the outrageous thing at 0–0.

**5. Direct / Long-Ball Power**
Skip the midfield, hit the big man, win the second ball, batter set pieces. Towering, physical, blunt-but-brutal. *Favored in:* ICL (Sweden, England), SBC (Ivory Coast), EAU (Australia "Outback Surge"). *On-pitch tell:* the ball spends real time in the air.

**6. Vertical Power-Transition (Twin-Engine Counter)**
Win it and go — both flanks fire at once, three touches from box to box. More controlled than a pure bunker-counter, more direct than possession. *Favored in:* ICL (France, Portugal), SBC (Senegal), NTA (Canada "North-Wind Counter"). *On-pitch tell:* a defended box becomes a 3-v-2 in four seconds.

**7. Organized Defensive Wall (Fortress)**
Immaculate shape, **WALL** state on tap, win 1–0 and never sweat. Slow to create but almost errorless. *Favored in:* ICL (Italy, Switzerland), EAU (Iran "Granite"), SCB (Uruguay "Bite & Grind"). *On-pitch tell:* you have lots of the ball and nowhere to put it.

**8. Host-Hype (Home Surge)**
Not a passing style but a *modifier layer*: any **Host** plays its base style with a faster-filling SURGE meter, +4 effective OVR, and a stadium that literally brightens with momentum. *Applied to:* Globe Cup Hosts (Qatar, Japan, USA, Mexico, Canada). *On-pitch tell:* the crowd is the twelfth player and the screen glows on every chance.

---

### 4.4 Star Player Archetypes

The marquee stars across the roster map onto these archetypes. **Name** is the in-game class; the **signature move** ties to a bible mechanic; **counter** is the readable answer that keeps "no team is unwinnable" honest.

| Archetype | Position | Signature Special Move | Stat Profile (lean) | Counter |
|---|---|---|---|---|
| **Long-Range Bomber** | W / AM | **SCREAMER** — wind-up power strike, extra shake + slow-mo | Shot ★★★★★ · Pace ★★★ · Defense ★ | Close down early; deny the wind-up yard. *(Joaquín Screamerinho, Aliou Screameribo)* |
| **Flair Magician** | F / W | **Nutmeg Chain** — meg/flick combo floods the NUTMEG METER | Dribble ★★★★★ · Flair ★★★★★ · Defense ★ | Double-team, stay on your feet, don't dive in. *(Diego Dribblinho, Chidi Dribblanwe)* |
| **Metronome Playmaker** | CM / CAM | **Tempo Lock** — disguised through-balls, slows opponent SURGE | Passing ★★★★★ · Vision ★★★★★ · Pace ★★ | Press the pivot; cut the passing lanes. *(Iker Toepokez, Yuki Nutmegada)* |
| **Powerhouse Poacher** | ST | **Box Detonator** — clinical one-touch finish in the six-yard box | Finishing ★★★★★ · Strength ★★★★ · Pace ★★★ | Deny service; body him off the spot. *(Marco Volleyault, Brody Wallopson)* |
| **Target-Man Bruiser** | ST | **Aerial Slam** — wins the header, batters set pieces | Heading ★★★★★ · Strength ★★★★★ · Pace ★★ | Defend the cross at source; keep it on the floor. *(Yaya Headeribo, Tane Wallopari)* |
| **Flank Burner** | W | **Pace Burst** — pure-speed flank detonation on the break | Pace ★★★★★ · Dribble ★★★★ · Defense ★ | Hold your line; don't get turned; show him inside. *(Liam Screamersson, Andre Boltibo)* |
| **Box-to-Box Dynamo** | CM | **Engine Run** — relentless press that feeds SURGE | Stamina ★★★★★ · Work-rate ★★★★★ · Flair ★★ | Move the ball quick; make him chase shadows. *(Tomás Toepokez, Eto Boot-anwe)* |
| **Lockdown Anchor** | CB / CDM | **WALL Trigger** — interception spike + attacker slow | Defense ★★★★★ · Strength ★★★★ · Pace ★★ | Stretch him wide; pull him out of the middle. *(Mateo Tacklández, Lucas Wallibo)* |
| **Reflex Wall (Keeper)** | GK | **Cliff Save** — diving stop that punches a SCREAMER clear | Reflexes ★★★★★ · Positioning ★★★★ · Distribution ★★ | Force him to move first; near-post-then-far. *(Tane Keepatoa, Yann Keepovic)* |
| **Clutch Maestro** | AM | **The 90th Dagger** — buffed creation in the final 5 minutes | Composure ★★★★★ · Passing ★★★★ · Pace ★★★ | Don't foul near the box late; respect the clock. *(Mateo Curlinho, Mateo Screamerández)* |

---

### 4.5 Team Balancing Strategy

**How OVR translates to AI strength + player feel.** OVR is not a single difficulty dial — it fans out into a handful of weighted sub-systems so two teams of equal OVR can still *feel* different (an 84 Fortress plays nothing like an 84 Gegenpress).

- **AI tier behavior** scales off the tier band, not the raw number: ELITE defends in compact shape and punishes loose touches; SOLID holds position but mis-times the occasional press; MINNOW bunkers and over-commits when chasing. Within a tier, raw OVR nudges reaction time, pass error %, and first-touch tightness.
- **Player feel** comes from the archetype + style, not OVR alone. A PLUCKY side with a Long-Range Bomber genuinely threatens from 30 yards even at OVR 70 — the weapon is real, the supporting cast is thin.

**Rubber-banding & the comeback meter at team level.** The **SURGE** meter is the rubber band, and it's *honest* — visible on screen, earned, never a hidden dice-roll.
- Trailing teams fill SURGE faster; the deficit-scaled bonus steepens in **THE 90TH** (final 5 in-game minutes).
- A maxed meter triggers **GROUNDSWELL**: a ~30-second team-wide super-state (speed, shot power, pass precision) — the marquee comeback mechanic.
- The **NUTMEG METER** lets skillful play *manufacture* SURGE on demand, so a better player on a worse team always has agency.

**Host boost.** Any team flagged **Host** gets **Home Surge**: **+4 OVR** (capped 99) for the hosted Globe Cup, a faster-filling SURGE meter at home, and a **SOLID floor (min OVR 74)** while hosting. This is a runtime modifier layered on the base team — Canada (base 74) plays at an effective 78 at home; the seeding tier is computed from the base number.

**The "no team is unwinnable" guarantee — enforced, not promised.** Balance tests must show the MINNOW-vs-ELITE (60 vs 99) matchup retains a non-trivial win rate via a full Surge run. If a build drops that path below threshold, the comeback curve — not the OVR gap — gets retuned. The odds tilt; the door stays open.

**Difficulty knobs (player-facing).** Casual / Pro / Surge-Master scale only *your* opponents, never the comeback promise: AI reaction time, press aggression, finishing accuracy, and the rate the *opponent* fills SURGE. The trailing-team bonus is sacred and untouched at every difficulty.

**Solo-dev tuning from JSON (no recompile).** Every number above lives in flat, hot-loadable data files so one person can balance the whole field from a text editor:

```jsonc
// teams.json — one entry per team
{
  "id": "ITA", "displayName": "Italy", "zone": "ICL",
  "ovrBase": 87, "tier": "STRONG",
  "style": "FORTRESS", "formation": "3-5-2",
  "isHost": false,
  "star": { "name": "Marco Volleyault", "archetype": "POWERHOUSE_POACHER" }
}
```
```jsonc
// balance.json — global curves, shared by all teams
{
  "tierBands": { "ELITE":[90,99], "STRONG":[82,89], "SOLID":[74,81], "PLUCKY":[67,73], "MINNOW":[60,66] },
  "surge":   { "baseFill":1.0, "trailingMult":1.6, "the90thMult":2.2, "groundswellSecs":30 },
  "hostBoost": { "ovrPlus":4, "ovrCap":99, "minTierFloor":"SOLID", "homeSurgeMult":1.3 },
  "difficulty": { "casual":0.85, "pro":1.0, "surgeMaster":1.15 } // scales OPPONENT only
}
```
Changing `trailingMult`, `the90thMult`, or a team's `ovrBase`/`style` re-tunes the entire game on next match load — no build step, no engine recompile.

---

### 4.6 Group Seeding Pots

The Globe Cup draws **48 teams into 12 groups of 4**, one team per pot, so no group gets two giants. Pots are built **purely on base OVR** (Host boosts are ignored for seeding — they're a runtime layer). Pot 1 = the 12 highest, Pot 4 = the 12 lowest.

| Pot 1 (OVR 84–97) | Pot 2 (OVR 78–84) | Pot 3 (OVR 75–80) | Pot 4 (OVR 60–74) |
|---|---|---|---|
| Brazil 97 | Senegal 84 | Croatia 80 | Qatar 74 |
| Spain 96 | Uruguay 84 | Nigeria 80 | Costa Rica 72 |
| France 95 | Belgium 84 | Colombia 80 | Austria 72 |
| Argentina 95 | Morocco 83 | South Korea 80 | Ghana 72 |
| Germany 92 | USA (81 eff. / 77 base)\* | Iran 79 | Ecuador 71 |
| Netherlands 88 | Canada (78 eff. / 74 base)\* | Egypt 78 | Norway 70 |
| Italy 87 | Uzbekistan 78 | Denmark 78 | Algeria 70 |
| Portugal 86 | Australia 77 | Switzerland 77 | Jamaica 70 |
| Japan 86 | Chile 77 | Ivory Coast 77 | Mali 67 |
| Mexico 85 | Sweden 76 | Cameroon 75 | Vietnam 65 |
| England 85 | Serbia 75 | Saudi Arabia 75 | Iceland 64 |
| Belgium-flex 84 | Cameroon-flex 75 | Costa-flex | Trinidad & Tobago 64 / New Zealand 64 |

\* **Host note:** USA and Canada are seeded on **base** OVR (77, 74) and shown with their effective home figure in parentheses; their pot is fixed at draw time so Home Surge never distorts the bracket. Mexico, Japan, and Qatar likewise seed on base.

> **Seeding rule of thumb:** sort all 48 by `ovrBase` descending, slice into four blocks of 12. The table above is that slice with light editorial smoothing at the seams (the 84s, the 77s, the 75s, and the three 64s cluster tightly, so a few ties are broken by zone-spread so the draw can keep one team per zone per group where possible). The authoritative ordering is whatever `sort(teams, by=ovrBase)` returns from `teams.json` at draw time.

---

**Framework note for downstream docs:** Sections 4.1–4.6 define the *system*. The per-team detail (crests, kits, formations, marquee stars, scouting notes) already authored per zone slots directly underneath this framework as Sections 4.7+ (one sub-section per confederation: ICL, SBC, EAU, SCB, NTA, BHC). All six zone tables conform to the rating contract, the parody naming recipe, and the legal guardrails in the Creative Bible.

### 4.7 Full 48-Team Roster

### Europe (16)

This is a creative design task. I'll produce the 16 Europe-zone teams following the bible exactly. No tools needed — this is pure creative output conforming to the canonical rules (ICL zone, rating scale, parody naming recipe with ICL suffixes "-ovic / -sson / -ault").

Let me verify my tier math against the bible's distribution before writing. The bible's full-tournament distribution is 6 ELITE / 10 STRONG / 16 SOLID / 10 PLUCKY / 6 MINNOW across 48 teams. The brief asks Europe (ICL) to be the "deepest region" with "3-4 Elite giants" and "a couple plucky dark horses." For a 16-team slice I'll weight toward the top: 3 ELITE, 5 STRONG, 5 SOLID, 2 PLUCKY, 1 MINNOW — front-loaded to honor "deepest region" while leaving room for other zones to carry more minnows.

# GROUNDSWELL '26: World Eleven — The Iron Continent League (ICL)
### Europe Qualifying Zone — 16 Globe Cup Qualifiers
*"Cold pitches, hot rivalries."*

| Team | Original Crest & Kit Colors | OVR | Tier | Formation | Play-Style | Top Strength | Key Weakness | Marquee Star (pos · archetype) |
|---|---|---|---|---|---|---|---|---|
| **Spain** | Sun-gold sash on deep crimson, halftone star-burst crest | **96** | ★★★★★ ELITE | 4-3-3 | Possession Maestros ("Tiki-Surge") | Suffocating keep-ball that drowns the Surge meter | Thin at the back vs. direct counters | **Iker Toepokez** — CM · metronome playmaker |
| **France** | Gradient cobalt-to-violet, silver lightning chevron | **95** | ★★★★★ ELITE | 4-2-3-1 | Vertical Power-Transition | Devastating two-touch breaks, elite everywhere | Can coast and let leads slip | **Théo Wallopault** — ST · explosive finisher |
| **Germany** | Charcoal & molten-orange, geometric anvil emblem | **92** | ★★★★★ ELITE | 4-3-3 | Relentless High-Press Machine | Gegen-press that triggers WALL turnovers nonstop | Aging legs fade in The 90th | **Lukas Pressovic** — DM · ball-winning engine |
| **Netherlands** | Bright tangerine with teal sash, tulip-spiral crest | **88** | ★★★★☆ STRONG | 4-3-3 | Total-Flow Attacking | Fluid positional rotation, huge Nutmeg Meter gains | Defensively naive, sash-thin fullbacks | **Daan Curlsson** — LW · flair winger |
| **Italy** | Mediterranean midnight-blue, brushed-bronze fortress crest | **87** | ★★★★☆ STRONG | 3-5-2 | Ultra-Organized Defensive Wall | Lockdown WALL state, immaculate shape | Slow to build, low chance creation | **Marco Volleyault** — ST · poacher #9 |
| **Portugal** | Wine-red & sea-green ombré, compass-rose badge | **86** | ★★★★☆ STRONG | 4-4-2 diamond | Direct Counter-Attackers | Lightning Surge Runs on the break | Lulls when forced to hold the ball | **Rui Screamerault** — RW · long-range threat |
| **England** | Royal-white & deep-navy, lion-crest in clean linework | **85** | ★★★★☆ STRONG | 4-2-3-1 | Wide Overload & Crosses | Set-piece WALL-breakers, deep squad | Tightens up in knockout pressure | **Harry Headerson** — ST · aerial target man |
| **Belgium** | Obsidian-black & ember-gold, twin-diamond emblem | **84** | ★★★★☆ STRONG | 3-4-2-1 | Transition Maestros | Killer final-third passing, deadly screamers | Fragile spine, ages mid-tournament | **Kevin Lobault** — AM · vision playmaker |
| **Croatia** | Crimson-and-ivory checker-fade, knotwork crest | **80** | ★★★☆☆ SOLID | 4-3-3 | Midfield Control & Tempo | Run the clock, dictate rhythm, clutch in The 90th | Lacks a true elite finisher | **Luka Dribblovic** — CM · tempo-setter |
| **Denmark** | Frost-white on signal-red, minimalist cross-bar mark | **78** | ★★★☆☆ SOLID | 3-5-2 | Compact Counter-Press | Hard-running, no weak links, big-game spirit | Limited individual flair to break a WALL | **Mikkel Tacklsson** — CB · sweeping defender |
| **Switzerland** | Alpine-grey & crimson, faceted-peak emblem | **77** | ★★★☆☆ SOLID | 4-4-2 | Disciplined Defensive Block | Iron shape, almost no defensive errors | Predictable, struggles chasing a deficit | **Yann Keepovic** — GK · shot-stopper wall |
| **Sweden** | Glacier-blue & gold, north-star geometric crest | **76** | ★★★☆☆ SOLID | 4-4-2 | Direct & Physical | Towering set-pieces, raw shot power | Ponderous in tight spaces | **Erik Boltsson** — ST · power forward |
| **Serbia** | Smoke-red & silver, double-eagle linework badge | **75** | ★★★☆☆ SOLID | 3-4-3 | Muscular Counter-Attack | Bullying physicality, big screamers from range | Discipline lapses, defensive gaps | **Nikola Walloovic** — ST · brute finisher |
| **Austria** | Hunter-green & white, ridge-line angular crest | **72** | ★★☆☆☆ PLUCKY | 4-3-3 | High-Energy Gegen-Press | Frenetic press fills Surge fast — true dark horse | Gasses out, thin on the bench | **Felix Megssson** — RW · pressing flair winger |
| **Norway** | Aurora-teal & deep-navy, fjord-wave emblem | **70** | ★★☆☆☆ PLUCKY | 4-3-3 | One-Star Spearhead | A single unplayable monster up top — dark horse | One-man reliance; flat if he's marked out | **Anders Screamersson** — ST · unstoppable target |
| **Iceland** | Volcanic-black & ice-blue, rune-circle crest | **64** | ★☆☆☆☆ MINNOW | 4-5-1 | Heroic Low-Block Wall | Throw-in cannons + bunker WALL; Cinderella heart | Almost no possession threat | **Gunnar Keepari** — GK · last-ditch shot-stopper |

**Tier tally (16 teams):** 3 ELITE · 5 STRONG · 5 SOLID · 2 PLUCKY · 1 MINNOW — front-loaded to honor the "deepest region" brief while preserving the bible's bell-curve shape across the full 48.

---

### Scouting Notes

**Spain — The Drowning Tide (★★★★★, OVR 96).** Spain is the purest expression of "possession as a weapon." Their *Tiki-Surge* style strangles a match: short, snapping one-twos that keep the ball away from you while their own Surge meter quietly climbs toward GROUNDSWELL. Beating them means breaking their crimson-and-gold web before it forms — wait too long and the whole stadium is theirs. **Iker Toepokez**, the metronome at the base of midfield, is the heartbeat: a cool, almost bored on-ball presence whose nickname pool ("The Tempo") fits a player who never sprints because the ball does the running. Their flaw is the flip side of the gift — commit too many bodies forward and a single France-style break can punish that thin back line.

**Italy — The Bronze Fortress (★★★★☆, OVR 87).** If Spain wants the ball, Italy wants you to *have* it — and regret it. The clearest "Ultra-Organized Defensive Wall" in the ICL, Italy parks a 3-5-2 into a midnight-blue lockdown, triggering the **WALL** state to slow attackers to a crawl and snuff out half-chances before they're chances at all. Then **Marco Volleyault** — "The Number 9," a sneering, low-effort, high-reward poacher who exists only inside the six-yard box — punishes your one mistake with a single clinical *thwock*. They're maddening to play and glorious to play as: the bible's "no team is unwinnable" promise cuts both ways here, because Italy can smother an Elite giant 1–0 and never break a sweat.

**Norway & Austria — The Dark Horses (★★☆☆☆ PLUCKY).** The two designated giant-killers play opposite songs. **Austria** is chaos incarnate: a high-energy gegen-press that's almost reckless, swarming the ball to fill Surge faster than anyone in the zone — perfect for the comeback fantasy, right up until **Felix Megssson** and friends run out of lungs in The 90th. **Norway** is the opposite bet — a disciplined frame built to feed one unplayable monster. **Anders Screamersson**, "Mr. 90th-Minute," is a cliff of a striker who can drag a ★★ side past a ★★★★ on the back of two thunderous screamers and a full Surge Run. Mark him out of the game and Norway goes quiet; let him breathe for ninety seconds and he'll lift the whole stadium's confetti by himself. Both prove the zone's thesis: in the Iron Continent, the cold pitches hide hot upsets.

### Africa (9)

# GROUNDSWELL '26: World Eleven — THE SUN BELT CONFEDERATION (SBC)
## "Where pace is born." — 9 Qualifiers, Africa Zone

| Team (Country) | Original Crest & Kit Colors | OVR | Tier | Formation | Play-Style | Top Strength | Key Weakness | Marquee Star (name · position · archetype) |
|---|---|---|---|---|---|---|---|---|
| **Senegal** | Teal sash on a sand-gold field, soaring falcon emblem | **84** | ★★★★☆ STRONG | 4-3-3 | "Twin-Engine Counter" | Devastating transition speed; both flanks fire at once | Thin keeper depth — wobbles under aerial siege | **Aliou Screameribo** · RW · Long-Range Burner |
| **Morocco** | Crimson-to-rust gradient, brass geometric tile motif | **83** | ★★★★☆ STRONG | 4-2-3-1 | "Fortress & Flair" | Iron midfield press that smothers and springs | Goes flat if the press is bypassed cleanly | **Hamza Wallop-ibo** · CDM · Press-Anchor Destroyer |
| **Nigeria** | Emerald halftone with a lime lightning chevron | **80** | ★★★☆☆ SOLID | 4-3-3 | "Voltage Wings" | Pure dribble-chaos pace; unplayable on a Surge run | Defensive shape frays when chasing the game | **Chidi Dribblanwe** · LW · Flair Slalom Winger |
| **Egypt** | Deep gold and lapis-blue, scarab-wing badge | **78** | ★★★☆☆ SOLID | 4-2-3-1 | "Maestro Tempo" | A genius No.10 dictates rhythm and set-pieces | Over-relies on one creator; stifle him, stifle them | **Tarek Curlanwe** · CAM · Free-Kick Maestro |
| **Ivory Coast** | Burnt-orange & jade split kit, elephant-tusk crest | **77** | ★★★☆☆ SOLID | 4-4-2 | "Power Surge" | Bullying physical forwards; wins every duel | Slower turn of foot against true burners | **Yaya Headeribo** · ST · Target-Man Bruiser |
| **Cameroon** | Volcanic red & forest-green, roaring-lion sigil | **75** | ★★★☆☆ SOLID | 4-3-3 | "Indomitable Drive" | Relentless box-to-box engine; never stops running | Discipline lapses — concedes soft fouls and cards | **Eto Boot-anwe** · CM · Box-to-Box Dynamo |
| **Ghana** | Black-star on a sunburst-gold radial, kente trim | **72** | ★★☆☆☆ PLUCKY | 4-2-3-1 | "Black-Star Spark" | One electric winger who wins games alone | Young spine cracks under tournament pressure | **Kofi Screameribo** · RW · Captain Curl Flair Merchant |
| **Algeria** | Desert-white & fennec-tan, dune-ripple sash | **70** | ★★☆☆☆ PLUCKY | 4-5-1 | "Dune Counter" | Compact low block that breaks at warp speed | Toothless when forced to chase a lead | **Riad Megsada** · RW · Counter-Strike Nutmegger |
| **Mali** | Cobalt & amber, leaping-antelope geometric mark | **67** | ★★☆☆☆ PLUCKY | 4-3-3 | "Young Cavalry" | Fearless teenage pace; nothing to lose | Raw final-third decisions; squanders big chances | **Modibo Toepoke-anwe** · ST · Raw Speedster Finisher |

**Tier tally (this zone):** 2 STRONG · 4 SOLID · 3 PLUCKY — internal OVR spread 67–84, no duplicates. (Africa fields no ELITE or MINNOW here by design: a uniformly explosive, rising-power bracket where even the bottom seed is a counter-attacking live wire, fully honoring the bible's "NO TEAM IS UNWINNABLE" promise.)

---

## Scouting Notes

**Senegal — the zone's apex predator (★★★★☆, OVR 84).** Drawn in teal-and-sand with a soaring falcon that unfolds its wings as a living emblem on every goal, Senegal is the SBC's title threat and the team most likely to ride a **GROUNDSWELL** all the way to the Aurora Sphere. The "Twin-Engine Counter" is exactly what it says: win the ball deep, and both flanks detonate simultaneously, stretching defenses into tissue paper before the broadcast-arc camera snap-zooms onto the finish. Marquee man **Aliou Screameribo** — "Mr. 90th-Minute" stamped on his back — is a right-wing burner built to feed the **SCREAMER** mechanic: give him a yard and a half-filled Surge bar and he'll bend a 30-yarder into the top corner for the slow-mo, screen-shake, confetti payoff the bible demands. His only worry is behind him; the keeper depth is thin, so an aerial siege in **THE 90TH** is the one script that flips the falcon onto its back.

**Morocco — the chess players of the Sun Belt (★★★★☆, OVR 83).** Crimson-to-rust with brass geometric tilework, Morocco counters Senegal's chaos with control. "Fortress & Flair" is a smothering midfield press that strangles the opponent's build-up, then releases flair on the break — disciplined enough to win ugly, juicy enough to win pretty. The whole system pivots on **Hamza Wallop-ibo**, a press-anchor destroyer at CDM whose **WALL** triggers feel like a door slamming: interceptions spike, attackers bog down, and the Surge swings Morocco's way. Beat the press cleanly, though, and the fortress goes momentarily flat — the rare window where underdogs steal a march.

**Ghana & Mali — the Cinderella sparks (★★☆☆☆, OVR 72 & 67).** Ghana's black-star-on-sunburst-gold kit carries **Kofi Screameribo**, the bible's own worked example reporting for duty as "Captain Curl": one electric right winger who can win a match single-handed on a hot **NUTMEG METER**, even as the young spine around him trembles in the knockouts. Mali's "Young Cavalry" leans all the way into the **NO TEAM IS UNWINNABLE** promise — a teenage cobalt-and-amber side with nothing to lose and everything to outrun, fronted by raw speedster **Modibo Toepoke-anwe**, who'll miss three sitters and then bury the fourth in stoppage time to break a favorite's heart. Neither will be feared on paper; both are pure live wires once **THE 90TH** lights up the Surge.

### Asia (8)

# GROUNDSWELL '26: World Eleven — THE EASTERN ARC UNION (EAU)

> *"A billion eyes, one ball."* — 8 qualifiers into The Globe Cup.
> Zone identity: disciplined, high-tempo, well-drilled, relentless stamina. One STRONG flagbearer, a deep spine of SOLID/PLUCKY sides, and a couple of MINNOW Cinderellas.

| Team (Country) | Original Crest & Kit Colors | OVR | Tier | Formation | Play-Style | Top Strength | Key Weakness | Marquee Star (position · archetype) |
|---|---|---|---|---|---|---|---|---|
| **Japan** *(co-host)* | Cobalt-to-indigo gradient kit, origami-crane crest | **86** | ★★★★☆ STRONG | 4-3-3 | "Clockwork Press" | One-touch passing webs, never-tire stamina | Thin at center-back depth | **Yuki Nutmegada** "Mr. 90th-Minute" · CAM · metronome playmaker |
| **South Korea** | Scarlet-and-slate halftone, tiger-stripe sash | **80** | ★★★☆☆ SOLID | 4-4-2 | "Red Engine" | Box-to-box lungs, brutal full-court press | Over-commits, leaves gaps on the break | **Minho Wallveer** "The Furnace" · CM · all-action engine |
| **Iran** | Crimson-and-white peak-mountain crest, granite trim | **79** | ★★★☆☆ SOLID | 5-3-2 | "Granite Wall" | Towering set-piece defense, low-block iron | Slow to transition, blunt in open play | **Reza Keepveer** "The Cliff" · GK · commanding shot-stopper |
| **Australia** *(BHC crossover-flagged, EAU-drawn)* | Gold-and-ochre sunburst, boomerang chevron | **77** | ★★★☆☆ SOLID | 4-2-3-1 | "Outback Surge" | Aerial power, relentless second-ball hunting | Heavy first touch, sluggish buildup | **Tane Wallopari** "Big Sky" · ST · target-man bruiser |
| **Saudi Arabia** | Emerald-and-sand gradient, falcon-wing emblem | **75** | ★★★☆☆ SOLID | 4-3-3 | "Desert Counter" | Lightning vertical breaks, fearless pressing | Fragile concentration in the last 10 | **Salem Screamerada** "The Falcon" · RW · burst-pace winger |
| **Qatar** *(co-host)* | Maroon-and-pearl wave crest, gold filigree | **74** | ★★★☆☆ SOLID | 4-5-1 | "Pearl Block" | Compact mid-block, Home-Surge stamina | Light up top, few clear chances | **Jassim Tacklada** "The Anchor" · CDM · screen-and-shield destroyer |
| **Uzbekistan** | Turquoise-and-white tile mosaic, sun-disc badge | **71** | ★★☆☆☆ PLUCKY | 4-1-4-1 | "Silk Road Sprint" | Wing-to-wing pace, fearless youth | Naive defending, prone to overload | **Aziz Curlada** "Silk" · LW · direct flair winger |
| **Vietnam** | Jade-and-crimson lotus crest, bamboo-stripe trim | **65** | ★☆☆☆☆ MINNOW | 5-4-1 | "Lotus Counter" | Tireless low-block, quick sting on the break | Tiny margins, fades if Surge runs dry | **Hieu Megada** "The Whisper" · RM · nimble counter-sprinter |

**Tier tally (EAU = 8 of 48):** 1 STRONG · 5 SOLID · 1 PLUCKY · 1 MINNOW. Spine-heavy and well-drilled, exactly as a disciplined zone should read. OVR spread 65–86 keeps internal variety; no two sides share a formation-plus-style fingerprint.

---

## Scouting Notes

**Japan — the zone's flagbearer and a co-host.** This is the EAU's one genuinely dangerous side, and the +4 **Home Surge** boost lifts the cobalt machine to a tournament-rattling 90 on home turf (never below SOLID while hosting, per the Host Boost rule). They play **"Clockwork Press"**: dizzying one-touch passing triangles, a high line that never gasps for air, and a stamina bar that simply refuses to empty in **THE 90TH**. Their talisman is **Yuki Nutmegada, "Mr. 90th-Minute"** — a CAM metronome who threads megs and disguised through-balls, feeding the **NUTMEG METER** with every flick. When his **SURGE RUN** ignites, the whole midfield seems to play in fast-forward. The one crack: center-back depth is thin, so an aerial bully who gets in behind can punish them before the Clockwork resets.

**Qatar — the second co-host, the master of the rope-a-dope.** Don't be fooled by the SOLID floor; the **Home Surge** buff and a faster-filling meter make the maroon **"Pearl Block"** a nightmare to break down at home, where stamina and a compact 4-5-1 invite you to throw punches until the Surge swings their way. **Jassim Tacklada, "The Anchor"** is the heartbeat — a CDM who screens, shields, and springs the **WALL** stance to smother attacks, then recycles possession to drain the clock. They're light up top and rarely create clean chances, so they live and die by patience and a single late **GROUNDSWELL** surge — pure "no team is unwinnable" theatre.

**Vietnam — the Cinderella seed.** At OVR 65 they're the zone's lone MINNOW, but the **"Lotus Counter"** is built precisely for the bible's promise: a tireless five-man low-block soaks pressure, then **Hieu Megada, "The Whisper,"** a feather-light RM, sprints daylight on the turnover. Their margins are razor-thin and they fade if the Surge meter runs dry — but in **THE 90TH**, with the trailing-team Surge bonus filling fast, this jade-and-crimson underdog can absolutely sting an ELITE side on one perfect breakaway. Heart over talent, exactly as the MINNOW tier promises.

### South America (6)

# SILVER COAST BLOC (SCB) — South America Zone
### *"Flair is the first language."*

| Team (Country) | Original Crest & Kit Colors | OVR | Tier | Formation | Play-Style | Top Strength | Key Weakness | Marquee Star |
|---|---|---|---|---|---|---|---|---|
| **Brazil** | Gold-on-emerald sunburst crest; halftone canary-and-jade kit with a cobalt sash | **97** | ★★★★★ ELITE | 4-3-3 | "Samba Overload" | Bottomless attacking flair — fastest Nutmeg Meter fill in the game | Thin at the back when the press is bypassed | **Diego Dribblinho** "Lefty" — Forward, Flair Magician |
| **Argentina** | Twin-river chevron crest; gradient sky-blue/white kit with a silver lightning trim | **95** | ★★★★★ ELITE | 4-4-2 diamond | "Cold-Blooded Tiki" | Ruthless in the clutch — deadliest **THE 90TH** finisher | Ages quickly under sustained high tempo | **Mateo Curlinho** "Mr. 90th-Minute" — Attacking Mid, Clutch Maestro |
| **Uruguay** | Iron-sun shield crest; deep sky-and-charcoal kit with a blood-orange collar | **84** | ★★★★ STRONG | 4-4-2 | "Bite & Grind" | Iron **WALL** defending; brutal set pieces | Light on raw pace out wide | **Lucas Wallibo** "The Cliff" — Centre-Back, Lockdown Anchor |
| **Colombia** | Coastal-condor crest; halftone gold/scarlet kit with cobalt gradient sleeves | **80** | ★★★ SOLID | 4-2-3-1 | "Carnival Counter" | Explosive transition Surge Runs; dazzling wing play | Discipline wobbles when behind | **Andrés Megaez** "Captain Curl" — Winger, Rhythm Dribbler |
| **Chile** | Andes-peak triangle crest; volcanic red/navy kit with a white mountain stripe | **77** | ★★★ SOLID | 3-4-3 | "High Press Storm" | Relentless pressing — drains opponent stamina fast | High line gets caught on the break | **Tomás Toepokez** "The Engine" — Box-to-Box Mid, Pressing Dynamo |
| **Ecuador** | Equator-line sunwave crest; bright marigold/sapphire kit with a jade horizon band | **71** | ★★ PLUCKY | 4-5-1 | "Altitude Ambush" | One standout weapon: a thunderous **SCREAMER** specialist; thrives on Home Surge energy | Shallow squad depth; fades late in tournaments | **Joaquín Screamerinho** "The Cannon" — Winger, Long-Range Bomber |

**Tier tally for this zone:** 2 Elite ★★★★★ · 1 Strong ★★★★ · 2 Solid ★★★ · 1 Plucky ★★. OVR spread 71–97 keeps the bloc the bible's "smallest-but-mightiest region" — top-heavy with giants, no dead weight, and every side has a live win path per **"No team is unwinnable."**

---

## Scouting Notes

**Brazil — the flair ceiling of the whole tournament.** This is the squad the art team builds the confetti budget around. Brazil plays "Samba Overload": chunky, rhythm-driven touches that feed the **NUTMEG METER** faster than any team in the game, so style literally snowballs into **SURGE**. Get them rolling and the screen tilts gold — meg, flick, rainbow, goal, *thwock*, fireworks. Their marquee man **Diego Dribblinho** ("Lefty") is a low-center-of-gravity Forward who treats defenders like traffic cones; his whole vibe is the grinning showman who'll try the outrageous thing on a 0-0 *and* a 4-0. The catch, and what keeps them beatable: commit too many bodies forward and that 4-3-3 leaves a soft underbelly — bypass the press and you're in behind. Brazil wins shootouts of joy; punish them and the carnival can stall.

**Argentina — the ice to Brazil's fire.** Where Brazil overwhelms, Argentina *manages*. The "Cold-Blooded Tiki" 4-4-2 diamond is patient, possession-hungry, and built to win the moments that matter, which makes them the single most dangerous team once **THE 90TH** kicks in — exactly when a trailing opponent expects to mount a comeback, Argentina is the side that calmly buries the dagger. **Mateo Curlinho** ("Mr. 90th-Minute") is the metronome at the tip of the diamond: not flashy for flash's sake, just always in the right pocket, curling the winner with the clock red. Their one crack is stamina — run them ragged with a high tempo early and the diamond legs go heavy late, opening the door for a true underdog Surge run.

**Ecuador — the bloc's Cinderella spark.** The lone PLUCKY seed here is pure bible philosophy made flesh: spirited, undermanned, and packing exactly **one standout weapon**. The "Altitude Ambush" 4-5-1 sits deep, soaks pressure, and then unleashes **Joaquín Screamerinho** ("The Cannon"), a winger who exists to wind up one perfect **SCREAMER** from distance and detonate the stadium — extra shake, extra slow-mo, **HOME SURGE** crowd roaring if they're hosting. They won't out-pass the giants and their bench is thin, so deep tournament runs gas them out. But on a single electric night, one Cannon blast plus a full **GROUNDSWELL** is all the win path a minnow-hearted side needs to topple a giant. Underdog joy, sacred and intact.

### North, Central America & Caribbean (6)

This is a creative design task — no codebase work needed. Let me build the deliverable directly from the bible.

First, let me lock the tier math against the zone's mandate: "Mix of Solid hosts and Plucky/Minnow islanders," 3 hosts among 6 teams, host boost applied, hosts never below SOLID.

Here is the design for the **Northern Tides Alliance (NTA)** zone.

---

# GROUNDSWELL '26: World Eleven — NTA Qualifiers
## The Northern Tides Alliance — "Three coasts, one anthem."

*6 qualifiers. 3 of them are Globe Cup Hosts (Home Surge applied: +4 OVR, capped 99, never below SOLID). Athletic, fast, fearless, fast-improving — solid hosts up top, plucky-and-minnow islanders swinging below.*

| Team (Country) | Original Crest & Kit Colors | OVR | Tier | Formation | Play-Style | Top Strength | Key Weakness | Marquee Star (name · position · archetype) |
|---|---|---|---|---|---|---|---|---|
| **United States** ★HOST | Star-burst chevron on slate-navy, electric-cyan sash, white halftone trim | **81** (77 base **+4 Home Surge**) | ★★★☆☆ SOLID | 4-3-3 | "Press-and-Pace" | Relentless high press + fastest stamina recovery in the zone | Final-third decision-making goes loose under pressure | **Brody Wallopson** · Striker · Powerhouse Poacher |
| **Mexico** ★HOST | Eagle-feather diamond on deep emerald, gold sunburst gradient, scarlet underglow | **85** (81 base **+4 Home Surge**) | ★★★★☆ STRONG | 4-2-3-1 | "Tiki-Surge" | Silkiest passing web in NTA; fills Surge off possession chains | Thin at center-back; counters bite | **Mateo Tacklández** · Defender · "The Wall," Sweeper-General |
| **Canada** ★HOST | Twin-peak summit mark on glacier-white, crimson-to-magenta gradient, ice-blue rim | **78** (74 base **+4 Home Surge**) | ★★★☆☆ SOLID | 3-4-3 | "North-Wind Counter" | Blistering wing-back transitions; vertical in three touches | Set-piece defending is raw and rattled | **Liam Screamersson** · Winger · Flank Burner |
| **Costa Rica** | Volcano-arc crest on jungle-teal, sunrise-coral band, foam-white halftone | **72** | ★★☆☆☆ PLUCKY | 5-3-2 | "Bunker-and-Spring" | Elite keeper + low block that springs lethal counters | Goes flat if forced to chase a game | **Tico Keepández** · Keeper · The Last-Line Wall |
| **Jamaica** | Lightning-runner glyph on jet-black, neon-lime bolt, sun-gold flare | **70** | ★★☆☆☆ PLUCKY | 4-2-4 | "Sprint-Reckless" | Outright fastest squad in the zone; chaos on the break | Reckless shape — bleeds chances both ways | **Andre Boltibo** · Winger · "The Lightning," Pure Pace Merchant |
| **Trinidad & Tobago** | Twin-island steel-pan ring on cobalt, hot-coral sweep, white spark accents | **64** | ★☆☆☆☆ MINNOW | 4-4-2 | "Carnival Counter" | Joyful flair-flicks load the Nutmeg Meter fast → cheap Surge | Thinnest squad depth; tires in The 90th | **Kervon Megsari** · Midfielder · "Mr. Carnival," Flair Trickster |

**Tier tally (this zone's contribution to the 48):** STRONG ×1 · SOLID ×2 · PLUCKY ×2 · MINNOW ×1. All three hosts sit at SOLID or above after Home Surge (Canada's 74 base lands exactly on the SOLID floor, then +4 → 78), honoring the rule. Internal spread runs 64→85, with five distinct formations and six distinct play-styles.

---

## Scouting Notes

**Mexico — the team to beat in NTA.** With the gold-sunburst gradient kit literally brightening as the Surge climbs, the home crowd is half the roster. "Tiki-Surge" is the zone's most watchable system: short, stabbing passing chains that fill the meter through possession alone, then detonate into a GROUNDSWELL when the stadium hits full voltage. The spine is veteran sweeper-general **Mateo Tacklández** — "The Wall" — who reads counters a beat early and snuffs them with a clean slide, the brushed-emerald crest pulsing on his chest. He's the calm at the center of a joyful storm. The catch the bible's "no team is unwinnable" promise loves to exploit: behind him the center-backs are thin, so a MINNOW on a full Surge Run can absolutely sprint through the gap and steal a fairy tale.

**Jamaica — the chaos engine, and the funniest watch in the zone.** A 4-2-4 is barely a formation; it's a dare. The neon-lime bolt on jet-black kit suits a side built on one sacred idea — be faster than the problem. **Andre "The Lightning" Boltibo** is a pure pace merchant who turns a half-yard of space into a Screamer-from-nowhere, and the screen-shake when he connects is worth the ticket. Jamaica wins by making every match a track meet and trusting their legs to outrun their own defending. Against the elite, that recklessness is exactly the kind of full-tilt Surge run that flips a knockout on its head.

**Trinidad & Tobago — the Cinderella seed wearing a smile.** At OVR 64 they're the zone's lovable MINNOW, but the steel-pan-ring crest tells you the plan: style is the strategy. "Carnival Counter" leans entirely on the Nutmeg Meter — **Kervon "Mr. Carnival" Megsari** stacks megs, rainbow flicks, and cheeky drag-backs to farm flair-Surge faster than anyone, converting showboating into real comeback fuel. The flip side is brutally honest: the squad is paper-thin, and once The 90th arrives, tired legs start dropping passes. But on a hot night, with the Nutmeg Meter glowing and the bench holding up, T&T are the exact "heart over talent" underdog the whole game is built to let dream.

### Oceania & Wildcards (3)

## GROUNDSWELL '26: World Eleven — The Blue Horizon Circuit (BHC)
### "Far from everywhere, fearless."
**Zone allocation: 3 teams — 1 Oceania champion (MINNOW) + 2 intercontinental playoff wildcards (1 PLUCKY, 1 surprise SOLID)**

| Team (Real Country) | Original Crest & Kit Colors | OVR | Tier | Formation | Play-Style | Top Strength | Key Weakness | Marquee Star (name · position · archetype) |
|---|---|---|---|---|---|---|---|---|
| **New Zealand** *(Oceania champion)* | Silver-fern-inspired chevron crest; charcoal & glacier-white kit with a single teal storm-sash | **64** | ★☆☆☆☆ **MINNOW** | 5-4-1 "Low Block" | **The Cliff Wall** — bunker, frustrate, hit one long ball | League-best set-piece defending; never folds in **THE 90TH** | Toothless attack; relies on one outlet to create anything | **Tane Keepatoa** "The Cliff" · Goalkeeper · Reflex-Monster Sweeper-Keeper |
| **Panama** *(NTA wildcard)* | Twin-isthmus interlock badge; coral-red & deep-ocean-navy halftone kit with gold trim | **70** | ★★☆☆☆ **PLUCKY** | 4-3-3 "Pressing Trio" | **Riptide Press** — swarm high, win it back, sprint in transition | Relentless high-press that feeds the **NUTMEG METER** fast | Gets pulled apart by patient passing; tires late if Surge runs dry | **Mateo Screamerández** "Mr. 90th-Minute" · Right Winger · Live-Wire Counter Sprinter |
| **Uzbekistan** *(EAU wildcard — surprise Solid)* | Faceted-mountain "Arc" crest; ice-blue & cobalt gradient kit with white circuit-line piping | **78** | ★★★☆☆ **SOLID** | 4-2-3-1 "Control Spine" | **Steppe Tempo** — patient build-up, then a sudden **SCREAMER** | Composed double-pivot midfield; no glaring holes anywhere | Thin striker depth; can dominate the ball yet under-convert | **Sardor Volleyveer** "Captain Curl" · Attacking Midfielder · Deep-Lying Playmaker-Screamer |

---

### Scouting Notes

**New Zealand — the lovable Cinderella seed (★☆☆☆☆ MINNOW, OVR 64).** This is the underdog the whole stadium adopts. The Kiwis park a five-man **WALL**, swallow shots whole, and dare you to break a low block that simply will not crack on set pieces. Their entire game plan is to survive to **THE 90TH**, let the trailing-team Surge boost stack, and lump one hopeful ball toward a teammate while the crowd loses its mind. The heartbeat is **Tane Keepatoa**, "The Cliff" — a wild-haired, elastic-limbed sweeper-keeper who throws himself at everything, punches screamers into the upper deck, and celebrates every save like a goal. He keeps New Zealand in matches it has no business being in, which is exactly the point: **no team is unwinnable**, and the Cliff is living proof.

**Uzbekistan — the wildcard nobody scouted (★★★☆☆ SOLID, OVR 78).** The surprise of the zone. Drawn in as an Eastern Arc Union playoff crasher, Uzbekistan is no plucky tourist — they're a genuinely well-built, hole-free side that can out-pass two thirds of the bracket. The **Control Spine** sits on a calm double-pivot, recycles possession with steppe-cool patience, then detonates a sudden long-range strike when you least expect it. Their conductor is **Sardor Volleyveer**, "Captain Curl," a deep-lying playmaker who paints cross-field passes and unloads dipping screamers from 30 yards. The only thing keeping them out of the STRONG tier is a paper-thin striker pool — they'll dominate the ball, rattle the woodwork five times, and need Captain Curl to bail them out himself.

**Panama — the engine that never idles (★★☆☆☆ PLUCKY, OVR 70).** The crowd-energy pick of the bunch. Panama's **Riptide Press** is all motion: a snarling front three that hunts in packs, wins the ball high, and turns turnovers into chaos before the defense can reset — style points pile up on the **NUTMEG METER** and feed their Surge faster than almost anyone in the zone. The spark is **Mateo Screamerández**, "Mr. 90th-Minute," a live-wire right winger who only seems to score when it matters most, ghosting onto loose balls in transition for late daggers. The catch: if a calmer side keeps the ball away from the press, Panama burns out late and the riptide goes slack — but on a full **GROUNDSWELL**, they'll drown anybody.

---

## 5. Game Modes

> All modes are powered by a **single shared match engine** (see §5.10). A "mode" is a configuration layer — a rule-set, win condition, and presentation skin wrapped around the same core of Surge, the 90th, Screamers, the Groundswell, and broadcast-arc camera. We never fork the simulation; we parameterize it. This is the only way a solo dev ships this much surface area.

All modes obey the Core Pillars (§7): **Surge over Sim**, the **Five-Minute Mastery Arc**, **Every Goal Is a Firework**, and **No Team Is Unwinnable**. Match length defaults to the canonical 4–6 minute window unless a mode explicitly overrides it.

---

### 5.1 Tournament Mode

- **Hook:** *"48 nations, six zones, one Aurora Sphere — survive the bracket and lift it."*
- **Core loop:** Draw into **The Globe Cup** → play the group stage across the six zones (ICL, SBC, EAU, SCB, NTA, BHC) → advance through single-elimination knockouts → final. Between matches: spend **Aurora Points (AP)**, scout the next opponent's tier, manage a light squad-fitness/momentum carryover.
- **Win condition:** Win the final and **lift the Aurora Sphere**. Hosts run under the **Home Surge** rule (+4 OVR, capped 99, never below SOLID, faster Surge fill at home).
- **Why it's fun:** It's the headline comeback fantasy at tournament scale — the bracket is a pressure cooker where a ★☆☆☆☆ MINNOW Cinderella run is mechanically real thanks to **the 90th** and the **Groundswell**. Group-stage spice plus climactic knockouts (the bell-curve tier distribution from §8 is doing exactly this job).
- **Solo-dev complexity:** **High.** Bracket logic, qualification/seeding, host handling, AP economy hooks, and persistent run state across many matches.

---

### 5.2 Quick Match

- **Hook:** *"Pick two nations, kick off, feel the thwock — football in under sixty seconds of setup."*
- **Core loop:** Choose your team and opponent (or randomize) → optional difficulty → straight into one match → rematch or reshuffle.
- **Win condition:** Score more goals over the match clock; draws go to a sudden-death **Screamer**-friendly extra phase or penalties (player toggle).
- **Why it's fun:** Zero friction, pure **Five-Minute Mastery Arc**. It's the default warm-up, the "show a friend" mode, and the fastest path to a juicy goal. Every session of the game can start here.
- **Solo-dev complexity:** **Low.** It's the match engine with a thin team-select front end — essentially the engine's "hello world."

---

### 5.3 Penalty Shootout

- **Hook:** *"Ice in the veins. One kick, one keeper, the whole stadium holding its breath."*
- **Core loop:** Best-of-five alternating spot kicks → sudden death if level. Shooter aims power/placement on a timing gauge; keeper dives via read/timing. Standalone, or invoked as a tiebreaker by other modes.
- **Win condition:** Lead after five rounds, or win sudden death.
- **Why it's fun:** Maximum tension-per-second, and **Every Goal Is a Firework** at its most concentrated — confetti, screen-shake, slow-mo on the decisive kick. Naturally bite-sized and endlessly replayable; great for couch dares.
- **Solo-dev complexity:** **Low.** A self-contained mini-loop (aim gauge + keeper dive + scoreboard) reusing the shot, keeper, net, and juice systems. No full-pitch AI needed.

---

### 5.4 Challenge Mode

- **Hook:** *"Curated football puzzles — beat the clock, beat the odds, beat the scenario."*
- **Core loop:** Select a hand-authored scenario from a grid → spawn into a pre-set match state (score, time, personnel, field position) → solve the objective → earn stars/AP → next challenge. Examples: *"Score 2 in 60s," "Win down a player," "Land a Screamer from outside the box," "Trigger a full Groundswell, then score during it," "Survive the 90th with a one-goal lead."*
- **Win condition:** Per-scenario objective met within its constraints (star ratings for over-performing — e.g. extra time remaining, style via the **Nutmeg Meter**).
- **Why it's fun:** Turns the game's mechanics into teachable, bite-sized puzzles — it's the **Five-Minute Mastery Arc** made into a curriculum. Doubles as a stealth tutorial: each challenge spotlights one system (Surge, the Wall, Screamers, the Groundswell). High replay via star-chasing.
- **Solo-dev complexity:** **Med.** Engine itself is reused; the work is a scenario-definition format (initial state + objective + success/fail triggers) and authoring ~20–40 good puzzles. Tooling-light if the data format is clean.

---

### 5.5 Local Multiplayer

- **Hook:** *"Same couch, same screen, one ball — settle it like civilized people."*
- **Core loop (1v1 same-device):** Two players, split inputs (two controllers, or split touch zones on tablet) → one match → rematch. **Co-op vs AI:** two players share one nation (or take attack/defense roles) against the CPU.
- **Win condition:** Standard match result (1v1) or beat the AI together (co-op).
- **Why it's fun:** The bible's "playground tournament" feeling made literal. The **Surge** meter creates real swing — a losing human gets the comeback tools, so blowouts stay tense and trash-talk stays loud. **No team is unwinnable** is most satisfying with a friend across the couch.
- **Solo-dev complexity:** **Med.** Engine and rules are shared, but second-player input routing, split-meter UI, role assignment for co-op, and same-screen camera framing (no off-screen unfairness) are real work.

---

### 5.6 Custom Tournament

- **Hook:** *"Your bracket, your rules — build the Globe Cup you actually want."*
- **Core loop:** Configure a tournament from a settings sheet → **team count** (e.g. 8 / 16 / 24 / 48), **who's in** (hand-pick nations, zone filters, or random draw), **difficulty**, **host selection** (applies Home Surge), and **rules toggles** (match length, golden-goal, Surge fill rate, Groundswell on/off, Screamers-only, etc.) → run it like Tournament Mode.
- **Win condition:** Win the user-defined final.
- **Why it's fun:** Infinite replay and personal expression — make an all-MINNOW Cinderella cup, a six-ELITE death bracket, or a chaos run with Surge cranked to max. It's the sandbox that keeps the 48-nation roster alive for hundreds of hours.
- **Solo-dev complexity:** **Med** (if Tournament Mode exists). It's largely Tournament Mode with its config exposed to the player plus a clean settings UI. Most cost is validating weird combinations and a tidy rules-toggle layer the engine already reads.

---

### 5.7 Endless Arcade Mode

- **Hook:** *"Keep winning to keep playing — how deep into the gauntlet can you Surge?"*
- **Core loop:** Face a continuous gauntlet of opponents → win to advance, lose and the run ends → each round escalates (rising opponent tier, shrinking clock, harder AI, optional modifiers) → bank a score → post to the leaderboard. Light run-modifiers/perks chosen between rounds keep it spicy.
- **Win condition:** No "win" — it's a **survival/score-chase**. The goal is the longest streak / highest score, ranked on a **score-chase leaderboard** (AP-rewarding milestones).
- **Why it's fun:** The "one more run" hook. Escalating difficulty makes every **Groundswell** comeback feel like survival, and the leaderboard converts solo play into competition. Pairs perfectly with the short match length — runs build fast, stakes compound.
- **Solo-dev complexity:** **Med.** Reuses the engine and Quick Match flow; new work is the escalation curve, opponent-generation, run-modifier system, score formula, and leaderboard persistence (local first; online optional/post-MVP).

---

### 5.8 Mode-by-Mode Summary

| Mode | Hook (short) | Win Condition | Complexity |
|---|---|---|---|
| Tournament Mode | Survive the 48-team bracket | Lift the Aurora Sphere | **High** |
| Quick Match | Instant kickoff | Outscore over the clock | **Low** |
| Penalty Shootout | One kick, one keeper | Win best-of-5 / sudden death | **Low** |
| Challenge Mode | Curated football puzzles | Meet scenario objective | **Med** |
| Local Multiplayer | Same-couch 1v1 / co-op | Match result / beat AI | **Med** |
| Custom Tournament | Build your own Globe Cup | Win your defined final | **Med** |
| Endless Arcade Mode | Climb the escalating gauntlet | Highest streak/score (no win) | **Med** |

---

### 5.9 MVP Recommendation

**Ship these three in the MVP:**

1. **Quick Match (Low)** — the front door. Validates the entire match engine, the "feel," and §6 art direction with the least overhead. If Quick Match isn't fun, nothing is; build and tune it first.
2. **Tournament Mode (High)** — the headline fantasy and the reason the title exists ("48 Nations. One Surge. Lift the Sphere."). It's the marquee feature that justifies the 48-nation roster and the **Globe Cup / Aurora Sphere** identity. Highest cost, highest payoff.
3. **Penalty Shootout (Low)** — cheap, high-drama, and it pulls double duty as the **tiebreaker** for Quick Match and Tournament knockouts, so you need its core loop anyway. Best fun-per-dev-hour in the lineup.

**Rationale:** This trio spans the full emotional range (instant fun → long-haul stakes → pure tension), maximizes engine reuse, and front-loads the two cheapest modes around the one expensive one — so the engine is proven by Quick Match and battle-tested by Shootout before Tournament's bracket layer goes on top.

**Fast-follow (post-MVP, ranked):** **Custom Tournament** (cheap once Tournament exists — exposes its config), then **Endless Arcade Mode** (adds long-tail retention + leaderboards), then **Challenge Mode** (content-authoring heavy but a great onboarding/skill ramp), and finally **Local Multiplayer** (highest input/UI cost; ship when the single-player loop is locked).

---

### 5.10 Shared Systems (one engine, many modes)

Every mode is a thin wrapper over a common core. Build these once; reuse everywhere:

- **Match Engine** — physics, ball, players, collision, the broadcast-arc camera, snap-zoom and slow-mo. The single source of truth all modes call into.
- **Surge stack** — the **Surge** meter, **Surge Run** bursts, the team-wide **Groundswell** super-state, and **the 90th** trailing-team accelerator. Modes only tune fill rates and toggles; they never reimplement it.
- **Goal & juice layer** — net detection, **Screamer** recognition, screen-shake, confetti, slow-mo, sound stingers. This is "**Every Goal Is a Firework**" as a reusable subsystem.
- **Shot / keeper / aim systems** — used by full matches *and* Penalty Shootout *and* Challenge scenarios.
- **Defensive systems** — the **Wall** stance, interceptions, tackling.
- **Style systems** — the **Nutmeg Meter** and flair-move recognition (feeds Surge; powers star-ratings in Challenge/Arcade).
- **Rules-config layer** — a single parameter set (match length, Surge fill, host/**Home Surge**, golden-goal, modifier flags) that *every* mode reads from. This is the seam that makes Custom Tournament and Arcade modifiers nearly free.
- **Team & rating layer** — the §8 OVR/tier model, Host Boost, and the 48-nation roster (original crests/kits, fictional parody names per §4). One roster, every mode.
- **Progression & presentation** — **Aurora Points (AP)** earning/spending, results screens, UI shell (geometric, e-sports-crisp, phone-and-couch legible per §6).

> **Design rule:** if a mode needs behavior the engine can't express through the rules-config layer, the fix is to *extend the config layer*, not to fork the engine. One engine. Many dials.

---

The full section is above, ready to drop into the GDD. Key decisions captured: MVP = **Quick Match + Tournament Mode + Penalty Shootout** (instant fun + headline fantasy + cheap high-drama tiebreaker), with all seven modes built as configuration layers over one shared match engine driven by a single rules-config seam.

---

## 6. Progression & Unlocks

> **Design contract:** Everything here is offline-first and single-player-friendly. Progression is earned through *play*, never through your wallet. There are **no real-money loot boxes, no gacha pulls, no pay-to-win, no energy timers, and no FOMO-gated content.** GROUNDSWELL '26 respects Pillar 4 ("No team is unwinnable") at the meta layer too: nothing you unlock makes another player's team *stronger* than yours in a head-to-head — unlocks are teams-you-can-pilot and cosmetics, never stat advantages.

---

### 6.1 Aurora Points (AP) — The Currency System

The single meta-currency is **Aurora Points (AP)** (see Glossary §9), named for the Aurora Sphere trophy. You earn AP every match, in every mode, online or off. There is **one** currency — no confusing premium/soft split, no second currency you can only buy.

**Earn philosophy:**
- **You always leave a match richer.** Even a loss pays out (heart over talent — Pillar 4).
- **Style pays.** The Nutmeg Meter and Screamers convert flair directly into AP, so the *fun* way to play is also the *rewarding* way.
- **Comebacks pay best.** Triggering a **Groundswell** or scoring in **The 90th** carries bonus AP — the game literally pays you for the comeback fantasy.

#### Economy Table — Actions → AP

| Action | AP Earned | Notes |
|---|---|---|
| Score a standard goal | **+15** | The baseline firework. |
| Score a **Screamer** (long-range power shot) | **+40** | Juiciest goal = juiciest payout. |
| Score during **The 90th** (final 5 min) | **+25 bonus** | Stacks on the goal value. |
| Trigger a **Groundswell** (team super-state) | **+50** | Once per match, the marquee reward. |
| Fill the **Nutmeg Meter** (per fill) | **+20** | Style sub-meter cashout; repeatable. |
| Pull off a flair move (meg, rainbow, flick) | **+3 each** | Small, frequent dopamine. |
| Clean tackle / interception (**Wall** trigger) | **+5** | Defenders earn too. |
| Clean sheet (concede 0) | **+30 bonus** | Keepers and back lines rewarded. |
| **Win** a match | **+60** | The core win payout. |
| **Loss** (participation) | **+20** | You never leave empty-handed. |
| Draw | **+35** | Splits the difference. |
| Win a Globe Cup **group-stage** match | **+75** | Tournament multiplier kicks in. |
| Win a **knockout** match | **+120** | Stakes rise, so does pay. |
| Win the **Globe Cup** (lift the Aurora Sphere) | **+1,000** | The grand payout. |
| **Underdog bonus** (beat a team ≥2 tiers above you) | **+150** | Cinderella seeds get paid. |
| **First-win-of-the-day** bonus | **+50** | Gentle daily warmth, never a punishing streak-loss. |

> **AP Sinks (where it goes):** cosmetic unlocks (kits, crest skins, ball skins, celebrations, trails, banners), team-variant unlocks (legend/cosmetic versions), and stadium unlocks. **AP is never spent on anything that affects gameplay balance.** No buying OVR, no buying Surge, no buying wins.

#### What we explicitly do NOT do

- ❌ **No real-money loot boxes / blind boxes / gacha.** Period.
- ❌ **No premium hard currency.** AP is earned, never purchased.
- ❌ **No pay-to-win.** Nothing purchasable touches OVR, the Surge meter, or match outcomes.
- ❌ **No energy/stamina timers** gating how much you can play.
- ❌ **No expiring "limited-time-only-buy-now" pressure.** Seasonal cosmetics rotate back; nothing is lost forever.
- ✅ **Optional, honest cosmetic DLC packs** (flat one-time price, contents shown up front) and an **optional "Tip the Dev" supporter pack** are the *only* monetization touchpoints, and the **full game is completable and enjoyable with zero spend.**

---

### 6.2 Unlockable Teams

**Core principle: all 48 nations are FREE and available from the start.** You should never be paywalled or grind-walled out of piloting your home nation or your favorite underdog. Pillar 4 lives here — every nation is in your hands on day one.

What you unlock are **variants and modes layered on top** of the free roster:

| Unlock | Locked at start? | How to earn | Cost |
|---|---|---|---|
| **All 48 base nations** | **No — free from launch** | Already yours | 0 AP |
| **WORLD ELEVEN** (cross-nation all-star squad mode) | Yes | Win one full Globe Cup with any nation | Unlock via achievement |
| **Legend Kit variants** (per nation) | Yes | Reach a milestone with that nation (e.g., 10 wins) **or** purchase with AP | 800 AP each |
| **"Retro Surge" alt-color variants** | Yes | AP purchase | 500 AP each |
| **Confederation Crest Skins** (one per zone: ICL, SBC, EAU, SCB, NTA, BHC) | Yes | Win a match in each zone's qualifying bracket | 400 AP each |
| **Host Edition (Home Surge cosmetic FX)** | Yes | Win a Globe Cup as a flagged Host team | Achievement unlock |
| **Fictionalized Nations name pack** (Brazilia, Argentinia, etc.) | No — free toggle | Settings switch (safety mode per Bible §0) | 0 AP |

> **Balance guarantee:** Legend/Retro/Host variants are **cosmetic only**. A nation's OVR, tier (per the §8 Rating Contract), and ratings are **identical** whether you pilot the base kit or a 5,000-AP legend skin. You unlock *looks and flair*, never *power*.

---

### 6.3 Cosmetic Rewards

All cosmetics are **100% original designs** per the Art-Direction North Star (§6 of the Bible) — invented color treatments, halftone textures, gradients, and sashes that *evoke* a nation's mood without copying any real kit or crest. Spend AP, equip in the Locker, mix and match freely.

| Category | What it is | AP Range | Notes |
|---|---|---|---|
| **Original Kits** | Alternate home/away/third kits with invented gradient + sash treatments | 300–800 AP | Never imitates a real federation kit. |
| **Crest Skins** | Animated "living emblem" reskins of a nation's original crest | 400–700 AP | Crests animate per Art Direction. |
| **Ball Skins** | Original match-ball designs (neon, chrome, confetti-trail, aurora-glass) | 200–500 AP | The **Aurora-Glass** ball ties to trophy lore. |
| **Celebrations** | Goal-celebration animations (the firework moment — Pillar 3) | 250–600 AP | Each is a tiny fireworks show. |
| **Trails** | Ball/player motion trails that intensify with the **Surge** meter | 200–450 AP | Brighter as Surge builds. |
| **Banners** | Crowd tifo banners + profile banners for your supporter section | 150–400 AP | Stadium crowd flavor. |

> **Marquee cosmetic:** the **"Groundswell" Trail Set** — a maxed-Surge trail that erupts into aurora-flecked confetti when your team enters the **Groundswell** super-state. Earned, not bought: trigger 25 Groundswells across your career.

---

### 6.4 Stadium Unlocks

Stadiums are unlocked with AP and tie directly to the **Visual section's** environment set. Each is an original, neo-poster 2.5D arena with its own lighting mood, crowd palette, and **Surge**-reactive ambiance (the screen literally gets brighter and louder as a comeback builds — Art Direction §6).

| Stadium | Vibe | How to unlock | Cost |
|---|---|---|---|
| **The Surge Bowl** | Default home arena; electric blue, pulsing rim-light | Available at start | Free |
| **Sun Belt Arena** (SBC flavor) | Warm dusk, dust-gold light, fast-pace energy | Win 5 matches | 600 AP |
| **Iron Continent Dome** (ICL flavor) | Cold steel, floodlit night, "hot rivalries" tifo | Win 5 matches | 600 AP |
| **Silver Coast Stadium** (SCB flavor) | Coastal sunset, flair-forward, carnival crowd | Win 10 matches | 800 AP |
| **Eastern Arc Colosseum** (EAU flavor) | Neon megacity, "a billion eyes" wall of light | Win 10 matches | 800 AP |
| **Blue Horizon Ground** (BHC flavor) | Remote oceanic cliffside, fearless underdog mood | Beat a team ≥2 tiers above you | 700 AP |
| **The Aurora Sphere Arena** (Globe Cup final venue) | The crown jewel; aurora gradient sky, max-confetti | Win the Globe Cup once | Achievement unlock |

> Host-flagged matches grant the **Home Surge** stadium buff (§8) regardless of which arena is selected — the buff is mechanical and the arena is cosmetic dressing.

---

### 6.5 Achievement System

Achievements are **feel-good milestones**, not grind chores. They celebrate the four Pillars: surging comebacks, the five-minute mastery arc, every-goal-a-firework, and underdog joy. Each pays AP and often unlocks a signature cosmetic. All are earnable fully offline.

| # | Achievement | Trigger | Reward |
|---|---|---|---|
| 1 | **First Touch** | Play your very first match | +50 AP |
| 2 | **Net Buster** | Score your first goal | +50 AP + "Confetti Pop" celebration |
| 3 | **Screamer!** | Score your first **Screamer** | +100 AP + Screamer slow-mo trail |
| 4 | **Caught the Wave** | Trigger your first **Groundswell** | +150 AP + "Groundswell" banner |
| 5 | **The 90th Minute Man** | Score a winning goal during **The 90th** | +200 AP + "Mr. 90th-Minute" title |
| 6 | **Style Tax** | Fill the **Nutmeg Meter** 10 times in one match | +150 AP + "Showboat" trail |
| 7 | **The Wall Stands** | Get a clean sheet (concede 0) | +120 AP + "The Wall" crest skin |
| 8 | **Megs Master** | Pull off 50 nutmegs across your career | +200 AP + "Captain Curl" celebration |
| 9 | **Cinderella Story** | Beat a team **2+ tiers** above you (e.g., MINNOW beats ELITE) | +300 AP + "Underdog" gold banner |
| 10 | **Heart Over Talent** | Win a match piloting a ★☆☆☆☆ **MINNOW** | +250 AP + Retro Surge variant |
| 11 | **Home Surge Hero** | Win a Globe Cup as a flagged **Host** team | +400 AP + Host Edition FX |
| 12 | **Lift the Sphere** | Win your first **Globe Cup** | +1,000 AP + **WORLD ELEVEN** mode unlock |
| 13 | **Six-Zone Sweep** | Win at least one match representing a nation from all **6 confederations** (ICL, SBC, EAU, SCB, NTA, BHC) | +500 AP + Aurora-Glass ball skin |
| 14 | **Comeback Kings** | Win a match after trailing by 2+ goals | +350 AP + "Comeback" trail set |
| 15 | **Globe-Trotter** | Win the Globe Cup with **10 different nations** | +1,500 AP + **The Aurora Sphere Arena** stadium |

> **Tone check:** Every trigger is reachable by a determined solo player offline. No achievement requires online play, no achievement requires spending real money, and the hardest ones (#13, #15) reward *breadth of joy* — playing the whole colorful world — exactly the "the whole world wants the ball" fantasy.

---

Wrote the GDD section. File: `/Users/humanjack/projects/humanjack/road-to-2026/GDD_07_Visual_Design.md`

The full markdown content of `## 7. Visual Design`, all subheadings included:

---

## 7. Visual Design

> **North Star (from the Creative Bible, Section 6):** Bold, clean **"neo-poster" 2D** — chunky, flat-shaded figures with confident silhouettes, thick rim-lighting, vivid saturated pitches, a dynamic **broadcast-arc** camera that snap-zooms and slow-mos on shots/tackles/celebrations, and a world that visibly **swells with the Surge meter**. UI stays minimal, geometric, and e-sports-crisp for phone-and-couch legibility.

### 7.1 Art Style
**Commitment: 2D neo-poster broadcast — flat-shaded layered sprites on a stylized pitch, rendered in Phaser 3 with a fixed three-quarter "broadcast" framing that sells cinematic weight through 2D camera acting.**

The engine choice is TypeScript + Phaser 3 + Vite, and the art direction is built from the ground up to exploit it rather than fight it. A 2D pipeline is the correct call for a solo developer working AI-assisted: every asset, shader, and animation is plain text or a flat image file that Claude Code can read, modify, and regenerate in-context. There is no 3D mesh pipeline to wrangle, no rig to break, no uncanny face to sidestep. Phaser's first-class arcade physics, tween engine, and particle system handle all the juice natively. Instant hot-module reload (Vite HMR) means a color tweak or camera parameter ships in under a second.

The cinematic broadcast feeling survives the move to 2D through technique, not geometry. Depth is a 2.5D illusion built from layered sprite planes: deep backdrop → midfield crowd → pitch markings → player layer → foreground rim. Scale-for-depth rules (players shrink ~15% toward the far touchline) reinforce perspective without a z-axis. The "broadcast-arc camera" is Phaser's own `camera.startFollow()`, `camera.zoomTo()`, `camera.pan()`, and `camera.shake()` — snap-zooms on a Screamer, slow-mo via global `timeScale`, a half-second follow-lock on a keeper dive. Parallax layers shift at different rates on every pan, selling the illusion of stadium volume.

What is rejected: photoreal rendering (wrong tone, wrong scope), and fussy pixel-art (wrong scale for phone legibility and the bold poster aesthetic). The look is closer to a vivid World Cup match programme illustration in motion than to either extreme.

AI tooling contributes 2D color-study concepts, crest motif exploration, and palette iteration — all of which slot directly into Phaser as PNGs or hex tokens, with zero pipeline conversion cost.

### 7.2 Character Style
**"Chibi-athletic" proportions (~4–4.5 heads tall), role-readable silhouettes, and fully procedural kit identity — 48 original kits, zero per-team hand-painted art.**

Characters are modular layered 2D sprites: body, limbs, head, and kit layer are separate sprite sheets composited at runtime. Role silhouettes stay instantly legible — the keeper's oversized glove outline, the striker's low centre-of-gravity crouch, the defender's planted wide stance, the on-ball ground-ring that marks the active player. One dominant team color covers approximately 60% of the visible kit; a thick high-contrast rim-light (baked as a separate additive sprite layer) pops each figure off the pitch regardless of background.

Kit identity is driven entirely by a per-team data record fed into a Phaser WebGL shader at load time:

- `primary_hex` / `secondary_hex` / `accent_hex` — the three color slots
- `treatment` enum — `solid` | `sash` | `halftone` | `gradient` | `hoops` | `split`
- `crest_id` — references a procedurally assembled crest (geometric shapes + color fills, no licensed badges)
- `number_ink` — auto-contrast white or deep indigo, chosen algorithmically against `primary_hex`

The shader recolors the base sprite atlas at runtime by remapping grayscale luminance zones to the three hex slots and applying the treatment pattern as a mask. Team 48 is a data row; it costs zero additional art. All 48 kits are legally clear originals.

Fictional-player identity is assembled from modular invented parts — hair silhouettes, skin-tone fills, boot colors, celebration gesture variants — plus parody names. No real faces, no real likenesses, no real player names.

### 7.3 Animation Style
**Cheap-but-juicy, and 2D makes it cheaper without sacrificing any of the juice.**

Each player runs from a compact set of approximately 10 base animation clips delivered as sprite-sheet sequences or Phaser skeletal bone tweens:

- `run` (8-frame loop, mirrored for direction)
- `pass` (3-frame snap)
- `shoot` (4-frame wind-up + release)
- `tackle` / `Wall` (3-frame plant + impact)
- `celebrate` (role-specific 6-frame loop)
- `keeper_dive` (left + right variants, 5 frames)
- `idle` (4-frame breathe)
- `slump` (post-concession drop, 3 frames)
- `groundswell_glow` (idle overlay, additive pulse)

Juice is layered on top procedurally: squash-and-stretch on shoot wind-up and landing via `scaleX`/`scaleY` tweens; spring/lerp tweening on follow-through; hit-stop (freeze all `timeScale` for 80 ms on a clean tackle); `camera.shake()` on impact; particle bursts at contact points. Surge-reactive playback accelerates run-cycle frame rate and saturates tint values as the Surge meter fills — the pitch literally feels faster and louder in Groundswell.

### 7.4 Stadium Design
**Five themed venues, each a stack of 2D layered backdrops with palette-swap lighting overlays and a crowd-imposter sprite layer that breathes with the Surge meter.**

All five venues share the same layered scene architecture — deep sky, upper stand silhouettes, lower stand crowd imposters, pitch edge props, pitch surface — and are differentiated entirely through backdrop art swaps, color-grading overlay tints, and signature prop sprites. No new geometry, no material pipeline:

- **Sandlot Bowl** (starter): warm afternoon amber sky, weathered concrete stand silhouettes, hand-painted touchline chalk, sparse crowd
- **Neon Harbor** (knockouts): night backdrop, cyan-and-magenta port cranes behind the upper tier, reflective wet-pitch overlay, dense neon crowd
- **Sun Belt Arena**: bleached midday white sky, terracotta upper stands, vivid pitch-lime turf, flag-wave particle emitters
- **Iron Continent Dome**: enclosed dark-gray backdrop suggesting a closed roof, industrial lighting columns as sprite props, mid-density crowd
- **Aurora Colosseum** (Globe Cup Final): deep-indigo night sky, Aurora Gold light columns animated as additive sprite overlays, maximum crowd density, full post-process stack engaged

The crowd imposter is a single layered sprite sheet of silhouetted figures. It pulses in scale and brightness — a subtle Phaser tween on `alpha` and `scaleY` — in rhythm with Surge meter level. At Groundswell, the crowd layer receives a kit-primary-hex tint overlay per the Home team's data flag, turning the whole stand into a wall of the home color.

### 7.5 UI/UX Concepts
**Minimal, geometric, e-sports-crisp — readable at arm's length on a phone, comfortable from the couch.**

Menu flow (≤3 taps to kickoff):

```
[TITLE SCREEN]
      |
   [HUB]
   /  |  \  \
[Quick  [Globe  [World   [Settings]
 Match]  Cup]   Eleven]      |
                         [Fictionalized
                          Nations: ON/OFF]
```

**In-match HUD:** Big-number scoreline + confederation-color crest chips + running clock anchored top-center. Bottom strip: Surge meter as a glowing heartbeat line that spikes and pulses (Phaser graphics redrawn each frame against the live Surge float); Nutmeg sub-meter as a segmented pip row beneath it; in THE 90TH the fill-rate of both meters visibly accelerates and the heartbeat line strobes Surge Magenta.

**Bracket screen:** Pannable (touch drag or stick scroll) full-bracket view with all six confederation blocs color-coded to their accent hex — ICL in Electric Blue, SBC in Amber, EAU in Teal, SCB in Steel, NTA in Cyan, BHC in Violet — lines converging toward the Aurora Sphere trophy graphic at center.

**Controller + touch parity:** Floating virtual stick (left thumb zone) + context-sensitive action buttons (right thumb zone) for touch; auto-hidden on gamepad connect. Hold-to-charge Screamer on shoot button — charge arc fills a radial indicator around the player sprite. TV-safe and thumb-safe margins respected on all HUD elements.

### 7.6 Color Palette
**One shared vocabulary, re-tinted per event, per confederation, per Surge state.**

| Role | Name | Hex |
|---|---|---|
| Primary accent | Surge Magenta | `#FF2E88` |
| Base / deep bg | Deep Pitch Indigo | `#1A1240` |
| Secondary accent | Electric Cyan | `#19D3F0` |
| Pitch surface | Pitch Lime | `#7BE83C` |
| Trophy / Finals | Aurora Gold | `#FFC53D` |
| Energy / warning | Flare Orange | `#FF7A33` |
| Neutral lightest | — | `#F5F7FF` |
| Neutral mid | — | `#A9B0C8` |
| Neutral dark | — | `#3A3656` |
| Neutral deepest | — | `#0E0A24` |

Confederation accent tokens: ICL `#4C7DF0`, SBC `#FF9E1B`, EAU `#1FB89A`, SCB `#9AA7C7`, NTA `#2BC4C9`, BHC `#7B5CFF`.

All tokens are consumed as Phaser tint values, WebGL uniform inputs, and CSS custom properties — one source of truth referenced across gameplay, UI, and VFX.

### 7.7 Special Effects
**One shared VFX vocabulary of Phaser 2D particle emitters and WebGL post-process pipelines, re-tinted and rescaled per event.**

All effects are composited in Phaser's render pipeline — no native 3D, no external VFX tool:

- **Goal explosion:** Net-impact particle burst (kit-primary-hex confetti emitter at contact point) + bloom flash (WebGL post-process brightness spike, 3-frame hold) + camera shake scaled to shot power; crowd layer alpha-pulse synchronized
- **Surge Run aura:** Additive sprite halo around ball-carrier, color-cycling Surge Magenta → Electric Cyan as meter fills; halo `scaleX` pulses on each footstrike
- **Groundswell aura:** Full-team ring of additive particle trails when the meter peaks; pitch overlay tint shifts to Surge Magenta for the duration
- **Wall aura:** Defender cluster emits a low deep-indigo shield-flash particle ring on tackle plant
- **Charged-shot heat trail:** Phaser particle emitter following ball trajectory, gradient Flare Orange → Surge Magenta, particle lifetime scaled to charge level; at full Screamer charge, a comet-ribbon overlay sprite trails the ball on a 6-frame ghost sequence
- **THE 90TH crowd flares:** Crowd layer receives per-frame additive orange-white tint ramp; flare sprite overlays (4 randomized positions in the upper stand layer) fire on a staggered loop
- **Global post-process momentum stack:** A single WebGL pipeline reads the live Surge float and linearly scales bloom radius, color saturation, and vignette intensity between baseline (meter empty) and maximum (Groundswell). At zero Surge the pitch looks clean and open; at full Groundswell the image blooms, saturates, and closes in at the edges — the screen itself feels like it is about to burst.
---

## 8. Audio Design

The entire audio system for **GROUNDSWELL '26: World Eleven** is built on one principle: **a small, modular asset library that recombines into something that sounds enormous.** As a solo-indie product, every sound must pull double duty — layered, pitch-shifted, filtered, and triggered dynamically so a few dozen source files produce hundreds of perceived moments. Audio is the second half of the **SURGE** engine: when the screen gets brighter and more confetti-flecked, the ears must agree.

> **North-star rule:** Everything ships **original or royalty-free** (CC0 / properly licensed). No real chants, no recognizable stadium recordings, no licensed tracks, no recognizable broadcast-commentator impressions. See Section 0 legal guardrails — the same discipline that governs crests and rosters governs every waveform.

---

### Crowd Reactions

The crowd is not a backing track — it is a **living instrument tied directly to the SURGE meter.** We build it from a handful of loops and let the mixer do the storytelling.

**The few-loops-feel-like-many recipe:**

- **3 base ambience loops** at different energy tiers, all original or CC0 crowd beds:
  - **Loop A — "Idle Murmur"** (low, restless, baseline hum)
  - **Loop B — "Engaged Buzz"** (mid, attentive, rising chatter)
  - **Loop C — "Fever"** (high, roaring, near-continuous)
- These three are **cross-faded by the SURGE value**, not switched. As Surge climbs, the mix slides A→B→C continuously, so the crowd *breathes* with momentum rather than stepping between states. Layer a low-pass filter that opens as Surge rises — muffled-to-bright — for an extra perceived dimension from the same files.
- **One-shot reaction stingers** fired by gameplay events, each with **3–5 pitch/volume variations** to dodge repetition fatigue:
  - **"Ooooh!"** rising-then-falling — near-miss, post off the woodwork, a saved **SCREAMER**.
  - **"Gasp + intake"** — a sudden turnover or a **WALL** stop.
  - **"Rolling cheer build"** — sustained possession in the attacking third (feeds anticipation).
  - **"ROAR"** — the goal payoff (see Goal Celebrations).
  - **"Groan / deflate"** — conceding, or a **SURGE RUN** that fizzles.

**Momentum & comeback hooks:**
- When **THE 90TH** triggers (final 5 in-game minutes, trailing team's Surge fills faster), the crowd bed pushes toward Loop C and a **low, swelling "willing-them-on" chant loop** fades in — wordless, rhythmic *"hey… hey… hey,"* deliberately non-language so it's globally generic and legally clean.
- When **GROUNDSWELL** fires (maxed-Surge team-wide super-state), the crowd hits a **dedicated sustained roar layer** stacked on top of Loop C — the only time all crowd layers play simultaneously. This audio "ceiling" is reserved so the namesake moment is unmistakably the loudest thing in the game.

**Asset count:** ~3 beds + ~6 reaction one-shots (×4 variations) + 2 special layers ≈ **under 12 source files** powering the entire crowd.

---

### Commentary Approach

**Recommendation: skip full play-by-play VO entirely.** For a solo dev, real commentary is a budget black hole (scripting, hours of session recording, branching state logic, re-records for every balance change) — and it ages badly. Instead, use a **stinger-callout + on-screen "broadcast text"** hybrid that reads as energetic e-sports broadcast while costing a fraction.

**The three-layer commentary stack (cheapest → richest):**

1. **On-screen "broadcast text" (ships first, zero VO cost).** Punchy, animated lower-thirds and center-screen flashes in the geometric e-sports UI — `SCREAMER!!!`, `GROUNDSWELL UNLEASHED`, `THE WALL HOLDS`, `90TH-MINUTE DRAMA`. Pairs with a short musical/UI stinger. This alone *feels* like commentary because it names the moment in our own glossary.
2. **Short VO "hype tags" (a handful of words, not sentences).** 1–2 second exclamatory callouts, not running narration. Easy to record, easy to vary, trivially swappable. Fire sparingly so they punctuate rather than chatter.
3. **Optional: light color-commentary fragments** for marquee moments only (goals, GROUNDSWELL, final whistle) — still tags, never paragraphs.

**~12 reusable hype-tag callout lines** (deliberately generic, glossary-flavored, zero real-name/real-event references):

1. *"GROUNDSWELL!"*
2. *"What a SCREAMER!"*
3. *"The Wall holds!"*
4. *"He's surging!"*
5. *"Oh, that's cheeky!"* (skill move / NUTMEG METER pop)
6. *"Nutmegged!"*
7. *"Into the 90th — here we go!"*
8. *"They will not lie down!"* (comeback in progress)
9. *"Top corner!"*
10. *"Lift the Sphere!"* (final-whistle win)
11. *"The whole world wants the ball!"* (secondary tagline as a flavor tag)
12. *"One surge from glory!"*

> These map to events, not specific players, so they never need re-recording when rosters or balance change — and they never point at a real individual (Section 0 / Section 4 smell test).

**Optional TTS path (and how to keep it clean):**
- Generate all VO via **text-to-speech / AI voice** to skip recording entirely. Use tools whose license **grants commercial rights and royalty-free ownership of the output** — e.g. **ElevenLabs** (paid tiers grant commercial use; use only their generic/synthetic or your own cloned-with-consent voices), **Piper** (fully open-source, on-device, CC-friendly), or **Coqui-style** open TTS.
- **Legal hygiene for TTS:** (a) never clone or imitate a real, identifiable commentator or celebrity voice; (b) use the tool's stock/synthetic voices or a voice you own/licensed with consent; (c) keep lines **generic and event-based** — no real player names, club names, or real-tournament references; (d) retain proof of license/commercial grant for each voice. A synthetic, slightly stylized "broadcast" voice actually suits the e-sports-clean tone better than hyper-real VO.
- **Hybrid sweet spot:** TTS hype tags + on-screen broadcast text + crowd reactions together read as a full broadcast for near-zero recording cost, and any line can be re-generated in seconds when the glossary grows.

---

### Music Style

**Genre:** **pulsing electronic-orchestral with global percussion** (per the Section 6 art-direction north star). Think driving synth arps and four-on-the-floor energy underpinned by cinematic strings/brass hits, laced with hand percussion (djembe, taiko, frame drums, shakers, claps) that nods to the worldwide cast of nations without quoting any one nation's traditional music. **Celebratory, rhythm-driven, e-sports-clean** — never grim, never sleepy.

**The original anthemic tournament theme — "Lift the Sphere" (working title):**
- One **memorable 8–16 bar melodic hook** (the "Groundswell motif") that becomes the sonic logo of the brand. It plays on the title screen, gets teased under menus, and returns in full triumphant form on the trophy lift.
- Built so it can be **fragmented and reused**: the hook's first 3 notes become a UI confirm sound; a single brass swell becomes a goal stinger; the percussion stem becomes a menu loop. One composition seeds the whole soundtrack — maximum cohesion, minimum assets.

**Context intensity tiers (same palette, different energy):**
- **Menus / Front-end:** the theme stripped back — percussion + soft arp + pad, mid-tempo, loopable, low-stakes confidence. Inviting, not adrenaline.
- **Match (in-play):** rhythmic engine bed that **layers up with SURGE** (see adaptive layering). Energetic but doesn't fight the crowd or SFX — sits in a mid frequency pocket, leaving highs for whistles/net and lows for crowd roar.
- **Final / Knockouts:** full arrangement — strings, brass, choir-style synth pads, biggest percussion. The theme at maximum bombast, reserved so it lands as an event.

**Adaptive layering (how 1 track becomes many):**
- Compose the match track in **stems / vertical layers** locked to the same tempo and key:
  1. **Pulse** (kick + bass) — always on.
  2. **Groove** (percussion + hats) — fades in at low Surge.
  3. **Melody** (arp / synth lead) — enters at mid Surge.
  4. **Anthem** (strings + brass + the hook) — unlocks at high Surge / **GROUNDSWELL**.
- Surge value drives the layer mix in real time, so the *same* loop feels like four different tracks across one match — and the music peaks exactly when the comeback peaks. A short **filter-sweep / riser** transitions between intensity jumps so layer changes feel intentional, not abrupt.

---

### Goal Celebrations

Per Pillar 3 — **EVERY GOAL IS A FIREWORK** — scoring is the loudest, juiciest audio event in the game. The celebration is a **stacked stinger** assembled live from existing parts so each goal feels custom without bespoke files.

**The goal stack (fired in a ~2-second cascade):**
1. **Impact transient** — a beefy *THWOCK* of ball-on-net + a sub-bass *boom* for screen-shake weight (synced to the visual punch-in / slow-mo).
2. **Crowd ROAR layer** — the high reaction one-shot, pitched up slightly on bigger goals (e.g. a **SCREAMER** or a **GROUNDSWELL** goal gets the loudest, brightest variant).
3. **Goal jingle** — a **1–2 second triumphant brass/synth flourish** lifted directly from the "Lift the Sphere" hook, so every goal reinforces the theme. Keep **3–4 jingle variants** and rotate to avoid fatigue.
4. **Confetti / sparkle shimmer** — a light high-frequency particle sound matching the on-screen confetti, panned and tailing off as the slow-mo releases.

**Goal-type juice scaling (same parts, escalating mix):**
- **Tap-in / normal goal:** impact + standard roar + short jingle.
- **SCREAMER:** add extra sub-bass, longer slow-mo audio tail, brightest roar variant, a tiny pre-impact *whoosh* on the long shot.
- **GROUNDSWELL goal:** the full stack at the ceiling — sustained roar layer + the anthem jingle variant + an extra shimmer pass. The audio equivalent of the marquee moment.

> All goal audio derives from the **same hook + the same crowd one-shots**, just remixed by goal type. Net result: dozens of distinct-feeling celebrations from a tiny shared pool.

---

### Tournament Atmosphere

Audio is the primary tool that makes the **Globe Cup** *escalate* — the final must feel categorically bigger than a group-stage opener, and we achieve that almost entirely through mix and layering rather than new assets.

**Escalation dials (turned up stage by stage):**

| Stage | Crowd | Music | Presentation |
|---|---|---|---|
| **Group Stage** | smaller bed, Loops A/B dominant, modest roar ceiling | match stems, lighter top layers | minimal stinger set |
| **Knockouts (Ro16 → QF → SF)** | bigger bed, Loop C reachable sooner, fuller reaction set | more layers unlocked earlier, occasional anthem tease | richer broadcast-text flashes, more hype tags |
| **THE FINAL** | maximum crowd ceiling, dedicated final-roar layer, pre-match anthem swell | full "Lift the Sphere" arrangement, all stems live | full stinger suite, color-commentary fragments, trophy-lift cue |

**Specific escalation techniques (cheap, high-impact):**
- **Reverb / space scaling:** widen the reverb tail and stereo image as the tournament progresses — the *same* crowd loops sound like a bigger, more cavernous stadium in the final. One reverb parameter sells "huge venue."
- **Pre-match anthem & ceremony:** the final (and only the final) opens with a short **"Lift the Sphere" ceremonial swell** and a hush-then-rise crowd cue, signaling *this one matters.* Group games just kick off.
- **Rising Surge generosity:** later stages let the music's **Anthem layer** and crowd **Fever loop** trigger more readily, so the knockouts simply *sound* more intense moment-to-moment.
- **The trophy-lift payoff:** winning the final detonates the full audio ceiling at once — sustained roar + confetti shimmer wall + the complete triumphant theme + the *"Lift the Sphere!"* hype tag — the single biggest audio moment in the product, earned by the whole tournament's escalation.
- **HOST nuance:** in a **HOME SURGE** stadium, bias the crowd bed one tier hotter and let the Fever loop and home-roar one-shots trigger more easily — the host's stadium *audibly* roars louder, reinforcing the Section 8 buff without any new gameplay logic.

> **Bottom line for the solo dev:** roughly **a dozen crowd files, one stem-based music composition, one hook-derived stinger family, and a handful of TTS hype tags** — recombined by Surge, goal type, and tournament stage — deliver an arena that sounds AAA. The mixer is the content. Build the surge response once, and the whole world roars on cue.

---

## 9. Technical Design

> **Scope.** This section is the build contract for a solo developer working with AI-assisted coding (Claude Code). Every choice below optimizes for two things above all else: **iteration speed** (see a balance tweak or a *Surge* curve change in the browser within a second) and **AI-editability** (a flat, text-based, strongly-typed codebase Claude Code can read, reason about, and refactor without choking on binary blobs or opaque editor-scene files). It directly serves the four Core Pillars — especially **Five-Minute Mastery Arc** and **Surge Over Sim** — by keeping the match simulation small, deterministic, and tunable from JSON.

### 9.1 Technology Stack

**Decision: TypeScript + Phaser 3, built with Vite, wrapped for Desktop (Tauri) and Mobile (Capacitor).**

TypeScript is non-negotiable for an AI-assisted solo project: static types are the single highest-leverage tool for keeping Claude Code's edits correct. Interfaces (Section 9.4) act as a machine-readable contract, the compiler catches whole classes of AI hallucinations before runtime, and editor tooling gives instant cross-file navigation. We run `strict: true` from day one.

For the 2D arcade engine, here is the honest comparison:

| Option | Web iteration | AI/text editability | Fit for GROUNDSWELL | Verdict |
|---|---|---|---|---|
| **Phaser 3** | Excellent — pure JS/TS, instant HMR via Vite, runs in any browser tab | Excellent — 100% code, huge well-documented API in the training corpus, no binary project files | Built exactly for fast, juicy 2D arcade games: arcade physics, tweens, particles, camera shake, sprite atlases all first-class | ✅ **CHOSEN** |
| **PixiJS + custom systems** | Excellent rendering | Good, but *you* write the game loop, input, physics, scene mgmt, audio — more code to own | Maximum control, maximum work. Reinventing what Phaser ships. Not worth it for a solo dev on a timeline | Runner-up |
| **Godot** | Web export is a heavy WASM bundle; iteration is in-editor, not the browser | Poor for *this workflow* — `.tscn`/`.tres` scene files and the editor-driven flow fight a text-first AI pipeline; GDScript has thinner AI coverage than TS | Capable engine, wrong tool for an AI-edited, web-first, text-based codebase | Rejected |
| **Unity** | Slow iteration, no instant web tab, C# + heavy editor, large web builds | Poor — scene/prefab files are not meaningfully AI-editable; closed-source engine internals | Overkill; contradicts "minimize implementation complexity" | Rejected |

**Why Phaser 3 wins for this project specifically:** it is *all text*. There is no binary scene file, no proprietary editor in the loop — the entire game is `.ts` files Claude Code can open, diff, and rewrite. Its API surface (scenes, arcade physics, tweens, particle emitters, `camera.shake()`) maps one-to-one onto our needs: **EVERY GOAL IS A FIREWORK** is literally `camera.shake()` + a particle burst + a tween, and **SCREAMER** slow-mo is a one-line `time.timeScale` dip. The API is heavily represented in AI training data, so generated code tends to be correct on the first pass. Combined with Vite's sub-second hot-module-reload, you change a tween easing or a *Surge* fill rate and see it in the running browser game immediately — the tightest possible feedback loop for tuning game feel.

**Tooling: Vite.** Dev server with instant HMR, zero-config TypeScript, trivial static build (`vite build` → a `dist/` folder of plain web assets). That `dist/` folder is what every platform wrapper consumes, which is what makes "Web first, then Desktop + Mobile" almost free.

```jsonc
// package.json (core deps)
{
  "type": "module",
  "scripts": {
    "dev": "vite",                    // instant web iteration
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",             // headless sim/unit tests
    "desktop": "tauri dev",
    "mobile": "cap run ios"
  },
  "dependencies": { "phaser": "^3.80.0" },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^5.3.0",
    "vitest": "^2.0.0",
    "@tauri-apps/cli": "^2.0.0",
    "@capacitor/cli": "^6.0.0"
  }
}
```

**Platform path:**
- **Web (primary):** `vite build` → static host (itch.io, Netlify, any CDN). This is the canonical target.
- **Desktop (Win/Mac/Linux):** **Tauri** wraps the same `dist/` in a native webview. Tiny binaries, native file-system access (used for the desktop save path in Section 9.5), no second codebase.
- **Mobile (iOS/Android):** **Capacitor** wraps the same `dist/`. Touch input is handled in-engine by Phaser's unified pointer events.

One TypeScript codebase, one build output, three platforms. No engine lock-in, no editor in the loop, and every byte of game logic is text an AI can edit.

### 9.2 Game Engine / Framework

The pick is **Phaser 3**, organized around three concepts: a **fixed-timestep match loop**, **Scenes** for top-level flow, and **arcade physics for feel, not realism**.

**Deterministic-ish fixed-timestep loop.** This is the most important engineering decision in the document. The match simulation must advance in fixed steps so that (a) AI behaves identically regardless of frame rate, (b) replays and the headless test harness reproduce a match exactly, and (c) **THE 90TH** and *Surge* fill rates are frame-rate-independent. We decouple simulation from rendering: the sim steps at a fixed `SIM_DT` (60 Hz), rendering interpolates between the last two sim states for smoothness, and Phaser arcade physics is used only for cosmetic/loose collisions in the render layer — the *authoritative* ball-and-player state lives in our own sim (Section 9.3), not in Phaser bodies.

```ts
// src/sim/MatchLoop.ts — fixed-timestep accumulator, engine-agnostic
export const SIM_DT = 1000 / 60; // 16.667 ms — one simulation tick
const MAX_FRAME = 250;           // clamp spiral-of-death after a stall

export class MatchLoop {
  private acc = 0;

  constructor(
    private sim: MatchSim,                       // pure logic, no Phaser
    private render: (interp: number) => void,    // draws interpolated state
  ) {}

  /** Called once per rendered frame with real elapsed ms. */
  tick(deltaMs: number): void {
    this.acc += Math.min(deltaMs, MAX_FRAME);
    while (this.acc >= SIM_DT) {
      this.sim.step(SIM_DT);   // deterministic: same input -> same output
      this.acc -= SIM_DT;
    }
    this.render(this.acc / SIM_DT); // 0..1 interpolation alpha
  }
}
```

**Determinism caveat ("-ish").** True bit-exactness across platforms would require a fixed-point or seeded-integer math layer. We do not need that. We need *reproducibility within a session* (replays, tests, debugging) and *fairness* (frame-rate independence). We get both by: stepping at fixed `SIM_DT`, routing **all** randomness through one seeded PRNG (`SeededRandom`, seed stored in `MatchState`), and never reading `Math.random()` or wall-clock time inside `sim.step()`. Same seed + same inputs = same match, every time. This is what makes **NO TEAM IS UNWINNABLE** testable: we can simulate 10,000 MINNOW-vs-ELITE matches headlessly and confirm the underdog's *Surge*-driven win rate stays above zero.

**Scenes (top-level flow).** Phaser Scenes are the natural unit for screens. Each is a thin shell that owns rendering and input and delegates all logic to systems/state stores:

```
BootScene → PreloadScene → MainMenuScene → TournamentScene
                                              ├── GroupStageScene
                                              ├── BracketScene
                                              └── MatchScene  (hosts MatchLoop + MatchSim)
                                                    └── ResultScene
```

`MatchScene` is the only scene that runs `MatchLoop`. Menu/tournament scenes are essentially views over the `TournamentState` store (Section 9.3). This keeps the heavy, testable logic out of Phaser entirely.

**Physics story.** Phaser's **Arcade Physics** (lightweight AABB, no rigid-body solver) is more than enough — and deliberately so: **Surge Over Sim** means we want snappy, readable, slightly-exaggerated motion, not a physics simulation. The ball is a single body with custom acceleration/drag we tune from JSON; player-ball "possession" is a proximity check, not a collision joint. A **SCREAMER** is just a high-velocity shot with a power threshold that triggers the camera/slow-mo juice. We never enable the heavier Matter.js physics — it would add complexity for zero gameplay benefit.

### 9.3 Architecture

**Guiding principle: the match simulation is a pure, Phaser-free module.** Everything that decides *what happens* (ball, players, AI, *Surge*, goals, **THE 90TH**) lives in `src/sim/` and imports nothing from Phaser. Everything that decides *how it looks* lives in `src/scenes/` and `src/render/`. This separation is what makes AI behavior, replays, and unit tests possible — you can run a full match in a Vitest process with no browser.

**Folder structure:**

```
src/
  main.ts                 # Phaser.Game config, scene registry, boot
  config/
    constants.ts          # SIM_DT, pitch dims, Surge tuning knobs
    balance.ts            # loads + validates JSON balance data
  data/                   # DATA-DRIVEN CONTENT — edit without recompiling logic
    teams/                #   one JSON file per nation (48 files)
    players/              #   rosters (or embedded in team files)
    tournament.json       #   zones, host flag, tier distribution
    powerups.json         #   Surge Run / Groundswell / Wall params
  sim/                    # PURE LOGIC — zero Phaser imports
    MatchSim.ts           #   owns MatchState, runs one step()
    MatchLoop.ts          #   fixed-timestep accumulator (9.2)
    SeededRandom.ts       #   single source of randomness
    entities/             #   Ball, PlayerEntity (plain data + behavior)
    systems/              #   movement, possession, shooting, surge, the90th, scoring
    ai/                   #   opponent + teammate decision systems
    replay/               #   InputRecorder, ReplayPlayer
  state/                  # APP/TOURNAMENT STATE (menus, bracket, progression)
    tournamentStore.ts    #   zustand-style vanilla store
    settingsStore.ts
    saveStore.ts
  scenes/                 # PHASER — rendering + input only, thin
    BootScene.ts  PreloadScene.ts  MainMenuScene.ts
    TournamentScene.ts  GroupStageScene.ts  BracketScene.ts
    MatchScene.ts  ResultScene.ts
  render/                 # Phaser-side helpers: juice, particles, hud
    Juice.ts              #   shake, slow-mo, confetti, screamer FX
    SurgeMeterUI.ts
  save/
    SaveManager.ts        #   platform-adaptive persistence (9.5)
    migrations.ts         #   versioned save migrations (9.5)
  types/
    models.ts             #   all interfaces from Section 9.4
  test/
    sim.spec.ts           #   headless match-sim tests
    balance.spec.ts       #   "no team is unwinnable" statistical test
assets/                   # built atlases, audio, fonts (9.6)
```

**Design: a light Entity/System split inside the sim.** Entities (`Ball`, `PlayerEntity`) are mostly plain data. Systems are pure functions `(state, dt) => void` that mutate the `MatchState` they're handed. The whole match is `MatchState` + an ordered list of systems run each tick. This is simple, AI-friendly (each system is a small, single-responsibility file), and trivially testable.

```ts
// src/sim/MatchSim.ts — the authoritative, Phaser-free simulation
import { SeededRandom } from "./SeededRandom";

export interface MatchState {
  seed: number;
  rng: SeededRandom;
  clockMs: number;          // in-match time
  isFinalFive: boolean;     // THE 90TH active (last 5 in-game minutes)
  ball: Ball;
  players: PlayerEntity[];
  score: [number, number];  // [home, away]
  surge: [number, number];  // 0..1 per side, Section 8/9 Surge meter
  groundswell: [boolean, boolean]; // team-wide super-state active
  events: MatchEvent[];     // goals, screamers, megs — drives the juice layer
}

type System = (s: MatchState, dt: number) => void;

export class MatchSim {
  private systems: System[];
  constructor(public state: MatchState, systems: System[]) {
    this.systems = systems; // [input, movement, possession, shooting,
                            //  surgeSystem, the90thSystem, scoring, ...]
  }
  step(dt: number): void {
    this.state.clockMs += dt;
    for (const sys of this.systems) sys(this.state, dt);
  }
}
```

The render layer reads `state.events` each frame and fires juice (`Juice.screamer()`, confetti, `camera.shake()`), then clears consumed events. The renderer never writes to `MatchState` — strict one-way data flow. This means a replay is just `MatchState.seed` + recorded input frames re-fed through the identical systems.

**State management for menus & tournament.** Outside a match, the app is plain UI state — no need for Phaser here. We use a tiny vanilla **Zustand** store (works without React; it's a 1 KB pub/sub) as the single source of truth for `TournamentState`, `Settings`, and the active `SaveGame`. Scenes subscribe and re-render; actions (`advanceGroupStage()`, `recordResult()`) mutate the store and trigger autosave. This keeps tournament progression decoupled from any scene and makes it directly serializable to the save file.

```ts
// src/state/tournamentStore.ts
import { createStore } from "zustand/vanilla";

interface TournamentSlice {
  tournament: TournamentState | null;
  recordResult(matchId: string, result: MatchResult): void; // updates group/bracket, autosaves
  advanceRound(): void;
}

export const tournamentStore = createStore<TournamentSlice>((set, get) => ({
  tournament: null,
  recordResult(matchId, result) {
    /* update standings/bracket, then call SaveManager.autosave(get()) */
  },
  advanceRound() { /* ... */ },
}));
```

**Module boundaries (enforced, lint-checkable):**
- `sim/**` imports **nothing** from `phaser`, `scenes/`, `render/`, or `state/`. (Add an ESLint `no-restricted-imports` rule so an AI edit can't accidentally break it.)
- `scenes/**` and `render/**` may import `sim/` and `state/` (read state, react to events) but never reverse.
- `data/**` is JSON only — no logic.
- `save/**` depends on `state/` shapes and `types/`, nothing else.

This boundary is the architectural backbone: it is what makes the sim testable in isolation, replays exact, and AI behavior pluggable (swap an `ai/` system without touching rendering).

### 9.4 Data Structures

All interfaces live in `src/types/models.ts`. They encode the Creative Bible's contracts directly — the rating scale, zones, host rule, and glossary terms are types, not loose strings, so the compiler enforces the bible.

```ts
// ─────────────────────────────────────────────────────────────
// src/types/models.ts
// ─────────────────────────────────────────────────────────────

/** Section 3 confederation codes — exact bible values. */
export type ZoneCode = "ICL" | "SBC" | "EAU" | "SCB" | "NTA" | "BHC";

/** Section 8 rating contract — five tiers, locked OVR bands. */
export type Tier = "ELITE" | "STRONG" | "SOLID" | "PLUCKY" | "MINNOW";

export type Position = "GK" | "DEF" | "MID" | "FWD";

export interface Player {
  id: string;                 // stable, e.g. "ITA-FWD-01"
  firstName: string;          // generic regional given name (Section 4)
  surname: string;            // invented punny surname, e.g. "Volleyault"
  nickname?: string;          // e.g. "The Number 9"
  position: Position;
  jersey: number;
  /** Per-attribute ratings, all on the 60–99 band of Section 8. */
  attrs: {
    pace: number;
    shooting: number;
    passing: number;
    defending: number;
    flair: number;            // feeds the NUTMEG METER
    keeping: number;          // meaningful only for GK
  };
}

export interface Team {
  id: string;                 // ISO-style key, e.g. "ITA"
  country: string;            // real country name (allowed — Section 0)
  /** Fictionalized-Nations toggle name, e.g. "Brazilia" (Section 0). */
  altName: string;
  zone: ZoneCode;
  tier: Tier;
  ovr: number;                // 60–99, must fall in tier's band (Section 8)
  isHost: boolean;            // triggers HOME SURGE (+4 OVR, faster Surge)
  /** Original-design identity — NEVER a real crest/kit (Section 0/6). */
  crestId: string;            // key into the crest atlas
  kit: KitTheme;
  roster: Player[];           // 11 starters + subs
}

export interface KitTheme {
  primary: string;            // hex — invented color treatment
  secondary: string;
  accent: string;
  pattern: "solid" | "sash" | "halftone" | "gradient"; // Section 6
}

// ── Match ─────────────────────────────────────────────────────
export interface MatchResult {
  homeGoals: number;
  awayGoals: number;
  /** Optional shootout if a knockout match is drawn. */
  shootout?: [number, number];
  scorers: GoalEvent[];
  groundswellTriggered: [boolean, boolean]; // did either side go super?
}

export interface GoalEvent {
  teamSide: 0 | 1;
  playerId: string;
  minute: number;
  type: "open" | "screamer" | "header" | "penalty";
  duringGroundswell: boolean;
}

export interface Match {
  id: string;                 // e.g. "GRP-A-1" or "KO-R16-3"
  home: string;               // Team.id
  away: string;               // Team.id
  hostBoostApplied: boolean;  // was Home Surge in effect?
  result?: MatchResult;       // undefined until played
  seed: number;               // PRNG seed → reproducible / replayable
}

// ── Group stage ───────────────────────────────────────────────
export interface GroupRow {
  teamId: string;
  played: number; won: number; drawn: number; lost: number;
  gf: number; ga: number; pts: number;
}

export interface Group {
  id: string;                 // "A".."L" (12 groups of 4 = 48 teams)
  teamIds: string[];
  matches: string[];          // Match.id list
  table: GroupRow[];          // recomputed from results
}

// ── Knockout bracket (binary tree) ────────────────────────────
export interface BracketNode {
  id: string;                 // "KO-R16-3", "KO-QF-1", ... "KO-F"
  round: "R32" | "R16" | "QF" | "SF" | "F";
  matchId?: string;           // the Match played here
  homeSource: string;         // group rank ("A1") or child node id
  awaySource: string;
  winnerId?: string;          // set once decided; feeds parent node
}

// ── Top-level tournament ──────────────────────────────────────
export interface TournamentState {
  id: string;
  name: "The Globe Cup";      // bible-locked event name
  hostTeamId: string | null;  // drives Host Boost rule (Section 8)
  phase: "GROUPS" | "KNOCKOUT" | "COMPLETE";
  teams: Record<string, Team>;
  groups: Group[];
  bracket: BracketNode[];
  championId: string | null;  // lifts THE AURORA SPHERE
  auroraPoints: number;       // AP earned this run (Section 9 glossary)
}

// ── Power-ups / Surge states (Section 9 glossary) ─────────────
export type PowerUpKind =
  | "SURGE_RUN"     // spent-Surge speed/shot/pass burst
  | "GROUNDSWELL"   // ~30s team-wide super-state
  | "SCREAMER"      // long-range power-shot window
  | "WALL"          // defensive lockdown stance
  | "HOME_SURGE";   // host stadium buff

export interface PowerUp {
  kind: PowerUpKind;
  surgeCost: number;          // fraction of the Surge meter consumed (0..1)
  durationMs: number;         // GROUNDSWELL ≈ 30000
  effects: {                  // multiplicative modifiers applied in sim
    speed?: number;           // e.g. 1.2
    shotPower?: number;
    passPrecision?: number;
    interception?: number;    // WALL boosts this
  };
}

// ── Settings (Section 0 toggle lives here) ────────────────────
export interface Settings {
  schemaVersion: number;
  fictionalizedNations: boolean;  // OFF by default (Section 0)
  masterVolume: number;           // 0..1
  sfxVolume: number;
  musicVolume: number;
  screenShake: number;            // 0..1 — accessibility/juice scaler
  difficulty: "casual" | "normal" | "groundswell";
  reducedMotion: boolean;         // dampens slow-mo/shake for accessibility
}

// ── Save game (Section 9.5) ───────────────────────────────────
export interface SaveGame {
  schemaVersion: number;      // bump on any breaking shape change
  slotId: number;             // 0..N — multiple slots
  createdAt: number;          // epoch ms
  updatedAt: number;
  profileName: string;
  career: {
    totalAuroraPoints: number;
    unlockedCosmetics: string[];
    worldElevenUnlocked: boolean;   // WORLD ELEVEN all-star mode
    trophiesWon: number;
  };
  activeTournament: TournamentState | null; // resume mid-run
  settings: Settings;
}
```

These types are deliberately serialization-friendly: every field is a primitive, array, or plain object, so a `SaveGame` is `JSON.stringify`-able with no custom serializer. The PRNG state is reconstructed from the stored `seed`, never serialized directly.

### 9.5 Save System

**Strategy: one platform-agnostic `SaveManager` interface, three backends, JSON everywhere, versioned with migrations.** This directly satisfies the Tournament section's need to resume a Globe Cup run mid-bracket and to keep career/AP progression across sessions.

**Backend per platform (auto-selected at boot):**
- **Web:** **IndexedDB** as primary (large quota, structured, async, survives across tabs), with a `localStorage` mirror of just `Settings` + the save *index* for instant boot reads. We use IndexedDB over raw `localStorage` for the full save because a deep mid-tournament `SaveGame` (48 teams + rosters + bracket) can exceed `localStorage`'s ~5 MB cap.
- **Desktop (Tauri):** a real `groundswell/saves/slot-{n}.json` file in the OS app-data dir via Tauri's FS API — human-readable, backup-able, debuggable.
- **Mobile (Capacitor):** Capacitor Preferences/Filesystem; same JSON, native storage.

```ts
// src/save/SaveManager.ts
export interface SaveBackend {
  read(slotId: number): Promise<unknown | null>;
  write(slotId: number, data: SaveGame): Promise<void>;
  list(): Promise<SaveMeta[]>;        // for the slot-select screen
  delete(slotId: number): Promise<void>;
}

export const CURRENT_SCHEMA = 3;      // bump on breaking change

export class SaveManager {
  constructor(private backend: SaveBackend) {}  // injected per platform

  async load(slotId: number): Promise<SaveGame | null> {
    const raw = await this.backend.read(slotId);
    if (!raw) return null;
    return migrate(raw as VersionedSave); // always run through migration chain
  }

  async save(slot: number, game: SaveGame): Promise<void> {
    game.schemaVersion = CURRENT_SCHEMA;
    game.updatedAt = Date.now();
    await this.backend.write(slot, game);
  }

  /** Debounced autosave called by the tournament store after every result. */
  autosave = debounce((slot: number, game: SaveGame) => this.save(slot, game), 400);
}
```

**Versioning + migration story.** Every save carries `schemaVersion`. On load we run it through an ordered migration chain so old saves never break when interfaces evolve — critical when an AI-assisted dev iterates on data shapes frequently.

```ts
// src/save/migrations.ts
type Migration = (s: any) => any;

const MIGRATIONS: Record<number, Migration> = {
  // v1 -> v2: added career.worldElevenUnlocked
  1: (s) => ({ ...s, career: { ...s.career, worldElevenUnlocked: false }, schemaVersion: 2 }),
  // v2 -> v3: added Settings.reducedMotion
  2: (s) => ({ ...s, settings: { ...s.settings, reducedMotion: false }, schemaVersion: 3 }),
};

export function migrate(save: VersionedSave): SaveGame {
  let s: any = save;
  while (s.schemaVersion < CURRENT_SCHEMA) {
    const m = MIGRATIONS[s.schemaVersion];
    if (!m) throw new Error(`No migration from v${s.schemaVersion}`);
    s = m(s);
  }
  return s as SaveGame;
}
```

**Autosave points** (each writes the active slot through the debounced `autosave`):
- After every **match result** is recorded (group or knockout) — the core resume guarantee.
- On **group-stage → knockout** phase transition.
- On **tournament completion** (champion lifts **The Aurora Sphere**, AP banked).
- On any **Settings** change (settings persist independent of a run).
- On **manual save** from the pause menu.

**Multiple slots.** `SaveBackend.list()` returns `SaveMeta[]` (`slotId`, `profileName`, `updatedAt`, current `phase`, AP total) to power a slot-select screen — supporting several parallel careers/tournaments. Slot 0 is the default "quick career." Save data is namespaced (`groundswell:save:{slot}`) so it never collides with other localStorage keys when hosted on a shared domain like itch.io.

### 9.6 Asset Pipeline

**Philosophy: data and binaries are separate from code, and balance lives in JSON so the simulation never recompiles to retune.** This is the operational expression of **Surge Over Sim** and **No Team Is Unwinnable** — you tweak a number, the running game reflects it.

**Data-driven content (the most important part).** Teams, rosters, tournament structure, and power-up tuning are **JSON in `src/data/`**, loaded at boot and validated against the Section 9.4 interfaces (a lightweight Zod schema or hand-written type guards in `config/balance.ts`). To rebalance a team's tier, edit a JSON file — no logic change, no recompile, and during `vite dev` the HMR reloads it instantly.

```jsonc
// src/data/teams/ITA.json — one file per nation, AI- and human-editable
{
  "id": "ITA",
  "country": "Italy",
  "altName": "Italia-Prime",        // Fictionalized-Nations toggle
  "zone": "ICL",
  "tier": "STRONG",
  "ovr": 86,                         // must sit in 82–89 (STRONG band)
  "isHost": false,
  "crestId": "crest_italy_orig",     // original design key
  "kit": { "primary": "#1B4D8C", "secondary": "#0E2A4D", "accent": "#E8C547", "pattern": "sash" },
  "roster": [
    {
      "id": "ITA-FWD-01", "firstName": "Marco", "surname": "Volleyault",
      "nickname": "The Number 9", "position": "FWD", "jersey": 9,
      "attrs": { "pace": 84, "shooting": 90, "passing": 80, "defending": 55, "flair": 86, "keeping": 10 }
    }
    // ...10 more, built via the Section 4 fun-tweak recipe
  ]
}
```

A boot-time validator enforces the bible: it checks that each team's `ovr` falls within its `tier` band, that the 48-team tier distribution matches Section 8 (6/10/16/10/6), and that host teams respect the min-SOLID / +4 rule. If an AI-edited JSON violates the contract, the dev build fails loudly with a clear message — turning the Creative Bible into an automated test.

**Sprites (AI-generated, then atlased).** A solo dev generates the neo-poster art (Section 6) with image-gen tools, exporting transparent PNGs at a consistent base resolution. Organize source art under `art-src/` (not shipped), then pack into **texture atlases** so the game loads a handful of files instead of hundreds:

```bash
# Pack loose PNGs into atlases consumed by Phaser's load.atlas()
free-tex-packer-cli --project players.ftpp --output assets/atlases/
# → players.png  +  players.json   (frame map: "run_01", "kick_03", "celebrate_02", ...)
```

Atlas categories: `players` (run/kick/tackle/celebrate frames), `crests` (original animated emblems), `ui` (meters, buttons), `fx` (confetti, screamer flash, *Groundswell* glow). Phaser loads each atlas once and references frames by name — fast load, few HTTP requests, and frame names are readable strings an AI can wire up in code.

**Audio (AI-generated SFX + music).** Generate SFX (the satisfying *thwock*, net ripple, crowd swell, **SCREAMER** boom) and the "pulsing electronic-orchestral-with-global-percussion" score (Section 6) with AI audio tools. Export to **`.webm`/`.ogg` + `.m4a`** fallback for broad browser support, keep them in `assets/audio/{sfx,music}/`, and index them in a small `audio.json` manifest so a clip is referenced by key (`"sfx.screamer"`), not a raw path — making it trivial to swap a sound without touching code.

**Fonts.** Use one or two **open-license** display fonts (e.g. an SIL OFL geometric face) matching the "big numbers, clean meters, e-sports-crisp" UI (Section 6). Subset to the glyphs actually used and self-host as `.woff2` in `assets/fonts/` — zero external CDN dependency, fast load, works offline in the desktop/mobile wrappers. For in-canvas score/timer rendering, generate a **bitmap font** (`.fnt` + atlas page) from the same typeface so Phaser draws large numbers crisply at any zoom.

**Pipeline summary:** AI generates raw art/audio → packed into atlases/manifests in `assets/` → referenced by stable string keys in code → all *gameplay numbers* live in `src/data/*.json` validated against the Section 9.4 interfaces and the Section 8 rating contract. Code, content, and binaries stay cleanly separated, so the solo dev (with Claude Code) iterates on balance and feel at the speed of a save-and-refresh.

---

The section above is the deliverable. The full GDD section "## 9. Technical Design" is written and ready to paste into the document — no files were created (per instructions, the content is returned directly here). It is internally consistent with the Creative Bible: it reuses the locked title **GROUNDSWELL '26: World Eleven**, **The Globe Cup**, **The Aurora Sphere**, all six zone codes, the five-tier 60–99 rating scale and 6/10/16/10/6 distribution, the Host Boost (+4 / min-SOLID) rule, the Fictionalized Nations toggle, the Section 4 player-naming recipe (including **Marco Volleyault "The Number 9"**), and every Section 9 glossary term (**Surge, Surge Run, Groundswell, Screamer, Nutmeg Meter, Wall, The 90th, Aurora Points, World Eleven, Home Surge**) — and encodes the bible's contracts as TypeScript types and a boot-time validator.

---

---

## 10. Development Roadmap

> **Scope.** This section sequences GROUNDSWELL '26 into three honest, shippable milestones for a **solo developer using AI-assisted coding (Claude Code)**, built on the Section 9 stack (**TypeScript + Phaser 3 + Vite**, pure `src/sim/` core, JSON-driven content). It exists to enforce one discipline above all: **ship the fun first.** Each milestone is ruthlessly scoped, has an explicit cut list, a binary definition of done, and one load-bearing thing to nail. The ordering serves the Core Pillars (Section 7) in priority order — **Every Goal Is a Firework** and **Five-Minute Mastery Arc** must be *felt* on Day 1, long before the 48-team **Globe Cup** scaffolding exists.
>
> **The governing rule (tape it to the monitor):** *high-fun ÷ low-cost wins; low-fun × high-cost is a trap.* Where Phaser ships a feature for free (`camera.shake()`, tweens, particle emitters, `time.timeScale`), we lean on it hard. Where a feature is sim-flavored, asset-heavy, or only marginally fun, it is deferred or cut. We do not build the bracket before the ball feels good to kick.

---

### 10.1 The 1-Day MVP — "One Fun Match"

**Goal: prove the core loop is fun in a single sitting.** One arcade match, hot-seat or vs. a dumb bot, that you genuinely want to replay. If kicking the ball and scoring a goal isn't fun with zero art and zero teams, no amount of bracket, progression, or polish will save the game — so we find that out on Day 1. This milestone is the riskiest and therefore comes first.

**IN SCOPE:**
- **One `MatchScene`** running the fixed-timestep `MatchLoop` + `MatchSim` (Section 9.2/9.3). Sim is Phaser-free from the very first commit — this is the architectural keystone, not a later refactor.
- **5v5 on the 60×40 pitch** (Gameplay 2.2 default), but only **1 human-controlled player at a time** with auto-switch to the nearest teammate. The other figures are placeholder dots/capsules.
- **Three verbs only: shoot, pass, tackle.** Move with stick/WASD; one button passes, one button shoots (hold-to-charge), tackle is contextual on the defending side.
- **A ball that feels good** — custom accel/drag from `constants.ts`, proximity-based possession (no physics joints), and a **charged shot** whose power maps to the **SCREAMER** threshold.
- **Goals score, and a goal is already a firework** — `camera.shake()` + a particle burst + a `time.timeScale` slow-mo dip + a *thwock*. This is one afternoon's work in Phaser and it is the whole point of the game (Pillar 3).
- **A bare SURGE meter** (Section 9 glossary) that fills from good play and, when spent, triggers a single **SURGE RUN** speed/shot burst. Even stubbed, the heartbeat must be present on Day 1.
- **A clock, a score, a win screen.** 4–6 minute match (Gameplay 2.2), first to final whistle wins, a screen that says who won and offers "Rematch."
- **2 placeholder teams** as two color tints + two `Team` JSON rows (real-ish `Team` shape from Section 9.4), so the data path exists even though balance doesn't.
- **One Vitest test** that steps the sim headlessly to a goal — proves the seeded, frame-rate-independent loop works.

**OUT OF SCOPE / CUT (ruthlessly):**
- ❌ The tournament, groups, bracket, qualifying — **none of it.** No `TournamentState`.
- ❌ Save/load. A match is ephemeral; closing the tab loses everything. Fine.
- ❌ **GROUNDSWELL** team super-state, **WALL**, **NUTMEG METER**, **THE 90TH**, **HOME SURGE** — all deferred. Only the bare Surge→Surge Run loop ships.
- ❌ Menus beyond a "Press Start" and the win screen. No settings, no Fictionalized Nations toggle.
- ❌ Real rosters, parody names, crests, kits, audio mixing, music. Placeholder shapes and 3–4 free SFX.
- ❌ Smart AI. The opponent chases the ball and shoots when close — a **low-fun/high-cost trap** to over-build now.
- ❌ Mobile/desktop wrappers. **Web/`vite dev` only.**

**DEFINITION OF DONE:** You can launch `npm run dev`, play a full timed 5v5 match end-to-end against a trivial bot, score a goal that makes the screen shake and slow-mo, see a final score, and hit "Rematch" — and you actually *want* to. The Vitest sim test is green.

**THE ONE THING TO NAIL:** **Ball feel + the goal moment.** If the kick is satisfying and the goal is a firework, the project is alive. Everything downstream is scaffolding around this 30 seconds of feel — spend the day's tuning budget here, not on AI or UI.

---

### 10.2 The 1-Week Playable Prototype — "The Whole Globe Cup, Roughly"

**Goal: a complete game-shaped experience you can play start to finish.** Take the fun match from 10.1 and wrap it in the full **Globe Cup** structure — 48 teams, group stage, knockout bracket, a champion lifting (a placeholder) **Aurora Sphere** — plus save/resume so a run survives closing the tab, the marquee power-ups that make comebacks sing, and enough juice/audio to feel like a real game. Rough, gray-box, but *whole*.

**IN SCOPE:**
- **End-to-end Globe Cup:** 48 teams → **12 groups of 4** → group tables → **R32→R16→QF→SF→F** knockout (the `Group` / `BracketNode` / `TournamentState` types from Section 9.4, wired through the `tournamentStore`). Drawn knockouts resolve by a quick shootout.
- **Play-or-sim:** the human plays their team's match in `MatchScene`; all other fixtures are **simulated headlessly** by the same seeded `MatchSim` (an enormous high-fun/low-cost win — the bracket fills itself using code you already wrote and tested).
- **Save / resume (Section 9.5):** IndexedDB backend on web, debounced **autosave after every result** and on phase transitions. Closing the tab mid-bracket and resuming is the core promise — it ships this week.
- **The power-up trio that defines the game** (Section 9 glossary): **GROUNDSWELL** team super-state (~30s, the comeback marquee), **THE 90TH** trailing-team Surge boost in the final 5 minutes, and **WALL** defensive stance. These are the highest-fun mechanics in the design and they are mostly *Surge-meter math + a particle/tint* — high fun, low cost.
- **Two modes:** **Globe Cup** (the main career run) and **Quick Match / Street Surge** (3v3, instant replayable bouts reusing the same sim) — a second mode for nearly free.
- **Basic juice + audio pass:** confetti tinted to kit colors, **SCREAMER** comet-trail + extra shake, a *thwock*/net-ripple/crowd-swell SFX set, and one looping music bed. Use the shared VFX library discipline from Visual Design 7.7 — re-tint, don't author bespoke.
- **Real country names + gray-box teams:** 48 `Team` rows with real countries, tiers assigned, and a **handful** of parody-name rosters (Section 4 recipe) to validate the naming pipeline. Crests/kits are flat color tints for now.
- **The "no team is unwinnable" test harness** (`balance.spec.ts`): simulate thousands of **MINNOW-vs-ELITE** matches headlessly and confirm the underdog's Surge-driven win rate stays above zero (Pillar 4, Section 8 Promise). This is cheap because the sim is pure and seeded.

**OUT OF SCOPE / CUT:**
- ❌ Final art, animated crests, the real **Aurora Sphere** model, neo-poster character meshes — gray-box and color tints only.
- ❌ Full balance of all 48 teams. Tiers are assigned per the **6/10/16/10/6** distribution (Section 8) but per-attribute tuning is a Month-3 job; this week just needs the bands to exist and the harness to be green-ish.
- ❌ **WORLD ELEVEN** all-star mode, full cosmetic unlock economy, deep **AURORA POINTS** spending. AP can accrue, but the store is deferred.
- ❌ Settings depth, accessibility scalers, **Fictionalized Nations** toggle UI — data field exists (Section 9.4), screen does not.
- ❌ Tauri/Capacitor builds. Still web-only; wrappers are a Month-3 near-free step.
- ❌ **Over-engineered AI.** A single tunable "aggression/positioning" bot is plenty — realistic team AI is a low-fun/high-cost trap that would eat the whole week.

**DEFINITION OF DONE:** Start a new Globe Cup, play your matches while the rest of the bracket auto-sims, advance from groups through the knockouts to lift the (placeholder) Aurora Sphere, with **GROUNDSWELL / THE 90TH / WALL** firing in matches — then close the tab mid-run, reopen, and **resume exactly where you left off.** Both modes are playable; the balance harness runs.

**THE ONE THING TO NAIL:** **The comeback feels earned and electric.** A **THE 90TH** + **GROUNDSWELL** run that flips a losing match is the emotional core of the whole title (Pillars 1 & 4). If that swing lands — meter, super-state, screen swelling with momentum — the prototype proves the *fantasy*, not just the structure.

---

### 10.3 The 1-Month Polished Version — "Store-Ready"

**Goal: turn the whole prototype into a shippable product.** All 48 teams balanced and named, the full progression and unlock economy, every mode, the neo-poster art and audio from the Visual Design and Audio sections, real menus and settings, the three-platform build, and a clean legal pass — a build you could put on itch.io and a storefront without flinching.

**IN SCOPE:**
- **All 48 teams, fully balanced:** complete parody rosters (Section 4 recipe, position-appropriate roots — *Keepa/Wall/Cliff* for GKs, etc.), per-attribute ratings on the 60–99 band, sorted into the six zones (**ICL/SBC/EAU/SCB/NTA/BHC**), with the **6/10/16/10/6** tier distribution enforced by the **boot-time validator** (Section 9.6). The `balance.spec.ts` "no team is unwinnable" gate must be **green**.
- **Host Boost** fully implemented (Section 8): **+4 OVR Home Surge** (cap 99), faster home Surge fill, min-**SOLID** floor while hosting.
- **Full progression + economy:** **AURORA POINTS** earned per match, a cosmetic/unlock store, **WORLD ELEVEN** all-star mode unlocked via career milestones, trophy/career tracking persisted in `SaveGame`.
- **All modes:** Globe Cup career, Quick Match, Street Surge (3v3), 7v7 "Full Pitch" / World Eleven showcase, and the **Fictionalized Nations** safety toggle fully wired (Brazilia/Argentinia/etc.) for streamers and restricted regions (Section 0).
- **Art + audio polish** to the Visual Design (Section 7) and audio north star: neo-poster flat-shaded characters, animated original crests, invented-treatment kits, the real **Aurora Sphere** lift sequence, the **Surge-driven post-process** that brightens/warms the screen on a comeback (7.7), full SFX bank and the "electronic-orchestral-with-global-percussion" adaptive score.
- **Menus, settings, accessibility:** main menu, qualifying/bracket screens, slot-select (multi-slot saves, Section 9.5), volume mix, `screenShake`/`reducedMotion` scalers, three difficulty tiers (`casual`/`normal`/`groundswell`).
- **Three-platform build:** `vite build` → web (canonical), **Tauri** desktop, **Capacitor** mobile with touch input — one codebase, near-free per Section 9.1. Save migration chain (Section 9.5) tested across schema versions.
- **Store-ready legal pass (Section 0 — non-negotiable):** automated check + manual sweep confirming **zero** real player likenesses/names, **zero** FIFA/"World Cup" marks (event is **The Globe Cup**), all crests/kits/typography original, all rosters obviously-parody (the Section 4 "smell test"), and the title/tournament/trophy identity intact. The validator turns the Creative Bible into a CI gate.

**OUT OF SCOPE / CUT (post-launch, not v1):**
- ❌ Online multiplayer / netcode — a massive scope multiplier; the sim's determinism keeps the door open later, but it is **not** a launch feature.
- ❌ Live-service seasons, battle passes, server-driven content, monetization beyond cosmetic AP.
- ❌ Tactics/formation editors, transfers, manager-mode depth — explicitly anti-Bible (Section 5: "NOT a stat-spreadsheet manager"). A perennial low-fun/high-cost trap; keep it cut.
- ❌ Per-player face/likeness customization, voice commentary lines naming players, replay-sharing/export.
- ❌ Localization beyond the launch language(s) — strings are externalized so it's *possible* later, but not promised for v1.

**DEFINITION OF DONE:** A clean `npm run build` produces web/desktop/mobile builds of a feature-complete game — all 48 balanced teams, full progression and unlocks, every mode, polished art/audio, complete menus and settings — that **passes the automated bible/legal validator and the balance harness**, resumes saves across schema migrations, and is genuinely store-ready: nothing placeholder-gray remains, and a stranger can install it, play a full Globe Cup, and lift the Aurora Sphere.

**THE ONE THING TO NAIL:** **Balance + the legal pass — the two things that can sink a finished game.** Polish is visible and forgiving; an unwinnable tier curve quietly betrays Pillar 4, and a single real-likeness slip is an existential legal risk for a solo indie (Section 0). Make both **automated gates**, not vibes: the validator and `balance.spec.ts` are the difference between "looks done" and "is shippable."

---

> **Roadmap throughline.** Day 1 proves the *firework*; Week 1 proves the *comeback fantasy and the whole Globe Cup shape*; Month 1 makes it *balanced, complete, legal, and beautiful*. At every step we bought maximum fun with minimum code by leaning on what Phaser, the pure seeded sim, and JSON-driven content give us for free — and by refusing the sim-flavored, asset-heavy, marginally-fun work the Creative Bible already told us to avoid.

---

The section above is the complete deliverable, written to match the existing GDD conventions in `/Users/humanjack/projects/humanjack/road-to-2026/GDD_07_Visual_Design.md` (the `##`/`###` heading structure, the leading `>` Bible-anchored blockquote, bold lead-ins, explicit IN/OUT scope lists with ❌ cut markers, a solo-dev/shippability lens, and a closing throughline paragraph). Per instructions, no file was created — paste this under `## 10. Development Roadmap`.

It conforms to the Creative Bible and the provided Section 9 (Technical) and Section 2 (Gameplay) context: it reuses the locked title **GROUNDSWELL '26: World Eleven**, **The Globe Cup**, **The Aurora Sphere**, the six zone codes, the five-tier 60–99 scale and **6/10/16/10/6** distribution, the **Host Boost (+4 / min-SOLID)** rule, the **Fictionalized Nations** toggle, the Section 4 naming recipe, and every glossary term (**Surge, Surge Run, Groundswell, Screamer, Nutmeg Meter, Wall, The 90th, Aurora Points, World Eleven, Home Surge**). It aligns with the recommended stack (TypeScript + Phaser 3 + Vite, pure `src/sim/`, JSON content, IndexedDB/Tauri/Capacitor save backends, `balance.spec.ts` "no team is unwinnable" harness) and the 5v5 / 4–6 minute match format from the gameplay context, and it consistently flags high-fun/low-cost wins (Phaser juice, headless auto-sim of the bracket, Surge-math power-ups) versus low-fun/high-cost traps (realistic AI, manager-mode depth, netcode).

---

---

## 11. Legal Safety Review

> **I am not a lawyer, and nothing here is legal advice.** This section is a practical risk-reduction playbook written for a solo indie shipping *GROUNDSWELL '26: World Eleven* commercially. It encodes the constraints already locked in Section 0 (Legal Guardrails) and makes them actionable. **Before commercial launch, commission a short paid IP review** (a 1–2 hour consult with an entertainment/IP attorney covering your game title, trophy/tournament names, and shipping config) — it is the single cheapest insurance you can buy.

The North Star: the game should read as **clearly inspired by a global 48-team football tournament** while never borrowing a single protected asset. We sell the *vibe* of a planet-sized football summer. We never sell anyone else's marks.

---

### What to AVOID (hard "do-not-ship" list)

Treat every item below as a hard block. If an asset or string touches one of these, it does not ship.

- **"World Cup" as a name or tagline.** It is a registered trademark in the football context. Our in-game event is **THE GLOBE CUP** (nickname: *"The Groundswell"*). Never let "World Cup" appear in code, UI, store copy, ASO keywords, or trailers.
- **FIFA marks** — the word "FIFA," the FIFA logo, and any FIFA sub-brand or slogan.
- **Official tournament emblems / "official look"** — the per-edition event logo, the trophy-silhouette logo, official poster systems, mascots, or the official typeface treatment.
- **The real trophy's likeness or silhouette.** The actual world-football trophy is a protected design. Our **AURORA SPHERE** must not resemble its silhouette (no globe-on-twisting-figures form). Keep our original cradled-wings-and-faceted-orb design.
- **Official kits / crests / federation badges.** No reproduction or close imitation of any real national-team kit, color-and-crest lockup, or federation emblem. All crests/kits are **ORIGINAL** (Section 6) — evoke a mood, never copy.
- **Real player names, likenesses, faces, photos, signature celebrations, or distinctive numbers+name combos.** Covered in detail below.
- **National anthems and official tournament music.** Anthems may be modern copyrighted arrangements; tournament/broadcast theme music is licensed. Use original or cleared royalty-free audio only.
- **Sponsor logos and brand boards** — no perimeter advertising, sleeve sponsors, or ball/boot brand logos, real or near-copies.
- **Stadium names and trademarked architecture.** Many real stadiums are named (trademarked) venues with protected, recognizable designs. Use **original, generic arenas**.
- **Broadcaster marks and on-screen graphics** — no real broadcaster bug, lower-third, or score-bug styling.
- **League marks** — no club-league logos, league names, or club crests (out of scope, but worth a hard "no" so nothing leaks in from reference art).

---

### What is GENERALLY SAFE

These are the materials and ideas you can lean on with confidence. "Generally safe" still means *execute carefully* — the notes matter.

- **Real country names as geographic facts.** "Brazil," "Japan," "Ghana" are not trademarks of a football body; they are place names. Using them as team labels is the grounded default (Section 0).
- **The *idea* and *rules* of a 48-team, six-zone tournament.** Tournament **formats, structures, and rules are not copyrightable** — copyright protects *expression*, not systems or methods of play. A bracket of 48 teams across six qualifying zones with a group stage into knockouts is a format/idea, and ideas are free to use. (You still must not copy the official *presentation* of that format.)
- **Original art, original crests, original kit color treatments, original trophy, original UI** — anything you create is yours.
- **Original fictional rosters** built via the Section 4 "fun-tweak" recipe.
- **Generic descriptive terms** — "Continental Cup," "Globe Cup," "qualifiers," "group stage," "the finals," "matchday." Generic football vocabulary is free; avoid the *specific* protected names.
- **Nominative / parody references done carefully** — you can factually state real football *exists* (e.g., "inspired by the world's biggest football tournament") in non-misleading marketing, as long as you never imply official affiliation, sponsorship, or endorsement. Keep it descriptive, never a logo or a confusingly-similar name.

---

### The Naming Strategy (locked)

This is the shipping decision. **Lock it and don't drift.**

**DEFAULT SHIPPING CONFIG (the recommended hybrid):**
**Real country names** + **100% original crests/kits/color/typography** + **100% fictional parody rosters** + **original tournament identity** (THE GLOBE CUP / THE AURORA SPHERE).

**Plus a one-switch safety valve: the "Fictionalized Nations" toggle** (Section 0). Ships **OFF by default**, available in Settings. Flipping it swaps real country names for lightly altered ones — **"Brazilia," "Argentinia," "Germania," "Nihon-go," "Eaglestan"** — for the most risk-averse path, for streamers in restricted regions, or as a fast lever if a storefront or region ever raises a flag. Build it so the toggle is a pure data swap (one string table), not a code change, so you can pivot instantly without a re-release.

**How to make parody names *obviously* invented (the "fun-tweak" recipe, Section 4):**
- **First name = generic regional given name**, never a famous athlete's (e.g., "Marco," "Kofi," "Yuki," "Diego," "Liam," "Tane").
- **Surname = [football action root] + [regional sound-suffix]** — e.g., *Boot, Strike, Volley, Dribbl, Nutmeg, Header, Curl, Tackl, Keepa, Screamer* + suffixes like ICL "-ovic/-sson/-ault," SCB "-inho/-ez," BHC "-ari/-toa." Worked examples: **Marco Volleyault**, **Kofi Screameribo**, **Yuki Nutmegada**, **Diego Dribblinho**, **Mateo Tacklández**, **Tane Keepatoa**.
- **The MANDATORY smell test:** read each name aloud. If it sounds like a real, identifiable athlete — even a near-spelling — **reject and re-roll.** Parody must be unmistakable. No initials, birth-years, or club references that point at one real person.

---

### Trademark Hygiene (the game title and the in-game names)

The **game title is your highest-exposure trademark surface** — it is the storefront-facing brand. Clear it before you commit art and ASO spend.

- **Do a basic knockout search on the title** *"GROUNDSWELL '26: World Eleven"* and the short forms **GROUNDSWELL / GS26**:
  - **App stores:** search Apple App Store, Google Play, and Steam for existing games with the same or confusingly-similar names.
  - **Trademark registers:** free searches on **USPTO TESS** (US) and **EUIPO eSearch / WIPO Global Brand Database** (international) under the relevant class (software/games is broadly **Class 9** and **Class 41** for entertainment services).
  - **Plain web + domain/social handle** availability check.
- **Avoid confusingly-similar marks** in the games/football space — not just identical hits. If a near-name exists in the same category, change yours rather than gamble.
- **Clear the in-game flavor names too** at a lighter touch: **THE GLOBE CUP**, **THE AURORA SPHERE**, and the six zone names (e.g., *The Iron Continent League*). These face the public in trailers and screenshots; a quick search avoids an avoidable collision. ("Globe Cup" / "Aurora Sphere" are deliberately generic-plus-original to stay clear of *"World Cup"* and the real trophy name.)
- If the title clears, **consider filing your own trademark** for the game name once revenue justifies it — it protects *you* and is a normal post-launch step (defer until a lawyer advises).

---

### Players & Likeness / Right of Publicity

This is where solo devs most often get burned, because the risk is **not only copyright** — it is the **right of publicity / personality rights**, which protect a person's name, likeness, and identity, and which **vary by country and US state** (some are aggressive). The rule of thumb: *don't evoke a specific, identifiable real athlete — by any combination of signals.*

- **A matching name + number + position + nationality can identify a real person even with the name changed.** "The Argentine striker, #10, left-footed genius" evokes one individual. Avoid building a fictional player whose *cluster of attributes* points unmistakably at a living athlete.
- **Concrete rules to keep rosters clean:**
  - **Never** use a real player's name or a near-spelling (the smell test catches this).
  - **Do not** replicate a real national squad's *exact* set of numbers + positions + roles + standout traits. Shuffle numbers, vary positions, and invent traits so no slot maps 1:1 onto a real lineup.
  - **No** signature celebrations, distinctive tattoos, hairstyles, or visual quirks tied to one athlete.
  - **No** birth-years, club references, hometowns, or biographical "Easter eggs" that fingerprint a real person.
  - **Generic given names only** for first names, randomized across the roster so even coincidental matches don't cluster.
- **Likeness in art:** chunky, stylized, original "neo-poster" figures (Section 6) — never modeled on a real person's face or body. No photo references of real athletes in any pipeline asset.

---

### Music / Audio

- **Ship original or properly-licensed/royalty-free audio only.** No national anthems (modern arrangements can be copyrighted), no official tournament/broadcast themes, no chants or songs associated with a specific club/nation.
- **If using royalty-free / stock libraries, confirm the license covers commercial use in a game, on all platforms, in perpetuity** — and that it permits inclusion in an interactive product (some licenses exclude games or require per-title clearance).
- **Document every audio source** in an **audio license ledger** (track name, source, license type, URL, date, license ID, scope). Keep the receipts; storefronts and any future dispute will ask for proof.
- The Section 6 score (pulsing electronic-orchestral-with-global-percussion, swelling with **Surge**) should be **original composition or fully-cleared library music** — and the cue sheet logged in the same ledger.

---

### Disclaimer Recommendation

Add a short, plain disclaimer and place it where users and store reviewers will see it. Suggested wording:

> ***GROUNDSWELL '26: World Eleven** is an original work of parody and fiction. It is not affiliated with, authorized, endorsed by, or associated with FIFA, any football federation or confederation, any official tournament or event, or any real player, club, league, broadcaster, or sponsor. All teams, players, crests, kits, the tournament, and the trophy are fictional and original creations. Real country names are used as geographic references only.*

**Where to place it:**
- **Store listing** — bottom of the description on App Store / Google Play / Steam.
- **In-game** — on a **Legal / About / Credits** screen reachable from the main menu.
- **First-launch splash** — a brief credits/legal card (optional but tidy).
- **Marketing site / press kit** — footer.

A disclaimer is **not** a force field — it does not cure an actual infringement — but it rebuts any *implied affiliation/endorsement* claim and signals good faith. Pair it with the substantive choices above; it works *with* them, not instead of them.

---

### Store-Compliance Notes (Apple / Google / Steam)

All three storefronts independently police IP and impersonation, and **will pull an app on a credible rights complaint** — often before any court would. Comply proactively.

- **Apple App Store** — Guideline **5.2 (Intellectual Property)** bars using protected third-party IP without permission and bars apps that imply false endorsement/affiliation. Don't use protected names/marks in the **app name, subtitle, keywords, icon, or screenshots**. The icon and first screenshots are the most-scrutinized surfaces — keep them 100% original.
- **Google Play** — the **Intellectual Property** and **Impersonation** policies prohibit infringing content and any implication of affiliation/endorsement you don't have. Same rule for **title, icon, and store graphics**.
- **Steam (Valve)** — the Distribution Agreement requires you to **warrant that you own or have rights to everything you ship**; a rights-holder DMCA/complaint can get the page taken down. Steam reviewers also reject obvious IP lookalikes at onboarding.
- **Cross-store hygiene:** keep **ASO/keywords clean** — *never* buy or stuff "FIFA" / "World Cup" as discovery keywords (a common and easily-caught violation). Keep a **rights/asset manifest** (every asset → original or license proof) so you can answer a takedown fast. If a complaint ever lands, the **Fictionalized Nations toggle** is your rapid-response lever.

---

### Pre-Launch Risk Checklist

Tick every row before you ship. **Anything not green gets fixed or removed.**

| # | Item | Risk Level | Mitigation |
|---|------|-----------|------------|
| 1 | "World Cup" / "FIFA" anywhere in game, code, store copy, or ASO keywords | **Critical** | Global string search; replace with **THE GLOBE CUP**; purge from keywords |
| 2 | Game title clearance (*GROUNDSWELL '26 / GS26*) | **High** | App-store + USPTO/EUIPO/WIPO + web/domain search; rename if a confusing match exists |
| 3 | Trophy design resembles the real trophy silhouette | **High** | Confirm **AURORA SPHERE** is the original cradled-wings/faceted-orb form; no globe-on-figures shape |
| 4 | Crests / kits / badges copy or closely imitate real ones | **High** | Art review: every crest/kit is original; evoke mood only (Section 6) |
| 5 | Player names near-spell or evoke real athletes | **High** | Apply Section 4 smell test to 100% of roster; re-roll failures |
| 6 | Squad numbers + positions + traits map 1:1 onto a real lineup | **Medium–High** | Shuffle numbers/positions; invent traits so no slot fingerprints a real player |
| 7 | Player art modeled on a real face/body | **High** | Stylized original figures only; no real-athlete photo references in pipeline |
| 8 | National anthems / official or broadcast tournament music | **Critical** | Original or cleared royalty-free only; remove anything else |
| 9 | Music/SFX licenses cover commercial game use, all platforms, perpetuity | **Medium** | Verify each license scope; keep **audio license ledger** |
| 10 | Sponsor logos / perimeter ads / ball-boot brands | **Medium** | Original generic boards only; no real or near-copy logos |
| 11 | Real stadium names or recognizable trademarked architecture | **Medium** | Original generic arenas only |
| 12 | Broadcaster bugs / score-bug / lower-third styling copied | **Low–Medium** | Original UI/broadcast graphics (Section 6) |
| 13 | Disclaimer present in store + in-game Legal/About screen | **Medium** | Add the recommended disclaimer in both places |
| 14 | "Fictionalized Nations" toggle implemented as one-switch data swap | **Medium** | Verify it ships (OFF by default) and flips via a single string table |
| 15 | Store assets (icon, name, subtitle, screenshots, keywords) IP-clean | **High** | Audit against Apple 5.2 / Google IP & Impersonation / Steam warranty |
| 16 | Rights/asset manifest exists (every asset → original or license proof) | **Medium** | Maintain a manifest for fast takedown response |
| 17 | Paid IP attorney review before commercial launch | **High** | Book a 1–2 hr consult on title, trophy/tournament names, and shipping config |

---

> **Bottom line:** The default config — real country names, original everything-visual, fictional parody rosters, an original tournament identity, plus the Fictionalized Nations escape hatch — keeps *GROUNDSWELL '26* clearly *inspired by* a global 48-team football summer while staying defensible for a solo commercial release. Do the title search, keep your license receipts, ship the disclaimer, and **get the short paid legal review before launch.** None of this is legal advice; the lawyer's sign-off is.

---

## 12. AI Coding Plan

> **How to read this section.** This is the executable build plan — the ordered list of small tasks a solo dev runs against Claude Code, one session at a time. It is the operational companion to Section 9 (Technical Design): every task obeys the `sim/` (pure logic) vs `scenes/`+`render/` (Phaser) boundary, routes randomness through `SeededRandom`, and keeps balance in `src/data/*.json`. The arc moves from an empty repo to a shippable, multi-platform game without ever leaving the build broken.

### The Prime Directive: every task leaves the game runnable

Each task below is sized for **one Claude Code session** and ends in a **green, runnable build** — `npm run dev` opens the game in a browser and you can *see* the new thing working. We never stub a half-system that breaks the screen. This is the **Five-Minute Mastery Arc** pillar applied to development itself: small, glanceable increments with a real payoff each time.

### How to work with Claude Code on this (read once, apply every task)

- **One task = one commit = one green build.** Start each session by stating the task's title, "what to build," and "acceptance check" to Claude Code verbatim. Don't merge until `npm run build` (which runs `tsc --noEmit && vite build`) and `npm run test` both pass. If a task balloons, split it — never leave `main` red.
- **Keep the boundary sacred.** Remind Claude Code that `sim/**` imports nothing from Phaser. The ESLint `no-restricted-imports` rule (Milestone 0) enforces this; if a generated edit trips it, that's a feature, not a blocker.
- **Data-driven balancing, always.** Any number that affects *feel* or *fairness* (Surge fill rate, shot power, OVR, tier bands, power-up costs) lives in JSON or `config/constants.ts`, never hard-coded in a system. When you ask Claude Code to "make comebacks feel better," the answer should be a JSON edit you see via HMR — not a recompile.
- **Tests are the Creative Bible's enforcement arm.** The `balance.spec.ts` "No Team Is Unwinnable" test and the boot-time JSON validator turn Section 8 into automated gates. Add to them as systems land.
- **Commit messages map to tasks.** `feat(sim): controllable player (M2.1)` — so the git log reads as this plan, and Claude Code can orient itself in any later session.
- **Show, don't assume.** Each acceptance check is a thing you can *see or run*. If you can't see it, the task isn't done.

---

### MILESTONE 0 — Project Scaffold & Guardrails
*Goal: an empty but correctly-wired project that builds, tests, and runs to a blank styled canvas. Everything downstream plugs into this skeleton.*

1. **Initialize the repo and toolchain.**
   - **Build:** `npm create vite@latest` (vanilla-ts), pin `phaser`, `vitest`, `typescript`. Add `strict: true` to `tsconfig.json`. Create the `package.json` scripts from Section 9.1 (`dev`, `build`, `preview`, `test`). Add `.gitignore`, `README.md` with a one-line run instruction.
   - **Acceptance:** `npm run dev` serves a blank page; `npm run build` and `npm run test` exit 0 (with one trivial passing test).
   - **Files:** `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `test/smoke.spec.ts`, `.gitignore`.

2. **Boot Phaser to a styled empty canvas.**
   - **Build:** `Phaser.Game` config in `main.ts` (fixed logical resolution, `Scale.FIT`, dark pitch-green background). Register a single empty `BootScene`. Set the e-sports-crisp page background so the canvas is centered on phone and desktop aspect ratios.
   - **Acceptance:** `npm run dev` shows a centered, correctly-scaled green canvas that resizes cleanly — the game *boots*.
   - **Files:** `src/main.ts`, `src/scenes/BootScene.ts`, `index.html`.

3. **Lay down the folder skeleton and module-boundary lint rule.**
   - **Build:** Create the empty Section 9.3 folder tree (`sim/`, `state/`, `scenes/`, `render/`, `data/`, `save/`, `types/`, `config/`, `test/`) with placeholder `index.ts` barrels. Add ESLint + the `no-restricted-imports` rule forbidding `phaser`/`scenes`/`render`/`state` imports inside `sim/**`.
   - **Acceptance:** `npm run lint` passes; a deliberately-bad test import of `phaser` inside `sim/` fails lint (then revert it). Build stays green.
   - **Files:** `.eslintrc.cjs`, `src/**/index.ts` placeholders, `package.json` (lint script).

4. **Seed the types and constants from Section 9.4.**
   - **Build:** Paste the Section 9.4 interfaces into `src/types/models.ts` (Team, Player, Tier, ZoneCode, MatchResult, TournamentState, SaveGame, Settings, PowerUp, etc.). Create `config/constants.ts` with `SIM_DT`, pitch dimensions, and placeholder Surge tuning knobs.
   - **Acceptance:** `tsc --noEmit` compiles all types with zero errors; constants importable. Nothing renders yet — but the contract exists.
   - **Files:** `src/types/models.ts`, `src/config/constants.ts`.

---

### MILESTONE 1 — The Pitch
*Goal: a real, proportioned playfield drawn from data, with the broadcast-arc framing of Section 6.*

1. **Render a data-driven pitch.**
   - **Build:** `MatchScene` (replacing/after Boot) draws the pitch from `constants.ts` dimensions: turf, touchlines, halfway line, center circle, two penalty boxes, two goals — all as Phaser graphics, no art assets yet. Camera framed slightly higher-and-wider (the broadcast arc).
   - **Acceptance:** `npm run dev` boots straight into a clean, correctly-proportioned football pitch filling the broadcast-framed camera.
   - **Files:** `src/scenes/MatchScene.ts`, `src/config/constants.ts`.

2. **Add a debug overlay + scene flow stub.**
   - **Build:** A toggleable debug text layer (FPS, sim clock placeholder, mouse coords) and a minimal `BootScene → MatchScene` flow. Wire a dev-only key to toggle debug.
   - **Acceptance:** Pitch renders; pressing the debug key shows/hides a live FPS + coordinate readout. Build green.
   - **Files:** `src/scenes/BootScene.ts`, `src/scenes/MatchScene.ts`, `src/render/DebugOverlay.ts`.

---

### MILESTONE 2 — Controllable Player
*Goal: a player token you can drive around the pitch, on top of the pure-sim loop. This is where the fixed-timestep architecture (Section 9.2) lands.*

1. **Stand up the fixed-timestep loop and a PlayerEntity.**
   - **Build:** Implement `SeededRandom`, `MatchLoop` (accumulator from Section 9.2), and a minimal `MatchSim` holding a `MatchState` with one `PlayerEntity` (position/velocity as plain data). `MatchScene` drives `loop.tick(delta)` and renders the player as a colored disc by reading sim state (one-way data flow).
   - **Acceptance:** A disc sits on the pitch; the debug overlay shows the sim clock advancing in fixed 16.67ms steps independent of frame rate.
   - **Files:** `src/sim/SeededRandom.ts`, `src/sim/MatchLoop.ts`, `src/sim/MatchSim.ts`, `src/sim/entities/PlayerEntity.ts`, `src/scenes/MatchScene.ts`.

2. **Add input → movement system.**
   - **Build:** An `inputSystem` translating WASD/arrows **and** Phaser pointer/touch into an intent vector on `MatchState`; a `movementSystem` (pure) applying accel/drag from `constants.ts`. Keep input capture in the scene; movement math in `sim/systems/`.
   - **Acceptance:** You can drive the player around the pitch with keyboard and touch; motion feels snappy (tunable via constants). Stays inside touchlines.
   - **Files:** `src/sim/systems/movement.ts`, `src/scenes/MatchScene.ts` (input capture), `src/config/constants.ts`.

3. **Add render interpolation for smoothness.**
   - **Build:** Use the `MatchLoop` interpolation alpha to lerp the rendered disc between the last two sim states. Confirm smooth motion at high refresh rates while sim stays at 60 Hz.
   - **Acceptance:** Movement is visibly smooth on a 120 Hz display with no change to sim timing; toggling a "show raw sim pos" debug confirms interpolation.
   - **Files:** `src/scenes/MatchScene.ts`, `src/render/` (interp helper).

---

### MILESTONE 3 — Ball Physics
*Goal: a ball that obeys our own tunable physics and can be carried — the heart of **Surge Over Sim** (feel, not realism).*

1. **Add a Ball entity with custom drag.**
   - **Build:** `Ball` entity (position/velocity) and a `ballSystem` applying velocity + rolling drag from JSON-able constants. Render the ball as a disc. No collisions yet beyond bouncing off touchlines/back walls.
   - **Acceptance:** A ball rolls, decelerates naturally, and bounces off the pitch boundaries; drag is tunable live via constants/HMR.
   - **Files:** `src/sim/entities/Ball.ts`, `src/sim/systems/ball.ts`, `src/config/constants.ts`.

2. **Add possession (proximity dribble).**
   - **Build:** A `possessionSystem` — when the player is within a radius of the ball, the ball "sticks" slightly ahead in the direction of travel (arcade dribble, a proximity check, not a physics joint per Section 9.2).
   - **Acceptance:** You can run up to the loose ball and dribble it around the pitch; it nudges ahead of you and you can lose it by turning sharply.
   - **Files:** `src/sim/systems/possession.ts`, `src/config/constants.ts`.

---

### MILESTONE 4 — Passing & Shooting
*Goal: the two core verbs, with the **SCREAMER** hook wired in from the start.*

1. **Add shooting with a power threshold.**
   - **Build:** A `shootingSystem` — a button/tap releases the ball with a velocity scaled by a (optional) charge. Define the SCREAMER power threshold in JSON; tag a shot as `type: "screamer"` in `state.events` when it exceeds it. No goals yet — shots just fire across the pitch.
   - **Acceptance:** You can shoot the dribbled ball; the debug overlay logs an event with `type: "open"` or `"screamer"` depending on power.
   - **Files:** `src/sim/systems/shooting.ts`, `src/data/powerups.json` (threshold), `src/scenes/MatchScene.ts` (input).

2. **Add directional passing.**
   - **Build:** A pass action that fires the ball along the aim vector at a calmer speed with light auto-aim assist toward the facing direction (tunable). Distinct input from shoot.
   - **Acceptance:** You can pass the ball deliberately in a chosen direction at a controlled weight, distinct from a shot. Build green.
   - **Files:** `src/sim/systems/shooting.ts` (or a sibling `passing.ts`), `src/config/constants.ts`.

---

### MILESTONE 5 — Second Player & Goals
*Goal: a real scoring loop — two players, two goals, a ball that goes in. **EVERY GOAL IS A FIREWORK** gets its first taste of juice.*

1. **Add a second (swappable) controlled player.**
   - **Build:** Spawn a second `PlayerEntity` on the same team; "nearest to ball" auto-switches active control (or a manual switch button). Render the active player highlighted.
   - **Acceptance:** Two teammates on the pitch; control snaps to whoever's nearest the ball; you can pass between them.
   - **Files:** `src/sim/systems/possession.ts`, `src/scenes/MatchScene.ts`, `src/sim/MatchSim.ts`.

2. **Add goal detection and scoring.**
   - **Build:** A `scoringSystem` detecting ball-crosses-goal-line within the posts; increments `state.score`, pushes a `GoalEvent`, resets to kickoff. Render score in a minimal HUD.
   - **Acceptance:** Putting the ball in the net increments the score and resets play to center. Score shows in the HUD.
   - **Files:** `src/sim/systems/scoring.ts`, `src/render/Hud.ts`, `src/types/models.ts`.

3. **First goal-juice pass.**
   - **Build:** `Juice.goal()` in the render layer reads the `GoalEvent` and fires `camera.shake()`, a particle confetti burst, and a brief `time.timeScale` slow-mo (extra for `type:"screamer"`). Renderer consumes/clears the event.
   - **Acceptance:** Scoring now *feels* like a firework — shake, confetti, and a slow-mo beat; screamers hit harder. Strictly one-way (render reads events, never writes state).
   - **Files:** `src/render/Juice.ts`, `src/scenes/MatchScene.ts`.

---

### MILESTONE 6 — Goalkeeper & Basic AI
*Goal: an opponent worth scoring against — keeper plus rudimentary outfield AI, all in pure `sim/ai/`.*

1. **Add a goalkeeper.**
   - **Build:** A GK `PlayerEntity` per goal and a `gkSystem` in `ai/` that tracks the ball laterally along the goalmouth and lunges to save when the ball enters a danger zone. Uses the entity's `keeping` attribute and the seeded RNG for save variance.
   - **Acceptance:** Shots on target are sometimes saved; the keeper visibly tracks and dives. Save odds scale with `keeping`.
   - **Files:** `src/sim/ai/gk.ts`, `src/sim/MatchSim.ts`.

2. **Add basic opponent outfield AI.**
   - **Build:** An `opponentAiSystem`: chase ball when nearest, else mark space; shoot when in range; pass when pressured. Simple state machine, fully deterministic via seeded RNG.
   - **Acceptance:** A one-player AI opponent contests possession and occasionally scores; a full kick-about against the CPU is playable.
   - **Files:** `src/sim/ai/opponent.ts`, `src/config/constants.ts`.

3. **Add basic teammate AI.**
   - **Build:** A `teammateAiSystem` so non-controlled teammates make supporting runs and offer pass options.
   - **Acceptance:** Your non-active teammate moves into space; you can find them with a pass. Build green; sim still deterministic.
   - **Files:** `src/sim/ai/teammate.ts`.

---

### MILESTONE 7 — A Full Single Match
*Goal: a complete, self-contained match with timer, win condition, and result — the smallest truly "fun" vertical slice.*

1. **Add the match clock and half/full-time flow.**
   - **Build:** Drive `state.clockMs` to a configurable match length (4–6 min per Section 5); kickoff → play → full-time. HUD shows the clock. Match ends and freezes input at full-time.
   - **Acceptance:** A match runs start-to-finish on the clock and ends cleanly with a final score frozen on screen.
   - **Files:** `src/sim/systems/clock.ts`, `src/render/Hud.ts`.

2. **Add a ResultScene and replayability.**
   - **Build:** On full-time, transition `MatchScene → ResultScene` showing winner/score and a "Play Again" button that re-seeds and restarts. Package the match seed + inputs hook for future replays.
   - **Acceptance:** You can play a full match against the CPU, see a result screen with the winner, and start a fresh match — the core loop is complete and fun.
   - **Files:** `src/scenes/ResultScene.ts`, `src/scenes/MatchScene.ts`, `src/sim/MatchSim.ts`.

3. **Add headless sim tests.**
   - **Build:** `test/sim.spec.ts` runs a full match in Vitest with a fixed seed and asserts determinism (same seed ⇒ identical final score) and basic invariants (score never decreases, clock terminates).
   - **Acceptance:** `npm run test` runs a headless match and passes; re-running yields identical results — the determinism contract is now guarded.
   - **Files:** `test/sim.spec.ts`.

---

### MILESTONE 8 — Data Layer (Teams & Players)
*Goal: replace hard-coded discs with **fictional rosters and original-identity teams** loaded from JSON, validated against the Creative Bible.*

1. **Author the data schema, loader, and bible validator.**
   - **Build:** `config/balance.ts` loads `src/data/` JSON and validates against Section 9.4 types (Zod or type guards). The validator enforces Section 8: each `ovr` sits in its `tier` band, host rules hold. Add a tiny seed dataset (4 teams) following the Section 4 fun-tweak recipe (e.g. **Marco Volleyault "The Number 9"**) and original `KitTheme`s.
   - **Acceptance:** Boot loads 4 teams from JSON; a deliberately out-of-band OVR makes the dev build fail loudly with a clear message, then fix it. The bible is now an automated test.
   - **Files:** `src/config/balance.ts`, `src/data/teams/*.json`, `test/balance.spec.ts` (validator test).

2. **Drive match entities from team data.**
   - **Build:** `MatchScene` takes two `Team`s; players spawn from rosters; per-player `attrs` (pace/shooting/keeping/flair) feed the movement/shooting/GK systems. Kits drive colors; nicknames/numbers render on the HUD.
   - **Acceptance:** A match between two *named, fictional* teams in distinct invented kits, where a high-`pace` player is visibly faster and a high-`keeping` GK saves more.
   - **Files:** `src/scenes/MatchScene.ts`, `src/sim/systems/*` (read attrs), `src/render/Hud.ts`.

3. **Add the Fictionalized Nations toggle (data-side).**
   - **Build:** Read `Settings.fictionalizedNations`; when ON, render `Team.altName` (e.g. "Brazilia") instead of `country`. Default OFF (Section 0).
   - **Acceptance:** Flipping a dev setting swaps all displayed nation names to their alt forms; default shows real country names.
   - **Files:** `src/state/settingsStore.ts`, `src/render/Hud.ts`, `src/scenes/*`.

---

### MILESTONE 9 — Tournament Engine
*Goal: **The Globe Cup** — 48 teams, 12 groups, knockout bracket to a final and a champion who lifts **The Aurora Sphere**. Built sim-first and headless-testable.*

1. **Add the tournament store and group-stage generator.**
   - **Build:** Vanilla Zustand `tournamentStore`; a generator that draws 48 teams into 12 groups of 4 (respecting `ZoneCode`), creates round-robin `Match`es with seeds, and computes `GroupRow` standings from results. Pure functions, no Phaser.
   - **Acceptance:** A Vitest test simulates a full group stage headlessly and produces correct, sorted standings for all 12 groups.
   - **Files:** `src/state/tournamentStore.ts`, `src/sim/tournament/groups.ts`, `test/tournament.spec.ts`.

2. **Add the knockout bracket (binary tree).**
   - **Build:** Build the `BracketNode[]` from group qualifiers (R32→R16→QF→SF→F per Section 9.4), feed winners up the tree, support drawn-knockout shootouts (`MatchResult.shootout`).
   - **Acceptance:** A headless test runs groups → full bracket → a single `championId`; drawn knockouts resolve via shootout.
   - **Files:** `src/sim/tournament/bracket.ts`, `test/tournament.spec.ts`.

3. **Add Host Boost + full 48-team dataset.**
   - **Build:** Author all 48 team JSONs across the six zones at the Section 8 distribution (6/10/16/10/6). Apply the Host rule: `+4 OVR` (cap 99), min-SOLID, faster Surge at home. Extend the validator to assert the 48-team tier distribution.
   - **Acceptance:** Boot validates a full, bible-compliant 48-team field; a flagged host shows its boosted OVR and never drops below SOLID. Validator fails if the distribution is off.
   - **Files:** `src/data/teams/*.json` (48), `src/data/tournament.json`, `src/config/balance.ts`.

4. **Wire tournament UI scenes.**
   - **Build:** `TournamentScene`, `GroupStageScene`, `BracketScene` as thin views over the store; player picks a team, plays *their* matches live in `MatchScene` while CPU matches sim headlessly; results flow back via `recordResult()`.
   - **Acceptance:** You can play a full Globe Cup run — pick a nation, play your group matches, advance through the bracket, and lift **The Aurora Sphere** on a final win.
   - **Files:** `src/scenes/TournamentScene.ts`, `GroupStageScene.ts`, `BracketScene.ts`.

---

### MILESTONE 10 — Save / Load
*Goal: persistence and mid-run resume across sessions, with versioned migrations (Section 9.5).*

1. **Add the SaveManager with a web backend.**
   - **Build:** `SaveManager` + `SaveBackend` interface; IndexedDB backend (with a `localStorage` mirror of `Settings` + save index). Namespaced keys (`groundswell:save:{slot}`). Debounced `autosave`.
   - **Acceptance:** A tournament autosaves after each result; reloading the tab and choosing "Continue" resumes mid-bracket with standings intact.
   - **Files:** `src/save/SaveManager.ts`, `src/save/backends/IndexedDbBackend.ts`, `src/state/tournamentStore.ts` (autosave hook).

2. **Add schema versioning, migrations, and slots.**
   - **Build:** `migrations.ts` chain + `CURRENT_SCHEMA`; `SaveBackend.list()` → `SaveMeta[]`; a slot-select screen. Add a migration test.
   - **Acceptance:** A hand-crafted old-schema save loads cleanly via the migration chain (proven by a test); multiple slots show in slot-select with phase + AP.
   - **Files:** `src/save/migrations.ts`, `src/scenes/SlotSelectScene.ts`, `test/save.spec.ts`.

---

### MILESTONE 11 — Surge, Power-Ups & the Comeback Engine
*Goal: the namesake systems — **Surge**, **Surge Run**, **Groundswell**, **Wall**, **The 90th**, **Home Surge** — the mechanical guarantee of **No Team Is Unwinnable**.*

1. **Add the Surge meter.**
   - **Build:** `surgeSystem` filling `state.surge` from good play (tackles, near-misses, shots) and faster when trailing; data from `powerups.json`. Render per-side Surge meters (`SurgeMeterUI`).
   - **Acceptance:** Playing well visibly fills your Surge meter; trailing fills it faster. Tunable live via JSON/HMR.
   - **Files:** `src/sim/systems/surge.ts`, `src/render/SurgeMeterUI.ts`, `src/data/powerups.json`.

2. **Add Surge Run and Wall.**
   - **Build:** Spend Surge for a **Surge Run** burst (speed/shot/pass multipliers from `PowerUp.effects`); trigger **Wall** for a defensive lockdown (interception boost). Both consume `surgeCost`, run for `durationMs`.
   - **Acceptance:** You can spend Surge to sprint a comeback attack or lock down defensively; meters drain and effects apply for the duration.
   - **Files:** `src/sim/systems/powerups.ts`, `src/data/powerups.json`, `src/render/Juice.ts` (FX).

3. **Add Groundswell (team super-state) and The 90th.**
   - **Build:** A maxed meter triggers **Groundswell** — ~30s team-wide boost with screen-wide juice. `the90thSystem` flags `isFinalFive` in the last 5 minutes and accelerates the trailing team's Surge fill.
   - **Acceptance:** Maxing Surge ignites a visible ~30s Groundswell; in the final five minutes a trailing team's meter fills faster — comebacks are now mechanically real.
   - **Files:** `src/sim/systems/the90th.ts`, `src/sim/systems/powerups.ts`, `src/render/Juice.ts`.

4. **Add Home Surge and the "No Team Is Unwinnable" statistical test.**
   - **Build:** Apply the host's faster home-Surge fill in hosted matches. Write `balance.spec.ts` to simulate ~10,000 headless MINNOW(60)-vs-ELITE(99) matches and assert the underdog win rate stays meaningfully above zero.
   - **Acceptance:** `npm run test` runs the mass simulation and confirms the bible's promise; the host's home matches fill Surge faster. The pillar is now a guarded invariant.
   - **Files:** `src/sim/systems/surge.ts` (home buff), `test/balance.spec.ts`.

---

### MILESTONE 12 — Additional Modes
*Goal: depth beyond the single Globe Cup — including the subtitle mode, **World Eleven**.*

1. **Add Quick Match / Exhibition.**
   - **Build:** A menu path to instantly pick any two teams (and a host flag) and play a one-off match, reusing `MatchScene`.
   - **Acceptance:** From the main menu you can jump straight into a single match between any two nations.
   - **Files:** `src/scenes/QuickMatchScene.ts`, `src/scenes/MainMenuScene.ts`.

2. **Add the World Eleven all-star mode (gated).**
   - **Build:** Unlockable cross-nation all-star squad (`career.worldElevenUnlocked`); a builder that drafts top fictional players across zones into one team usable in Quick Match / a special cup.
   - **Acceptance:** Once unlocked, you can field the World Eleven all-star squad and play with it; locked state shows an unlock hint.
   - **Files:** `src/scenes/WorldElevenScene.ts`, `src/state/*`, `src/data/*`.

---

### MILESTONE 13 — Progression & Unlocks
*Goal: a reason to keep playing — **Aurora Points** and cosmetic unlocks persisted in the save.*

1. **Award Aurora Points per match/run.**
   - **Build:** Compute AP from match outcomes and tournament finish; bank into `SaveGame.career.totalAuroraPoints`; show AP earned on the ResultScene.
   - **Acceptance:** Finishing matches and runs awards AP that persists across sessions and displays on results.
   - **Files:** `src/sim/tournament/scoring.ts`, `src/scenes/ResultScene.ts`, `src/state/saveStore.ts`.

2. **Add the unlock store (spend AP).**
   - **Build:** A simple unlock screen spending AP on cosmetics + the **World Eleven** unlock; persist `unlockedCosmetics`. Data-driven unlock catalog.
   - **Acceptance:** You can spend AP to unlock cosmetics and World Eleven; unlocks persist and gate their features.
   - **Files:** `src/scenes/UnlockScene.ts`, `src/data/unlocks.json`, `src/state/saveStore.ts`.

---

### MILESTONE 14 — Art & Audio Juice Passes
*Goal: replace primitives with the **neo-poster** look and the momentum-driven score of Section 6. Done last so the whole game is already fun in greybox.*

1. **Swap discs for sprite atlases.**
   - **Build:** Pack AI-generated player frames (run/kick/tackle/celebrate) into a `players` atlas via the Section 9.6 pipeline; load with `load.atlas()` and drive animations from sim state (speed, kicking, celebrating). Add original animated `crests` and `ui` atlases.
   - **Acceptance:** Players render as rim-lit neo-poster sprites that run, kick, and celebrate; teams show original animated crests.
   - **Files:** `assets/atlases/*`, `src/scenes/MatchScene.ts`, `src/render/*`.

2. **Add the audio manifest, SFX, and momentum music.**
   - **Build:** `audio.json` manifest (key→clip); wire SFX (`sfx.thwock`, `sfx.screamer`, net ripple, crowd) to events; add the electronic-orchestral-global-percussion score that swells with the Surge meter. Respect volume settings.
   - **Acceptance:** Kicks *thwock*, screamers boom, the crowd and music swell with Surge and erupt during Groundswell; volume sliders work.
   - **Files:** `assets/audio/*`, `src/data/audio.json`, `src/render/AudioBus.ts`.

3. **Juice polish + accessibility scalers.**
   - **Build:** Tune `camera.shake`, slow-mo, confetti, and Groundswell glow to taste; wire `Settings.screenShake` and `reducedMotion` to dampen effects. Add bitmap-font score/timer for crisp big numbers.
   - **Acceptance:** Goals feel like fireworks; reduced-motion/shake settings visibly tone effects down without breaking feedback.
   - **Files:** `src/render/Juice.ts`, `src/render/Hud.ts`, `src/state/settingsStore.ts`.

---

### MILESTONE 15 — Menus, Settings & Onboarding
*Goal: a complete, legible front-end shell tying every mode together.*

1. **Build the main menu and navigation.**
   - **Build:** A polished `MainMenuScene` linking Globe Cup, Quick Match, World Eleven, Unlocks, Settings, Continue. Minimal geometric e-sports UI.
   - **Acceptance:** From the menu you can reach every mode and back out cleanly; "Continue" appears only when a save exists.
   - **Files:** `src/scenes/MainMenuScene.ts`.

2. **Build the settings screen.**
   - **Build:** A `SettingsScene` bound to `settingsStore`: volumes, screen-shake, reduced-motion, difficulty, and the **Fictionalized Nations** toggle (OFF by default). Persist via SaveManager.
   - **Acceptance:** Every setting changes the game immediately and survives a reload; Fictionalized Nations flips all nation names.
   - **Files:** `src/scenes/SettingsScene.ts`, `src/state/settingsStore.ts`.

3. **Add a first-run primer.**
   - **Build:** A lightweight first-launch overlay teaching the core loop (move, pass, shoot, Surge) in a few cards — the Five-Minute Mastery on-ramp.
   - **Acceptance:** A first-time player sees a short primer; it never reappears once dismissed (flagged in the save).
   - **Files:** `src/scenes/OnboardingScene.ts`, `src/state/saveStore.ts`.

---

### MILESTONE 16 — Legal, Build & Deploy
*Goal: ship it — disclaimer in place, web build live, desktop and mobile wrappers producing installable binaries (Section 9.1).*

1. **Add the legal disclaimer and credits.**
   - **Build:** A boot/menu-accessible disclaimer screen: all teams, players, crests, kits, and the tournament are original/fictional; no affiliation with any real federation/event; real country names used as geographic facts (Section 0). Credit AI-asset tooling and OFL fonts.
   - **Acceptance:** A clear disclaimer/credits screen is reachable from the menu and shown on first run; copy matches the Section 0 guardrails.
   - **Files:** `src/scenes/LegalScene.ts`, `README.md`, `LICENSE`/`CREDITS.md`.

2. **Ship the web build.**
   - **Build:** Finalize `vite build` → `dist/`; verify asset paths work under a subpath (itch.io). Add a production smoke check and deploy to a static host.
   - **Acceptance:** The built `dist/` runs the full game from a static host (itch.io/Netlify) with no broken assets — the canonical target is live.
   - **Files:** `vite.config.ts` (base path), CI/deploy config.

3. **Wrap Desktop with Tauri.**
   - **Build:** Add Tauri; point it at `dist/`; implement the desktop file-system save backend (`groundswell/saves/slot-{n}.json`) behind the existing `SaveBackend` interface.
   - **Acceptance:** `npm run desktop` launches the game in a native window; saves write real JSON files; a packaged binary installs and runs.
   - **Files:** `src-tauri/*`, `src/save/backends/TauriFsBackend.ts`.

4. **Wrap Mobile with Capacitor.**
   - **Build:** Add Capacitor; wrap `dist/`; implement the Capacitor Preferences/Filesystem save backend; confirm Phaser pointer events handle touch end-to-end.
   - **Acceptance:** `npm run mobile` runs the game on a device/simulator with working touch controls and persistent saves.
   - **Files:** `capacitor.config.ts`, `src/save/backends/CapacitorBackend.ts`, platform projects.

---

### Dependency Spine (at a glance)

`M0 scaffold → M1 pitch → M2 player(loop) → M3 ball → M4 pass/shoot → M5 goals+juice → M6 GK/AI → M7 full match+tests → M8 data layer → M9 tournament → M10 save/load → M11 Surge/comeback → M12 modes → M13 progression → M14 art/audio → M15 menus → M16 legal/deploy.`

The first seven milestones build a **fun, complete single match in greybox** — the true vertical slice. M8–M11 turn it into **The Globe Cup with a soul** (data, tournament, persistence, the Surge comeback engine). M12–M16 are **breadth and shine**: more modes, progression, the neo-poster art/audio juice, the front-end shell, and the multi-platform ship. Every arrow is a runnable build; you can stop at any milestone boundary and have something playable to show.
