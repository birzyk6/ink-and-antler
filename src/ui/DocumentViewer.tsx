import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { PDF, copy, items } from '../content/copy';
import { CV, MOTIVATION_LETTER } from '../content/documents';
import { prefersReducedMotion } from '../engine/motion';
import { useGame } from '../game/store';
import { PixelArt } from '../pixel/PixelArt';
import { SEAL, SEAL_PALETTE } from '../pixel/sprites';
import './ui.css';

const SEAL_MS = 900;

export function DocumentViewer() {
  const viewing = useGame((s) => s.viewing);
  const firstTime = useGame((s) => s.viewingFirstTime);
  const viewItem = useGame((s) => s.viewItem);
  if (!viewing) return null;
  const close = () => viewItem(null);
  return (
    <div className="modal-backdrop" onClick={close}>
      <div role="dialog" aria-modal="true" aria-label={items[viewing].name} onClick={(e) => e.stopPropagation()}>
        {viewing === 'cv' ? (
          <ScrollDoc pdf={PDF.cv} onClose={close}>
            <CvBody />
          </ScrollDoc>
        ) : (
          <SealedLetter firstTime={firstTime} onClose={close} />
        )}
      </div>
    </div>
  );
}

function ScrollDoc({ pdf, onClose, children }: { pdf: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap
        .timeline()
        .from('.scroll-body', { clipPath: 'inset(0 0 100% 0)', duration: 0.7, ease: 'power2.out' })
        .from('.scroll-rod--bottom', { y: '-=40vh', duration: 0.7, ease: 'power2.out' }, 0)
        .from('.scroll-body > *', { opacity: 0, y: 6, stagger: 0.05, duration: 0.25 }, 0.4);
    },
    { scope: ref },
  );
  return (
    <div ref={ref} className="scroll-doc">
      <div className="scroll-rod" />
      <article className="scroll-body parchment-hand">
        {children}
        <div className="doc-actions">
          <button type="button" className="px-btn" onClick={onClose}>
            {copy.viewer.close}
          </button>
          <a className="px-btn" href={pdf} download>
            {copy.viewer.pdf}
          </a>
        </div>
      </article>
      <div className="scroll-rod scroll-rod--bottom" />
    </div>
  );
}

function CvBody() {
  return (
    <>
      <h2>{CV.title}</h2>
      <p className="doc-sub">{CV.subtitle.join(' · ')}</p>
      {CV.sections.map((s) => (
        <section key={s.heading}>
          <h3>{s.heading}</h3>
          <ul>
            {s.entries.map((e) => (
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
      ))}
      <p className="doc-closing">{CV.closing}</p>
    </>
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

/** First opening cracks the wax seal, then the letter unrolls like the CV. */
function SealedLetter({ firstTime, onClose }: { firstTime: boolean; onClose: () => void }) {
  const [sealed, setSealed] = useState(() => firstTime && !prefersReducedMotion());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sealed) return;
    const t = window.setTimeout(() => setSealed(false), SEAL_MS);
    return () => window.clearTimeout(t);
  }, [sealed]);

  useGSAP(
    () => {
      if (!sealed || prefersReducedMotion()) return;
      gsap
        .timeline()
        .to('.seal', { rotation: -8, scale: 1.1, duration: 0.2, ease: 'power1.inOut', yoyo: true, repeat: 3 })
        .to('.seal', { scale: 1.6, rotation: 20, opacity: 0, duration: 0.3, ease: 'power2.in' });
    },
    { dependencies: [sealed], scope: ref },
  );

  if (!sealed) {
    return (
      <ScrollDoc pdf={PDF.letter} onClose={onClose}>
        <LetterBody />
      </ScrollDoc>
    );
  }
  return (
    <div ref={ref} className="letter-sealed">
      <PixelArt rows={SEAL} palette={SEAL_PALETTE} scale={12} className="seal" />
    </div>
  );
}
