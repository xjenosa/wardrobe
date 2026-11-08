import sample from './fixture.json';
import { isForecast } from './types';

const fixture = sample.forecast;

/* a copy of the fixture with one change, so each test plants one defect */
const changed = (edit: (f: typeof fixture) => void) => {
  const f = structuredClone(fixture);
  edit(f);
  return f;
};

it('passes the fixture, which is what Weather builds against', () => {
  expect(isForecast(fixture)).toBe(true);
});

it('keeps a forecast whose air quality could not be read', () => {
  expect(isForecast(changed((f) => ((f.now as { airQuality: number | null }).airQuality = null)))).toBe(true);
});

it('refuses a forecast with no time it was fetched, since a kept one must say', () => {
  expect(isForecast(changed((f) => ((f as { fetchedAt: unknown }).fetchedAt = 'this morning')))).toBe(false);
});

it('refuses less than a day of hours', () => {
  expect(isForecast(changed((f) => f.hours.splice(23)))).toBe(false);
});

it('refuses hours out of order', () => {
  expect(isForecast(changed((f) => f.hours.reverse()))).toBe(false);
});

it('refuses an hour with an offset, since hours are the place’s wall clock', () => {
  expect(isForecast(changed((f) => (f.hours[0].at = '2026-01-08T09:00-05:00')))).toBe(false);
});

it('refuses a chance of rain over a hundred', () => {
  expect(isForecast(changed((f) => (f.hours[3].precipChance = 140)))).toBe(false);
});

it('refuses a day whose low is above its high', () => {
  expect(isForecast(changed((f) => ((f.day.lowC = 5), (f.day.highC = -5))))).toBe(false);
});

it('refuses what is not a forecast at all', () => {
  for (const v of [null, [], 'forecast', { ...fixture, hours: 'many' }, { ...fixture, now: null }]) {
    expect(isForecast(v)).toBe(false);
  }
});
