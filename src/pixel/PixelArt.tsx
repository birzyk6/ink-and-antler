import { useMemo, type CSSProperties } from 'react';
import { mapSize, mapToRuns, type Palette } from './pixelMap';

interface Props {
  rows: readonly string[];
  palette: Palette;
  scale?: number;
  className?: string;
  style?: CSSProperties;
  /** Accessible name; omit for decorative art. */
  title?: string;
}

export function PixelArt({ rows, palette, scale = 4, className, style, title }: Props) {
  const runs = useMemo(() => mapToRuns(rows, palette), [rows, palette]);
  const { w, h } = mapSize(rows);
  return (
    <svg
      className={className}
      style={style}
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {runs.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.color} />
      ))}
    </svg>
  );
}
