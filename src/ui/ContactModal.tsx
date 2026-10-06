import { useEffect, useState, type MouseEvent } from 'react';
import { CONTACT, copy } from '../content/copy';
import { useGame } from '../game/store';
import './chrome.css';

const COPIED_MS = 2400;

/**
 * The address copies to the clipboard on click, with a short "copied" note. It stays a mailto
 * link, so middle-click works, and if the clipboard is unavailable the click opens the mail app.
 */
function EmailLink() {
  const [copied, setCopied] = useState(0);
  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(0), COPIED_MS);
    return () => window.clearTimeout(t);
  }, [copied]);
  const onClick = async (e: MouseEvent<HTMLAnchorElement>) => {
    if (!navigator.clipboard) return;
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(CONTACT.email);
      setCopied((n) => n + 1);
    } catch {
      window.location.href = `mailto:${CONTACT.email}`;
    }
  };
  return (
    <span className="email-copy">
      <a href={`mailto:${CONTACT.email}`} title={copy.fastTravel.copyHint} onClick={onClick}>
        {CONTACT.email}
      </a>
      <span className="email-copied" role="status">
        {copied > 0 && (
          <span key={copied} className="email-copied-note">
            {copy.fastTravel.copied}
          </span>
        )}
      </span>
    </span>
  );
}

export function ContactModal() {
  const isOpen = useGame((s) => s.contactOpen);
  const setOpen = useGame((s) => s.setContactOpen);
  if (!isOpen) return null;
  const close = () => setOpen(false);
  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="contact px-parchment parchment-hand" role="dialog" aria-modal="true" aria-label={copy.fastTravel.title} onClick={(e) => e.stopPropagation()}>
        <h2>{copy.fastTravel.title}</h2>
        <p>{copy.fastTravel.intro}</p>
        <ul className="fast-travel">
          <li>
            <span className="fast-travel-place">{copy.fastTravel.postal}</span> (<EmailLink />)
          </li>
          <li>
            <span className="fast-travel-place">{copy.fastTravel.guild}</span> (
            <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">
              {copy.fastTravel.linkedin}
            </a>
            )
          </li>
        </ul>
        <button type="button" className="px-btn" onClick={close}>
          {copy.fastTravel.close}
        </button>
      </div>
    </div>
  );
}
