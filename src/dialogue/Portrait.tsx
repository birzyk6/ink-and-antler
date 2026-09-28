import druidUrl from '../assets/druid.webp';
import { FRAMES, FRAME_H, FRAME_W } from '../npc/druidSheet';

/** Zoom into the first idle frame, centred on Ossian's face. Tune HEAD if the crop is off. */
const ZOOM = 1.5;
const HEAD = { x: 77, y: 52 };
const BOX = 96;

export function Portrait() {
  return (
    <div
      className="portrait"
      aria-hidden="true"
      style={{
        backgroundImage: `url(${druidUrl})`,
        backgroundSize: `${FRAME_W * FRAMES * ZOOM}px ${FRAME_H * ZOOM}px`,
        backgroundPosition: `${-(HEAD.x * ZOOM - BOX / 2)}px ${-(HEAD.y * ZOOM - BOX / 2)}px`,
      }}
    />
  );
}
