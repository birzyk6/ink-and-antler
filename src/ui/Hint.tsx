import { PixelArt } from '../pixel/PixelArt';
import { CURSOR, CURSOR_PALETTE } from '../pixel/sprites';
import './cues.css';

export function Hint({ text }: { text: string }) {
  return (
    <div className="hint px-parchment" role="note">
      <PixelArt rows={CURSOR} palette={CURSOR_PALETTE} scale={3} />
      {text}
    </div>
  );
}
