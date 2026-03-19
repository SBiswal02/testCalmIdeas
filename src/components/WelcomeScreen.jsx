export default function WelcomeScreen({ participantName, onBack, onContinue }) {
  return (
    <section className="screen-pane screen welcome-screen">
      <div className="welcome-hero">
        <div className="welcome-orbit" aria-hidden="true">
          <span className="welcome-orbit-dot" />
          <span className="welcome-orbit-dot" />
          <span className="welcome-orbit-dot" />
        </div>
        <div>
          <p className="welcome-kicker">CalmUX Lab</p>
          <h1>
            Welcome{participantName ? `, ${participantName}` : ""}.
          </h1>
          <p className="subtitle">
            Before we dive into the rules, take a breath. This session is designed to keep your focus
            steady while the interface stays soft and peripheral.
          </p>
        </div>
      </div>

      <div className="welcome-grid">
        <article className="welcome-pill">
          <h3>Gentle tempo</h3>
          <p>Each trial has a smooth progress wave so you never feel rushed, only guided.</p>
        </article>
        <article className="welcome-pill">
          <h3>Peripheral cues</h3>
          <p>Visual and audio hints stay at the edges of your attention rather than grabbing it.</p>
        </article>
        <article className="welcome-pill">
          <h3>Warm-up first</h3>
          <p>You will start with a short practice round to get comfortable before the main run.</p>
        </article>
      </div>

      <div className="actions between">
        <button type="button" onClick={onBack}>
          Back to Intro
        </button>
        <button type="button" className="primary" onClick={onContinue}>
          Continue to rules
        </button>
      </div>
    </section>
  );
}
