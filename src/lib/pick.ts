import AsyncStorage from '@react-native-async-storage/async-storage';

import empty from '../../fixtures/pick-empty.json';
import nothingFits from '../../fixtures/pick-nothing-fits.json';
import day from '../../fixtures/pick.json';
import { dayOf } from './day';
import type { Category, Units, Vibe, Warmth } from './words';

/* The contract in README.md. The app sends words, never what a garment is worth
   (ADR 0002, ADR 0020), and the service decides what to wear and what to say
   about the day (ADR 0019). Nothing in this file decides anything: it carries
   the request out and the answer back (AGENTS.md, rule 1). */
export type Weather = {
  lowC: number;
  highC: number;
  feelsLowC: number;
  feelsHighC: number;
  /* the forecast's own WMO weather code; the words Today prints for it are the
     app's, and the service never reads a word for the sky */
  code: number;
  windKph: number;
  humidity: number;
};

export type PickGarment =
  | { id: string; name: string; category: Exclude<Category, 'Accessories'>; warmth: Warmth }
  | { id: string; name: string; category: 'Accessories'; warmth?: Warmth };

/* An empty closet is still sent: the day's lines are drawn over it (Fig 10b). */
export type PickRequest = { weather: Weather; garments: PickGarment[]; vibe: Vibe; units: Units };

/* SENTENCES, NOT CODES. Each line is drawn as it comes and left out when it is
   empty. On a day nothing owned suits, `fits` is false, `wear` is the closest
   the closet comes and `because` says how far it falls short (Fig 09). An
   answer for an empty closet wears nothing and suits no range. */
export type PickResponse = {
  wear: string[];
  suitsC: { lowC: number; highC: number } | null;
  because: string;
  dayLine: string;
  takeLine: string;
  fits: boolean;
};

/* A FAILURE IS A VALUE, NOT A THROW, so a screen cannot forget the failed state:
   it has to branch on `ok` to reach the answer at all. A failure carries the
   day's last real answer when one is kept for it, and null when none is.
   `noService` is no service address set and a closet the fixtures were not made
   for, which is a state of the build and not a broken answer. */
export type PickFailure = 'network' | 'timeout' | 'status' | 'malformed' | 'noService';

type Asked = { ok: true; response: PickResponse } | { ok: false; failure: PickFailure };

export type PickResult =
  | { ok: true; response: PickResponse }
  | { ok: false; failure: PickFailure; kept: PickResponse | null };

const TIMEOUT_MS = 15000;

const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

const isRange = (v: unknown): boolean => {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  return isNumber(r.lowC) && isNumber(r.highC) && r.lowC <= r.highC;
};

/* THE FIXTURES PASS THE SAME CHECK AS THE SERVICE, so the two cannot drift
   apart without a test failing (ADR 0015). */
export function isPickResponse(v: unknown): v is PickResponse {
  if (typeof v !== 'object' || v === null) return false;
  const r = v as Record<string, unknown>;
  if (!Array.isArray(r.wear) || !r.wear.every((id) => typeof id === 'string')) return false;
  const range = r.wear.length === 0 ? r.suitsC === null : isRange(r.suitsC);
  return (
    range &&
    typeof r.because === 'string' &&
    typeof r.dayLine === 'string' &&
    typeof r.takeLine === 'string' &&
    typeof r.fits === 'boolean'
  );
}

/* AN ANSWER NAMES ONLY GARMENTS IT WAS SENT. One naming any other is a garment
   a screen cannot draw, so it fails as malformed rather than reaching one. */
function accept(request: PickRequest, body: unknown): Asked {
  const sent = new Set(request.garments.map((g) => g.id));
  return isPickResponse(body) && body.wear.every((id) => sent.has(id))
    ? { ok: true, response: body }
    : { ok: false, failure: 'malformed' };
}

/* WITH NO SERVICE ADDRESS, THE ANSWER IS A FIXTURE, which is how every screen is
   built before a service exists (ADR 0021). The answers were made for the
   sample closet in fixtures/closet.json and answer no other, which fails as
   noService, in Celsius whatever the units. An empty closet gets fixtures/pick-empty.json; any
   other gets the day chosen here, fixtures/pick.json until a placeholder or a
   test asks for the day nothing fits. */
