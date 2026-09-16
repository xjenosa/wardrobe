# 0002. A garment crosses the wire as a WORD, not as a number

Status: Accepted, 2026-09-16.

## Context

The service needs to know what each garment is in order to score it. There are
two ways to tell it.

## Decision

**The request names a row: `"row": "Coat"`. It never says what a coat is worth.**

The client knows the vocabulary. The service knows the values.

## Consequences

**This is the whole reason the boundary in ADR 0001 is safe.** Sending the
insulation value instead is simpler to write and publishes the table one garment
at a time: anyone reading this repository, or watching its traffic, would
recover the numbers by using the app normally.

**The vocabulary is a small closed list**, and adding to it is a change on both
sides. That is the price and it is the right price: a client that can invent a
garment type is a client that can ask for a score the service cannot give.

## What would show this was wrong

**A garment nobody can name.** If a real wardrobe holds things the row list has
no word for, the list is too small rather than the idea being wrong. Widen the
list; do not start sending numbers.
