import { useCallback, useEffect, useRef, useState } from 'react';
import { copy } from '../content/copy';
import { QuestMarker } from '../ui/QuestMarker';
import { SpeechBubble } from '../ui/SpeechBubble';

export const LINE_PAUSE_MS = 1400;
export const NUDGE_MS = 6000;
export const BARK_MS = 4000;

export function Greeting({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const lines = copy.greeting;
  const handleTyped = useCallback(() => {
    timer.current = window.setTimeout(() => (i + 1 < lines.length ? setI(i + 1) : onDone()), LINE_PAUSE_MS);
  }, [i, lines.length, onDone]);
  return <SpeechBubble key={i} text={lines[i]} onTyped={handleTyped} />;
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
  useEffect(() => {
    const t = window.setTimeout(onDone, BARK_MS);
    return () => window.clearTimeout(t);
  }, [onDone]);
  return <SpeechBubble text={text} />;
}
