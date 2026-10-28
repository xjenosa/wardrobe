import AsyncStorage from '@react-native-async-storage/async-storage';

import { sampleCloset as sample } from './sample';
import { loadCloset, resetCloset, updateCloset, type Garment } from './store';

const KEY = 'wardrobe.closet';
const coat: Garment = { id: 'g1', name: 'Navy overcoat', category: 'Outerwear', warmth: 'Warmest', style: 'Everyday' };
const trousers: Garment = { id: 'g3', name: 'Charcoal trousers', category: 'Bottoms', warmth: 'Mid-season' };
const beanie: Garment = { id: 'g5', name: 'Charcoal beanie', category: 'Accessories' };
const add = (g: Garment) => (garments: Garment[]) => [...garments, g];
const saveRaw = (value: unknown) => AsyncStorage.setItem(KEY, JSON.stringify(value));

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

describe('loadCloset()', () => {
  it('reads a first run as an empty closet, not a failure', async () => {
    await expect(loadCloset()).resolves.toEqual({ ok: true, garments: [] });
  });

  it('reads back what was saved', async () => {
    await updateCloset(add(coat));
    await expect(loadCloset()).resolves.toEqual({ ok: true, garments: [coat] });
  });

  it('reads the sample closet as a closet', async () => {
    await expect(resetCloset(sample)).resolves.toEqual({ ok: true });
    await expect(loadCloset()).resolves.toEqual({ ok: true, garments: sample });
  });

  it('reports data that is not JSON as corrupt', async () => {
    await AsyncStorage.setItem(KEY, '{not json');
    await expect(loadCloset()).resolves.toEqual({ ok: false, failure: 'corrupt' });
  });

  it('reports a saved null as corrupt', async () => {
    await AsyncStorage.setItem(KEY, 'null');
    await expect(loadCloset()).resolves.toEqual({ ok: false, failure: 'corrupt' });
  });

  it('reports garments that are not a list as corrupt', async () => {
    await saveRaw({ version: 1, garments: { g1: coat } });
    await expect(loadCloset()).resolves.toEqual({ ok: false, failure: 'corrupt' });
  });

  it.each(['id', 'name', 'category', 'warmth'])('reports a garment with no %s as corrupt', async (field) => {
    const garment: Record<string, unknown> = { ...coat };
    delete garment[field];
    await saveRaw({ version: 1, garments: [garment] });
    await expect(loadCloset()).resolves.toEqual({ ok: false, failure: 'corrupt' });
  });

  it('reads an accessory with no warmth, since an accessory may leave it out', async () => {
    await saveRaw({ version: 1, garments: [beanie] });
    await expect(loadCloset()).resolves.toEqual({ ok: true, garments: [beanie] });
  });

  it.each([
    ['a category', { category: 'Knitwear' }],
    ['a warmth', { warmth: 'Fleece' }],
    ['a style', { style: 'Formal' }],
  ])('reports %s that is not one of the drawn words as corrupt', async (_what, change) => {
    await saveRaw({ version: 1, garments: [{ ...coat, ...change }] });
    await expect(loadCloset()).resolves.toEqual({ ok: false, failure: 'corrupt' });
  });

  it('reads back a favourite', async () => {
    await saveRaw({ version: 1, garments: [{ ...coat, favourite: true }] });
    await expect(loadCloset()).resolves.toEqual({ ok: true, garments: [{ ...coat, favourite: true }] });
  });

  it('reports a favourite that is not a yes or a no as corrupt', async () => {
    await saveRaw({ version: 1, garments: [{ ...coat, favourite: 'yes' }] });
    await expect(loadCloset()).resolves.toEqual({ ok: false, failure: 'corrupt' });
  });

  it('reports a closet from an unknown version as corrupt', async () => {
    await saveRaw({ version: 99, garments: [coat] });
    await expect(loadCloset()).resolves.toEqual({ ok: false, failure: 'corrupt' });
  });

  it('reports storage that cannot be read as unreadable', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk'));
    await expect(loadCloset()).resolves.toEqual({ ok: false, failure: 'unreadable' });
  });
});

describe('updateCloset()', () => {
  it('hands each change what is saved now, so two changes at once both land', async () => {
    await Promise.all([updateCloset(add(coat)), updateCloset(add(trousers))]);
    await expect(loadCloset()).resolves.toEqual({ ok: true, garments: [coat, trousers] });
  });

  it('never writes over a closet it could not read', async () => {
    await AsyncStorage.setItem(KEY, '{not json');
    const setItem = jest.spyOn(AsyncStorage, 'setItem');
    setItem.mockClear();
    await expect(updateCloset(add(coat))).resolves.toEqual({ ok: false, failure: 'corrupt' });
    expect(setItem).not.toHaveBeenCalled();
    await expect(AsyncStorage.getItem(KEY)).resolves.toBe('{not json');
  });

  it('never writes when storage cannot be read', async () => {
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk'));
    const setItem = jest.spyOn(AsyncStorage, 'setItem');
    setItem.mockClear();
    await expect(updateCloset(add(coat))).resolves.toEqual({ ok: false, failure: 'unreadable' });
    expect(setItem).not.toHaveBeenCalled();
  });

  it('reports a write that fails instead of throwing', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('full'));
    await expect(updateCloset(add(coat))).resolves.toEqual({ ok: false, failure: 'unwritable' });
  });

  it('keeps working after a change that throws', async () => {
    await expect(
      updateCloset(() => {
        throw new Error('bug');
      }),
    ).rejects.toThrow('bug');
    await expect(updateCloset(add(coat))).resolves.toEqual({ ok: true, garments: [coat] });
  });
});

describe('resetCloset()', () => {
  it('replaces a closet that could not be read', async () => {
    await AsyncStorage.setItem(KEY, '{not json');
    await expect(resetCloset()).resolves.toEqual({ ok: true });
    await expect(loadCloset()).resolves.toEqual({ ok: true, garments: [] });
  });

  it('reports a write that fails instead of throwing', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('full'));
    await expect(resetCloset()).resolves.toEqual({ ok: false });
  });
});
