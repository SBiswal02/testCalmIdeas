export default function SettingsScreen({ settings, onSettingsChange, onBack, onStart }) {
  const distractionProbability = Number(settings.distractionProbability ?? 30);

  return (
    <section className="screen-pane screen settings-screen">
      <h2>Session Settings</h2>
      <p className="subtitle">Task timing and scoring remain unchanged. Calm features stay enabled.</p>

      <form
        className="form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          onStart();
        }}
      >
        <label>
          N-Back Level
          <select
            value={settings.nValue}
            onChange={(event) => onSettingsChange("nValue", Number(event.target.value))}
          >
            <option value={1}>1-Back</option>
            <option value={2}>2-Back</option>
            <option value={3}>3-Back</option>
            <option value={4}>4-Back</option>
          </select>
        </label>

        <label>
          Number of Trials
          <select
            value={settings.numTrials}
            onChange={(event) => onSettingsChange("numTrials", Number(event.target.value))}
          >
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={40}>40</option>
            <option value={50}>50</option>
          </select>
        </label>

        <label>
          Stimulus Type
          <select
            value={settings.stimulusType}
            onChange={(event) => onSettingsChange("stimulusType", event.target.value)}
          >
            <option value="letters">Letters</option>
            <option value="numbers">Numbers</option>
            <option value="positions">Positions</option>
          </select>
        </label>

        <label>
          Stimulus Duration (ms)
          <select
            value={settings.stimulusDuration}
            onChange={(event) => onSettingsChange("stimulusDuration", Number(event.target.value))}
          >
            <option value={1000}>1000 ms</option>
            <option value={1500}>1500 ms</option>
            <option value={2000}>2000 ms</option>
            <option value={2500}>2500 ms</option>
            <option value={3000}>3000 ms</option>
            <option value={3500}>3500 ms</option>
            <option value={4000}>4000 ms</option>
          </select>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={Boolean(settings.enableDistractions)}
            onChange={(event) => onSettingsChange("enableDistractions", event.target.checked)}
          />
          <span>Enable Calm Notifications</span>
        </label>

        {settings.enableDistractions && (
          <label>
            Notification Probability
            <select
              value={distractionProbability}
              onChange={(event) => onSettingsChange("distractionProbability", Number(event.target.value))}
            >
              <option value={10}>10%</option>
              <option value={20}>20%</option>
              <option value={30}>30%</option>
              <option value={40}>40%</option>
              <option value={50}>50%</option>
              <option value={60}>60%</option>
              <option value={70}>70%</option>
              <option value={80}>80%</option>
              <option value={90}>90%</option>
              <option value={100}>100%</option>
            </select>
          </label>
        )}

        <div className="actions between">
          <button type="button" onClick={onBack}>
            Back
          </button>
          <button type="submit" className="primary">
            Start Session
          </button>
        </div>
      </form>
    </section>
  );
}
