# 0023. What was worn is kept on the phone, one outfit a day

Status: Accepted, 2026-10-21.

## Context

**Fig 19 draws "Worn 12 times · last on 3 Jan" and the closet sorts by "Least
worn"**, and nothing recorded a wear. Pressing "Wear this" on Today is the one
moment the app learns what was worn.

## Decision

**`src/lib/wears.ts` keeps a wear log on the phone**, for each day the ids of
the outfit worn that day. Today calls `recordWear(ids)` when "Wear this" or
"Wear it anyway" is pressed. The editor and the closet read it with
`loadWears()` and `wornOf(log, id)`, which gives how many days a garment was
worn and the last of them.

**One outfit a day.** Wearing again the same day replaces that day's outfit
rather than adding a second, so a change of mind is not a second wear and
"Worn n times" counts days.

**It never leaves the phone.** The request to the service does not carry it.

**It fails like the closet.** A log that cannot be read is reported and never
written over, and only `resetWears()`, on a person's say-so, replaces it. A day
is the phone's own calendar day, the same one the kept answer uses
(`src/lib/day.ts`).

**PREMISE:** one outfit a day, worn as picked. If the request ever carries
wear history, or a day has to hold two outfits, this is re-read.

## Consequences

- Today calls `recordWear` on "Wear this" and "Wear it anyway".
- The editor draws "Worn n times · last on …" and the closet sorts by "Least
  worn", both from `wornOf`.
- A deleted garment's days stay in the log and count for nothing, since an id
  is never reused.

## What would show this was wrong

**Somebody who changes outfit at noon and expects both to count**, or a closet
order that needs more than a count and a last day.
