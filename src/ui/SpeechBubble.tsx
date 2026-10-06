import { useEffect, useRef } from 'react';
import { useTypewriter } from './useTypewriter';
import './cues.css';

/**
 * Give each new line a new `key` so the typewriter restarts. A click finishes the typing;
 * once typed, a click calls `onSkip` (when given) to move on early.
 */
export function SpeechBubble({ text, onTyped, onSkip }: { text: string; onTyped?: () => void; onSkip?: () => void }) {
  const { shown, done, finish } = useTypewriter(text);
  const fired = useRef(false);

  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      onTyped?.();
    }
  }, [done, onTyped]);

  return (
    <div className={`bubble${done && onSkip ? ' bubble--skippable' : ''}`} role="status" onClick={done ? onSkip : finish}>
      {done ? text : (
        <>
          <span aria-hidden="true">{shown}</span>
          <span className="sr-only">{text}</span>
        </>
      )}
    </div>
  );
}
