# 0028. A garment carries its photograph, and tagging answers from a service

Status: Accepted, 2026-10-30.

## Context

**ADR 0022 held capture and Fig 19b until a tagging contract and a place to
keep a photograph existed.** Max asked track E to build Fig 17, 17b and 19b,
so that premise is no longer true. The closet still has only four words on the
wire; a photograph has nowhere to live, and README.md still named only `/pick`.

## Decision

**A garment may carry `photo`, a file URI on the phone.** It is kept with the
closet in `src/lib/store.ts` and never sent on `/pick`. The photograph itself
is a copy in the app's documents (`src/lib/garmentPhoto.ts`), the same way the
reference photo is kept (ADR 0025), one file per garment id.

**Tagging is a service call, `POST /tag`, not arithmetic here.** With no
`EXPO_PUBLIC_TAG_URL` the answer is `fixtures/tag.json`, the way `/pick` uses
fixtures (ADR 0021). The response is the words Fig 18 already draws: name,
category, warmth and optional style. No temperature range crosses that wire.

**Fig 18 remains the confirm form and the screen Reading failed ends on.**
Warmth stays five words and no slider (ADR 0022). Close still discards an
unsaved edit.

**PREMISE:** tagging returns words, not ranges, and a photograph stays on this
phone. If the service starts returning a comfort band, or photos have to leave
the phone for a render, this is re-read.

## Consequences

- Capture (Fig 17) and Reading (Fig 17b) can be built; shutter starts the tag.
- Fig 19b can draw the photograph beside the cut-out.
- ADR 0022's "capture waits" line is superseded; its warmth and Close rules
  stand.
- No closet version bump: an older closet has no `photo` and still reads.

## What would show this was wrong

**A tagging answer that carries a temperature band**, or a closet that cannot
open without every garment having a photograph.
