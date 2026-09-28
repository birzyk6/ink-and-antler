import { useEffect, useRef, useState, type ReactNode } from 'react';
import { selectDruidHold, useGame } from '../game/store';
import { DRUID_H, DRUID_W } from '../npc/druidSheet';
import { createScene, type SceneHandle } from './createScene';
import './scene.css';

interface Props {
  onReady: (handle: SceneHandle) => void;
  druidOverlay: ReactNode;
  onError?: (err: unknown) => void;
}

export function SceneCanvas({ onReady, druidOverlay, onError }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const druidRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const [handle, setHandle] = useState<SceneHandle | null>(null);
  const druid = useGame((s) => s.druid);
  const hold = useGame(selectDruidHold);

  useEffect(() => {
    let cancelled = false;
    let created: SceneHandle | null = null;
    createScene(hostRef.current!, { druid: druidRef.current! }, { onDruidArrive: () => useGame.getState().druidArrived() })
      .then((h) => {
        if (cancelled) {
          h.destroy();
          return;
        }
        created = h;
        setHandle(h);
        onReadyRef.current(h);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) onErrorRef.current?.(err);
      });
    return () => {
      cancelled = true;
      created?.destroy();
    };
  }, []);

  useEffect(() => {
    handle?.setDruid(druid, hold);
  }, [handle, druid, hold]);

  return (
    <>
      <div ref={hostRef} className="scene-host" aria-hidden="true" />
      <div ref={druidRef} className="anchor" style={{ width: DRUID_W, height: DRUID_H, display: druid === 'offstage' ? 'none' : undefined }}>
        {druidOverlay}
      </div>
    </>
  );
}
