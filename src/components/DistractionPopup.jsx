/**
 * Dismissible distraction popup shown during active trials.
 */
export default function DistractionPopup({ visible, text, onClose }) {
  if (!visible) {
    return null;
  }

  return (
    <div className="distraction-popup" role="dialog" aria-label="Distraction popup">
      <button type="button" className="distraction-close" onClick={onClose} aria-label="Close distraction">
        X
      </button>
      <p>{text}</p>
    </div>
  );
}
