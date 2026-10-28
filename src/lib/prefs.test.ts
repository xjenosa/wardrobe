import AsyncStorage from '@react-native-async-storage/async-storage';

import { defaults, loadPrefs, resetPrefs, savePrefs } from './prefs';

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

it('is the defaults on a first run, with degrees in Celsius', async () => {
  await expect(loadPrefs()).resolves.toEqual({ ok: true, prefs: { units: 'C' } });
  expect(defaults.units).toBe('C');
});

it('keeps what is saved', async () => {
  await expect(savePrefs({ units: 'F' })).resolves.toEqual({ ok: true });
  await expect(loadPrefs()).resolves.toEqual({ ok: true, prefs: { units: 'F' } });
});

it('goes back to the defaults when reset', async () => {
  await savePrefs({ units: 'F' });
  await expect(resetPrefs()).resolves.toEqual({ ok: true });
  await expect(loadPrefs()).resolves.toEqual({ ok: true, prefs: { units: 'C' } });
});

it.each([
  ['storage that cannot be read', () => jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('io'))],
  ['what is not JSON', () => AsyncStorage.setItem('wardrobe.prefs', '{')],
  ['units that are not a word the app sends', () => AsyncStorage.setItem('wardrobe.prefs', JSON.stringify({ version: 1, units: 'K' }))],
  ['a shape from another version', () => AsyncStorage.setItem('wardrobe.prefs', JSON.stringify({ version: 2, units: 'F' }))],
])('fails as a value, never as the defaults, on %s', async (_case, plant) => {
  await plant();
  await expect(loadPrefs()).resolves.toEqual({ ok: false });
});

it('fails as a value when a save or a reset cannot be written', async () => {
  jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('full'));
  jest.spyOn(AsyncStorage, 'removeItem').mockRejectedValueOnce(new Error('full'));
  await expect(savePrefs({ units: 'F' })).resolves.toEqual({ ok: false });
  await expect(resetPrefs()).resolves.toEqual({ ok: false });
});
