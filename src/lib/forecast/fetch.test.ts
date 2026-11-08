import AsyncStorage from '@react-native-async-storage/async-storage';

import { refreshAt } from './fetch';
import { isForecast } from './types';

/* AN ANSWER IN OPEN-METEO'S OWN SHAPE, as a request on 2026-11-07 returned it:
   local times with no offset, 48 hours from midnight, °C, km/h, % and mm. */
const hours = Array.from({ length: 48 }, (_, i) => `2026-01-${i < 24 ? '08' : '09'}T${String(i % 24).padStart(2, '0')}:00`);
const weather = {
  timezone: 'America/Toronto',
  current: { time: '2026-01-08T09:15', temperature_2m: -5, apparent_temperature: -8.4, weather_code: 71, wind_speed_10m: 12, relative_humidity_2m: 78 },
  hourly: {
    time: hours,
    temperature_2m: hours.map((_, i) => -8 + (i % 10)),
    apparent_temperature: hours.map((_, i) => -11 + (i % 10)),
    weather_code: hours.map(() => 71),
    precipitation_probability: hours.map((_, i) => (i * 7) % 100),
    precipitation: hours.map((_, i) => (i % 5) / 2),
  },
  daily: {
    time: ['2026-01-08', '2026-01-09'],
    temperature_2m_min: [-8, -9],
    temperature_2m_max: [2, 0],
    apparent_temperature_min: [-11, -13],
    apparent_temperature_max: [-1, -3],
    weather_code: [71, 3],
    uv_index_max: [1.2, 1.5],
  },
};
const air = { current: { time: '2026-01-08T09:00', european_aqi: 18 } };

const toronto = { latitude: 43.65, longitude: -79.38 };
const place = 'Toronto, CA';
const thursday = () => new Date('2026-01-08T14:15:00Z');
const friday = () => new Date('2026-01-09T14:15:00Z');

const answer = (body: unknown, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)) }) as unknown as Response;

/* each request answered by which of Open-Meteo's two hosts it went to */
let fetchMock: jest.Mock;
const answering = (forecast: () => Promise<Response>, quality: () => Promise<Response> = () => Promise.resolve(answer(air))) =>
  fetchMock.mockImplementation((url: string) => (url.includes('air-quality') ? quality() : forecast()));

beforeEach(async () => {
  await AsyncStorage.clear();
  fetchMock = jest.fn();
  globalThis.fetch = fetchMock;
});
afterEach(() => jest.useRealTimers());

describe('refreshAt() with nothing kept, failures first', () => {
  it('has no forecast when Open-Meteo refuses the request (Fig 14d)', async () => {
    answering(() => Promise.resolve(answer({ error: true, reason: 'Latitude must be in range' }, 400)));
    await expect(refreshAt(toronto, place, { now: thursday })).resolves.toEqual({ state: 'none', place, failure: 'status' });
  });

  it('has no forecast when the network drops', async () => {
    answering(() => Promise.reject(new TypeError('Network request failed')));
    await expect(refreshAt(toronto, place, { now: thursday })).resolves.toEqual({ state: 'none', place, failure: 'network' });
  });

  it('has no forecast when Open-Meteo does not answer in time', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new Error('aborted')))),
    );
    const result = refreshAt(toronto, place, { now: thursday, timeoutMs: 1000 });
    jest.advanceTimersByTime(1000);
    await expect(result).resolves.toEqual({ state: 'none', place, failure: 'timeout' });
  });

  it.each([
    ['a body that is not JSON', '<html>gateway</html>'],
    ['no hourly forecast', { ...weather, hourly: undefined }],
    ['an hour with no temperature', { ...weather, hourly: { ...weather.hourly, temperature_2m: weather.hourly.temperature_2m.map((t, i) => (i === 12 ? null : t)) } }],
    ['fewer than a day of hours ahead', { ...weather, hourly: { ...weather.hourly, time: hours.slice(0, 30) } }],
    ['no day', { ...weather, daily: { ...weather.daily, time: [] } }],
  ])('has no forecast for %s', async (_case, body) => {
    answering(() => Promise.resolve(answer(body)));
    await expect(refreshAt(toronto, place, { now: thursday })).resolves.toEqual({ state: 'none', place, failure: 'malformed' });
  });
});

