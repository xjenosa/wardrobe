import fixture from '../../fixtures/tag.json';
import { hasTagService, isTagResponse, tag } from './tag';

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
  it('fails as noService when no service address is set', async () => {
    await expect(tag('file:///cache/shot.jpg', { url: '' })).resolves.toEqual({ ok: false, failure: 'noService' });
  });

  it('reports whether a tagging address is set', () => {
    expect(typeof hasTagService()).toBe('boolean');
  });

  it('posts the photograph to /tag with its real name and type', async () => {
    const appended: unknown[] = [];
    const FormDataMock = jest.fn().mockImplementation(() => ({
      append: (_key: string, value: unknown) => {
        appended.push(value);
      },
    }));
    global.FormData = FormDataMock as unknown as typeof FormData;
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify(fixture),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    await expect(tag('file:///cache/coat.png', { url: 'https://tag.example/' })).resolves.toEqual({
      ok: true,
      response: fixture,
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://tag.example/tag',
      expect.objectContaining({ method: 'POST', body: expect.any(Object) }),
    );
    expect(appended[0]).toEqual({ uri: 'file:///cache/coat.png', name: 'coat.png', type: 'image/png' });
  });

  it('fails as status when the service answers with an error', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;
    await expect(tag('file:///cache/shot.jpg', { url: 'https://tag.example' })).resolves.toEqual({
      ok: false,
      failure: 'status',
    });
  });
});
