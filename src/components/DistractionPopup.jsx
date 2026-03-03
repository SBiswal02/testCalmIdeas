export default function DistractionPopup({ visible, text, level }) {
  if (!visible) {
    return null;
  }

  return (
    <aside className={`calm-notification ${level || "minor"}`} role="status" aria-live="polite">
      <p>{text}</p>
    </aside>
  );
}
