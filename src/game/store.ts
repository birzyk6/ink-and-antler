import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { copy } from '../content/copy';
import { CHECKS, applyCheck, modifierFor, type Ability, type CheckId } from './checks';
import { resolveCheck, rollD20 } from './d20';
import type { Rng } from './dice';
import { ALL_ITEMS, type ItemId } from './items';
import { NO_MODS, finishRound, rerollPlayer, startRound, toggleHold as toggleHeld, type RoundResult, type RoundState } from './round';

export type DruidScene = 'offstage' | 'entering' | 'greeting' | 'waiting' | 'patrolling';

export type DialogueNode =
  | { id: 'origin' }
  | { id: 'wager'; afterOrigin: Ability | null }
  | { id: 'about' }
  | { id: 'check'; wager: ItemId }
  | { id: 'rolling'; wager: ItemId; check: CheckId; roll: number; modifier: number; dc: number; success: boolean }
  | { id: 'nat20'; items: ItemId[] }
  | { id: 'dice'; wager: ItemId }
  | { id: 'roundWon'; wager: ItemId; result: RoundResult }
  | { id: 'roundLost'; wager: ItemId; result: RoundResult }
  | { id: 'epilogue' };

interface Persisted {
  origin: Ability | null;
  inventory: ItemId[];
  opened: ItemId[];
  introSeen: boolean;
  contactSeen: boolean;
}

interface Session {
  druid: DruidScene;
  node: DialogueNode | null;
  round: RoundState | null;
  lossStreak: number;
  usedChecks: CheckId[];
  justReceived: ItemId[];
  satchelOpen: boolean;
  viewing: ItemId | null;
  viewingFirstTime: boolean;
  contactOpen: boolean;
  bark: string | null;
  barkIndex: number;
  /** Bumped on every natural 20; the scene plays its celebration when it changes. */
  celebrate: number;
  rng: Rng;
}

interface Actions {
  setDruid: (druid: DruidScene) => void;
  startDruidEntrance: () => void;
  druidArrived: () => void;
  greetingDone: () => void;
  talk: () => void;
  clearBark: () => void;
  chooseOrigin: (origin: Ability) => void;
  chooseWager: (wager: ItemId) => void;
  askAbout: () => void;
  backToWager: () => void;
  chooseCheck: (check: CheckId) => void;
  justRoll: () => void;
  continueAfterRoll: () => void;
  toggleHold: (i: number) => void;
  reroll: () => void;
  revealRound: () => void;
  continueDialogue: () => void;
  closeDialogue: () => void;
  ackReceived: () => void;
  setSatchelOpen: (open: boolean) => void;
  viewItem: (id: ItemId | null) => void;
  setContactOpen: (open: boolean) => void;
  skipTale: () => void;
  resetTale: () => void;
}

export type GameState = Persisted & Session & Actions;

export const INITIAL: Persisted & Session = {
  origin: null,
  inventory: [],
  opened: [],
  introSeen: false,
  contactSeen: false,
  druid: 'offstage',
  node: null,
  round: null,
  lossStreak: 0,
  usedChecks: [],
  justReceived: [],
  satchelOpen: false,
  viewing: null,
  viewingFirstTime: false,
  contactOpen: false,
  bark: null,
  barkIndex: 0,
  celebrate: 0,
  rng: Math.random,
};

export function remainingItems(inventory: readonly ItemId[]): ItemId[] {
  return ALL_ITEMS.filter((i) => !inventory.includes(i));
}

export function selectDruidHold(s: Pick<GameState, 'node' | 'druid'>): boolean {
  return s.node !== null || s.druid === 'entering' || s.druid === 'greeting' || s.druid === 'waiting';
}

/** localStorage can throw (private mode, blocked site data); the game must still run. */
const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

