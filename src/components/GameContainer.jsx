/**
 * GameContainer.jsx
 *
 * The ONLY place React touches Phaser directly: mounting the canvas and
 * owning the Phaser.Game instance's lifecycle. No other component ever
 * imports Phaser or reaches into game internals - everything else goes
 * through GameEvents.
 *
 * A ref guard + explicit `game.destroy(true)` on unmount keeps this safe
 * under React 18 StrictMode's dev-mode mount/cleanup/mount double-invoke,
 * so exactly one Phaser.Game instance ever exists at a time.
 */
import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '../game/config/gameConfig.js';

const CONTAINER_ID = 'phaser-game-root';

export default function GameContainer() {
  const gameRef = useRef(null);

  useEffect(() => {
    if (gameRef.current) return undefined;

    const config = createGameConfig(CONTAINER_ID);
    const game = new Phaser.Game(config);
    gameRef.current = game;

    return () => {
      game.destroy(true);
      if (gameRef.current === game) gameRef.current = null;
    };
  }, []);

  return <div id={CONTAINER_ID} className="game-container" />;
}
