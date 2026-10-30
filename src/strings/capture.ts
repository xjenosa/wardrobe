import { drawn } from './drawn';

/* The words the capture track needs where the mockup draws none: the states
   docs/States.md describes in words (Add garment, Item editor). The sentences
   the mockup does draw are in drawn.ts. */
export const capture = {
  byHand: 'Fill it in by hand.',
  saveFailed: 'Could not save. What you entered is still here.',
  closetUnreadable: 'The closet could not be read.',
  tryAgain: 'Try again',
  notInCloset: 'This garment is not in your closet.',
  taggingFailed: 'The garment could not be read. Your photograph is still here.',
  fillByHand: 'Fill it in by hand',
  cameraRefused: 'Camera access was refused. You can upload a photo instead, or open Settings.',
  openSettings: 'Open Settings',
  photoFailed: 'The photograph could not be kept. Try again.',
  /* The plate only draws the plural ("Worn 12 times · last on 3 Jan"). The
     singular is the one line that has no plate. */
  wornOnce: 'Worn 1 time · last on 3 Jan',
  wearsUnreadable: 'The wear log could not be read.',
} as const;

/* "3 Jan" as Fig 19 draws the last day, in Canadian English order. */
export function lastWornDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const when = new Date(y, m - 1, d);
  const part = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-CA', o).format(when);
  return [part({ day: 'numeric' }), part({ month: 'short' })].join(' ');
}

/* Fig 19's sentence with the count and the day filled in. Built from the
   plate's own words so nobody retypes them; only the singular is ours. */
export function wornLine(times: number, lastDay: string): string {
  const last = lastWornDay(lastDay);
  if (times === 1) return capture.wornOnce.replace('3 Jan', last);
  return drawn.fig19.worn12TimesLastOn.replace('12', String(times)).replace('3 Jan', last);
}
