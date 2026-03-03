export default function IntroScreen({ participant, introError, onParticipantChange, onContinue }) {
  return (
    <section className="screen-pane screen intro-screen">
      <h1>CalmUX Lab</h1>
      <p className="subtitle">
        Calm Condition N-back session. Instructions are integrated here so you can start with minimal cognitive load.
      </p>

      <ul className="rules-list compact">
        <li>Match when the current item is the same as N trials earlier.</li>
        <li>Use <strong>Space</strong> for Match and <strong>Enter</strong> for No Match.</li>
        <li>Peripheral notifications may appear during the main session, but the task continues.</li>
      </ul>

      <form className="form-grid" onSubmit={onContinue}>
        <label>
          Name
          <input
            required
            value={participant.name}
            placeholder="Enter your name"
            onChange={(event) => onParticipantChange("name", event.target.value)}
          />
        </label>
        <label>
          ID Number
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={participant.rollNumber}
            placeholder="Numeric ID"
            onChange={(event) => onParticipantChange("rollNumber", event.target.value.replace(/\D/g, ""))}
          />
        </label>
        {introError ? <p className="form-error">{introError}</p> : null}
        <button type="submit" className="primary">
          Continue
        </button>
      </form>
    </section>
  );
}
