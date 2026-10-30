import fixture from '../../fixtures/tag.json';
import { hasGarmentWords, isOneOf, vibes, type Category, type Vibe, type Warmth } from './words';

/* THE TAGGING CONTRACT IN README.md (ADR 0028). The app sends the photograph;
   the service answers with Fig 18's words. Nothing here decides warmth as a
   number: the words are the whole answer (AGENTS.md, rule 1). */
export type TagResponse = {
  name: string;
  category: Category;
  warmth?: Warmth;
  style?: Vibe;
};

export type TagFailure = 'network' | 'timeout' | 'status' | 'malformed' | 'noService';

export type TagResult = { ok: true; response: TagResponse } | { ok: false; failure: TagFailure };

const TIMEOUT_MS = 15000;

export function isTagResponse(v: unknown): v is TagResponse {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  if (typeof r.name !== 'string' || !r.name.trim()) return false;
  if (!hasGarmentWords({ category: r.category, warmth: r.warmth })) return false;
  if (r.style !== undefined && !isOneOf(vibes, r.style)) return false;
  return true;
}

/* EXPO_PUBLIC_TAG_URL is the tagging service's base address. Public by
   construction, like EXPO_PUBLIC_PICK_URL. */
export const hasTagService = () => Boolean(process.env.EXPO_PUBLIC_TAG_URL);

export async function tag(
  photoUri: string,
  {
    url = process.env.EXPO_PUBLIC_TAG_URL,
    timeoutMs = TIMEOUT_MS,
  }: { url?: string; timeoutMs?: number } = {},
): Promise<TagResult> {
  if (!url) {
    return isTagResponse(fixture) ? { ok: true, response: fixture } : { ok: false, failure: 'noService' };
  }
  return ask(photoUri, url, timeoutMs);
}

async function ask(photoUri: string, url: string, timeoutMs: number): Promise<TagResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const cut = (): TagResult => ({ ok: false, failure: controller.signal.aborted ? 'timeout' : 'network' });
  try {
    const body = new FormData();
    body.append('photo', { uri: photoUri, name: 'garment.jpg', type: 'image/jpeg' } as unknown as Blob);
    let response: Response;
    try {
      response = await fetch(url.replace(/\/+$/, '') + '/tag', {
        method: 'POST',
        body,
        signal: controller.signal,
      });
    } catch {
      return cut();
    }
    if (!response.ok) return { ok: false, failure: 'status' };
    let text: string;
    try {
      text = await response.text();
    } catch {
      return cut();
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return { ok: false, failure: 'malformed' };
    }
    return isTagResponse(parsed) ? { ok: true, response: parsed } : { ok: false, failure: 'malformed' };
  } finally {
    clearTimeout(timer);
  }
}
