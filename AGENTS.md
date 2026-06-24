# PowerRunner — Agent Guide

Phaser 4 space-mining game. Code lives under **`src/`** in focused ES modules. Root **`main.js`** re-exports `main()` for `index.html` compatibility.

The public README is outdated. Treat **`src/`** and this file as the source of truth.

---

## Quick start

```bash
npm ci
npm run dev      # Vite dev server
npm run build    # outputs to dist/
npm run lint     # JavaScript Standard Style (CI enforced)
npm run lint:fix # auto-fix standard violations
npm test         # unit tests (Vitest)
npm run test:watch
```

- Entry: `index.html` → `main.js` → `src/main.js`
- Phaser: `src/phaser.js` re-exports from `node_modules/phaser/dist/phaser.esm.js`
- Global run state: `window.gameState` (created in `src/main.js`)
- `tmp/` and `scripts/` are tooling/scratch — not shipped
- `test/` — Vitest unit tests (see below)

---

## Unit tests

**Vitest** runs pure logic tests without booting Phaser or scenes.

```bash
npm test           # single run (CI)
npm run test:watch # watch mode
```

| Path | Covers |
|------|--------|
| `test/utils/` | Asteroid tiers, mining params, tractor/scanner math, geometry |
| `test/state/` | `GameState`, cargo/economy, fuel/battery |
| `test/shop/` | Tech tree layout, shop prerequisites and purchases |
| `test/render/asteroid.test.js` | Mineral capacity, color helpers |

- Setup: `test/setup.js` resets `window.gameState` before each test
- Phaser is mocked in tests via `test/mocks/phaser.js` (`vi.mock('@/phaser.js')`)
- Prefer testing **`src/utils/`**, **`src/state/`**, **`src/shop/`** — not scene mixins
- Add tests when changing game rules; run `npm test` with lint/build before finishing

---

## Repository layout

```
src/
  main.js                 # Phaser config, scene registration, game bootstrap
  phaser.js               # Shared Phaser import
  constants/              # Tuning values (player, tools, asteroids, tech tree, resources)
  state/                  # GameState, ship fuel/battery, economy/cargo
  shop/                   # ShopItem classes, tech tree menu helpers
  utils/                  # Pure helpers (geometry, mining params, tractor/scanner math)
  render/                 # Graphics drawing (ship, asteroids, mothership, starfield, tractor cone)
  ui/                     # HUD widgets, resource boxes, fullscreen
  input/                  # Gamepad
  game/                   # Scene transitions
  scenes/                 # DeathScene, MothershipScene, LevelScene (thin orchestrator)
  level/                  # LevelScene logic split by system (prototype mixins)
main.js                   # Re-exports main() from src/main.js
index.html
package.json
AGENTS.md
```

---

## Architecture

### Scenes

| Scene | File | Role |
|-------|------|------|
| `mothership` | `src/scenes/MothershipScene.js` | Tech tree shop, undock |
| `level` | `src/scenes/LevelScene.js` | Mining run (imports `src/level/*` mixins) |
| `death` | `src/scenes/DeathScene.js` | Game over / lost in space |

`LevelScene` uses **`Object.assign(LevelScene.prototype, …Methods)`** to mix in behaviour from `src/level/*.js`. Each level module exports a `*Methods` object whose functions use `this` like scene methods.

### Level modules (`src/level/`)

| Module | Responsibility |
|--------|----------------|
| `core.js` | `create`, `setupInput`, `update` loop |
| `world.js` | World bounds, field mothership, shield repel |
| `run.js` | `initMiningRun`, return to mothership, director pressure |
| `asteroidField.js` | Spawn, fracture, asteroid–asteroid collision |
| `grapple.js` | Grapple hook, attach, sync to target |
| `drilling.js` | Drill arm, mineral depletion |
| `tractor.js` | Tractor beam pull + visual |
| `scanner.js` | Scanner charge, pulse, off-screen markers |
| `explosives.js` | Placed charges, detonation |
| `player.js` | Movement, rendering, fragments, hull damage |
| `fuelBattery.js` | Fuel grace timer, battery drain/recharge |
| `docking.js` | Auto-dock, nav HUD |
| `hud.js` | Level HUD layout |
| `pause.js` | Pause overlay |
| `devMenu.js` | F10 dev menu |

### Global state (`src/state/GameState.js`)

Key fields: `level`, `resources`, `cargo`, `fuelCurrent`, `batteryCurrent`, `tractorBeamLevel`, `scannerLevel`, `explosiveCharges`, `deathReason`.

Shop upgrades mutate `window.gameState` via `src/shop/items.js`.

### Constants

Balance lives in `src/constants/`:

- `player.js` — movement, fuel, battery, grapple
- `tools.js` — tractor, scanner, explosive charges
- `asteroids.js` — sizes, mining field, docking distances, shield
- `techTree.js` — layout and dependency edges
- `resources.js` — iron / helium3 / crystal
- `theme.js` — colors, gamepad dead zone

---

## Gameplay reference

### Level update pipeline (`src/level/core.js`)

When not paused: movement → fuel → grapple → drilling → tractor → scanner → battery → explosives → auto-dock → HUD refresh.

### Input (level)

| Key / pad | Action |
|-----------|--------|
| WASD / stick | Thrust / rotate |
| Space / X | Grapple |
| Q (hold) | Scanner |
| F (hold) | Tractor |
| Z | Explosive (while attached) |
| Esc / P / Start / B | Pause |
| F10 | Dev menu |

---

## Making changes

### New shop upgrade

1. Add class in `src/shop/items.js` (extend `ShopItem`)
2. Register in `MothershipScene` constructor
3. Add node to `src/constants/techTree.js` (`TECH_TREE_LAYOUT`, `TECH_TREE_EDGES`)

### New level mechanic

1. Add constants to the appropriate `src/constants/*.js` file
2. Add pure logic to `src/utils/` if scene-agnostic
3. Add or extend a `src/level/*.js` module; export methods on `*Methods`
4. Register the mixin in `src/scenes/LevelScene.js` `Object.assign(...)`
5. Wire into `core.js` `update()` if needed each frame

### Rendering

All art is `Graphics`-based — see `src/render/`. HUD elements use `setScrollFactor(0)`.

---

## Agent conventions

- **Edit the smallest module** that owns the behaviour — avoid re-monolithing
- **Standard JS** — run `npm run lint:fix` after edits
- **No commits** unless the user asks
- **Verify** with `npm run lint && npm test && npm run build`
- Level mixins must keep `this` semantics — do not convert to standalone functions that need `scene` passed everywhere unless refactoring the whole module

---

## Useful commands

```bash
# Find a system
rg "fractureAsteroid|grappleState" src/

# List level modules
ls src/level/

# Shop items
rg "class ShopItem" src/shop/
```

---

## Tooling scripts

- `scripts/split-main.mjs` — one-time extractor used for the modular refactor
- `scripts/fix-level-imports.mjs` — regenerates import headers for `src/level/*.js` after method moves

If you move methods between level modules, update `scripts/fix-level-imports.mjs` and re-run it.
