import AsyncStorage from '@react-native-async-storage/async-storage';

import empty from '../../fixtures/pick-empty.json';
import nothingFits from '../../fixtures/pick-nothing-fits.json';
import fixture from '../../fixtures/pick.json';
import { chooseFixture, isPickResponse, pick, type PickRequest } from './pick';
import { sampleCloset } from './sample';

const request: PickRequest = {
  weather: { lowC: -4, highC: 2, feelsLowC: -9, feelsHighC: -1, code: 71, windKph: 12, humidity: 78 },
  garments: sampleCloset,
  vibe: 'Everyday',
  units: 'C',
};
const URL = 'https://pick.example';

const answer = (body: string, status = 200) =>
  ({ ok: status >= 200 && status < 300, status, text: () => Promise.resolve(body) }) as unknown as Response;

let fetchMock: jest.Mock;
beforeEach(async () => {
  await AsyncStorage.clear();
  fetchMock = jest.fn();
  globalThis.fetch = fetchMock;
  delete process.env.EXPO_PUBLIC_PICK_URL;
  chooseFixture('fits');
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
  delete process.env.EXPO_PUBLIC_PICK_URL;
});

describe('pick() with no service', () => {
  it('answers the sample closet with the fixture', async () => {
    await expect(pick(request)).resolves.toEqual({ ok: true, response: fixture });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('answers with the day nothing fits when asked to (Fig 09)', async () => {
    chooseFixture('nothingFits');
    await expect(pick(request)).resolves.toEqual({ ok: true, response: nothingFits });
  });

  it('answers an empty closet with the day and nothing to wear (Fig 10b)', async () => {
    await expect(pick({ ...request, garments: [] })).resolves.toEqual({ ok: true, response: empty });
  });

  it.each([
    ['the day', fixture],
    ['the day nothing fits', nothingFits],
    ['the empty closet', empty],
  ])('holds the fixture for %s to the same check as a real answer', (_day, body) => {
    expect(isPickResponse(body)).toBe(true);
  });

  it('fails as noService for any other closet, not as a broken answer', async () => {
    const other = { ...request, garments: [{ id: 'x1', name: 'Camel topcoat', category: 'Outerwear', warmth: 'Warm' }] };
    await expect(pick(other as PickRequest)).resolves.toEqual({ ok: false, failure: 'noService', kept: null });
  });
});

describe('pick() with a service', () => {
  it('posts the request as JSON to /pick and returns the answer', async () => {
    fetchMock.mockResolvedValue(answer(JSON.stringify(fixture)));
    await expect(pick(request, { url: URL + '/' })).resolves.toEqual({ ok: true, response: fixture });
    const [calledUrl, init] = fetchMock.mock.calls[0];
    expect(calledUrl).toBe(URL + '/pick');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toEqual(request);
  });

  it('sends each garment as README.md names it, and nothing the phone keeps for itself', async () => {
    fetchMock.mockResolvedValue(answer(JSON.stringify(fixture)));
    const saved = sampleCloset.map((g) => ({ ...g, style: 'Everyday', favourite: true }));
    await pick({ ...request, garments: saved }, { url: URL });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).garments).toEqual(sampleCloset);
  });

  it('takes its address from EXPO_PUBLIC_PICK_URL', async () => {
    process.env.EXPO_PUBLIC_PICK_URL = URL;
    fetchMock.mockResolvedValue(answer(JSON.stringify(fixture)));
    await expect(pick(request)).resolves.toEqual({ ok: true, response: fixture });
    expect(fetchMock.mock.calls[0][0]).toBe(URL + '/pick');
  });

  it('fails as network when the request never connects', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await expect(pick(request, { url: URL })).resolves.toEqual({ ok: false, failure: 'network', kept: null });
  });

  it('fails as network when the connection drops mid-answer', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, text: () => Promise.reject(new TypeError('dropped')) });
    await expect(pick(request, { url: URL })).resolves.toEqual({ ok: false, failure: 'network', kept: null });
  });

  it('fails as status when the service errors, or refuses a word', async () => {
    fetchMock.mockResolvedValue(answer('{"error":"vibe"}', 400));
    await expect(pick(request, { url: URL })).resolves.toEqual({ ok: false, failure: 'status', kept: null });
  });

  it('fails as malformed when the body is not JSON', async () => {
    fetchMock.mockResolvedValue(answer('<html>gateway</html>'));
    await expect(pick(request, { url: URL })).resolves.toEqual({ ok: false, failure: 'malformed', kept: null });
  });

  /* Each is the fixture with one thing wrong, so each line fails for one reason. */
  it.each([
    ['no suits range', { ...fixture, suitsC: undefined }],
    ['no suits range for an outfit', { ...fixture, suitsC: null }],
    ['a suits range for an empty outfit', { ...empty, suitsC: fixture.suitsC }],
    ['a range with no high end', { ...fixture, suitsC: { lowC: -3 } }],
    ['a range whose low end is above its high end', { ...fixture, suitsC: { lowC: 5, highC: -3 } }],
    ['a wear that is not a list', { ...fixture, wear: 'g1' }],
    ['a wear naming a garment it was not sent', { ...fixture, wear: ['g1', 'x9'] }],
    ['a because that is not words', { ...fixture, because: 3 }],
    ['no day line', { ...fixture, dayLine: undefined }],
    ['a take-along line that is not words', { ...fixture, takeLine: null }],
    ['no fits', { ...fixture, fits: undefined }],
    ['a fits that is not true or false', { ...fixture, fits: 'yes' }],
  ])('fails as malformed for %s', async (_case, body) => {
    fetchMock.mockResolvedValue(answer(JSON.stringify(body)));
    await expect(pick(request, { url: URL })).resolves.toEqual({ ok: false, failure: 'malformed', kept: null });
  });

  it('refuses a wear holding something other than an id', () => {
    expect(isPickResponse({ ...fixture, wear: ['g1', 2] })).toBe(false);
  });

  it('fails as timeout when the service does not answer in time', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    const result = pick(request, { url: URL, timeoutMs: 1000 });
    jest.advanceTimersByTime(1000);
    await expect(result).resolves.toEqual({ ok: false, failure: 'timeout', kept: null });
  });
});

