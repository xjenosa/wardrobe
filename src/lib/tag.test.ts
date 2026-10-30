import fixture from '../../fixtures/tag.json';
import { isTagResponse, tag } from './tag';

describe('isTagResponse()', () => {
  it('accepts the fixture', () => {
    expect(isTagResponse(fixture)).toBe(true);
  });

  it('rejects a warmth that is not a drawn word', () => {
    expect(isTagResponse({ ...fixture, warmth: 'Fleece' })).toBe(false);
  });

  it('rejects an empty name', () => {
    expect(isTagResponse({ ...fixture, name: '  ' })).toBe(false);
  });
});

describe('tag()', () => {
  it('answers from the fixture when no service address is set', async () => {
    await expect(tag('file:///cache/shot.jpg', { url: '' })).resolves.toEqual({ ok: true, response: fixture });
  });

  it('posts the photograph to /tag when an address is set', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(fixture),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(tag('file:///cache/shot.jpg', { url: 'https://tag.example/' })).resolves.toEqual({
      ok: true,
      response: fixture,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://tag.example/tag',
      expect.objectContaining({ method: 'POST', body: expect.any(FormData) }),
    );
  });

  it('fails as status when the service answers with an error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    await expect(tag('file:///cache/shot.jpg', { url: 'https://tag.example' })).resolves.toEqual({
      ok: false,
      failure: 'status',
    });
  });
});
