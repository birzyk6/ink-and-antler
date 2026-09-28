import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { useEffect, useRef, useState } from 'react';
import { CV_PDF_URL, copy, items } from '../content/copy';
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
        {viewing === 'cv' ? <ScrollDoc onClose={close} /> : <LetterDoc firstTime={firstTime} onClose={close} />}
      </div>
    </div>
  );
}

function ScrollDoc({ onClose }: { onClose: () => void }) {
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
        <h2>{CV.title}</h2>
        <p className="doc-sub">{CV.subtitle}</p>
        {CV.sections.map((s) => (
          <section key={s.heading}>
            <h3>{s.heading}</h3>
            <ul>
              {s.lines.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </section>
        ))}
        <div className="doc-actions">
          <button type="button" className="px-btn" onClick={onClose}>
            {copy.viewer.close}
          </button>
          {CV_PDF_URL && (
            <a className="px-btn" href={CV_PDF_URL} download>
              {copy.viewer.pdf}
            </a>
          )}
        </div>
      </article>
      <div className="scroll-rod scroll-rod--bottom" />
    </div>
  );
}

function LetterDoc({ firstTime, onClose }: { firstTime: boolean; onClose: () => void }) {
  const [sealed, setSealed] = useState(() => firstTime && !prefersReducedMotion());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sealed) return;
    const t = window.setTimeout(() => setSealed(false), SEAL_MS);
    return () => window.clearTimeout(t);
  }, [sealed]);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      if (sealed) {
        gsap
          .timeline()
          .to('.seal', { rotation: -8, scale: 1.1, duration: 0.2, ease: 'power1.inOut', yoyo: true, repeat: 3 })
          .to('.seal', { scale: 1.6, rotation: 20, opacity: 0, duration: 0.3, ease: 'power2.in' });
      } else {
        gsap.from('.letter-doc', { scaleY: 0.05, duration: 0.5, ease: 'back.out(1.4)' });
      }
    },
    { dependencies: [sealed], scope: ref },
  );

  return (
    <div ref={ref}>
      {sealed ? (
        <div className="letter-sealed">
          <PixelArt rows={SEAL} palette={SEAL_PALETTE} scale={12} className="seal" />
        </div>
      ) : (
        <article className="letter-doc parchment-hand">
          <p>{MOTIVATION_LETTER.salutation}</p>
          {MOTIVATION_LETTER.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p>
            {MOTIVATION_LETTER.signoff}
            <br />
            {MOTIVATION_LETTER.signature}
          </p>
          <p className="letter-flavour">“{items.letter.flavour}”</p>
          <div className="doc-actions">
            <button type="button" className="px-btn" onClick={onClose}>
              {copy.viewer.closeLetter}
            </button>
          </div>
        </article>
      )}
    </div>
  );
}
