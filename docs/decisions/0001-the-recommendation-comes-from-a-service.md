# 0001. The recommendation comes from a service, not from this repository

Status: Accepted, 2026-09-16.

## Context

The app has to answer "what should I wear today", and that answer is arithmetic:
a table of clothing-insulation values, a curve relating insulation to
temperature, and a ranking over what is in the closet.

**That arithmetic is the product.** This repository is public.

## Decision

**The app sends the garments and the weather to a service and gets back which
garments to wear and the range they suit.** The table, the curve and the ranking
are never in this repository.

**Code has to be published to be read. A running service is reached, not read.**
That is the whole of the reasoning, and it is why a public repository and a
working recommendation are not in conflict.

The request and response shapes are in README.md and they are the contract.

## Consequences

- **The endpoint has to be up for a demo**, which is the worst possible moment
  to find out it is not. So the client caches its last answer and ships
  `fixtures/pick.json`.
- **The fixture is not a convenience.** It is how the app stays demonstrable
  with the network off, how every screen gets built before the service exists,
  and how the tests run without a network.
- **Do not add a local formula, a lookup, or "a simple version for now".** A
  wrong formula that WORKS is harder to remove than one that is missing, because
  nothing fails while it is wrong: the app keeps recommending, just badly, and
  the day somebody replaces it every screenshot taken so far is out of date.

## What would show this was wrong

**A screen that needs something the response does not carry.** If drawing
something requires a score, a weight or an intermediate value, then either the
boundary is in the wrong place or the arithmetic is leaking into the client one
field at a time. Say so and stop; it is a decision rather than a patch.
