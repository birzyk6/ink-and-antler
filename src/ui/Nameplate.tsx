import './cues.css';

/**
 * BG3-style name tooltip. Place it right after the character's hit button: CSS shows it while
 * that button is hovered or keyboard-focused. The button's aria-label already names the character.
 */
export function Nameplate({ name, sub }: { name: string; sub: string }) {
  return (
    <div className="nameplate" aria-hidden="true">
      <span className="nameplate-name">{name}</span>
      <span className="nameplate-sub">{sub}</span>
    </div>
  );
}