export const useGame = create<GameState>()(
  persist(
    (set, get) => {
      const grant = (ids: ItemId[]) => {
        const { inventory, justReceived } = get();
        const fresh = ids.filter((i) => !inventory.includes(i));
        set({ inventory: [...inventory, ...fresh], justReceived: [...justReceived, ...fresh] });
      };

      return {
        ...INITIAL,

        setDruid: (druid) => set({ druid }),
        startDruidEntrance: () => {
          if (get().druid === 'offstage') set({ druid: 'entering' });
        },
        druidArrived: () => {
          if (get().druid === 'entering') set({ druid: 'greeting' });
        },
        greetingDone: () => {
          if (get().druid === 'greeting') set({ druid: 'waiting', introSeen: true });
        },

        talk: () => {
          const s = get();
          if (s.node || s.druid === 'offstage' || s.druid === 'entering') return;
          const druid = s.druid === 'greeting' ? 'waiting' : s.druid;
          if (remainingItems(s.inventory).length === 0) {
            set({ bark: copy.barks[s.barkIndex % copy.barks.length], barkIndex: s.barkIndex + 1, druid: 'patrolling', introSeen: true });
            return;
          }
          set({ druid, introSeen: true, node: s.origin ? { id: 'wager', afterOrigin: null } : { id: 'origin' } });
        },
        clearBark: () => set({ bark: null }),

        chooseOrigin: (origin) => set({ origin, node: { id: 'wager', afterOrigin: origin } }),
        chooseWager: (wager) => set({ node: { id: 'check', wager } }),
        askAbout: () => set({ node: { id: 'about' } }),
        backToWager: () => set({ node: { id: 'wager', afterOrigin: null } }),

        chooseCheck: (check) => {
          const s = get();
          const node = s.node;
          if (node?.id !== 'check') return;
          const def = CHECKS[check];
          const roll = rollD20(s.rng);
          const modifier = modifierFor(s.origin, def.ability);
          const { success } = resolveCheck(roll, modifier, def.dc);
          set({
            usedChecks: [...s.usedChecks, check],
            node: { id: 'rolling', wager: node.wager, check, roll, modifier, dc: def.dc, success },
          });
        },

        justRoll: () => {
          const s = get();
          const node = s.node;
          if (node?.id !== 'check') return;
          set({ round: startRound(NO_MODS, s.lossStreak, s.rng), node: { id: 'dice', wager: node.wager } });
        },

        continueAfterRoll: () => {
          const s = get();
          const node = s.node;
          if (node?.id !== 'rolling') return;
          if (node.roll === 20) {
            const ids = remainingItems(s.inventory);
            grant(ids);
            set({ node: { id: 'nat20', items: ids }, round: null, celebrate: s.celebrate + 1 });
            return;
          }
          const mods = applyCheck(NO_MODS, node.check, node.success);
          set({ round: startRound(mods, s.lossStreak, s.rng), node: { id: 'dice', wager: node.wager } });
        },

        toggleHold: (i) => {
          const r = get().round;
          if (r) set({ round: toggleHeld(r, i) });
        },
        reroll: () => {
          const s = get();
          if (s.round) set({ round: rerollPlayer(s.round, s.rng) });
        },

        revealRound: () => {
          const s = get();
          const node = s.node;
          if (node?.id !== 'dice' || !s.round) return;
          const result = finishRound(s.round);
          if (result.outcome === 'win') {
            grant([node.wager]);
            set({ lossStreak: 0, round: null, node: { id: 'roundWon', wager: node.wager, result } });
          } else {
            set({ lossStreak: s.lossStreak + 1, round: null, node: { id: 'roundLost', wager: node.wager, result } });
          }
        },

        continueDialogue: () => {
          const s = get();
          const node = s.node;
          if (!node) return;
          if (node.id === 'roundWon' || node.id === 'nat20') {
            set({ node: remainingItems(s.inventory).length === 0 ? { id: 'epilogue' } : { id: 'wager', afterOrigin: null } });
          } else if (node.id === 'roundLost') {
            set({ node: { id: 'check', wager: node.wager } });
          } else if (node.id === 'epilogue') {
            get().closeDialogue();
          }
        },

        closeDialogue: () => set({ node: null, round: null, druid: 'patrolling' }),

        ackReceived: () => set({ justReceived: get().justReceived.slice(1) }),
        setSatchelOpen: (satchelOpen) => set({ satchelOpen }),
        viewItem: (id) => {
          if (!id) {
            set({ viewing: null });
            return;
          }
          const { opened } = get();
          set({ viewing: id, viewingFirstTime: !opened.includes(id), opened: opened.includes(id) ? opened : [...opened, id] });
        },
        setContactOpen: (contactOpen) => set(contactOpen ? { contactOpen, contactSeen: true } : { contactOpen }),

        skipTale: () => {
          grant(remainingItems(get().inventory));
          set({ node: null, round: null, introSeen: true, druid: get().druid === 'offstage' ? 'offstage' : 'patrolling' });
          get().viewItem('cv');
        },
        resetTale: () => set({ ...INITIAL, rng: get().rng }),
      };
    },
    {
      name: 'ink-antler-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ origin: s.origin, inventory: s.inventory, opened: s.opened, introSeen: s.introSeen, contactSeen: s.contactSeen }),
    },
  ),
);