describe('pick() after a failed ask', () => {
  const thursday = () => new Date(2027, 0, 7, 8, 0);
  const later = () => new Date(2027, 0, 7, 17, 30);
  const friday = () => new Date(2027, 0, 8, 7, 0);
  const askedOnce = async () => {
    fetchMock.mockResolvedValueOnce(answer(JSON.stringify(fixture)));
    await expect(pick(request, { url: URL, now: thursday })).resolves.toEqual({ ok: true, response: fixture });
  };

  it("hands back the day's last real answer beside the failure", async () => {
    await askedOnce();
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(pick(request, { url: URL, now: later })).resolves.toEqual({ ok: false, failure: 'network', kept: fixture });
  });

  it('never hands back an answer made on another day', async () => {
    await askedOnce();
    fetchMock.mockResolvedValueOnce(answer('{}', 503));
    await expect(pick(request, { url: URL, now: friday })).resolves.toEqual({ ok: false, failure: 'status', kept: null });
  });

  it('hands it back for the same closet in another order', async () => {
    await askedOnce();
    const reordered = { ...request, garments: [...sampleCloset].reverse() };
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(pick(reordered, { url: URL, now: later })).resolves.toEqual({ ok: false, failure: 'network', kept: fixture });
  });

  /* An outfit, or the finding that nothing fits, is about the closet it was asked for. */
  it.each([
    ['a garment is gone', sampleCloset.filter((g) => g.id !== 'g4')],
    ['a garment is added', [...sampleCloset, { id: 'g6', name: 'Camel topcoat', category: 'Outerwear', warmth: 'Warm' }]],
    ['a garment is rated warmer', sampleCloset.map((g) => (g.id === 'g3' ? { ...g, warmth: 'Warm' } : g))],
    ['a garment is renamed', sampleCloset.map((g) => (g.id === 'g1' ? { ...g, name: 'Navy coat' } : g))],
  ])('never hands it back once %s', async (_change, garments) => {
    await askedOnce();
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    const changed = { ...request, garments: garments as PickRequest['garments'] };
    await expect(pick(changed, { url: URL, now: later })).resolves.toEqual({ ok: false, failure: 'network', kept: null });
  });

  it('never hands it back in other units, since its sentences print degrees', async () => {
    await askedOnce();
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(pick({ ...request, units: 'F' }, { url: URL, now: later })).resolves.toEqual({
      ok: false,
      failure: 'network',
      kept: null,
    });
  });

  it("never hands back an empty closet's answer once garments are added", async () => {
    fetchMock.mockResolvedValueOnce(answer(JSON.stringify(empty)));
    await pick({ ...request, garments: [] }, { url: URL, now: thursday });
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(pick(request, { url: URL, now: later })).resolves.toEqual({ ok: false, failure: 'network', kept: null });
  });

  it('never keeps a fixture, so one cannot stand in for a failure', async () => {
    await pick(request, { url: '', now: thursday });
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(pick(request, { url: URL, now: later })).resolves.toEqual({ ok: false, failure: 'network', kept: null });
  });

  it('ignores a kept answer that is not the contract', async () => {
    await AsyncStorage.setItem('wardrobe.lastAnswer', JSON.stringify({ day: '2027-01-07', response: { wear: 'g1' } }));
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(pick(request, { url: URL, now: later })).resolves.toEqual({ ok: false, failure: 'network', kept: null });
  });

  it('still fails plainly when the kept answer cannot be read', async () => {
    await askedOnce();
    jest.spyOn(AsyncStorage, 'getItem').mockRejectedValueOnce(new Error('disk'));
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));
    await expect(pick(request, { url: URL, now: later })).resolves.toEqual({ ok: false, failure: 'network', kept: null });
  });

  it('still answers when the answer cannot be kept', async () => {
    jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('full'));
    fetchMock.mockResolvedValueOnce(answer(JSON.stringify(fixture)));
    await expect(pick(request, { url: URL, now: thursday })).resolves.toEqual({ ok: true, response: fixture });
  });
});