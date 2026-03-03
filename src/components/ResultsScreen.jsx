import { useEffect, useMemo, useState } from "react";
import MetricCard from "./MetricCard";

export default function ResultsScreen({
  participantName,
  results,
  saveStatus,
  reflectionResponse,
  onReflectionChange,
  onSave,
  onNewParticipant,
  onRunAnother,
}) {
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    setShowSummary(false);
    const timerId = setTimeout(() => setShowSummary(true), 900);
    return () => clearTimeout(timerId);
  }, [results]);

  const dashboardScores = useMemo(() => {
    const hits = Number(results?.hits ?? 0);
    const misses = Number(results?.misses ?? 0);
    const falseAlarms = Number(results?.falseAlarms ?? 0);
    const correctRejections = Number(results?.correctRejections ?? 0);
    const avgReactionTime = Number(results?.avgReactionTime ?? 0);
    const total = hits + misses + falseAlarms + correctRejections;
    const errorRate = total > 0 ? (misses + falseAlarms) / total : 1;

    const visceral = Math.max(0, Math.min(100, Math.round(100 * (1 - errorRate))));
    const behavioral = Math.max(0, Math.min(100, Math.round(120 - avgReactionTime / 30)));

    const reflectionCount =
      (reflectionResponse?.focusedFeeling?.trim() ? 1 : 0) +
      (reflectionResponse?.interruptionEffect?.trim() ? 1 : 0);
    const reflective = Math.min(100, reflectionCount * 50);

    const composite = Math.round(visceral * 0.4 + behavioral * 0.35 + reflective * 0.25);
    const status = composite >= 70 ? "Calm" : composite >= 40 ? "Elevated" : "Alert";

    return { visceral, behavioral, reflective, composite, status };
  }, [reflectionResponse, results]);

  const saveLabel =
    saveStatus === "saving"
      ? "Saving results..."
      : saveStatus === "saved"
        ? "Results saved."
        : saveStatus === "error"
          ? "Save failed."
          : "";

  return (
    <section className="screen-pane screen results-screen">
      <h2>Reflective Results</h2>
      <p className="subtitle">Session summary for {participantName}.</p>
      {saveLabel ? <p className={`subtitle ${saveStatus}`}>{saveLabel}</p> : null}

      {!showSummary ? (
        <div className="results-loading" aria-live="polite">
          <span className="loading-dot" />
          <p>Building your reflective summary...</p>
        </div>
      ) : (
        <>
          <div className="results-grid">
            <MetricCard label="Accuracy" value={`${results?.accuracy ?? 0}%`} />
            <MetricCard
              label="Trials Completed"
              value={
                results?.totalTrials
                  ? `${results.completedTrials ?? 0} / ${results.totalTrials}`
                  : `${results?.completedTrials ?? 0}`
              }
            />
            <MetricCard
              label="Reaction Time"
              value={results?.avgReactionTime ? `${results.avgReactionTime} ms` : "N/A"}
            />
            <MetricCard label="Reaction Trend" value={results?.reactionTrend ?? "N/A"} />
            <MetricCard
              label="Stability Score"
              value={results?.stabilityScore != null ? `${results.stabilityScore}%` : "N/A"}
            />
            <MetricCard
              label="Distraction Resilience"
              value={
                results?.distractionResilienceScore != null ? `${results.distractionResilienceScore}%` : "N/A"
              }
            />
            <MetricCard label="Visceral Score" value={`${dashboardScores.visceral}%`} />
            <MetricCard label="Behavioral Score" value={`${dashboardScores.behavioral}%`} />
            <MetricCard label="Reflective Score" value={`${dashboardScores.reflective}%`} />
            <MetricCard label="Composite Score" value={`${dashboardScores.composite}%`} />
            <MetricCard label="System Status" value={dashboardScores.status} />
          </div>
          <div className="flow-line" aria-hidden="true">
            <span />
          </div>
        </>
      )}

      <section className="reflection-block">
        <h3>Reflection Prompt (Optional)</h3>
        <p className="subtitle">{results?.affirmation}</p>
        <label>
          How focused did you feel?
          <input
            value={reflectionResponse?.focusedFeeling ?? ""}
            onChange={(event) => onReflectionChange("focusedFeeling", event.target.value)}
            placeholder="Short reflection"
          />
        </label>
        <label>
          Did interruptions affect you?
          <input
            value={reflectionResponse?.interruptionEffect ?? ""}
            onChange={(event) => onReflectionChange("interruptionEffect", event.target.value)}
            placeholder="Optional note"
          />
        </label>
      </section>

      <div className="actions between">
        <button onClick={onNewParticipant}>New Participant</button>
        <button className="primary" onClick={onRunAnother}>
          Run Another Session
        </button>
      </div>

      <div className="actions end">
        <button className="primary" onClick={onSave} disabled={saveStatus === "saving"}>
          Save Session JSON
        </button>
      </div>
    </section>
  );
}
