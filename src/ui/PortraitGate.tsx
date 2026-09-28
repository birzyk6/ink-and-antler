import { copy } from '../content/copy';
import { useGame } from '../game/store';
import './chrome.css';

/** Shown only on narrow portrait screens (see chrome.css). */
export function PortraitGate() {
  const skip = useGame((s) => s.skipTale);
  return (
    <div className="portrait-gate">
      <div className="px-parchment portrait-gate-card">
        <p>{copy.portraitGate.text}</p>
        <button type="button" className="px-btn" onClick={skip}>
          {copy.portraitGate.anyway}
        </button>
      </div>
    </div>
  );
}
