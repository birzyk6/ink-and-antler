const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
};

interface Props {
  value: number;
  label: string;
  hidden?: boolean;
  held?: boolean;
  onClick?: () => void;
}

export function Die({ value, label, hidden, held, onClick }: Props) {
  const cls = `die${held ? ' die--held' : ''}${hidden ? ' die--hidden' : ''}`;
  const face = hidden ? '?' : Array.from({ length: 9 }, (_, i) => <span key={i} className={PIPS[value].includes(i) ? 'pip' : 'pip pip--off'} />);
  return onClick ? (
    <button type="button" className={cls} aria-pressed={held} aria-label={label} onClick={onClick}>
      {face}
    </button>
  ) : (
    <div className={cls} role="img" aria-label={label}>
      {face}
    </div>
  );
}
