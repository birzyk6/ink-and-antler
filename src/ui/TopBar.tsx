import { copy } from '../content/copy';
import { useGame } from '../game/store';
import './chrome.css';

export function TopBar() {
  const skip = useGame((s) => s.skipTale);
  const reset = useGame((s) => s.resetTale);
  return (
    <nav className="topbar" aria-label="Shortcuts">
      <button
        type="button"
        className="px-btn px-btn--small"
        onClick={() => {
          reset();
          window.location.reload();
        }}
      >
        {copy.reset}
      </button>
      <button type="button" className="px-btn px-btn--gold" onClick={skip}>
        {copy.skip}
      </button>
    </nav>
  );
}
