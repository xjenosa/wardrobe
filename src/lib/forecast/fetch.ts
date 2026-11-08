import AsyncStorage from '@react-native-async-storage/async-storage';

import { isForecast, type Forecast, type ForecastFailure, type ForecastState, type Hour } from './types';

/* THE FORECAST FROM OPEN-METEO (ADR 0030): free, no account and no key, so
   nothing secret is built into the app. Two requests, the forecast and the air
   quality, at the place's coordinates and in its own time zone. Nothing here
   reads the weather for clothing (AGENTS.md, rule 1): it carries numbers into
   the shape in types.ts and keeps the last good one. */

export type Coords = { latitude: number; longitude: number };

const FORECAST = 'https://api.open-meteo.com/v1/forecast';
const AIR = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const NOW = ['temperature_2m', 'apparent_temperature', 'weather_code', 'wind_speed_10m', 'relative_humidity_2m'];
const HOURLY = ['temperature_2m', 'apparent_temperature', 'weather_code', 'precipitation_probability', 'precipitation'];
const DAILY = ['temperature_2m_min', 'temperature_2m_max', 'apparent_temperature_min', 'apparent_temperature_max', 'weather_code', 'uv_index_max'];

const TIMEOUT_MS = 15000;
const KEPT = 'wardrobe.forecast';

const query = (base: string, at: Coords, fields: Record<string, string[]>) =>
  base +
  '?' +
  new URLSearchParams({
    latitude: String(at.latitude),
    longitude: String(at.longitude),
    timezone: 'auto',
    ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.join(',')])),
  }).toString();

type Asked = { ok: true; body: unknown } | { ok: false; failure: Exclude<ForecastFailure, 'location'> };

async function ask(url: string, timeoutMs: number): Promise<Asked> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const cut = (): Asked => ({ ok: false, failure: controller.signal.aborted ? 'timeout' : 'network' });
  try {
    let response: Response;
    try {
      response = await fetch(url, { signal: controller.signal });
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
    try {
      return { ok: true, body: JSON.parse(text) };
    } catch {
      return { ok: false, failure: 'malformed' };
    }
  } finally {
    clearTimeout(timer);
  }
}

type Columns = Record<string, unknown[] | undefined>;
const at = (v: unknown, i: number) => (Array.isArray(v) ? v[i] : undefined);

/* Open-Meteo's answer as the shape, or null where any part is missing. The
   hours start at the one the forecast was fetched in, a day of them; the
   check in types.ts is the last word on whether it is a forecast. */
function toForecast(body: unknown, airQuality: number | null, fetchedAt: string): Forecast | null {
  const b = body as { timezone?: unknown; current?: Record<string, unknown>; hourly?: Columns; daily?: Columns } | null;
  if (!b?.current || !b.hourly || !b.daily || typeof b.current.time !== 'string') return null;
  const { current: c, hourly: h, daily: d } = b;
  const hour = (c.time as string).slice(0, 13) + ':00';
  const times = Array.isArray(h.time) ? h.time : [];
  const first = times.findIndex((t) => typeof t === 'string' && t >= hour);
  const hours: Hour[] = first < 0 ? [] : times.slice(first, first + 24).map((t, j) => ({
    at: t as string,
    tempC: at(h.temperature_2m, first + j) as number,
    feelsC: at(h.apparent_temperature, first + j) as number,
    code: at(h.weather_code, first + j) as number,
    precipChance: at(h.precipitation_probability, first + j) as number,
    precipMm: at(h.precipitation, first + j) as number,
  }));
  const forecast = {
    fetchedAt,
    timezone: b.timezone,
    now: {
      tempC: c.temperature_2m,
      feelsC: c.apparent_temperature,
      code: c.weather_code,
      windKph: c.wind_speed_10m,
      humidity: c.relative_humidity_2m,
      airQuality,
    },
    day: {
      date: at(d.time, 0),
      lowC: at(d.temperature_2m_min, 0),
      highC: at(d.temperature_2m_max, 0),
      feelsLowC: at(d.apparent_temperature_min, 0),
      feelsHighC: at(d.apparent_temperature_max, 0),
      code: at(d.weather_code, 0),
      uvIndexMax: at(d.uv_index_max, 0),
    },
    hours,
  };
  return isForecast(forecast) ? forecast : null;
}

/* Air quality is a row on Weather, not the forecast: when it fails, the
   forecast carries null rather than failing with it. */
async function airQualityAt(where: Coords, timeoutMs: number): Promise<number | null> {
  const asked = await ask(query(AIR, where, { current: ['european_aqi'] }), timeoutMs);
  const aqi = asked.ok ? (asked.body as { current?: { european_aqi?: unknown } } | null)?.current?.european_aqi : null;
  return typeof aqi === 'number' && Number.isFinite(aqi) ? aqi : null;
}

/* THE LAST GOOD FORECAST IS KEPT WITH THE PLACE IT IS FOR, so a stale one names
   its own place rather than wherever the phone is now. Only a forecast that
   passed the check is written, so a failed refresh can never write over it,
   and one that cannot be read back is treated as none. */
type Kept = { place: string | null; forecast: Forecast };

async function keep(kept: Kept) {
  try {
    await AsyncStorage.setItem(KEPT, JSON.stringify(kept));
  } catch {
    /* failing to keep it fails nothing now; the next refresh keeps it */
  }
}

async function kept(): Promise<Kept | null> {
  try {
    const raw = await AsyncStorage.getItem(KEPT);
    const saved = raw === null ? null : (JSON.parse(raw) as Partial<Kept> | null);
    if (!saved || !isForecast(saved.forecast)) return null;
    return { place: typeof saved.place === 'string' ? saved.place : null, forecast: saved.forecast };
  } catch {
    return null;
  }
}

/* Ask for the forecast at a place already found. The place's name rides along
   to be kept with it. */
export async function refreshAt(
  where: Coords,
  place: string | null,
  { now = () => new Date(), timeoutMs = TIMEOUT_MS }: { now?: () => Date; timeoutMs?: number } = {},
): Promise<ForecastState> {
  const [asked, airQuality] = await Promise.all([
    ask(query(FORECAST, where, { current: NOW, hourly: HOURLY, daily: DAILY, forecast_days: ['2'] }), timeoutMs),
    airQualityAt(where, timeoutMs),
  ]);
  const forecast = asked.ok ? toForecast(asked.body, airQuality, now().toISOString()) : null;
  if (forecast) {
    await keep({ place, forecast });
    return { state: 'fresh', place, forecast };
  }
  const failure = asked.ok ? 'malformed' : asked.failure;
  const last = await kept();
  return last ? { state: 'stale', place: last.place, forecast: last.forecast, failure } : { state: 'none', place, failure };
}
