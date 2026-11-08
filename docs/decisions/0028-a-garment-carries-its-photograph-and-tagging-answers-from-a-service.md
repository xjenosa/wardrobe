# 0028. A garment carries its photograph, and tagging answers from a service

Status: Accepted, 2026-10-30.

## Context

**ADR 0022 held capture and Fig 19b until a tagging contract and a place to
keep a photograph existed.** Max asked track E to build Fig 17, 17b and 19b,
so that premise is no longer true. The closet still has only four words on the
wire; a photograph has nowhere to live, and README.md still named only `/pick`.

## Decision

**A garment may carry `photo`, the file name of a copy in the app's documents.**
It is kept with the closet in `src/lib/store.ts` and never sent on `/pick`. The
bytes live under the garment id (`src/lib/garmentPhoto.ts`), the same way the
reference photo is found (ADR 0025), so an iOS container move does not leave
every saved path pointing nowhere. Screens read the file by garment id, not by
an absolute URI.

**Tagging is a service call, `POST /tag`, not arithmetic here.** The photograph
goes to the tagging service once, to be read, and otherwise stays on the phone.
The `/tag` shape in README.md is the app's spec, the same as `/pick`. With no
`EXPO_PUBLIC_TAG_URL`, Add garment does not tag: it goes to Fig 18 by hand with
the photo kept. `fixtures/tag.json` stays for tests only. The response is the
words Fig 18 already draws: name, category, warmth and optional style. No
temperature range crosses that wire. A fixture standing in for a real answer
about the person's own garment is ruled out the same way ADR 0021 rules it out
for pick.

**Fig 18 remains the confirm form and the screen Reading failed ends on.**
Warmth stays five words and no slider (ADR 0022). Close still discards an
unsaved edit.

**PREMISE:** tagging returns words, not ranges. The photograph leaves the phone
once, for the tagging service to read it, and otherwise stays here. If the
service starts returning a comfort band, or photos have to leave for a render
or stay uploaded, this is re-read.

## Consequences

- Capture (Fig 17) and Reading (Fig 17b) can be built; shutter starts the tag
  only when an address is set.
- Fig 19b can draw the photograph beside the cut-out.
- ADR 0022's "capture waits" line is superseded; its warmth and Close rules
  stand.
- No closet version bump: an older closet has no `photo` and still reads.

## What would show this was wrong

**A tagging answer that carries a temperature band**, or a closet that cannot
open without every garment having a photograph.
