import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useEffect, useRef, useState } from 'react';
import { copy, items } from '../content/copy';
import { prefersReducedMotion } from '../engine/motion';
import { ABILITIES, CHECKS, CHECK_ORDER, modifierFor } from '../game/checks';
import type { RoundResult } from '../game/round';
import { remainingItems, useGame, type DialogueNode, type GameState } from '../game/store';
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

const CLOSABLE = new Set<DialogueNode['id']>(['origin', 'wager', 'about', 'check', 'epilogue']);

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
        choices: ABILITIES.map((a) => ({ label: copy.origins[a].label, tag: `${a} +3`, onSelect: () => g.chooseOrigin(a) })),
      };
    case 'wager': {
      const left = remainingItems(g.inventory);
      return {
        lines: [...(node.afterOrigin ? [copy.origins[node.afterOrigin].reply] : []), ...(left.length > 1 ? copy.wagerPrompt : [copy.wagerAgain])],
        choices: [
          ...left.map((i) => ({ label: copy.wagerChoice[i], onSelect: () => g.chooseWager(i) })),
          { label: copy.about, onSelect: g.askAbout },
          { label: copy.farewell, onSelect: g.closeDialogue },
        ],
      };
    }
    case 'about':
      return { lines: copy.aboutReply, choices: [{ label: copy.back, onSelect: g.backToWager }] };
    case 'check':
      return {
        lines: [copy.checkPrompt],
        choices: [
          ...CHECK_ORDER.filter((c) => !g.usedChecks.includes(c)).map((c) => {
            const def = CHECKS[c];
            const mod = modifierFor(g.origin, def.ability);
            return {
              label: copy.checks[c].label,
              tag: `${def.ability} · ${def.skill} · DC ${def.dc}${mod ? ` · +${mod}` : ''}`,
              onSelect: () => g.chooseCheck(c),
            };
          }),
          { label: copy.justRoll, onSelect: g.justRoll },
          { label: copy.farewell, onSelect: g.closeDialogue },
        ],
      };
    case 'rolling': {
      const lines =
        node.roll === 20
          ? []
          : [
              ...(node.roll === 1 ? [copy.nat1] : []),
              node.success ? copy.checks[node.check].success : copy.checks[node.check].fail,
              ...(node.success ? [`(${copy.effects[node.check]})`] : []),
            ];
      return {
        lines,
        d20: { roll: node.roll, modifier: node.modifier, dc: node.dc, success: node.success },
        choices: [{ label: copy.rollContinue, onSelect: g.continueAfterRoll }],
      };
    }
    case 'nat20':
      return {
        lines: [...(node.items.length > 1 ? copy.nat20.both : copy.nat20.last), copy.afterReceive],
        choices: [{ label: copy.nat20.take, onSelect: g.continueDialogue }],
      };
    case 'dice':
      return { lines: [copy.dice.holdHint], choices: [], dice: true };
    case 'roundWon':
      return {
        lines: node.result.pim
          ? [copy.pim, copy.wonItem(items[node.wager].name), copy.afterReceive]
          : [copy.win, ...(node.result.playerHand.rank === 'triple' ? [copy.triple] : []), copy.wonItem(items[node.wager].name), copy.afterReceive],
        result: node.result,
        choices: [{ label: copy.takeIt, onSelect: g.continueDialogue }],
      };
    case 'roundLost':
      return {
        lines: [copy.lose, copy.rematch],
        result: node.result,
        choices: [
          { label: copy.again, onSelect: g.continueDialogue },
          { label: copy.farewell, onSelect: g.closeDialogue },
        ],
      };
    case 'epilogue':
      return { lines: copy.epilogue, choices: [{ label: copy.farewellFinal, onSelect: g.continueDialogue }] };
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
  const text = view.lines.join('\n');

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

  return (
    <section ref={panelRef} className="dialogue px-panel" aria-label="Dialogue with Ossian">
      <Portrait />
      <div className="dialogue-main">
        <h2 className="dialogue-speaker">Ossian</h2>
        {view.d20 && <D20 {...view.d20} onSettled={() => setSettled(true)} />}
        {settled && text && <TypedLines text={text} />}
        {view.result && <RoundSummary result={view.result} />}
        {view.dice && <DiceTray />}
        {settled && view.choices.length > 0 && (
          <ol className="choices">
            {view.choices.map((c, i) => (
              <li key={i}>
                <button type="button" className="choice" onClick={c.onSelect}>
                  <span className="choice-num">{i + 1}.</span>
                  {c.tag && <span className="choice-tag">[{c.tag}]</span>} {c.label}
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
