import * as FileSystem from 'expo-file-system';

import { keepGarmentPhoto, loadGarmentPhoto, removeGarmentPhoto } from './garmentPhoto';

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
  expect(kept).toEqual({ ok: true, name: 'g9-000000000000001.jpg' });
  expect(disk.files.has('file:///cache/shot.jpg')).toBe(true);
  expect(loadGarmentPhoto('g9')).toMatchObject({
    ok: true,
    uri: 'file:///documents/garments/g9-000000000000001.jpg',
  });
});

it('finds a photograph by garment id after the app container path changes', async () => {
  disk.dirs.add('file:///documents/garments');
  disk.files.add('file:///documents/garments/g9-000000000000001.jpg');
  expect(loadGarmentPhoto('g9')).toEqual({
    ok: true,
    uri: 'file:///documents/garments/g9-000000000000001.jpg',
  });
});

it('replaces an older photograph for the same garment', async () => {
  disk.files.add('file:///cache/one.jpg');
  disk.files.add('file:///cache/two.jpg');
  await keepGarmentPhoto('g9', 'file:///cache/one.jpg', 1);
  const second = await keepGarmentPhoto('g9', 'file:///cache/two.jpg', 2);
  expect(second).toEqual({ ok: true, name: 'g9-000000000000002.jpg' });
  expect([...disk.files].filter((f) => f.includes('/g9-'))).toHaveLength(1);
});

it('fails without losing the photo there was, when a new one cannot be copied', async () => {
  disk.files.add('file:///cache/one.jpg');
  await keepGarmentPhoto('g9', 'file:///cache/one.jpg', 1);
  const before = loadGarmentPhoto('g9');
  disk.failCopy = true;
  disk.files.add('file:///cache/two.jpg');
  await expect(keepGarmentPhoto('g9', 'file:///cache/two.jpg', 2)).resolves.toEqual({ ok: false });
  expect(loadGarmentPhoto('g9')).toEqual(before);
});

it('removes every photograph for that garment', async () => {
  disk.files.add('file:///cache/shot.jpg');
  await keepGarmentPhoto('g9', 'file:///cache/shot.jpg', 1);
  expect(removeGarmentPhoto('g9')).toEqual({ ok: true });
  expect([...disk.files].filter((f) => f.includes('/g9-'))).toHaveLength(0);
});
