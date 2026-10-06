import { useState } from 'react';
import { copy } from '../content/copy';
import { evaluateHand } from '../game/dice';
import type { RoundResult, RoundState } from '../game/round';
import { useGame } from '../game/store';
import { prefersReducedMotion } from '../engine/motion';
import { Die, FLIP_S } from './Die';
import { scoringDice } from './scoringDice';

/** Seconds between neighbouring dice in a staggered row. */
const STAGGER = 0.07;

/**
 * One id per die that bumps whenever a reroll throws that die. Used in the key so a thrown die
 * remounts and tumbles again, while a held die keeps its key and stays where it is.
 */
function useThrowIds(round: RoundState | null): number[] {
  const [seen, setSeen] = useState(round?.rerollsLeft);
  const [ids, setIds] = useState<number[]>([]);
  if (round && round.rerollsLeft !== seen) {
    setSeen(round.rerollsLeft);
    setIds(round.player.map((_, i) => (round.held[i] ? (ids[i] ?? 0) : (ids[i] ?? 0) + 1)));
  }
  return ids;
}

export function DiceTray() {
  const round = useGame((s) => s.round);
  const toggleHold = useGame((s) => s.toggleHold);
  const reroll = useGame((s) => s.reroll);
  const reveal = useGame((s) => s.revealRound);
  const throwIds = useThrowIds(round);
  if (!round) return null;

  // Thrown dice (all on the first deal, the unheld ones on a reroll) stagger in order.
  let thrown = 0;
  const firstDeal = throwIds.length === 0;
  const hand = evaluateHand(round.player).rank;

  return (
    <div className="tray">
      <div className="tray-row">
        <span className="tray-who">{copy.dice.haslin}</span>
        {round.haslin.map((d, i) => (
          <Die key={i} value={d} hidden label={copy.dice.hiddenDie} entrance="tumble" delay={i * STAGGER} />
        ))}
      </div>
      <div className="tray-row">
        <span className="tray-who">{copy.dice.you}</span>
        {round.player.map((d, i) => {
          const id = throwIds[i] ?? 0;
          const delay = firstDeal || !round.held[i] ? 0.04 + thrown++ * STAGGER : 0;
          return (
            <Die
              key={`${i}-${id}`}
              value={d}
              held={round.held[i]}
              label={`Your die: ${d}${round.held[i] ? ', held' : ''}`}
              onClick={() => toggleHold(i)}
              entrance="tumble"
              delay={delay}
            />
          );
        })}
        <span key={hand} className="tray-hand tray-hand--new">
          {copy.hands[hand]}
        </span>
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
  const [instant] = useState(prefersReducedMotion);
  // Haslin's dice turn over one by one, then both hands' scoring dice pulse together.
  const flipped = (result.haslin.length - 1) * STAGGER + FLIP_S;
  const scoreAt = (scoring: boolean[], i: number) => (scoring[i] ? flipped + 0.05 + i * 0.04 : undefined);
  const haslinScoring = scoringDice(result.haslin, result.haslinHand.rank);
  const playerScoring = scoringDice(result.player, result.playerHand.rank);
  const handStyle = instant ? undefined : { animationDelay: `${flipped}s` };

  return (
    <div className="tray">
      <div className="tray-row">
        <span className="tray-who">{copy.dice.haslin}</span>
        {result.haslin.map((d, i) => (
          <Die
            key={i}
            value={d}
            label={`${copy.dice.haslin}’s die: ${d}`}
            entrance="flip"
            delay={i * STAGGER}
            scoreAt={scoreAt(haslinScoring, i)}
          />
        ))}
        <span className="tray-hand tray-hand--new" style={handStyle}>
          {copy.hands[result.haslinHand.rank]}
        </span>
      </div>
      <div className="tray-row">
        <span className="tray-who">{copy.dice.you}</span>
        {result.player.map((d, i) => (
          <Die key={i} value={d} label={`Your die: ${d}`} scoreAt={scoreAt(playerScoring, i)} />
        ))}
        <span className="tray-hand">{copy.hands[result.playerHand.rank]}</span>
      </div>
    </div>
  );
}
