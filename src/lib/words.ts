import { drawn } from '../strings/drawn';

/* THE WORDS ON THE WIRE ARE THE WORDS ON THE SCREEN (ADR 0020). Each list is the
   one the mockup draws, the app sends the word it shows and keeps no lookup,
   and README.md's contract prints the same lists. words.test.ts holds the
   three to one. */
const confirm = drawn.fig18;
const today = drawn.fig08;

/* Fig 18's Category. */
export const categories = [
  confirm.tops,
  confirm.sweaters,
  confirm.outerwear,
  confirm.bottoms,
  confirm.shoes,
  confirm.accessories,
] as const;

/* The five under Fig 18's "Not sure?", for any category. An accessory may
   leave it out, and the service never picks one. */
export const warmths = [
  confirm.veryLight,
  confirm.light,
  confirm.midSeason,
  confirm.warm,
  confirm.warmest,
] as const;

/* Fig 08's Vibe, which is also Fig 18's Style. */
export const vibes = [today.everyday, today.smart, today.active, today.occasion] as const;

/* The units the answer's sentences print degrees in. The numbers are Celsius
   whichever is chosen. */
export const units = ['C', 'F'] as const;

export type Category = (typeof categories)[number];
export type Warmth = (typeof warmths)[number];
export type Vibe = (typeof vibes)[number];
export type Units = (typeof units)[number];

export const isOneOf = <T extends string>(list: readonly T[], v: unknown): v is T =>
  typeof v === 'string' && (list as readonly string[]).includes(v);

/* What every garment carries, in the closet and on the wire alike. */
export function hasGarmentWords(g: { category?: unknown; warmth?: unknown }): boolean {
  if (!isOneOf(categories, g.category)) return false;
  if (g.warmth === undefined) return g.category === confirm.accessories;
  return isOneOf(warmths, g.warmth);
}