export type FixtureDay = 'fits' | 'nothingFits';
let fixtureDay: FixtureDay = 'fits';
export function chooseFixture(next: FixtureDay) {
  fixtureDay = next;
}

/* THE DAY'S LAST REAL ANSWER IS KEPT, AND ONLY FOR THAT DAY AND THAT CLOSET: its
   lines describe that day's weather, and its outfit, or its finding that
   nothing fits, describes the closet it was asked about (ADR 0021). After a
   failed ask it comes back beside the failure only if it was made today for the
   same closet, garment for garment, in the same units, since its sentences print
   degrees. A fixture is never kept, so one can never stand in for a failure. */
const KEPT = 'wardrobe.lastAnswer';

/* a closet as one string, whatever order its garments come in */
const closetOf = (garments: unknown): string | null =>
  Array.isArray(garments)
    ? garments.map((g: Partial<PickGarment>) => JSON.stringify([g.id, g.name, g.category, g.warmth ?? null])).sort().join('\n')
    : null;

async function keep(request: PickRequest, response: PickResponse, now: Date) {
  try {
    await AsyncStorage.setItem(KEPT, JSON.stringify({ day: dayOf(now), closet: closetOf(request.garments), units: request.units, response }));
  } catch {
    /* a kept answer is a courtesy; failing to keep one fails nothing */
  }
}

async function kept(request: PickRequest, now: Date): Promise<PickResponse | null> {
  try {
    const raw = await AsyncStorage.getItem(KEPT);
    const saved = raw === null ? null : (JSON.parse(raw) as { day?: unknown; closet?: unknown; units?: unknown; response?: unknown } | null);
    if (!saved || saved.day !== dayOf(now) || saved.closet !== closetOf(request.garments)) return null;
    if (saved.units !== request.units) return null;
    const still = accept(request, saved.response);
    return still.ok ? still.response : null;
  } catch {
    return null;
  }
}

/* EXPO_PUBLIC_PICK_URL is the service's base address. Expo builds it into the
   app, so it is public by construction and never a secret. */
export const hasService = () => Boolean(process.env.EXPO_PUBLIC_PICK_URL);

export async function pick(
  request: PickRequest,
  {
    url = process.env.EXPO_PUBLIC_PICK_URL,
    timeoutMs = TIMEOUT_MS,
    now = () => new Date(),
  }: { url?: string; timeoutMs?: number; now?: () => Date } = {},
): Promise<PickResult> {
  if (!url) {
    const fixture = request.garments.length === 0 ? empty : fixtureDay === 'fits' ? day : nothingFits;
    const answered = accept(request, fixture);
    return answered.ok ? answered : { ok: false, failure: 'noService', kept: null };
  }
  const asked = await ask(request, url, timeoutMs);
  if (asked.ok) {
    await keep(request, asked.response, now());
    return asked;
  }
  return { ...asked, kept: await kept(request, now()) };
}

/* ONLY WHAT README.md NAMES CROSSES THE WIRE. A screen may hand pick() the
   closet as it is saved, which also carries what stays on the phone: a
   garment's style, and whether it is a favourite (ADR 0027). */
const onTheWire = ({ id, name, category, warmth }: PickGarment) => ({ id, name, category, warmth });

async function ask(request: PickRequest, url: string, timeoutMs: number): Promise<Asked> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const cut = (): Asked => ({ ok: false, failure: controller.signal.aborted ? 'timeout' : 'network' });
  try {
    let response: Response;
    try {
      response = await fetch(url.replace(/\/+$/, '') + '/pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...request, garments: request.garments.map(onTheWire) }),
        signal: controller.signal,
      });
    } catch {
      return cut();
    }
    if (!response.ok) return { ok: false, failure: 'status' };

    /* Read as text first: a body that stops arriving is the network, a body
       that arrives but is not JSON is the service. */
    let text: string;
    try {
      text = await response.text();
    } catch {
      return cut();
    }
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return { ok: false, failure: 'malformed' };
    }
    return accept(request, body);
  } finally {
    clearTimeout(timer);
  }
}
