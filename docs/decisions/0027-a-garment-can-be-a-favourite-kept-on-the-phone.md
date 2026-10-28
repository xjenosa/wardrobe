# 0027. A garment can be a favourite, kept on the phone

Status: Accepted, 2026-10-28.

## Context

**Fig 15 draws a heart on every garment and a Favourites filter**, and the kit's
`GarmentTile` already takes `favourite` and `onFavourite` (ADR 0024). The
closet kept no such thing, so the Closet had nothing to save a heart into.

Fig 15 also sorts by Recently added, Name A-Z, Colour, Warmth, Least worn and
Custom. Name, warmth and the wear log (ADR 0023) are already kept.

## Decision

**A garment carries `favourite`, true or false, and absent means no.** It is
kept with the closet in `src/lib/store.ts` and never sent: `pick()` sends each
garment's README.md fields and nothing else, so what a screen keeps on the
phone cannot reach the service by being handed to it, style included.

**The closet's order is the order garments were added, newest last.** Add
garment appends and the editor changes a garment where it stands, so Recently
added reads the closet from its end and needs no date.

**Colour and Custom wait.** Colour needs a garment's colours, which wait with
the photograph (ADR 0022). Custom would reorder the closet, and then its order
could no longer say what was added last, so it needs its own decision.

**PREMISE:** a favourite is one yes or no per garment, kept on this phone. If
favourites have to follow a person to another phone, or the service starts to
weigh them, this is re-read.

## Consequences

- The Closet saves a heart with `updateCloset`, and filters on `favourite`.
- No version change: a closet saved before this has no favourites and reads as
  it did.
- Anything else a garment comes to keep for the phone alone stays off the wire
  without anyone having to remember.

## What would show this was wrong

**A person expecting a favourite to change what Today picks**, which would make
it something the service needs to hear.
