import { useEffect, useRef } from 'react';
import { useTypewriter } from './useTypewriter';
import './cues.css';

/** Give each new line a new `key` so the typewriter restarts. */
export function SpeechBubble({ text, onTyped }: { text: string; onTyped?: () => void }) {
  const { shown, done, finish } = useTypewriter(text);
  const fired = useRef(false);

  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      onTyped?.();
    }
  }, [done, onTyped]);

  return (
    <div className="bubble" role="status" onClick={finish}>
      {done ? text : (
        <>
          <span aria-hidden="true">{shown}</span>
          <span className="sr-only">{text}</span>
        </>
      )}
    </div>
  );
}
