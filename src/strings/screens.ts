/* The name of each screen, as its title and as its placeholder until its track
   builds it. The mockup's own words are in drawn.ts; these are the names
   docs/Build_Plan.md gives the screens. */
export const screens = {
  firstRun: 'First run',
  today: 'Today',
  noForecast: 'No forecast',
  weather: 'Weather',
  closet: 'Closet',
  addGarment: 'Add garment',
  itemEditor: 'Item editor',
  you: 'You',
} as const;

/* The placeholders' own controls, until each track draws the real ones. */
export const stub = {
  back: 'Back',
} as const;
