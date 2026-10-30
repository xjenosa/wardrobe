import * as FileSystem from 'expo-file-system';

import { keepGarmentPhoto, removeGarmentPhoto } from './garmentPhoto';

jest.mock('expo-file-system', () => {
  const disk = { files: new Set<string>(), dirs: new Set<string>(), failCopy: false };
  const uriOf = (parts: (string | { uri: string })[]) => parts.map((p) => (typeof p === 'string' ? p : p.uri)).join('/');
  class File {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = uriOf(parts);
    }
    get exists() {
      return disk.files.has(this.uri);
    }
    async copy(to: File) {
      if (disk.failCopy || !disk.files.has(this.uri)) throw new Error('copy failed');
      disk.files.add(to.uri);
    }
    delete() {
      disk.files.delete(this.uri);
    }
  }
  class Directory {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = uriOf(parts);
    }
    get exists() {
      return disk.dirs.has(this.uri);
    }
    create() {
      disk.dirs.add(this.uri);
    }
    list() {
      return [...disk.files].filter((f) => f.startsWith(this.uri + '/')).map((f) => new File(f));
    }
  }
  return { File, Directory, Paths: { document: { uri: 'file:///documents' } }, mockDisk: disk };
});

const disk = (FileSystem as unknown as { mockDisk: { files: Set<string>; dirs: Set<string>; failCopy: boolean } }).mockDisk;

beforeEach(() => {
  disk.files.clear();
  disk.dirs.clear();
  disk.failCopy = false;
});

it('keeps a photograph under the garment id in the app documents', async () => {
  disk.files.add('file:///cache/shot.jpg');
  const kept = await keepGarmentPhoto('g9', 'file:///cache/shot.jpg', 1);
  expect(kept).toMatchObject({
    ok: true,
    uri: expect.stringMatching(/^file:[/][/][/]documents[/]garments[/]g9-.*[.]jpg$/),
  });
  expect(disk.files.has('file:///cache/shot.jpg')).toBe(true);
});

it('replaces an older photograph for the same garment', async () => {
  disk.files.add('file:///cache/one.jpg');
  disk.files.add('file:///cache/two.jpg');
  await keepGarmentPhoto('g9', 'file:///cache/one.jpg', 1);
  const second = await keepGarmentPhoto('g9', 'file:///cache/two.jpg', 2);
  expect(second.ok && second.uri).toMatch(/g9-.*000000000000002/);
  expect([...disk.files].filter((f) => f.includes('/g9-'))).toHaveLength(1);
});

it('removes every photograph for that garment', async () => {
  disk.files.add('file:///cache/shot.jpg');
  await keepGarmentPhoto('g9', 'file:///cache/shot.jpg', 1);
  expect(removeGarmentPhoto('g9')).toEqual({ ok: true });
  expect([...disk.files].filter((f) => f.includes('/g9-'))).toHaveLength(0);
});
