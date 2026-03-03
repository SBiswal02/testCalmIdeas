export default function CountdownScreen({ countdownValue }) {
  return (
    <section className="screen-pane screen countdown-screen">
      <h2>Session starting in</h2>
      <div className="countdown-value">{countdownValue}</div>
    </section>
  );
}
