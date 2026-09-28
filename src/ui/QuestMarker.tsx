import { PixelArt } from '../pixel/PixelArt';
import { GOLD, MARKER } from '../pixel/sprites';
import './cues.css';

export function QuestMarker() {
  return <PixelArt rows={MARKER} palette={GOLD} scale={5} className="marker" />;
}
