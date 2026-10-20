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
beforeEach(() => {
  fetchMock = jest.fn();
  globalThis.fetch = fetchMock;
  delete process.env.EXPO_PUBLIC_PICK_URL;
  chooseFixture('fits');
});
afterEach(() => {
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
    await expect(pick(other as PickRequest)).resolves.toEqual({ ok: false, failure: 'noService' });
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

  it('takes its address from EXPO_PUBLIC_PICK_URL', async () => {
    process.env.EXPO_PUBLIC_PICK_URL = URL;
    fetchMock.mockResolvedValue(answer(JSON.stringify(fixture)));
    await expect(pick(request)).resolves.toEqual({ ok: true, response: fixture });
    expect(fetchMock.mock.calls[0][0]).toBe(URL + '/pick');
  });

  it('fails as network when the request never connects', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));
    await expect(pick(request, { url: URL })).resolves.toEqual({ ok: false, failure: 'network' });
  });

  it('fails as network when the connection drops mid-answer', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, text: () => Promise.reject(new TypeError('dropped')) });
    await expect(pick(request, { url: URL })).resolves.toEqual({ ok: false, failure: 'network' });
  });

  it('fails as status when the service errors, or refuses a word', async () => {
    fetchMock.mockResolvedValue(answer('{"error":"vibe"}', 400));
    await expect(pick(request, { url: URL })).resolves.toEqual({ ok: false, failure: 'status' });
  });

  it('fails as malformed when the body is not JSON', async () => {
    fetchMock.mockResolvedValue(answer('<html>gateway</html>'));
    await expect(pick(request, { url: URL })).resolves.toEqual({ ok: false, failure: 'malformed' });
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
    await expect(pick(request, { url: URL })).resolves.toEqual({ ok: false, failure: 'malformed' });
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
    await expect(result).resolves.toEqual({ ok: false, failure: 'timeout' });
  });
});
