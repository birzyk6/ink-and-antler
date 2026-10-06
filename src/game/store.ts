import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { copy } from '../content/copy';
import { CHECKS, applyCheck, modifierFor, type Ability, type CheckId } from './checks';
import { resolveCheck, rollD20 } from './d20';
import type { Rng } from './dice';
import { ALL_ITEMS, type ItemId } from './items';
import { NO_MODS, finishRound, rerollPlayer, startRound, toggleHold as toggleHeld, type RoundMods, type RoundResult, type RoundState } from './round';

export type DruidScene = 'offstage' | 'entering' | 'greeting' | 'waiting' | 'patrolling';

export type DialogueNode =
  | { id: 'origin' }
  | { id: 'wager'; afterOrigin: Ability | null }
  | { id: 'check'; wager: ItemId; oneLeft: boolean }
  | { id: 'rolling'; wager: ItemId; check: CheckId; roll: number; modifier: number; dc: number; success: boolean }
  | { id: 'dice'; wager: ItemId }
  | { id: 'roundWon'; wager: ItemId; result: RoundResult }
  | { id: 'roundTied'; wager: ItemId; result: RoundResult }
  | { id: 'roundLost'; wager: ItemId; result: RoundResult }
  | { id: 'double'; wager: ItemId }
  | { id: 'epilogue' };

/** Losses in a row after which the next game is quietly rigged for the player. */
export const PITY_LOSSES = 2;

interface Persisted {
  origin: Ability | null;
  inventory: ItemId[];
  opened: ItemId[];
  introSeen: boolean;
  contactSeen: boolean;
  /** Barks already spoken; they never repeat. */
  barkIndex: number;
}

interface Session {
  druid: DruidScene;
  node: DialogueNode | null;
  /** Choice nodes Rewind can step back to. Cleared once a d20 or the dice are rolled. */
  history: DialogueNode[];
  round: RoundState | null;
  /** Mods of the game in progress, so a tie replays the same game. */
  gameMods: RoundMods;
  lossStreak: number;
  /** A natural 20 with both scrolls on the table: Haslin offers double or nothing after the win. */
  doubleOrNothing: boolean;
  justReceived: ItemId[];
  satchelOpen: boolean;
  viewing: ItemId | null;
  viewingFirstTime: boolean;
  contactOpen: boolean;
  bark: string | null;
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
  rewind: () => void;
  chooseCheck: (check: CheckId) => void;
  justRoll: () => void;
  continueAfterRoll: () => void;
  toggleHold: (i: number) => void;
  reroll: () => void;
  revealRound: () => void;
  continueDialogue: () => void;
  acceptDouble: () => void;
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
  barkIndex: 0,
  druid: 'offstage',
  node: null,
  history: [],
  round: null,
  gameMods: NO_MODS,
  lossStreak: 0,
  doubleOrNothing: false,
  justReceived: [],
  satchelOpen: false,
  viewing: null,
  viewingFirstTime: false,
  contactOpen: false,
  bark: null,
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

      /** Moves to the next choice node and remembers the current one for Rewind. */
      const advance = (node: DialogueNode, patch: Partial<Persisted & Session> = {}) => {
        const s = get();
        set({ ...patch, node, history: s.node ? [...s.history, s.node] : s.history });
      };

      const startGame = (wager: ItemId, mods: RoundMods) => {
        const s = get();
        const gameMods = s.lossStreak >= PITY_LOSSES ? { ...mods, rigged: true } : mods;
        set({ history: [], gameMods, round: startRound(gameMods, s.rng), node: { id: 'dice', wager } });
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
          const left = remainingItems(s.inventory);
          if (left.length === 0) {
            const bark = copy.barks[s.barkIndex];
            set(bark ? { bark, barkIndex: s.barkIndex + 1, druid: 'patrolling', introSeen: true } : { druid: 'patrolling', introSeen: true });
            return;
          }
          const node: DialogueNode = !s.origin
            ? { id: 'origin' }
            : left.length > 1
              ? { id: 'wager', afterOrigin: null }
              : { id: 'check', wager: left[0], oneLeft: true };
          set({ druid: s.druid === 'patrolling' ? 'patrolling' : 'waiting', introSeen: true, history: [], node });
        },
        clearBark: () => set({ bark: null }),

        chooseOrigin: (origin) => advance({ id: 'wager', afterOrigin: origin }, { origin }),
        chooseWager: (wager) => advance({ id: 'check', wager, oneLeft: false }),
        rewind: () => {
          const { history } = get();
          const prev = history[history.length - 1];
          if (!prev) return;
          set({ node: prev, history: history.slice(0, -1), ...(prev.id === 'origin' ? { origin: null } : {}) });
        },

        chooseCheck: (check) => {
          const s = get();
          const node = s.node;
          if (node?.id !== 'check') return;
          const def = CHECKS[check];
          const roll = rollD20(s.rng);
          const modifier = modifierFor(s.origin, def.ability);
          const { success } = resolveCheck(roll, modifier, def.dc);
          set({
            history: [],
            doubleOrNothing: roll === 20 && remainingItems(s.inventory).length > 1,
            node: { id: 'rolling', wager: node.wager, check, roll, modifier, dc: def.dc, success },
          });
        },

        justRoll: () => {
          const node = get().node;
          if (node?.id === 'check') startGame(node.wager, NO_MODS);
        },

        continueAfterRoll: () => {
          const s = get();
          const node = s.node;
          if (node?.id !== 'rolling') return;
          const nat20 = node.roll === 20;
          if (nat20) set({ celebrate: s.celebrate + 1 });
          const mods = applyCheck(NO_MODS, node.check, node.success);
          startGame(node.wager, nat20 ? { ...mods, rigged: true } : mods);
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
          } else if (result.outcome === 'tie') {
            set({ round: null, node: { id: 'roundTied', wager: node.wager, result } });
          } else {
            set({ lossStreak: s.lossStreak + 1, round: null, node: { id: 'roundLost', wager: node.wager, result } });
          }
        },

        continueDialogue: () => {
          const s = get();
          const node = s.node;
          if (!node) return;
          if (node.id === 'roundWon') {
            const left = remainingItems(s.inventory);
            if (left.length === 0) set({ node: { id: 'epilogue' }, doubleOrNothing: false });
            else if (s.doubleOrNothing) set({ node: { id: 'double', wager: left[0] }, doubleOrNothing: false });
            else set({ node: { id: 'check', wager: left[0], oneLeft: true } });
          } else if (node.id === 'roundTied') {
            startGame(node.wager, s.gameMods);
          } else if (node.id === 'roundLost') {
            set({ node: { id: 'check', wager: node.wager, oneLeft: false } });
          } else if (node.id === 'epilogue') {
            get().closeDialogue();
          }
        },

        acceptDouble: () => {
          const node = get().node;
          if (node?.id === 'double') startGame(node.wager, { ...NO_MODS, rigged: true });
        },

        closeDialogue: () => set({ node: null, round: null, history: [], doubleOrNothing: false, druid: 'patrolling' }),

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
          set({ node: null, round: null, history: [], doubleOrNothing: false, introSeen: true, druid: get().druid === 'offstage' ? 'offstage' : 'patrolling' });
          get().viewItem('cv');
        },
        resetTale: () => set({ ...INITIAL, rng: get().rng }),
      };
    },
    {
      name: 'ink-antler-v1',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ origin: s.origin, inventory: s.inventory, opened: s.opened, introSeen: s.introSeen, contactSeen: s.contactSeen, barkIndex: s.barkIndex }),
    },
  ),
);
