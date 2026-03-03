import DistractionPopup from "./DistractionPopup";

export default function TestScreen({
  title,
  subtitle,
  trialCounterLabel,
  nValue,
  trialProgress,
  progressTransitionMs,
  stimulusType,
  currentStimulus,
  currentIsTarget,
  isResponseEnabled,
  onMatch,
  onNoMatch,
  onEndTest,
  feedback,
  notification,
  totalNotifications,
}) {
  const cueClass = notification?.visible ? `cue-${notification?.level || "minor"}` : "cue-idle";
  const stimulusToneClass = currentIsTarget ? "target-tone" : "neutral-tone";

  return (
    <section className={`screen-pane screen test-screen ${cueClass} ${notification?.visible ? "cue-active" : ""}`}>
      <header className="test-header">
        <div>
          <h2>{title}</h2>
          <p className="subtitle">{subtitle}</p>
        </div>
        <div className="test-controls">
          <button type="button" className="secondary" onClick={onEndTest}>
            End
          </button>
        </div>
      </header>

      <div className="test-meta">
        <span>{trialCounterLabel}</span>
        <span>N-Back: {nValue}</span>
        <span className="cue-count">Cues: {totalNotifications ?? 0}</span>
      </div>

      <div className="ambient-wave" aria-label="Time until next trial">
        <div
          className="ambient-wave-fill"
          style={{
            width: `${trialProgress}%`,
            transition: `width ${progressTransitionMs}ms linear`,
          }}
        />
      </div>

      <div className={`stimulus-panel ${stimulusToneClass}`}>
        {stimulusType === "positions" ? (
          <div className="grid-board">
            {Array.from({ length: 9 }).map((_, index) => (
              <div key={index} className={`grid-cell ${currentStimulus === index ? "active" : ""}`} />
            ))}
          </div>
        ) : (
          <div className="stimulus-token">{currentStimulus}</div>
        )}
      </div>

      <DistractionPopup visible={notification?.visible} text={notification?.text} level={notification?.level} />
      {notification?.visible ? <div className="cue-indicator">Peripheral cue active</div> : null}

      <div className="actions between">
        <button className="primary" onClick={onMatch} disabled={!isResponseEnabled}>
          Match (Space)
        </button>
        <button onClick={onNoMatch} disabled={!isResponseEnabled}>
          No Match (Enter)
        </button>
      </div>

      <div className="feedback-wrap">
        <p className={`feedback ${feedback.kind}`}>{feedback.text}</p>
      </div>
    </section>
  );
}
