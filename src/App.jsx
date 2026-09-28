/**
 * App.jsx
 *
 * Composes the Phaser game with the surrounding React UI. Owns a small
 * amount of React state that mirrors what Phaser has already decided
 * (health, money, wave, selection, etc.) - it is a *read model*, updated
 * only when GameEvents fire, never a place where gameplay is simulated.
 * All user actions are dispatched back to Phaser as command events.
 */
import { useCallback, useEffect, useState } from 'react';
import GameContainer from './components/GameContainer.jsx';
import HUD from './components/HUD.jsx';
import TowerSelector from './components/TowerSelector.jsx';
import TowerPanel from './components/TowerPanel.jsx';
import GameControls from './components/GameControls.jsx';
import GameOver from './components/GameOver.jsx';
import NextWaveBanner from './components/NextWaveBanner.jsx';
import GameEvents, { Events } from './game/events/GameEvents.js';

const STARTING_MONEY = 500;
const STARTING_HEALTH = 100;

function App() {
  const [health, setHealth] = useState(STARTING_HEALTH);
  const [maxHealth, setMaxHealth] = useState(STARTING_HEALTH);
  const [money, setMoney] = useState(STARTING_MONEY);
  const [wave, setWave] = useState(0);
  const [enemiesRemaining, setEnemiesRemaining] = useState(0);
  const [selectedTower, setSelectedTower] = useState(null);
  const [placement, setPlacement] = useState({ active: false, type: null });
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeedState] = useState(1);
  const [nextWaveCountdown, setNextWaveCountdown] = useState(null);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverStats, setGameOverStats] = useState(null);

  useEffect(() => {
    const onHealthChanged = ({ health: h, maxHealth: mh }) => {
      setHealth(h);
      setMaxHealth(mh);
    };
    const onMoneyChanged = (m) => setMoney(m);
    const onWaveChanged = (w) => setWave(w);
    const onEnemiesRemainingChanged = (n) => setEnemiesRemaining(n);
    const onTowerSelected = (snapshot) => setSelectedTower(snapshot);
    const onTowerDeselected = () => setSelectedTower(null);
    const onPlacementStateChanged = (state) => setPlacement(state);
    const onNextWaveCountdown = (payload) => setNextWaveCountdown(payload);
    const onGamePaused = () => setIsPaused(true);
    const onGameResumed = () => setIsPaused(false);
    const onGameSpeedChanged = (s) => setSpeedState(s);
    const onGameOver = (stats) => {
      setIsGameOver(true);
      setGameOverStats(stats);
    };

    GameEvents.on(Events.HEALTH_CHANGED, onHealthChanged);
    GameEvents.on(Events.MONEY_CHANGED, onMoneyChanged);
    GameEvents.on(Events.WAVE_CHANGED, onWaveChanged);
    GameEvents.on(Events.ENEMIES_REMAINING_CHANGED, onEnemiesRemainingChanged);
    GameEvents.on(Events.TOWER_SELECTED, onTowerSelected);
    GameEvents.on(Events.TOWER_DESELECTED, onTowerDeselected);
    GameEvents.on(Events.PLACEMENT_STATE_CHANGED, onPlacementStateChanged);
    GameEvents.on(Events.NEXT_WAVE_COUNTDOWN, onNextWaveCountdown);
    GameEvents.on(Events.GAME_PAUSED, onGamePaused);
    GameEvents.on(Events.GAME_RESUMED, onGameResumed);
    GameEvents.on(Events.GAME_SPEED_CHANGED, onGameSpeedChanged);
    GameEvents.on(Events.GAME_OVER, onGameOver);

    return () => {
      GameEvents.off(Events.HEALTH_CHANGED, onHealthChanged);
      GameEvents.off(Events.MONEY_CHANGED, onMoneyChanged);
      GameEvents.off(Events.WAVE_CHANGED, onWaveChanged);
      GameEvents.off(Events.ENEMIES_REMAINING_CHANGED, onEnemiesRemainingChanged);
      GameEvents.off(Events.TOWER_SELECTED, onTowerSelected);
      GameEvents.off(Events.TOWER_DESELECTED, onTowerDeselected);
      GameEvents.off(Events.PLACEMENT_STATE_CHANGED, onPlacementStateChanged);
      GameEvents.off(Events.NEXT_WAVE_COUNTDOWN, onNextWaveCountdown);
      GameEvents.off(Events.GAME_PAUSED, onGamePaused);
      GameEvents.off(Events.GAME_RESUMED, onGameResumed);
      GameEvents.off(Events.GAME_SPEED_CHANGED, onGameSpeedChanged);
      GameEvents.off(Events.GAME_OVER, onGameOver);
    };
  }, []);

  // Reset local UI state immediately on restart so the overlay/panels
  // don't flash stale data while Phaser reboots the scene.
  const handleRestart = useCallback(() => {
    setIsGameOver(false);
    setGameOverStats(null);
    setSelectedTower(null);
    setPlacement({ active: false, type: null });
    setNextWaveCountdown(null);
    setIsPaused(false);
    setSpeedState(1);
    setHealth(STARTING_HEALTH);
    setMaxHealth(STARTING_HEALTH);
    setMoney(STARTING_MONEY);
    setWave(0);
    setEnemiesRemaining(0);
    GameEvents.emit(Events.RESTART_GAME);
  }, []);

  const selectTowerType = useCallback((type) => {
    if (placement.active && placement.type === type) {
      GameEvents.emit(Events.CANCEL_TOWER_SELECTION);
      return;
    }
    GameEvents.emit(Events.SELECT_TOWER_TYPE, type);
  }, [placement]);

  const cancelPlacement = useCallback(() => {
    GameEvents.emit(Events.CANCEL_TOWER_SELECTION);
  }, []);

  const upgradeTower = useCallback((id) => {
    GameEvents.emit(Events.UPGRADE_TOWER, id);
  }, []);

  const sellTower = useCallback((id) => {
    GameEvents.emit(Events.SELL_TOWER, id);
  }, []);

  const startNextWave = useCallback(() => {
    GameEvents.emit(Events.START_NEXT_WAVE);
  }, []);

  const togglePause = useCallback(() => {
    GameEvents.emit(isPaused ? Events.RESUME_GAME : Events.PAUSE_GAME);
  }, [isPaused]);

  const setSpeed = useCallback((s) => {
    GameEvents.emit(Events.SET_GAME_SPEED, s);
  }, []);

  return (
    <div className="app-root">
      <div className="game-stage">
        <GameContainer />
        <NextWaveBanner countdown={nextWaveCountdown} onStartNextWave={startNextWave} />
        {isGameOver && <GameOver stats={gameOverStats} onRestart={handleRestart} />}
      </div>

      <HUD
        health={health}
        maxHealth={maxHealth}
        money={money}
        wave={wave}
        enemiesRemaining={enemiesRemaining}
      />

      <div className="bottom-bar">
        <TowerSelector
          money={money}
          activeType={placement.active ? placement.type : null}
          onSelectType={selectTowerType}
          onCancel={cancelPlacement}
        />
        <GameControls
          isPaused={isPaused}
          speed={speed}
          onTogglePause={togglePause}
          onSetSpeed={setSpeed}
          onRestart={handleRestart}
        />
      </div>

      {selectedTower && (
        <TowerPanel
          tower={selectedTower}
          money={money}
          onUpgrade={upgradeTower}
          onSell={sellTower}
        />
      )}
    </div>
  );
}

export default App;
