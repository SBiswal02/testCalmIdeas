/**
 * Active test UI showing stimulus, controls, and feedback.
 */
export default function TestScreen({
  trialCounterLabel,
  nValue,
  trialProgress,
  progressTransitionMs,
  stimulusType,
  currentStimulus,
  isResponseEnabled,
  onMatch,
  onNoMatch,
  feedback,
}) {
  return (
    <section className="card screen test-screen">
      <h2>Actual Test</h2>
      <div className="test-meta">
        <span>{trialCounterLabel}</span>
        <span>N-Back: {nValue}</span>
      </div>
      <div className="trial-progress" aria-label="Time until next trial">
        <div
          className="trial-progress-fill"
          style={{
            width: `${trialProgress}%`,
            transition: `width ${progressTransitionMs}ms linear`,
          }}
        />
      </div>

      <div className="stimulus-panel">
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

      <div className="actions">
        <button className="primary" onClick={onMatch} disabled={!isResponseEnabled}>
          Match (Space)
        </button>
        <button onClick={onNoMatch} disabled={!isResponseEnabled}>
          No Match (Enter)
        </button>
      </div>

      <p className={`feedback ${feedback.kind}`}>{feedback.text}</p>
    </section>
  );
}



