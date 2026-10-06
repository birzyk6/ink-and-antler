import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import type { SceneHandle } from './createScene';
import { playIntro } from './intro';

const SPLASH_MIN_MS = 700;

/** Plays the intro, then brings the druid on stage. */
export function useSceneIntro(scene: SceneHandle | null, skip: boolean) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!scene) return;
    let cancelled = false;
    let kill = () => {};

    (async () => {
      await new Promise((r) => setTimeout(r, SPLASH_MIN_MS));
      if (cancelled) return;
      setReady(true);
      const intro = playIntro(scene, { skip });
      kill = intro.kill;
      await intro.done;
      if (cancelled) return;
      const s = useGame.getState();
      if (s.druid !== 'offstage') return;
      if (skip || s.introSeen) s.setDruid('patrolling');
      else s.startDruidEntrance();
    })();

    return () => {
      cancelled = true;
      kill();
    };
  }, [scene, skip]);

  return { ready };
}
