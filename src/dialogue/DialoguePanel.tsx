import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useEffect, useRef, useState } from 'react';
import { copy, items } from '../content/copy';
import { prefersReducedMotion } from '../engine/motion';
import { ABILITIES, CHECKS, CHECK_ORDER, ORIGIN_BONUS, modifierFor } from '../game/checks';
import type { RoundResult } from '../game/round';
import { remainingItems, useGame, type DialogueNode, type GameState } from '../game/store';
import { ScrollIcon } from '../ui/ScrollIcon';
import { useTypewriter } from '../ui/useTypewriter';
import { D20 } from './D20';
import { DiceTray, RoundSummary } from './DiceTray';
import { Portrait } from './Portrait';
import './dialogue.css';

interface Choice {
  label: string;
  tag?: string;
  onSelect: () => void;
}

interface View {
  lines: string[];
  choices: Choice[];
  d20?: { roll: number; modifier: number; dc: number; success: boolean };
  dice?: boolean;
  result?: RoundResult;
}

const CLOSABLE = new Set<DialogueNode['id']>(['origin', 'wager', 'check', 'epilogue']);

export function DialoguePanel() {
  const node = useGame((s) => s.node);
  if (!node) return null;
  // Remount per node so the typewriter and d20 restart.
  return <DialogueView key={JSON.stringify(node)} node={node} />;
}

function buildView(node: DialogueNode, g: GameState): View {
  switch (node.id) {
    case 'origin':
      return {
        lines: [copy.originPrompt],
        choices: ABILITIES.map((a) => ({ label: copy.origins[a].label, tag: `${a} +${ORIGIN_BONUS}`, onSelect: () => g.chooseOrigin(a) })),
      };
    case 'wager':
      return {
        lines: [...(node.afterOrigin ? [copy.origins[node.afterOrigin].reply] : []), copy.wagerPrompt],
        choices: remainingItems(g.inventory).map((i) => ({ label: copy.wagerChoice[i], onSelect: () => g.chooseWager(i) })),
      };
    case 'check':
      return {
        lines: [node.oneLeft ? copy.oneLeft : copy.checkPrompt],
        choices: [
          ...CHECK_ORDER.map((c) => {
            const def = CHECKS[c];
            const mod = modifierFor(g.origin, def.ability);
            return {
              label: copy.checks[c].label,
              tag: `${def.ability} · ${def.skill} · DC ${def.dc}${mod ? ` · +${mod}` : ''}`,
              onSelect: () => g.chooseCheck(c),
            };
          }),
          { label: copy.justRoll, onSelect: g.justRoll },
        ],
      };
    case 'rolling':
      return {
        lines: [
          ...(node.roll === 1 ? [copy.nat1] : []),
          node.success ? copy.checks[node.check].success : copy.checks[node.check].fail,
          ...(node.success ? [`(${copy.effects[node.check]})`] : []),
        ],
        d20: { roll: node.roll, modifier: node.modifier, dc: node.dc, success: node.success },
        choices: [{ label: copy.rollContinue, onSelect: g.continueAfterRoll }],
      };
    case 'dice':
      return { lines: [copy.dice.holdHint], choices: [], dice: true };
    case 'roundWon':
      return {
        lines: [node.result.erl ? copy.tieErl : copy.win, copy.prize[node.wager]],
        result: node.result,
        choices: [{ label: copy.takeIt, onSelect: g.continueDialogue }],
      };
    case 'roundTied':
      return { lines: [copy.tie], result: node.result, choices: [{ label: copy.again, onSelect: g.continueDialogue }] };
    case 'roundLost':
      return { lines: [copy.lose, copy.rematch], result: node.result, choices: [{ label: copy.again, onSelect: g.continueDialogue }] };
    case 'double':
      return { lines: [copy.doubleOrNothing], choices: [{ label: copy.again, onSelect: g.acceptDouble }] };
    case 'epilogue':
      return { lines: copy.epilogue, choices: [{ label: copy.farewell, onSelect: g.continueDialogue }] };
  }
}

function TypedLines({ text }: { text: string }) {
  const { shown, done, finish } = useTypewriter(text);
  return (
    <p className="dialogue-text" onClick={finish}>
      {done ? text : (
        <>
          <span aria-hidden="true">{shown}</span>
          <span className="sr-only">{text}</span>
        </>
      )}
    </p>
  );
}

function DialogueView({ node }: { node: DialogueNode }) {
  const g = useGame();
  const view = buildView(node, g);
  const [settled, setSettled] = useState(!view.d20);
  const panelRef = useRef<HTMLElement>(null);
  const text = view.lines.join('\n\n');

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('.choice', { x: -12, opacity: 0, duration: 0.25, stagger: 0.05, ease: 'steps(3)' });
    },
    { dependencies: [settled], scope: panelRef },
  );

  // Rebind each render so the handler always sees the current choices.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useGame.getState();
      if (s.viewing || s.contactOpen || s.satchelOpen) return;
      const n = Number(e.key);
      if (settled && Number.isInteger(n) && n >= 1 && n <= view.choices.length) {
        e.preventDefault();
        view.choices[n - 1].onSelect();
      } else if (e.key === 'Escape' && CLOSABLE.has(node.id)) {
        g.closeDialogue();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const rewind = g.history.length > 0 && (
    <button type="button" className="px-btn px-btn--small" onClick={g.rewind}>
      <span aria-hidden="true">⟲ </span>
      {copy.rewind}
    </button>
  );
  const choices = settled && view.choices.length > 0 && (
    <ol className="choices">
      {view.choices.map((c, i) => (
        <li key={i}>
          <button type="button" className="choice" onClick={c.onSelect}>
            <span className="choice-num">{i + 1}</span>
            {c.tag && (
              <span className="choice-tag" data-ability={c.tag.slice(0, 3)}>
                [{c.tag}]
              </span>
            )}{' '}
            {c.label}
          </button>
        </li>
      ))}
    </ol>
  );

  // The dice game gets its own table instead of the dialogue box.
  if (view.dice || view.result) {
    const wager = 'wager' in node ? node.wager : null;
    return (
      <div className="table-backdrop">
        <section ref={panelRef} className="dice-table" aria-label={`Dialogue with ${copy.speaker}`}>
          <header className="table-head">
            <Portrait size={76} />
            <div className="table-speech">
              <div className="dialogue-head">
                <h2 className="dialogue-speaker">{copy.speaker}</h2>
                {rewind}
              </div>
              {settled && text && <TypedLines text={text} />}
            </div>
            {wager && (
              <div className="table-stake">
                <ScrollIcon id={wager} size={48} />
                <span className="table-stake-label">{copy.dice.stake}</span>
                <span className="table-stake-name">{items[wager].name}</span>
              </div>
            )}
          </header>
          <div className="table-felt">{view.result ? <RoundSummary result={view.result} /> : <DiceTray />}</div>
          {choices}
        </section>
      </div>
    );
  }

  return (
    <section ref={panelRef} className="dialogue" aria-label={`Dialogue with ${copy.speaker}`}>
      <Portrait />
      <div className="dialogue-main">
        <div className="dialogue-head">
          <h2 className="dialogue-speaker">{copy.speaker}</h2>
          {rewind}
        </div>
        {view.d20 && <D20 {...view.d20} onSettled={() => setSettled(true)} />}
        {settled && text && <TypedLines text={text} />}
        {choices}
      </div>
    </section>
  );
}
