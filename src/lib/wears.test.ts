import AsyncStorage from '@react-native-async-storage/async-storage';

import { loadWears, recordWear, resetWears, wornOf } from './wears';

const KEY = 'wardrobe.wears';
const monday = new Date(2026, 9, 19, 8);
const mondayNight = new Date(2026, 9, 19, 22);
const tuesday = new Date(2026, 9, 20, 8);
const saveRaw = (value: unknown) => AsyncStorage.setItem(KEY, JSON.stringify(value));

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

describe('loadWears()', () => {
  it('reads a first run as nothing worn, not a failure', async () => {
    await expect(loadWears()).resolves.toEqual({ ok: true, log: {} });
  });

  it('reads back what was recorded', async () => {
    await recordWear(['g1', 'g2'], monday);
    await expect(loadWears()).resolves.toEqual({ ok: true, log: { '2026-10-19': ['g1', 'g2'] } });
  });

  it('reports data that is not JSON as corrupt', async () => {
    await AsyncStorage.setItem(KEY, '{not json');
    await expect(loadWears()).resolves.toEqual({ ok: false, failure: 'corrupt' });
  });

  it.each([
    ['a saved null', null],
    ['another version', { version: 2, days: {} }],
    ['days that are a list', { version: 1, days: [['g1']] }],
    ['a day that is not a date', { version: 1, days: { monday: ['g1'] } }],
    ['a day that is not a list of ids', { version: 1, days: { '2026-10-19': 'g1' } }],
  ])('reports %s as corrupt', async (_what, value) => {
    await saveRaw(value);
    await expect(loadWears()).resolves.toEqual({ ok: false, failure: 'corrupt' });
  });

  it('reports storage that cannot be read as unreadable', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('locked'));
    await expect(loadWears()).resolves.toEqual({ ok: false, failure: 'unreadable' });
  });
});

describe('recordWear()', () => {
  it("records the outfit on the phone's own calendar day", async () => {
    await expect(recordWear(['g1', 'g2'], monday)).resolves.toEqual({
      ok: true,
      log: { '2026-10-19': ['g1', 'g2'] },
    });
  });

  it("replaces the day's outfit when it is worn again the same day", async () => {
    await recordWear(['g1', 'g2'], monday);
    await recordWear(['g1', 'g3'], mondayNight);
    await expect(loadWears()).resolves.toEqual({ ok: true, log: { '2026-10-19': ['g1', 'g3'] } });
  });

  it('keeps every other day when a new one is recorded', async () => {
    await recordWear(['g1'], monday);
    await recordWear(['g2'], tuesday);
    await expect(loadWears()).resolves.toEqual({ ok: true, log: { '2026-10-19': ['g1'], '2026-10-20': ['g2'] } });
  });

  it('counts a garment once however often one outfit names it', async () => {
    await recordWear(['g1', 'g1', 'g2'], monday);
    await expect(loadWears()).resolves.toEqual({ ok: true, log: { '2026-10-19': ['g1', 'g2'] } });
  });

  it('never writes over a log that could not be read', async () => {
    await AsyncStorage.setItem(KEY, '{not json');
    await expect(recordWear(['g1'], monday)).resolves.toEqual({ ok: false, failure: 'corrupt' });
    await expect(AsyncStorage.getItem(KEY)).resolves.toBe('{not json');
  });

  it('says so when the write fails', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('disk full'));
    await expect(recordWear(['g1'], monday)).resolves.toEqual({ ok: false, failure: 'unwritable' });
  });
});

describe('resetWears()', () => {
  it('replaces a log that could not be read, on a person\'s say-so', async () => {
    await AsyncStorage.setItem(KEY, '{not json');
    await expect(resetWears()).resolves.toEqual({ ok: true });
    await expect(loadWears()).resolves.toEqual({ ok: true, log: {} });
  });
});

describe('wornOf()', () => {
  const log = {
    '2026-10-12': ['g1', 'g2'],
    '2026-10-19': ['g1', 'g3'],
    '2026-10-03': ['g1'],
  };

  it('counts the days a garment was worn and names the last of them', () => {
    expect(wornOf(log, 'g1')).toEqual({ times: 3, lastDay: '2026-10-19' });
    expect(wornOf(log, 'g2')).toEqual({ times: 1, lastDay: '2026-10-12' });
  });

  it('is never worn when no day names it', () => {
    expect(wornOf(log, 'g9')).toEqual({ times: 0, lastDay: null });
    expect(wornOf({}, 'g1')).toEqual({ times: 0, lastDay: null });
  });
});
