import AsyncStorage from '@react-native-async-storage/async-storage';

import type { PickGarment } from './pick';
import { hasGarmentWords, isOneOf, vibes, type Vibe } from './words';

/* A garment as the closet keeps it: what crosses the wire (README.md), in the
   words Fig 18 draws (ADR 0020), and its style, which stays on the phone. A
   track that needs another field adds it here by pull request to Max, so there
   is one shape that every screen saves and reads. */
export type Garment = PickGarment & { style?: Vibe };

const KEY = 'wardrobe.closet';

/* THE SAVED SHAPE CARRIES A VERSION, so the build that changes the shape can
   tell an older closet from a broken one and carry it forward. Until then any
   other version is reported as corrupt. */
const VERSION = 1;

/* AN EMPTY CLOSET IS NOT A BROKEN ONE. A first run is `ok` with no garments;
   data that cannot be read is a failure, so the Closet never tells somebody
   they own nothing when it simply could not read what they own. */
export type LoadFailure = 'unreadable' | 'corrupt';
export type LoadResult = { ok: true; garments: Garment[] } | { ok: false; failure: LoadFailure };

export type UpdateResult = { ok: true; garments: Garment[] } | { ok: false; failure: LoadFailure | 'unwritable' };

export type SaveResult = { ok: true } | { ok: false };

const isGarment = (v: unknown): v is Garment => {
  if (typeof v !== 'object' || v === null) return false;
  const g = v as Record<string, unknown>;
  return (
    typeof g.id === 'string' &&
    typeof g.name === 'string' &&
    hasGarmentWords(g) &&
    (g.style === undefined || isOneOf(vibes, g.style))
  );
};

/* EVERY READ AND WRITE WAITS FOR THE ONE BEFORE IT, so two screens changing
   the closet at once cannot both read the old one and undo each other. A task
   that throws fails its own caller and not the ones queued behind it. */
let last: Promise<unknown> = Promise.resolve();
function inTurn<T>(task: () => Promise<T>): Promise<T> {
  const run = last.then(task);
  last = run.catch(() => undefined);
  return run;
}

async function read(): Promise<LoadResult> {
  let raw: string | null;
  try {
    raw = await AsyncStorage.getItem(KEY);
  } catch {
    return { ok: false, failure: 'unreadable' };
  }
  if (raw === null) return { ok: true, garments: [] };

  let saved: unknown;
  try {
    saved = JSON.parse(raw);
  } catch {
    return { ok: false, failure: 'corrupt' };
  }
  const s = saved as { version?: unknown; garments?: unknown } | null;
  if (!s || s.version !== VERSION || !Array.isArray(s.garments) || !s.garments.every(isGarment)) {
    return { ok: false, failure: 'corrupt' };
  }
  return { ok: true, garments: s.garments };
}

async function write(garments: Garment[]): Promise<SaveResult> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ version: VERSION, garments }));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function loadCloset(): Promise<LoadResult> {
  return inTurn(read);
}

/* A CHANGE IS MADE TO THE CLOSET AS SAVED, NOT TO A SCREEN'S COPY OF IT: the
   change is handed what is saved now. A closet that could not be read is never
   written over, so a failed read cannot turn into lost garments. */
export function updateCloset(change: (garments: Garment[]) => Garment[]): Promise<UpdateResult> {
  return inTurn(async () => {
    const now = await read();
    if (!now.ok) return now;
    const next = change(now.garments);
    return (await write(next)).ok ? { ok: true, garments: next } : { ok: false, failure: 'unwritable' };
  });
}

/* Replaces whatever is saved, readable or not. The only way past a closet that
   cannot be read, so it is called on a person's explicit say-so and nowhere
   else. */
export function resetCloset(garments: Garment[] = []): Promise<SaveResult> {
  return inTurn(() => write(garments));
}
