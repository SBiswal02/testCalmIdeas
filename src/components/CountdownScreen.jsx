/**
 * Countdown screen shown before the test begins.
 */
export default function CountdownScreen({ countdownValue }) {
  return (
    <section className="card countdown-card screen countdown-screen">
      <h2>Test starting in</h2>
      <div className="countdown-value">{countdownValue}</div>
    </section>
  );
}



