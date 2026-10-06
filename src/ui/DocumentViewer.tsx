import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Fragment, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { PDF, copy, items } from '../content/copy';
import { CV, MOTIVATION_LETTER, type DocSection } from '../content/documents';
import { prefersReducedMotion } from '../engine/motion';
import type { ItemId } from '../game/items';
import { useGame } from '../game/store';
import { WaxSeal } from './WaxSeal';
import './ui.css';

const FONT_MAX = 20;
const FONT_MIN = 13;

/** Shrinks the scroll's type until the whole text fits on screen, so it never needs scrolling. */
function useFitToScreen(ref: React.RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let size = FONT_MAX;
      el.style.fontSize = `${size}px`;
      while (el.scrollHeight > el.clientHeight + 1 && size > FONT_MIN) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };
    fit();
    document.fonts?.ready.then(fit);
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [ref]);
}

/** Parchment showing between the rods while the scroll is still rolled up. */
const CLOSED_PX = 26;

export function DocumentViewer() {
  const viewing = useGame((s) => s.viewing);
  const firstTime = useGame((s) => s.viewingFirstTime);
  const viewItem = useGame((s) => s.viewItem);
  if (!viewing) return null;
  const close = () => viewItem(null);
  return (
    <div className="modal-backdrop" onClick={close}>
      <div role="dialog" aria-modal="true" aria-label={items[viewing].name} onClick={(e) => e.stopPropagation()}>
        <ScrollDoc key={viewing} id={viewing} sealed={firstTime} onClose={close}>
          {viewing === 'cv' ? <CvBody /> : <LetterBody />}
        </ScrollDoc>
      </div>
    </div>
  );
}

/**
 * Both scrolls open the same way: the first time, the wax seal cracks and falls away with its
 * ribbon; every time, the bottom rod rolls down and unfurls the parchment.
 */
function ScrollDoc({ id, sealed, onClose, children }: { id: ItemId; sealed: boolean; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLElement>(null);
  const [showSeal] = useState(() => sealed && !prefersReducedMotion());
  // Before useGSAP, so the unroll measures the fitted height.
  useFitToScreen(bodyRef);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // Closed, the rods sit together around a sliver of parchment, centred where the open scroll will be.
      const open = ref.current!.querySelector<HTMLElement>('.scroll-sheet')!.offsetHeight - CLOSED_PX;
      const tl = gsap.timeline();
      tl.set('.scroll-sheet', { clipPath: `inset(0 0 ${open}px 0)` })
        .set('.scroll-rod--bottom', { y: -open })
        .fromTo(ref.current, { y: open / 2, scale: 0.85, opacity: 0 }, { y: open / 2, scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(2)' });
      if (showSeal) {
        tl.to('.wax-seal', { rotation: 7, duration: 0.07, ease: 'none', yoyo: true, repeat: 5 }, '+=0.15')
          .to('.wax-seal', { rotation: 0, duration: 0.05 })
          .fromTo('.wax-crack', { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.18, ease: 'power1.in' })
          .addLabel('break', '+=0.12')
          .set('.wax-crack', { opacity: 0 }, 'break')
          .to('.wax-half--left', { x: -46, y: 90, rotation: -55, svgOrigin: '42 42', duration: 0.55, ease: 'power2.in' }, 'break')
          .to('.wax-half--right', { x: 50, y: 105, rotation: 48, svgOrigin: '42 42', duration: 0.6, ease: 'power2.in' }, 'break')
          .to('.wax-seal', { opacity: 0, duration: 0.2 }, 'break+=0.4')
          .to('.scroll-ribbon', { y: 60, rotation: 8, opacity: 0, duration: 0.45, ease: 'power2.in' }, 'break+=0.05')
          .fromTo(
            '.wax-shard',
            { x: 0, y: 0, opacity: 1, scale: 1 },
            {
              x: () => gsap.utils.random(-70, 70),
              y: () => gsap.utils.random(-50, 40),
              rotation: () => gsap.utils.random(-180, 180),
              opacity: 0,
              scale: 0.4,
              duration: 0.55,
              ease: 'power2.out',
            },
            'break',
          )
          .set('.scroll-tie', { display: 'none' });
      }
      tl.addLabel('unroll')
        .to('.scroll-sheet', { clipPath: 'inset(0 0 0px 0)', duration: 0.9, ease: 'power2.inOut' }, 'unroll')
        .to(ref.current, { y: 0, duration: 0.9, ease: 'power2.inOut' }, 'unroll')
        .to('.scroll-rod--bottom', { y: 0, duration: 0.9, ease: 'power2.inOut' }, 'unroll')
        // Grain sliding down the rod reads as the rod turning while it unrolls.
        .fromTo('.scroll-rod--bottom', { backgroundPositionY: '0px' }, { backgroundPositionY: '72px', duration: 0.9, ease: 'power2.inOut' }, 'unroll')
        .from('.scroll-body > *', { opacity: 0, y: 6, stagger: 0.04, duration: 0.25 }, 'unroll+=0.5');
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className="scroll-doc">
      <div className="scroll-rod" />
      <div className="scroll-sheet">
        <article ref={bodyRef} className="scroll-body parchment parchment-hand">
          {children}
          <div className="doc-actions">
            <button type="button" className="px-btn" onClick={onClose}>
              {copy.viewer.close}
            </button>
            <a className="px-btn" href={PDF[id]} download>
              {copy.viewer.pdf}
            </a>
          </div>
        </article>
      </div>
      <div className="scroll-rod scroll-rod--bottom" />
      {showSeal && (
        <div className={`scroll-tie scroll-tie--${id}`} aria-hidden="true">
          <div className="scroll-ribbon" />
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i} className="wax-shard" />
          ))}
          <WaxSeal id={id} />
        </div>
      )}
    </div>
  );
}

function CvBody() {
  return (
    <>
      <h2>{CV.title}</h2>
      <p className="doc-sub">{CV.subtitle.join(' · ')}</p>
      {CV.sections.map((s) => (
        <CvSection key={s.heading} section={s} />
      ))}
      <p className="doc-closing">{CV.closing}</p>
    </>
  );
}

function CvSection({ section }: { section: DocSection }) {
  return (
    <section>
      <h3>{section.heading}</h3>
      {/* Lists of one-liners (skills, interests) wrap into two columns to save height. */}
      <ul className={section.entries.every((e) => !e.lines) ? 'doc-list--short' : undefined}>
        {section.entries.map((e) => (
          <li key={e.title}>
            {e.title}
            {e.lines && (
              <ul className="doc-sublist">
                {e.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function LetterBody() {
  return (
    <>
      {MOTIVATION_LETTER.opening.map((p) => (
        <p key={p} className="letter-opening">
          {p}
        </p>
      ))}
      <blockquote className="poem">
        {MOTIVATION_LETTER.poem.map((stanza, i) => (
          <p key={i}>
            {stanza.map((line, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
        ))}
      </blockquote>
      {MOTIVATION_LETTER.closing.map((p) => (
        <p key={p}>{p}</p>
      ))}
      <p>
        {MOTIVATION_LETTER.signoff}
        <br />
        {MOTIVATION_LETTER.signature}
      </p>
    </>
  );
}
