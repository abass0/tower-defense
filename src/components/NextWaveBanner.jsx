/**
 * NextWaveBanner.jsx
 *
 * Small overlay showing the countdown to the next wave with a button to
 * skip the wait. Rendered only while WaveSystem has an active countdown.
 */
export default function NextWaveBanner({ countdown, onStartNextWave }) {
  if (!countdown) return null;

  return (
    <div className="next-wave-banner">
      <span className="next-wave-text">
        NEXT WAVE ({countdown.waveNumber}) IN: {countdown.seconds}s
      </span>
      <button type="button" className="btn btn-next-wave" onClick={onStartNextWave}>
        START NEXT WAVE
      </button>
    </div>
  );
}
