import { useEffect } from 'react';
import { useGame } from '../game/store';

export function useGlobalKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useGame.getState();
      if (e.key === 'i' || e.key === 'I') {
        if (!s.node && !s.viewing) s.setSatchelOpen(!s.satchelOpen);
      } else if (e.key === 'Escape') {
        if (s.viewing) s.viewItem(null);
        else if (s.contactOpen) s.setContactOpen(false);
        else if (s.satchelOpen) s.setSatchelOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
