import { useState } from 'react';
import { copy, items } from '../content/copy';
import type { ItemId } from '../game/items';
import { useGame } from '../game/store';
import { PixelArt } from '../pixel/PixelArt';
import { LEATHER, SATCHEL } from '../pixel/sprites';
import { ScrollIcon } from './ScrollIcon';
import './ui.css';

const SLOT_COUNT = 12;

export function Satchel() {
  const inventory = useGame((s) => s.inventory);
  const opened = useGame((s) => s.opened);
  const open = useGame((s) => s.satchelOpen);
  const receiving = useGame((s) => s.justReceived.length > 0);
  const talking = useGame((s) => s.node !== null);
  const setOpen = useGame((s) => s.setSatchelOpen);
  const viewItem = useGame((s) => s.viewItem);
  const [hovered, setHovered] = useState<ItemId | null>(null);
  const unread = inventory.filter((i) => !opened.includes(i)).length;
  const card = hovered ?? inventory[0] ?? null;

  return (
    <>
      <button
        type="button"
        id="satchel-button"
        className={`satchel-btn${receiving ? ' satchel-btn--wiggle' : ''}`}
        aria-label={copy.satchel.open}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <PixelArt rows={SATCHEL} palette={LEATHER} scale={4} />
        {unread > 0 && <span className="satchel-badge">{unread}</span>}
      </button>
      {unread > 0 && !open && !talking && <div className="hint px-parchment satchel-hint">{copy.satchelHint}</div>}
      {open && (
        <aside className="satchel-panel px-panel" aria-label={copy.satchel.title}>
          <h2>{copy.satchel.title}</h2>
          <div className="slots">
            {Array.from({ length: SLOT_COUNT }, (_, i) => {
              const id = inventory[i];
              return id ? (
                <button
                  key={i}
                  type="button"
                  className={`slot slot--full rarity-${items[id].rarity.toLowerCase()}`}
                  aria-label={items[id].name}
                  onMouseEnter={() => setHovered(id)}
                  onFocus={() => setHovered(id)}
                  onClick={() => viewItem(id)}
                >
                  <ScrollIcon id={id} />
                </button>
              ) : (
                <div key={i} className="slot" />
              );
            })}
          </div>
          <ItemCard id={card} />
        </aside>
      )}
    </>
  );
}

function ItemCard({ id }: { id: ItemId | null }) {
  if (!id) {
    return (
      <div className="item-card item-card--empty">
        <p className="satchel-empty">{copy.satchel.empty}</p>
      </div>
    );
  }
  const it = items[id];
  return (
    <div className={`item-card rarity-${it.rarity.toLowerCase()}`}>
      <h3 className="item-name">{it.name}</h3>
      <p className="item-type">
        {copy.satchel.type} · {it.rarity}
      </p>
      <hr className="item-rule" />
      <p className="item-flavour">“{it.flavour}”</p>
      {it.attribution && <p className="item-attribution">~ {it.attribution}</p>}
      <p className="item-weight">
        {copy.satchel.weight} {it.weight}
      </p>
    </div>
  );
}
