import { Directory, File, Paths } from 'expo-file-system';

/* A GARMENT'S PHOTOGRAPH, ONE FILE PER ID in the app's documents (ADR 0028),
   the same pattern as the reference photo (ADR 0025). The closet stores the
   file name, or nothing; the bytes are found by garment id when they are read,
   so an iOS container move does not leave every URI pointing nowhere.

   Every call fails as a value, never a throw, so a screen has to say so. */
const folder = () => new Directory(Paths.document, 'garments');

const photosFor = (id: string, dir: Directory) =>
  dir
    .list()
    .filter((f): f is File => f instanceof File && f.uri.includes('/' + id + '-'))
    .sort((a, b) => a.uri.localeCompare(b.uri));

export function loadGarmentPhoto(id: string): { ok: true; uri: string | null } | { ok: false } {
  try {
    const dir = folder();
    if (!dir.exists) return { ok: true, uri: null };
    return { ok: true, uri: photosFor(id, dir).at(-1)?.uri ?? null };
  } catch {
    return { ok: false };
  }
}

/* A copy is made before anything older goes, so a failed copy keeps the
   photo there was. */
export async function keepGarmentPhoto(
  id: string,
  from: string,
  now = Date.now(),
): Promise<{ ok: true; name: string } | { ok: false }> {
  try {
    const dir = folder();
    if (!dir.exists) dir.create();
    const ext = from.match(/[.][a-z0-9]+$/i)?.[0] ?? '.jpg';
    const name = id + '-' + String(now).padStart(15, '0') + ext;
    const kept = new File(dir, name);
    await new File(from).copy(kept);
    for (const older of photosFor(id, dir)) {
      if (older.uri !== kept.uri) older.delete();
    }
    return { ok: true, name };
  } catch {
    return { ok: false };
  }
}

export function removeGarmentPhoto(id: string): { ok: boolean } {
  try {
    const dir = folder();
    if (!dir.exists) return { ok: true };
    for (const file of photosFor(id, dir)) file.delete();
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
