import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../engine/motion';
import { typedSlice } from './typewriter';

/** Types `text` out once per mount. Remount (change `key`) to type a new line. */
export function useTypewriter(text: string) {
  const [instant] = useState(prefersReducedMotion);
  const [elapsed, setElapsed] = useState(instant ? Infinity : 0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (instant) return;
    const start = performance.now();
    timer.current = window.setInterval(() => {
      const e = performance.now() - start;
      setElapsed(e);
      if (typedSlice(text, e).length >= text.length) window.clearInterval(timer.current);
    }, 30);
    return () => window.clearInterval(timer.current);
  }, [text, instant]);

  const shown = typedSlice(text, elapsed);
  return {
    shown,
    done: shown.length >= text.length,
    finish: () => {
      window.clearInterval(timer.current);
      setElapsed(Infinity);
    },
  };
}
