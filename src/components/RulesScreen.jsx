export default function RulesScreen({ onBack, onContinue }) {
  return (
    <section className="screen-pane screen rules-screen">
      <h2>How Calm Mode Works</h2>
      <p className="subtitle">The logic stays identical to the standard N-back, but interruptions are handled peripherally.</p>

      <div className="rules-body">
        <h3>Core Task</h3>
        <ol className="rules-list">
          <li>Observe one stimulus at a time.</li>
          <li>Decide whether it matches the item shown N steps earlier.</li>
          <li>Respond before the ambient progress wave reaches the end.</li>
        </ol>

        <h3>Calm Notifications</h3>
        <ul className="rules-list">
          <li><strong>Minor:</strong> edge glow pulse.</li>
          <li><strong>Visual:</strong> soft corner notification.</li>
          <li><strong>Audio:</strong> low-volume chime plus glow.</li>
        </ul>

        <h3>Flow</h3>
        <p>You will do a short warm-up round first, then configure and run the full session.</p>
      </div>

      <div className="actions between">
        <button type="button" onClick={onBack}>
          Back
        </button>
        <button type="button" className="primary" onClick={onContinue}>
          Continue
        </button>
      </div>
    </section>
  );
}