describe('refreshAt() keeps the last good forecast', () => {
  const fetchedOnce = async () => {
    answering(() => Promise.resolve(answer(weather)));
    const first = await refreshAt(toronto, place, { now: thursday });
    if (first.state !== 'fresh') throw new Error('the first refresh did not work');
    return first.forecast;
  };

  it('is stale when a refresh fails, with the time the kept one was fetched', async () => {
    const kept = await fetchedOnce();
    answering(() => Promise.reject(new TypeError('Network request failed')));
    const now = await refreshAt(toronto, place, { now: friday });
    expect(now).toEqual({ state: 'stale', place, forecast: kept, failure: 'network' });
    expect(kept.fetchedAt).toBe(thursday().toISOString());
  });

  it('names the place the kept forecast is for, not where the phone is now', async () => {
    await fetchedOnce();
    answering(() => Promise.resolve(answer({}, 503)));
    const now = await refreshAt({ latitude: 45.5, longitude: -73.57 }, 'Montréal, CA', { now: friday });
    expect(now).toMatchObject({ state: 'stale', place, failure: 'status' });
  });

  it('is not written over by a refresh that failed', async () => {
    const kept = await fetchedOnce();
    answering(() => Promise.resolve(answer('nonsense')));
    await refreshAt(toronto, place, { now: friday });
    answering(() => Promise.reject(new TypeError('Network request failed')));
    await expect(refreshAt(toronto, place, { now: friday })).resolves.toMatchObject({ state: 'stale', forecast: kept });
  });

  it.each([
    ['is not JSON', '{not json'],
    ['is not a forecast', JSON.stringify({ place, forecast: { fetchedAt: 'yesterday' } })],
  ])('has nothing kept when what was kept %s', async (_case, saved) => {
    await AsyncStorage.setItem('wardrobe.forecast', saved);
    answering(() => Promise.reject(new TypeError('Network request failed')));
    await expect(refreshAt(toronto, place, { now: friday })).resolves.toEqual({ state: 'none', place, failure: 'network' });
  });
});

describe('refreshAt() when it works', () => {
  it('keeps the forecast when only the air quality fails, with no air quality', async () => {
    answering(
      () => Promise.resolve(answer(weather)),
      () => Promise.reject(new TypeError('Network request failed')),
    );
    const now = await refreshAt(toronto, place, { now: thursday });
    expect(now).toMatchObject({ state: 'fresh', place, forecast: { now: { airQuality: null } } });
  });

  it('turns Open-Meteo’s answer into the forecast Today and Weather draw', async () => {
    answering(() => Promise.resolve(answer(weather)));
    const now = await refreshAt(toronto, place, { now: thursday });
    if (now.state !== 'fresh') throw new Error('not fresh');
    const f = now.forecast;
    expect(isForecast(f)).toBe(true);
    expect(f).toMatchObject({
      fetchedAt: '2026-01-08T14:15:00.000Z',
      timezone: 'America/Toronto',
      now: { tempC: -5, feelsC: -8.4, code: 71, windKph: 12, humidity: 78, airQuality: 18 },
      day: { date: '2026-01-08', lowC: -8, highC: 2, feelsLowC: -11, feelsHighC: -1, code: 71, uvIndexMax: 1.2 },
    });
    /* from the hour it is in, a day of them */
    expect(f.hours).toHaveLength(24);
    expect(f.hours[0]).toEqual({ at: '2026-01-08T09:00', tempC: 1, feelsC: -2, code: 71, precipChance: 63, precipMm: 2 });
    expect(f.hours[23].at).toBe('2026-01-09T08:00');
  });

  it('asks both hosts for the place, in its own time zone', async () => {
    answering(() => Promise.resolve(answer(weather)));
    await refreshAt(toronto, place, { now: thursday });
    const urls = fetchMock.mock.calls.map(([url]) => new URL(url as string));
    expect(urls.map((u) => u.host).sort()).toEqual(['air-quality-api.open-meteo.com', 'api.open-meteo.com']);
    for (const u of urls) {
      expect(u.searchParams.get('latitude')).toBe('43.65');
      expect(u.searchParams.get('longitude')).toBe('-79.38');
      expect(u.searchParams.get('timezone')).toBe('auto');
    }
  });
});
