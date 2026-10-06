import { copy } from '../content/copy';
import { evaluateHand } from '../game/dice';
import type { RoundResult } from '../game/round';
import { useGame } from '../game/store';
import { Die } from './Die';

export function DiceTray() {
  const round = useGame((s) => s.round);
  const toggleHold = useGame((s) => s.toggleHold);
  const reroll = useGame((s) => s.reroll);
  const reveal = useGame((s) => s.revealRound);
  if (!round) return null;

  return (
    <div className="tray">
      <div className="tray-row">
        <span className="tray-who">{copy.dice.haslin}</span>
        {round.haslin.map((d, i) => (
          <Die key={i} value={d} hidden label={copy.dice.hiddenDie} />
        ))}
      </div>
      <div className="tray-row">
        <span className="tray-who">{copy.dice.you}</span>
        {round.player.map((d, i) => (
          // The key changes on reroll, so the die remounts and replays its tumble.
          <Die
            key={`${i}-${d}-${round.rerollsLeft}`}
            value={d}
            held={round.held[i]}
            label={`Your die: ${d}${round.held[i] ? ', held' : ''}`}
            onClick={() => toggleHold(i)}
          />
        ))}
        <span className="tray-hand">{copy.hands[evaluateHand(round.player).rank]}</span>
      </div>
      <div className="tray-actions">
        <button type="button" className="px-btn" disabled={round.rerollsLeft === 0} onClick={reroll}>
          {copy.dice.reroll}
        </button>
        <span className="tray-rerolls">{copy.dice.rerollsLeft(round.rerollsLeft)}</span>
        <button type="button" className="px-btn px-btn--gold" onClick={reveal}>
          {copy.dice.reveal}
        </button>
      </div>
    </div>
  );
}

export function RoundSummary({ result }: { result: RoundResult }) {
  return (
    <div className="tray">
      <div className="tray-row">
        <span className="tray-who">{copy.dice.haslin}</span>
        {result.haslin.map((d, i) => <Die key={i} value={d} label={`${copy.dice.haslin}’s die: ${d}`} />)}
        <span className="tray-hand">{copy.hands[result.haslinHand.rank]}</span>
      </div>
      <div className="tray-row">
        <span className="tray-who">{copy.dice.you}</span>
        {result.player.map((d, i) => <Die key={i} value={d} label={`Your die: ${d}`} />)}
        <span className="tray-hand">{copy.hands[result.playerHand.rank]}</span>
      </div>
    </div>
  );
}
