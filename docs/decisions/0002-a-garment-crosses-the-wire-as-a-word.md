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

## Where the line actually falls, 2026-09-22

**A drawn TWO-ENDED range is a row of the table. A single figure inside a
sentence is the app explaining itself.**

The upstream generator strips any two-ended band, a low figure and a high one
joined by the word *to* and both carrying a degree sign, before publishing,
and it leaves *"Your warmest is the navy overcoat, good to about −5°"* alone.
That is the line, it is deliberate, and it is the one worth knowing when
writing copy: the app may say a garment is good to about a temperature, and it
may never print the band a garment suits.

**AND THIS PARAGRAPH DESCRIBES THE SHAPE RATHER THAN SPELLING IT**, because
`tools/no-leak.mjs` refuses that pattern anywhere in this repository and a rule
that has to exempt itself is a rule with a hole in it.

**PREMISE:** one endpoint in prose is not reconstructable into the table. If the
app ever draws enough of them, together they are the table and this is the
paragraph to re-read.
