import { Directory, File, Paths } from 'expo-file-system';

/* A GARMENT'S PHOTOGRAPH, ONE FILE PER ID in the app's documents (ADR 0028),
   the same pattern as the reference photo (ADR 0025). The closet stores the
   URI; the bytes live here so the picker's cache can go without losing them.

   Every call fails as a value, never a throw, so a screen has to say so. */
const folder = () => new Directory(Paths.document, 'garments');

export async function keepGarmentPhoto(id: string, from: string, now = Date.now()): Promise<{ ok: true; uri: string } | { ok: false }> {
  try {
    const dir = folder();
    if (!dir.exists) dir.create();
    const ext = from.match(/[.][a-z0-9]+$/i)?.[0] ?? '.jpg';
    const kept = new File(dir, id + '-' + String(now).padStart(15, '0') + ext);
    await new File(from).copy(kept);
    for (const older of dir.list()) {
      if (!(older instanceof File)) continue;
      if (older.uri === kept.uri) continue;
      if (older.uri.includes('/' + id + '-')) older.delete();
    }
    return { ok: true, uri: kept.uri };
  } catch {
    return { ok: false };
  }
}

export function removeGarmentPhoto(id: string): { ok: boolean } {
  try {
    const dir = folder();
    if (!dir.exists) return { ok: true };
    for (const file of dir.list()) {
      if (file instanceof File && file.uri.includes('/' + id + '-')) file.delete();
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
