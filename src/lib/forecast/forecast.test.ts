import fixture from './fixture.json';
import { chooseForecastFixture, isForecast, refreshForecast } from './index';

afterEach(() => chooseForecastFixture('fresh'));

describe('refreshForecast(), failures first', () => {
  it('says there is no forecast and why, and keeps the place (Fig 14d)', async () => {
    chooseForecastFixture('none');
    const now = await refreshForecast();
    expect(now).toEqual({ state: 'none', place: fixture.place, failure: 'network' });
    expect(now).not.toHaveProperty('forecast');
  });

  it('keeps the last forecast when a refresh fails, with the time it was fetched', async () => {
    chooseForecastFixture('stale');
    const now = await refreshForecast();
    expect(now).toEqual({ state: 'stale', place: fixture.place, forecast: fixture.forecast, failure: 'network' });
    if (now.state !== 'stale') throw new Error('not stale');
    expect(Date.parse(now.forecast.fetchedAt)).not.toBeNaN();
  });

  /* a module of its own, so no earlier test's choice can stand in for the default */
  it('answers a fresh forecast by default', async () => {
    let first!: typeof refreshForecast;
    jest.isolateModules(() => {
      ({ refreshForecast: first } = jest.requireActual<typeof import('./index')>('./index'));
    });
    await expect(first()).resolves.toEqual({ state: 'fresh', place: fixture.place, forecast: fixture.forecast });
  });

  it('answers with a forecast that passes the same check the fetch will', async () => {
    const now = await refreshForecast();
    if (now.state !== 'fresh') throw new Error('not fresh');
    expect(isForecast(now.forecast)).toBe(true);
  });
});
