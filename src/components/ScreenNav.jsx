import { useEffect, useState } from "react";

export default function ScreenNav({
  show,
  items,
  activePhase,
  onNavigate,
  isItemDisabled,
  isDarkMode,
  onToggleTheme,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [activePhase]);

  if (!show) {
    return null;
  }

  return (
    <nav className="navbar" aria-label="Screen navigation">
      <div className="container">
        <div className="nav-brand">CalmUX Lab</div>

        <ul className={`nav-menu ${isMenuOpen ? "active" : ""}`}>
          {items.map((item) => (
            <li key={item.phase}>
              <button
                type="button"
                className={`nav-link ${activePhase === item.phase ? "active" : ""}`}
                onClick={() => onNavigate(item.phase)}
                disabled={isItemDisabled ? isItemDisabled(item) : false}
                aria-current={activePhase === item.phase ? "page" : undefined}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>

        <div className="nav-actions">
          <button
            id="theme-toggle"
            type="button"
            className="theme-toggle"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            onClick={onToggleTheme}
          >
            {isDarkMode ? "Light" : "Dark"}
          </button>
          <button
            type="button"
            className={`menu-toggle ${isMenuOpen ? "active" : ""}`}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </nav>
  );
}
