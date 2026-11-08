import sample from './fixture.json';
import type { Forecast, ForecastState } from './types';

export { refreshAt, type Coords } from './fetch';
export { isForecast, type Forecast, type ForecastFailure, type ForecastState, type Hour } from './types';

/* UNTIL SOMETHING FINDS THE PLACE, A REFRESH ANSWERS FROM fixture.json, in
   whichever of the three states a test or a placeholder chose, so Today and
   Weather can build all three. refreshAt() is the real fetch, for a place
   already found; once the place is found, refreshForecast() calls it and keeps
   being called as it is here. */
export type ForecastFixture = ForecastState['state'];
let chosen: ForecastFixture = 'fresh';
export function chooseForecastFixture(next: ForecastFixture) {
  chosen = next;
}

const { place } = sample;
const forecast = sample.forecast as Forecast;

/* Ask for the forecast again, as Try again does (Fig 11). */
export async function refreshForecast(): Promise<ForecastState> {
  if (chosen === 'none') return { state: 'none', place, failure: 'network' };
  if (chosen === 'stale') return { state: 'stale', place, forecast, failure: 'network' };
  return { state: 'fresh', place, forecast };
}
