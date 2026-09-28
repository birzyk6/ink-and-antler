import { useEffect, useState } from 'react';
import { useGame } from '../game/store';
import type { SceneHandle } from './createScene';
import { playIntro } from './intro';
import { createTitleSign, type TitleSign } from './titleSign';

const SPLASH_MIN_MS = 700;

/** Builds the sign, plays the intro, then brings the druid on stage. */
export function useSceneIntro(scene: SceneHandle | null, skip: boolean, onIgnite?: (x: number, y: number) => void) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!scene) return;
    let cancelled = false;
    let sign: TitleSign | null = null;
    let kill = () => {};

    const advanceDruid = () => {
      if (cancelled) return;
      const s = useGame.getState();
      if (s.druid !== 'offstage') return;
      if (skip || s.introSeen) s.setDruid('patrolling');
      else s.startDruidEntrance();
    };

    (async () => {
      let built: TitleSign | null = null;
      try {
        [built] = await Promise.all([createTitleSign(scene), new Promise((r) => setTimeout(r, SPLASH_MIN_MS))]);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setReady(true);
          advanceDruid();
        }
        return;
      }
      if (cancelled) {
        built.destroy();
        return;
      }
      sign = built;
      setReady(true);
      const intro = playIntro(scene, built, { skip, onIgnite });
      kill = intro.kill;
      await intro.done;
      advanceDruid();
    })();

    return () => {
      cancelled = true;
      kill();
      sign?.destroy();
    };
    // onIgnite is read once when the intro starts.
  }, [scene, skip]);

  return { ready };
}
