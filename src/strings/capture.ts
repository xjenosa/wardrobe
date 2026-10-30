/* The words the capture track needs where the mockup draws none: the states
   docs/States.md describes in words (Add garment, Item editor). The sentences
   the mockup does draw are in drawn.ts. */
export const capture = {
  byHand: 'Fill it in by hand.',
  saveFailed: 'Could not save. What you entered is still here.',
  closetUnreadable: 'The closet could not be read.',
  tryAgain: 'Try again',
  notInCloset: 'This garment is not in your closet.',
  /* Fig 19's "Worn 12 times · last on 3 Jan", built from parts so the count
     and the day change. The plate's middot is the separator. */
  worn: 'Worn',
  times: 'times',
  lastOn: 'last on',
  wornSep: ' · ',
} as const;

/* "3 Jan" as Fig 19 draws the last day, in Canadian English order. */
export function lastWornDay(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  const when = new Date(y, m - 1, d);
  const part = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-CA', o).format(when);
  return [part({ day: 'numeric' }), part({ month: 'short' })].join(' ');
}

export function wornLine(times: number, lastDay: string): string {
  return [capture.worn, String(times), capture.times].join(' ') + capture.wornSep + [capture.lastOn, lastWornDay(lastDay)].join(' ');
}
