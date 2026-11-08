# 0030. The forecast comes from Open-Meteo, and the last good one is kept

Status: Accepted, 2026-11-07.

## Context

**Today and Weather need a forecast, and this repository is public.** A source
that needs an account needs a key, and Expo builds any key into the app, where
anyone can read it (AGENTS.md: no secrets). README.md already credits
Open-Meteo for the hourly forecast.

## Decision

**`src/lib/forecast/` asks Open-Meteo, which needs no account and no key.** Two
requests at the place's coordinates, in its own time zone: the forecast (now,
the day and 48 hours) and the air quality, a second host. A failed air quality
leaves its row empty rather than losing the forecast.

**The last good forecast is kept on the phone with the place it is for.** A
refresh that fails hands it back as stale, naming its own place and carrying
the time it was fetched; with nothing kept it is `none`, Fig 14d and Fig 11.
Only a forecast that passed the shape check is written, so a failed refresh
never writes over the last good one.

**It carries numbers, never a reading of them.** Nothing in it decides what
the weather means for clothing (ADR 0001).

**PREMISE:** Open-Meteo stays free without an account for a non-commercial
project, under CC BY 4.0 with the credit README.md gives. If it starts needing
a key, the app is sold, or it stops answering often enough to matter, this is
re-read, and a key would need a server of our own to hide it.

## Consequences

- `refreshAt(coords, place)` is the fetch. `refreshForecast()` keeps answering
  from the fixture until the place is found, which is its own decision.
- A kept forecast is replaced only by a newer good one. Nothing clears it.
- Tests answer from Open-Meteo's own shape, recorded from a real request, and
  never reach the network (ADR 0015).

## What would show this was wrong

**A forecast that is wrong often enough for the team to notice**, or a stale
forecast shown so often that its time is all a person reads.
