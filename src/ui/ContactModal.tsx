import { CONTACT, copy } from '../content/copy';
import { useGame } from '../game/store';
import './chrome.css';

export function ContactModal() {
  const isOpen = useGame((s) => s.contactOpen);
  const setOpen = useGame((s) => s.setContactOpen);
  if (!isOpen) return null;
  return (
    <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <div className="contact px-parchment parchment-hand" role="dialog" aria-modal="true" aria-label={copy.contact.title} onClick={(e) => e.stopPropagation()}>
        <h2>{copy.contact.title}</h2>
        <p>{copy.contact.intro}</p>
        <ul>
          <li>
            <a href={`mailto:${CONTACT.email}`}>
              {copy.contact.email}: {CONTACT.email}
            </a>
          </li>
          <li>
            <a href={CONTACT.linkedin} target="_blank" rel="noreferrer">
              {copy.contact.linkedin}
            </a>
          </li>
        </ul>
        <button type="button" className="px-btn" onClick={() => setOpen(false)}>
          {copy.contact.close}
        </button>
      </div>
    </div>
  );
}
