import AsyncStorage from '@react-native-async-storage/async-storage';

import { dayOf } from './day';
import type { LoadFailure, SaveResult } from './store';

/* WHAT WAS WORN, AND WHEN, kept on the phone and never sent (ADR 0023): each
   day, the ids of the outfit worn that day. Today records it on "Wear this"
   and "Wear it anyway". The editor reads it for "Worn n times · last on", and
   the closet for its "Least worn" order. */
export type WearLog = Record<string, string[]>;

export type WearsResult = { ok: true; log: WearLog } | { ok: false; failure: LoadFailure };

export type RecordResult = { ok: true; log: WearLog } | { ok: false; failure: LoadFailure | 'unwritable' };

/* How many days a garment was worn, and the last of them. */
export type Worn = { times: number; lastDay: string | null };

const KEY = 'wardrobe.wears';

/* Versioned for the same reason the closet is (src/lib/store.ts). */
const VERSION = 1;

const DAY = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

const isLog = (v: unknown): v is WearLog =>
  typeof v === 'object' &&
  v !== null &&
  !Array.isArray(v) &&
  Object.entries(v).every(
    ([day, ids]) => DAY.test(day) && Array.isArray(ids) && ids.every((id) => typeof id === 'string'),
  );

/* Every read and write waits for the one before it, as the closet's do. */
let last: Promise<unknown> = Promise.resolve();
function inTurn<T>(task: () => Promise<T>): Promise<T> {
  const run = last.then(task);
  last = run.catch(() => undefined);
  return run;
}

async function read(): Promise<WearsResult> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(KEY);
  } catch {
    return { ok: false, failure: 'unreadable' };
  }
  if (raw === null) return { ok: true, log: {} };

  let saved: unknown;
  try {
    saved = JSON.parse(raw);
  } catch {
    return { ok: false, failure: 'corrupt' };
  }
  const s = saved as { version?: unknown; days?: unknown } | null;
  if (!s || s.version !== VERSION || !isLog(s.days)) return { ok: false, failure: 'corrupt' };
  return { ok: true, log: s.days };
}

async function write(log: WearLog): Promise<SaveResult> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ version: VERSION, days: log }));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function loadWears(): Promise<WearsResult> {
  return inTurn(read);
}

/* ONE OUTFIT A DAY. Wearing again the same day replaces that day's outfit
   rather than adding a second, so a change of mind is not a second wear and
   "Worn n times" counts days. A log that could not be read is never written
   over, so a failed read cannot wipe the history. */
export function recordWear(ids: string[], now: Date = new Date()): Promise<RecordResult> {
  return inTurn(async () => {
    const current = await read();
    if (!current.ok) return current;
    const log = { ...current.log, [dayOf(now)]: [...new Set(ids)] };
    return (await write(log)).ok ? { ok: true, log } : { ok: false, failure: 'unwritable' };
  });
}

/* Replaces whatever is saved, readable or not, so it is called on a person's
   explicit say-so and nowhere else, like resetCloset. */
export function resetWears(log: WearLog = {}): Promise<SaveResult> {
  return inTurn(() => write(log));
}

export function wornOf(log: WearLog, id: string): Worn {
  const days = Object.keys(log)
    .filter((day) => log[day].includes(id))
    .sort();
  return { times: days.length, lastDay: days.length ? days[days.length - 1] : null };
}
