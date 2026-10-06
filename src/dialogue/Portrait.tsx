import druidUrl from '../assets/druid.webp';
import { FRAMES, FRAME_H, FRAME_W } from '../npc/druidSheet';

/** Zoom into the first idle frame, centred on Haslin's face. Tune HEAD if the crop is off. */
const HEAD = { x: 77, y: 52 };
/** Sheet pixels shown across the box; the zoom follows from the box size. */
const VIEW = 64;

export function Portrait({ size = 128 }: { size?: number }) {
  const zoom = size / VIEW;
  return (
    <div
      className="portrait"
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${druidUrl})`,
        backgroundSize: `${FRAME_W * FRAMES * zoom}px ${FRAME_H * zoom}px`,
        backgroundPosition: `${-(HEAD.x * zoom - size / 2)}px ${-(HEAD.y * zoom - size / 2)}px`,
      }}
    />
  );
}
