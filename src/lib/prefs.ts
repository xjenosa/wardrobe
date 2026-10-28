import AsyncStorage from '@react-native-async-storage/async-storage';

import { isOneOf, units, type Units } from './words';

/* WHAT A PERSON SETS ON YOU (Fig 23), kept on the phone. Units is the one
   preference the app has yet: the request carries it, and the answer's
   sentences print degrees in it (README.md). Location is the forecast's to
   find (track B), and the image model's key waits for a way to enter it, so
   neither is here. A screen that needs another preference adds it here, by
   pull request to Max. */
export type Prefs = { units: Units };

export const defaults: Prefs = { units: 'C' };

const KEY = 'wardrobe.prefs';
const VERSION = 1;

/* NOTHING SAVED IS THE DEFAULTS; SOMETHING THAT CANNOT BE READ IS A FAILURE,
   and You never writes over it, as the closet is never written over. */
export type Loaded = { ok: true; prefs: Prefs } | { ok: false };

export async function loadPrefs(): Promise<Loaded> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (raw === null) return { ok: true, prefs: defaults };
    const saved = JSON.parse(raw) as { version?: unknown; units?: unknown } | null;
    if (!saved || saved.version !== VERSION || !isOneOf(units, saved.units)) return { ok: false };
    return { ok: true, prefs: { units: saved.units } };
  } catch {
    return { ok: false };
  }
}

export async function savePrefs(prefs: Prefs): Promise<{ ok: boolean }> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify({ version: VERSION, ...prefs }));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/* Reset preferences, on Fig 23: back to the defaults, by forgetting them. */
export async function resetPrefs(): Promise<{ ok: boolean }> {
  try {
    await AsyncStorage.removeItem(KEY);
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
