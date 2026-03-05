export default function IntroScreen({ participant, introError, onParticipantChange, onContinue }) {
  return (
    <section className="screen-pane screen intro-screen">
      <div class = "intro-content">
        <h1>CalmUX Lab</h1>
        <p className="subtitle" style={{ textAlign: "center" }}>
          Settle in, take a slow breath, and let each step unfold gently. This Calm Condition N-back session guides you
          with clear, embedded instructions so your attention can stay steady, light, and focused.
        </p>
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
      </div>
    </section>
  );
}
