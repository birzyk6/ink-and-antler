import type { ReactNode } from 'react';
import { copy } from '../content/copy';
import { remainingItems, useGame } from '../game/store';
import { Hint } from '../ui/Hint';
import { Nameplate } from '../ui/Nameplate';
import { QuestMarker } from '../ui/QuestMarker';
import { Bark, Greeting, WaitingCue } from './speech';
import './npc.css';

/** Lives inside the druid's DOM anchor: click target, overhead cues and side hint. */
export function DruidOverlay() {
  const g = useGame();
  const itemsLeft = remainingItems(g.inventory).length > 0;

  let overhead: ReactNode = null;
  if (g.druid === 'greeting') overhead = <Greeting onDone={g.greetingDone} />;
  else if (g.bark) overhead = <Bark key={g.barkIndex} text={g.bark} onDone={g.clearBark} />;
  else if (!g.node && itemsLeft) overhead = g.druid === 'waiting' ? <WaitingCue /> : <QuestMarker />;

  return (
    <>
      <button type="button" className="druid-hit" aria-label={copy.druidLabel} onClick={g.talk} />
      <Nameplate {...copy.nameplates.druid} />
      <div className="druid-overhead">{overhead}</div>
      {g.druid === 'waiting' && !g.node && (
        <div className="druid-side">
          <Hint text={copy.hint} />
        </div>
      )}
    </>
  );
}
