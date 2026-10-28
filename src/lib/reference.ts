import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

/* THE REFERENCE PHOTO IS ONE FILE IN THE APP'S OWN DOCUMENTS (ADR 0025), where
   the system does not clear it, unlike the picker's copy in the cache. Each
   photo gets a new name, so a picture already on screen is never the old one
   under a new file, and the newest is the one kept. Nothing reads it but the
   screens that show it; it leaves the phone only once a render sends it.

   Every call fails as a value, never a throw, so a screen has to say so. */
const folder = () => new Directory(Paths.document, 'reference');
const photos = (dir: Directory) =>
  dir
    .list()
    .filter((f): f is File => f instanceof File)
    .sort((a, b) => a.uri.localeCompare(b.uri));

export type Kept = { ok: true; uri: string | null } | { ok: false };

export function loadReference(): Kept {
  try {
    const dir = folder();
    if (!dir.exists) return { ok: true, uri: null };
    return { ok: true, uri: photos(dir).at(-1)?.uri ?? null };
  } catch {
    return { ok: false };
  }
}

/* A copy is made before anything older goes, so a failed copy keeps the
   photo there was. */
export async function keepReference(from: string, now = Date.now()): Promise<{ ok: boolean }> {
  try {
    const dir = folder();
    if (!dir.exists) dir.create();
    const kept = new File(dir, 'photo-' + String(now).padStart(15, '0') + (from.match(/[.][a-z0-9]+$/i)?.[0] ?? '.jpg'));
    await new File(from).copy(kept);
    for (const older of photos(dir)) if (older.uri !== kept.uri) older.delete();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export function removeReference(): { ok: boolean } {
  try {
    const dir = folder();
    if (dir.exists) for (const photo of photos(dir)) photo.delete();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/* What came of asking for a photo. `refused` is the camera not allowed, which
   trying again cannot fix; `failed` is anything else that went wrong. */
export type Asked = 'kept' | 'cancelled' | 'refused' | 'failed';

export async function pickReference(from: 'camera' | 'library'): Promise<Asked> {
  try {
    if (from === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) return 'refused';
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
    const result =
      from === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    const photo = result.canceled ? undefined : result.assets[0];
    if (!photo) return 'cancelled';
    return (await keepReference(photo.uri)).ok ? 'kept' : 'failed';
  } catch {
    return 'failed';
  }
}
