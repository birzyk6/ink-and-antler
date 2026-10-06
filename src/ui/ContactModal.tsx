import { CONTACT, copy } from '../content/copy';
import { useGame } from '../game/store';
import './chrome.css';

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
            <span className="fast-travel-place">{copy.fastTravel.postal}</span> (<a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>)
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
