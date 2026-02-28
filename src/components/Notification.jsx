/**
 * Small status notification banner for inline success/error/info messages.
 */
export default function Notification({ type = "info", title, message }) {
  if (!message) {
    return null;
  }

  const safeType = ["info", "success", "error"].includes(type) ? type : "info";

  return (
    <div className={`notification ${safeType}`} role="status" aria-live="polite">
      {title ? <strong>{title}</strong> : null}
      <span>{message}</span>
    </div>
  );
}
