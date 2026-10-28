# 0026. You keeps the units, and draws what it cannot set yet

Status: Accepted, 2026-10-28.

## Context

**Fig 23 draws five settings in two sections.** Units, Reset preferences and
the reference photo have something behind them now. Units is a word the
request already carries (README.md), and the photo is the one First run keeps
(ADR 0025). Location and the image model's key do not. Each is drawn as a value
that opens a chooser, and no plate draws either chooser. The place is the
forecast's to find (track B), and nothing yet takes a key.

## Decision

**Units is kept on the phone by `src/lib/prefs.ts`**, Celsius until the person
chooses, and Reset preferences forgets it. Preferences that cannot be read are
reported, and Units waits until they read. Reset still works then, because it
is the person's say-so, as forgetting the wear log is (ADR 0023), and the only
way out of a save that is corrupt or from another version, which Try again
only reads again. Nothing else writes over them.

**Location and the key are drawn as Fig 23 draws them, with the dash Fig 14d
draws for a value nobody knows yet, and open nothing.** A row that pretended to
open something, or showed a place or a key the app does not have, would be
worse than a row that waits.

**PREMISE:** neither chooser is drawn, and nothing finds the place or takes a
key. When a chooser is drawn at the source (ADR 0006), or the forecast finds
the place, this is re-read and the row opens what it should.

## Consequences

- Today reads the units from `loadPrefs()` when it sends a pick, in its own
  pull request. Until then the request's units are Today's to set.
- With no service set, You keeps the sample closet and the fixture's days in a
  section of their own, so every track can still build against them.
- docs/States.md gains You's three failures.

## What would show this was wrong

**Somebody pressing Location or the key and expecting it to open**, often
enough to matter before the choosers are drawn. Then the rows wait somewhere
less tempting.
