/* THE FORECAST, AS TODAY AND WEATHER READ IT. Weather (Figs 14 and 14d) builds
   against this shape before the fetch exists, from fixture.json beside it.
   Nothing here is about clothing (AGENTS.md, rule 1): the pick request's
   weather is cut from this later, and the service decides what it means.

   Numbers are metric whatever the units setting: Celsius, km/h, mm. A screen
   converts for display. Times are the place's own wall clock, as Open-Meteo
   gives them ("2026-01-08T09:00", no offset), because the hours a screen
   draws are the place's hours. */

/* One hour, from the hourly strip and the precipitation chart (Fig 14). */
export type Hour = {
  at: string;
  tempC: number;
  feelsC: number;
  /* the WMO weather code; the words and the icon for it are the app's */
  code: number;
  /* 0 to 100 */
  precipChance: number;
  precipMm: number;
};

export type Forecast = {
  /* an instant with its offset, so a kept forecast can say when it was fetched
     (docs/States.md, Weather, Stale) */
  fetchedAt: string;
  /* the place's IANA time zone, which the times below are in */
  timezone: string;
  /* the hour the forecast was fetched in: Fig 14's hero and its rows */
  now: {
    tempC: number;
    feelsC: number;
    code: number;
    windKph: number;
    /* 0 to 100 */
    humidity: number;
    /* the European AQI. Air quality is a second request, and null when it
       failed, since a missing row is no reason to lose the forecast. */
    airQuality: number | null;
  };
  /* the calendar day: Fig 14's High and Low, and the day Today picks for */
  day: {
    date: string;
    lowC: number;
    highC: number;
    feelsLowC: number;
    feelsHighC: number;
    code: number;
    uvIndexMax: number;
  };
  /* hour by hour from the hour it was fetched in, at least a day of them */
  hours: Hour[];
};

/* Why a refresh failed. `location` is the phone not saying where it is,
   refused or unknown, which ADR 0003 counts as the forecast failing; the ADR
   that adds location settles what it shows. */
export type ForecastFailure = 'location' | 'network' | 'timeout' | 'status' | 'malformed';

/* THE THREE STATES A SCREEN DRAWS, and a failure is one of them rather than a
   throw, as pick()'s is.

     fresh  the refresh worked                        Fig 14, Today
     stale  it failed, and the last forecast is kept   Weather's Stale row,
            with the time it was fetched               docs/States.md
     none   it failed, and nothing is kept             Fig 14d, Fig 11

   The place is in all three, beside the forecast rather than in it: Figs 11
   and 14d name the place with no forecast to show. It is null until something
   finds it. A stale forecast cannot be drawn without its time, since the time
   is in it (`forecast.fetchedAt`). */
export type ForecastState =
  | { state: 'fresh'; place: string | null; forecast: Forecast }
  | { state: 'stale'; place: string | null; forecast: Forecast; failure: ForecastFailure }
  | { state: 'none'; place: string | null; failure: ForecastFailure };

const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isPercent = (v: unknown) => isNumber(v) && v >= 0 && v <= 100;
const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

const LOCAL_HOUR = /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:00$/;
const DATE = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

function isHour(v: unknown): v is Hour {
  return (
    isRecord(v) &&
    typeof v.at === 'string' &&
    LOCAL_HOUR.test(v.at) &&
    isNumber(v.tempC) &&
    isNumber(v.feelsC) &&
    Number.isInteger(v.code) &&
    isPercent(v.precipChance) &&
    isNumber(v.precipMm) &&
    v.precipMm >= 0
  );
}

/* THE FIXTURE PASSES THE SAME CHECK AS THE FETCH WILL, so the two cannot drift
   apart without a test failing (ADR 0015). */
export function isForecast(v: unknown): v is Forecast {
  if (!isRecord(v) || !isRecord(v.now) || !isRecord(v.day) || !Array.isArray(v.hours)) return false;
  const { now, day, hours } = v;
  return (
    typeof v.fetchedAt === 'string' &&
    !Number.isNaN(Date.parse(v.fetchedAt)) &&
    typeof v.timezone === 'string' &&
    v.timezone !== '' &&
    isNumber(now.tempC) &&
    isNumber(now.feelsC) &&
    Number.isInteger(now.code) &&
    isNumber(now.windKph) &&
    isPercent(now.humidity) &&
    (now.airQuality === null || isNumber(now.airQuality)) &&
    typeof day.date === 'string' &&
    DATE.test(day.date) &&
    isNumber(day.lowC) &&
    isNumber(day.highC) &&
    day.lowC <= day.highC &&
    isNumber(day.feelsLowC) &&
    isNumber(day.feelsHighC) &&
    day.feelsLowC <= day.feelsHighC &&
    Number.isInteger(day.code) &&
    isNumber(day.uvIndexMax) &&
    hours.length >= 24 &&
    hours.every(isHour) &&
    hours.every((h, i) => i === 0 || (h as Hour).at > (hours[i - 1] as Hour).at)
  );
}
