/**
 * Intro screen that collects participant details.
 */
export default function IntroScreen({ participant, introError, onParticipantChange, onContinue }) {
  return (
    <section className="card screen intro-screen">
      <h1>Calm Technology N-Back Experiment</h1>

      <form className="form-grid" onSubmit={onContinue}>
        <label>
          Name
          <input
            required
            value={participant.name}
            onChange={(event) => onParticipantChange("name", event.target.value)}
          />
        </label>
        <label>
          Roll Number
          <input
            value={participant.rollNumber}
            onChange={(event) => onParticipantChange("rollNumber", event.target.value)}
          />
        </label>
        {introError ? <p className="form-error">{introError}</p> : null}
        <button type="submit" className="primary">
          Continue to Test Settings
        </button>
      </form>
    </section>
  );
}



