/**
 * AudioSystem.js
 *
 * Prepares the project for audio without requiring any audio assets to
 * exist yet. Named sound keys are defined once here; `play()` silently
 * no-ops if that key hasn't been loaded, so the game works identically
 * with or without real audio files.
 *
 * To add real sound later:
 *   1. Drop files into `public/audio/` (or load from a CDN later).
 *   2. Load them in PreloadScene: `this.load.audio(SoundKeys.TOWER_FIRE_MACHINE_GUN, 'audio/machine-gun.mp3')`.
 *   3. Nothing else changes - every `AudioSystem.play(key)` call site
 *      already exists at the right moments (tower fire, enemy death, UI
 *      clicks) and will simply start playing once the key resolves.
 */

export const SoundKeys = {
  TOWER_FIRE_MACHINE_GUN: 'tower_fire_machineGun',
  TOWER_FIRE_CANNON: 'tower_fire_cannon',
  TOWER_FIRE_SNIPER: 'tower_fire_sniper',
  ENEMY_DEATH: 'enemy_death',
  UI_CLICK: 'ui_click',
  BGM_MAIN: 'bgm_main',
};

export default class AudioSystem {
  constructor(scene) {
    this.scene = scene;
  }

  play(key, config = {}) {
    const scene = this.scene;
    if (!scene || !scene.cache || !scene.cache.audio || !scene.cache.audio.exists(key)) {
      // No asset loaded for this key yet - safe no-op for the MVP.
      return null;
    }
    return scene.sound.play(key, config);
  }
}
