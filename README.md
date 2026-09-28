<div align="center">

# 🏰 Tower Defense 🎯

### Place towers. Stop the horde. Protect your base.

![Phaser](https://img.shields.io/badge/Phaser-3.90-ff4f75?style=for-the-badge&logo=phaser&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?style=for-the-badge&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Podman](https://img.shields.io/badge/Podman-ready-892CA0?style=for-the-badge&logo=podman&logoColor=white)

</div>

---

## 🎮 About the game

Enemies pour in from one side of the map and march down a winding path toward your base. 🟢 **Normal**, 🔵 **Fast**, and 🔴 **Tank** enemies each behave differently — some are quick and fragile, some are slow-moving walls of health. Your job: place towers along the path, earn 💰 money by killing enemies before they reach your base, and use that money to build more towers and upgrade the ones you have.

Let one too many enemies through and your base's ❤️ health hits zero — game over.

| 🗼 Tower | 💵 Cost | 🧠 Style |
|---|---|---|
| 🟡 **Machine Gun** | $100 | Fast fire rate, low damage, medium range |
| 🟠 **Cannon** | $200 | Slow, hard-hitting, damages everything in a splash radius |
| 🔵 **Sniper** | $300 | Very slow, massive single-target damage, longest range on the map |

Every tower can be upgraded twice (⭐ level 1 → 2 → 3) for more damage, range, and fire rate, or sold back for a 70% refund if you want to reposition your defense.

Survive **wave 1 through wave 5** (hand-crafted) and then keep going — waves after that are generated on the fly, getting steadily bigger and tougher. Speed up the action with the ⏩ **1x/2x** toggle, or hit ⏸ **pause** any time without losing your place.

No external art or sound files are used — every visual is drawn procedurally at startup, right inside the game engine. 🎨

---

## 🧩 Technologies used

| Layer | Tech | Why |
|---|---|---|
| 🕹️ **Game engine** | [Phaser 3](https://phaser.io/) | Owns the entire simulation — map, path, enemies, towers, projectiles, combat, waves |
| ⚛️ **UI** | React 19 | Renders the HUD, tower shop, panels, and overlays — never simulates gameplay |
| ⚡ **Build tool** | Vite | Dev server with hot reload + production bundling |
| 🟩 **Backend** | Node.js + Express 5 | Serves the production build, with room to grow into a real API later |
| 🐳 **Container** | Podman | Multi-stage build → small, non-root runtime image |

Curious how the pieces actually fit together (event bus, file-by-file breakdown, full combat-loop trace)? See **[`GUIDE.md`](./GUIDE.md)** for the deep dive.

---

## 🐳 Running with Podman

```bash
podman build -t tower-defense .
podman run --rm -p 8080:8080 tower-defense
```

Then open **http://localhost:8080** 🎉

> 💡 **Tip:** on some rootless-Podman setups, `localhost` doesn't resolve over the port-forward as reliably as the explicit loopback address. If the page won't load, try **http://127.0.0.1:8080** instead — the container itself is unaffected either way.

To stop it (from another terminal, if it wasn't run with `-it`):

```bash
podman stop $(podman ps -q --filter ancestor=tower-defense)
```

It shuts down gracefully and quickly — no waiting around for a forced kill. ⚡

---

<div align="center">

🌲🗼🌲 *Good luck out there.* 🌲🗼🌲

</div>
