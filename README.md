# Tower Defense

A small, complete 2D tower defense game. Enemies spawn on one side of the
map, follow a winding path toward your base, and you place towers along the
way to stop them before they get through. Kill enemies for money, spend
money on more towers and upgrades, survive as many waves as you can.

This is an MVP: one map, three tower types, three enemy types, five
hand-authored waves plus procedurally generated waves after that. It is
built to be extended (see [Extending the game](#extending-the-game) below)
rather than to be feature-complete.

## Tech stack

| Layer | Technology | Role |
|---|---|---|
| Game engine | [Phaser 3](https://phaser.io/) (3.90.x) | Owns the entire game world/simulation: map, path, enemies, towers, projectiles, combat, waves. |
| UI | React 19 | Renders the HUD, tower selector, tower panel, controls, and overlays. Never simulates gameplay — it only reads state and sends commands. |
| Build tool | Vite | Dev server + production bundling. |
| Backend | Node.js + Express 5 | Serves the production build. Structured as a foundation for future backend features (no database yet). |
| Container | Podman | Multi-stage `Containerfile` producing a small, non-root runtime image. |

No external art or audio assets are used. All visuals are generated at
runtime from `Phaser.GameObjects.Graphics` textures (see
`src/game/utils/textureGenerator.js`), and the audio system is a working
scaffold that safely no-ops when no sound assets are present.

## Architecture: Phaser owns the game, React owns the UI

This is the most important design rule in the codebase, so it's worth
stating explicitly:

- **Phaser** owns the map, the path, enemies, towers, projectiles, combat
  math, waves, money, and health. All of it lives in `src/game/`.
- **React** owns only presentation: the HUD, buttons, panels, and overlays
  in `src/components/`. React state is a *read model* — it mirrors what
  Phaser reports, it does not compute or drive gameplay.
- The two sides **never** call into each other directly. They communicate
  exclusively through a single event bus:
  `src/game/events/GameEvents.js`, a `Phaser.Events.EventEmitter` singleton
  with named `Events` constants.

```
Phaser (GameScene, systems)  --state-changed events-->  GameEvents  --React listens--> App.jsx state --> components
React (button clicks)        --command events-->        GameEvents  --Phaser listens--> GameScene handlers
```

Concretely:

- When a tower fires, deals damage, or an enemy dies, **Phaser** computes
  it and emits e.g. `Events.MONEY_CHANGED` or `Events.HEALTH_CHANGED`.
  `App.jsx` listens for these and updates React state, which flows down as
  props to `HUD.jsx`, etc.
- When the player clicks "Machine Gun" in the tower selector, **React**
  emits `Events.SELECT_TOWER_TYPE`. `GameScene` listens for this and enters
  placement mode. React never places a tower itself.

If you ever find yourself importing Phaser into a React component (besides
`GameContainer.jsx`, which owns the single `Phaser.Game` instance), or
computing gameplay values inside a `.jsx` file, that's a sign the
architecture boundary is being violated.

## Project structure

```
tower-defense/
├── server/
│   └── server.js            Express server: serves dist/, /api/health, SPA fallback
├── src/
│   ├── main.jsx              React entry point (StrictMode + createRoot)
│   ├── App.jsx                Composes UI, owns the React "read model" state,
│   │                          subscribes to GameEvents, dispatches commands
│   ├── index.css              All game UI styling
│   ├── components/            Presentational React components only
│   │   ├── GameContainer.jsx  The ONLY component that touches Phaser directly.
│   │   │                      Creates/destroys the single Phaser.Game instance.
│   │   ├── HUD.jsx             Health / money / wave / enemies-remaining display
│   │   ├── TowerSelector.jsx   Buy buttons for the 3 tower types
│   │   ├── TowerPanel.jsx      Selected-tower info, upgrade, sell
│   │   ├── GameControls.jsx    Pause/resume, speed (1x/2x)
│   │   ├── NextWaveBanner.jsx  Countdown + "start now" button
│   │   └── GameOver.jsx        End-of-run overlay + restart
│   └── game/
│       ├── config/             ALL balance numbers live here, nowhere else
│       │   ├── gameConfig.js    Phaser.Game config (resolution, scale mode, scenes)
│       │   ├── mapConfig.js     Map size, path waypoints, spawn/base points, decorations
│       │   ├── towers.js        Tower stats, upgrade scaling, upgrade costs
│       │   ├── enemies.js       Enemy stats (health, speed, reward, damage)
│       │   └── waves.js         Hand-authored waves 1-5 + generator for wave 6+
│       ├── events/
│       │   └── GameEvents.js    The event bus described above
│       ├── scenes/
│       │   ├── BootScene.js     Kicks off preloading
│       │   ├── PreloadScene.js  Generates all placeholder textures
│       │   └── GameScene.js     The orchestrator: map, placement, pause/speed,
│       │                        game-over, wires all systems together
│       ├── entities/
│       │   ├── Enemy.js         Path-following enemy + in-world health bar
│       │   ├── Tower.js         Turret rotation, range circle, upgrade/sell state
│       │   └── Projectile.js    Homing projectile visuals + hit detection
│       ├── systems/
│       │   ├── EconomySystem.js    Money
│       │   ├── HealthSystem.js     Base health / death
│       │   ├── TargetingSystem.js  Target-selection strategies (FIRST implemented)
│       │   ├── TowerSystem.js      Placement, firing, upgrades, selling
│       │   ├── WaveSystem.js       Spawning, wave progression, countdowns
│       │   ├── EffectsSystem.js    Muzzle flashes, explosions, particles, tweens
│       │   └── AudioSystem.js      Safe-no-op sound playback scaffold
│       └── utils/
│           ├── pathUtils.js         Path building + point-to-path distance
│           └── textureGenerator.js  Procedural texture generation (no assets)
├── Containerfile              Multi-stage Podman/Docker build
├── .containerignore
└── package.json
```

## Running in development

Requires Node.js 20+.

```bash
npm install
npm run dev
```

This starts the Vite dev server (with hot module reload) — open the URL it
prints (typically `http://localhost:5173`).

Other useful scripts:

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build locally via Vite
npm run lint       # oxlint
npm start          # node server/server.js (serves an existing dist/ build)
```

## Running in production (Node)

```bash
npm install
npm run build
npm start
```

The server listens on `0.0.0.0:8080` by default (override with the `PORT`
env var). Open `http://localhost:8080`.

## Running with Podman

The `Containerfile` is a two-stage build: the first stage installs
dependencies and runs `vite build`, then prunes dev dependencies; the
second stage copies only the production `node_modules`, the built `dist/`,
and `server/` into a fresh minimal image, and runs the app as a dedicated
non-root user (`towerdefense`).

```bash
podman build -t tower-defense .
podman run --rm -p 8080:8080 tower-defense
```

Then open `http://localhost:8080`.

> **Note:** on some rootless-Podman networking setups (notably the `pasta`
> network backend), `localhost` may resolve to `::1` before `127.0.0.1` and
> the IPv6 loopback isn't always forwarded. If `http://localhost:8080`
> doesn't load, try `http://127.0.0.1:8080` — the container itself is
> unaffected, this is purely a host-side DNS/loopback resolution quirk.

To stop it (in another terminal, if not run with `-it`):

```bash
podman stop $(podman ps -q --filter ancestor=tower-defense)
```

The server responds to `SIGTERM`/`SIGINT` immediately with a graceful
shutdown, so `podman stop` / Ctrl+C return quickly instead of waiting out
the default stop-timeout.

## How to play

1. Pick a tower from the tower selector and click a valid (green-highlighted)
   spot on the map to place it. Spots on or too close to the path, off the
   map, or too close to another tower are rejected (shown in red).
2. Waves start automatically after a countdown; you can also start the next
   wave immediately from the "next wave" banner.
3. Click a placed tower to select it, then upgrade (up to level 3) or sell
   it (70% of total money invested is refunded) from the tower panel.
4. Kill enemies before they reach your base — each one that gets through
   damages your base's health. The game ends when health reaches 0.
5. Use the game controls to pause/resume or toggle 1x/2x speed at any time.

Starting state: **100 health, $500, wave 1**.

### Towers

| Tower | Cost | Role |
|---|---|---|
| Machine Gun | $100 | Fast fire rate, low damage per shot, short-medium range |
| Cannon | $200 | Slow, high damage, splash damage around impact, short range |
| Sniper | $300 | Very slow, very high damage, longest range |

Each tower can be upgraded twice (levels 1→2→3), improving damage, range,
and fire rate. All exact numbers live in `src/game/config/towers.js`.

### Enemies

| Enemy | Trait |
|---|---|
| Normal | Baseline health/speed |
| Fast | Low health, high speed |
| Tank | High health, low speed, hits the base hard if it gets through |

All exact numbers live in `src/game/config/enemies.js`.

## Extending the game

The MVP was deliberately kept simple in a few specific, easy-to-extend
places:

- **Targeting strategies**: only `FIRST` (target the enemy furthest along
  the path) is implemented. `src/game/systems/TargetingSystem.js` already
  has the `TargetingStrategy` constants and a `strategies` map with
  `LAST`/`STRONGEST`/`WEAKEST`/`CLOSEST` stubbed out — implement the
  function, add it to the map, and it becomes available.
- **New tower type**: add an entry to `TOWER_TYPES` in
  `src/game/config/towers.js` (cost, damage, range, fire rate, projectile
  type, upgrade scaling/costs), add it to `TOWER_ORDER`, and add a texture
  case in `textureGenerator.js`. `TowerSystem`, `Tower`, and
  `TowerSelector.jsx` all read from this config rather than hardcoding
  tower types.
- **New enemy type**: same idea in `src/game/config/enemies.js` — add to
  `ENEMY_TYPES`/`ENEMY_ORDER`, add a texture case, then reference it from
  wave definitions.
- **New/changed waves**: edit `HAND_AUTHORED_WAVES` in
  `src/game/config/waves.js` for specific early waves, or tune
  `generateWave()` for how waves scale after that.
- **Map / path**: edit `PATH_WAYPOINTS`, `SPAWN_POINT`, `BASE_POINT`, and
  `DECORATIONS` in `src/game/config/mapConfig.js`. `GameScene.drawMap()`
  and `TowerSystem.canPlaceAt()` both derive everything from this config,
  so a new path shape "just works" as long as waypoints don't self-overlap
  in a way that breaks placement spacing.
- **Real audio**: `AudioSystem.play()` already checks
  `scene.cache.audio.exists(key)` and no-ops safely if missing. Load real
  sound files in `PreloadScene` under the keys in
  `AudioSystem.SoundKeys` and they'll start playing with no other changes.

## Code quality notes

- All gameplay balance numbers are centralized in `src/game/config/*.js` —
  no magic numbers scattered through entities/systems.
- Exactly one `Phaser.Game` instance is ever created
  (`GameContainer.jsx`), guarded against React 18/19 StrictMode's
  double-invoke behavior, and cleanly destroyed on unmount.
- `GameScene` fully unregisters its `GameEvents` listeners and destroys its
  systems on `Phaser.Scenes.Events.SHUTDOWN`, so restarting the scene never
  accumulates duplicate listeners or leaked timers.
- `npm run lint` runs `oxlint` across the project.
