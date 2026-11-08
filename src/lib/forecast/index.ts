import sample from './fixture.json';
import type { Forecast, ForecastState } from './types';

export { isForecast, type Forecast, type ForecastFailure, type ForecastState, type Hour } from './types';

/* UNTIL THE FETCH EXISTS, A REFRESH ANSWERS FROM fixture.json, in whichever of
   the three states a test or a placeholder chose, so Today and Weather can
   build all three before there is a network. The fetch replaces this, keeping
   refreshForecast() as it is called here. */
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
