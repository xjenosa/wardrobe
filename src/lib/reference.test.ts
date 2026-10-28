import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import { keepReference, loadReference, pickReference, removeReference } from './reference';

/* A phone's file system in memory, with what exists and a switch that makes
   the next copy fail the way a full disk would. */
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

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
}));

const disk = (FileSystem as unknown as { mockDisk: { files: Set<string>; dirs: Set<string>; failCopy: boolean } }).mockDisk;
const picker = jest.mocked(ImagePicker);
const taken = (uri: string) => {
  disk.files.add(uri);
  return { canceled: false, assets: [{ uri, width: 1, height: 1 }] } as unknown as ImagePicker.ImagePickerResult;
};

beforeEach(() => {
  disk.files.clear();
  disk.dirs.clear();
  disk.failCopy = false;
  jest.clearAllMocks();
  picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: true } as ImagePicker.CameraPermissionResponse);
});

it('has no photo on a first run', () => {
  expect(loadReference()).toEqual({ ok: true, uri: null });
});

it("keeps a chosen photo in the app's own documents, not the picker's cache", async () => {
  picker.launchImageLibraryAsync.mockResolvedValue(taken('file:///cache/picked.jpg'));
  await expect(pickReference('library')).resolves.toBe('kept');
  const kept = loadReference();
  expect(kept).toMatchObject({ ok: true, uri: expect.stringMatching(/^file:[/][/][/]documents[/]reference[/]photo-.*[.]jpg$/) });
});

it('asks for the camera before opening it, and opens nothing when it is refused', async () => {
  picker.requestCameraPermissionsAsync.mockResolvedValue({ granted: false } as ImagePicker.CameraPermissionResponse);
  await expect(pickReference('camera')).resolves.toBe('refused');
  expect(picker.launchCameraAsync).not.toHaveBeenCalled();
  expect(loadReference()).toEqual({ ok: true, uri: null });
});

it('keeps nothing when the person backs out of the picker', async () => {
  picker.launchCameraAsync.mockResolvedValue({ canceled: true, assets: null });
  await expect(pickReference('camera')).resolves.toBe('cancelled');
  expect(loadReference()).toEqual({ ok: true, uri: null });
});

it('keeps only the newest photo', async () => {
  await keepReference(taken('file:///cache/one.jpg').assets![0].uri, 1);
  await keepReference(taken('file:///cache/two.png').assets![0].uri, 2);
  const inside = [...disk.files].filter((f) => f.includes('/reference/'));
  expect(inside).toHaveLength(1);
  expect(loadReference()).toMatchObject({ uri: expect.stringMatching(/[.]png$/) });
});

it('fails without losing the photo there was, when a new one cannot be copied', async () => {
  await keepReference(taken('file:///cache/one.jpg').assets![0].uri, 1);
  const before = loadReference();
  disk.failCopy = true;
  picker.launchImageLibraryAsync.mockResolvedValue(taken('file:///cache/two.jpg'));
  await expect(pickReference('library')).resolves.toBe('failed');
  expect(loadReference()).toEqual(before);
});

it('fails as a value when the picker itself throws', async () => {
  picker.launchCameraAsync.mockRejectedValue(new Error('no camera on a simulator'));
  await expect(pickReference('camera')).resolves.toBe('failed');
});

it('removes the photo, and removing none is not a failure', async () => {
  expect(removeReference()).toEqual({ ok: true });
  await keepReference(taken('file:///cache/one.jpg').assets![0].uri, 1);
  expect(removeReference()).toEqual({ ok: true });
  expect(loadReference()).toEqual({ ok: true, uri: null });
});
