import { useCallback, useEffect, useRef, useState } from 'react';
import { copy } from '../content/copy';
import { QuestMarker } from '../ui/QuestMarker';
import { SpeechBubble } from '../ui/SpeechBubble';

export const NUDGE_MS = 6000;

/** How long a typed line stays up: long enough to read at a relaxed pace. Clicking skips it. */
export function readMs(text: string): number {
  return 2500 + text.length * 45;
}

/** Holds a typed line for readMs, or until skipped. */
function useLineTimer(onNext: () => void) {
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const start = useCallback(
    (text: string) => {
      timer.current = window.setTimeout(onNext, readMs(text));
    },
    [onNext],
  );
  const skip = useCallback(() => {
    window.clearTimeout(timer.current);
    onNext();
  }, [onNext]);
  return { start, skip };
}

export function Greeting({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const lines = copy.greeting;
  const next = useCallback(() => (i + 1 < lines.length ? setI(i + 1) : onDone()), [i, lines.length, onDone]);
  const { start, skip } = useLineTimer(next);
  const onTyped = useCallback(() => start(lines[i]), [start, lines, i]);
  return <SpeechBubble key={i} text={lines[i]} onTyped={onTyped} onSkip={skip} />;
}

export function WaitingCue() {
  const [nudge, setNudge] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setNudge(true), NUDGE_MS);
    return () => window.clearTimeout(t);
  }, []);
  return nudge ? <SpeechBubble text={copy.nudge} /> : <QuestMarker />;
}

export function Bark({ text, onDone }: { text: string; onDone: () => void }) {
  const { start, skip } = useLineTimer(onDone);
  const onTyped = useCallback(() => start(text), [start, text]);
  return <SpeechBubble text={text} onTyped={onTyped} onSkip={skip} />;
}
