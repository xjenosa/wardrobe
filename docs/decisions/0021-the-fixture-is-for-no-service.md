# 0021. The fixture answers when there is no service, never when it fails

Status: Accepted, 2026-10-20.

## Context

**AGENTS.md rule 1 said the fixture is what the app reads "with the network
off".** `pick()` reads it only when no service address is set. The review of the
shell asked which of the two was wrong.

## Decision

**The code is right, and the rule is reworded to match.** With no service
address set, the app reads the fixtures, so every screen runs before the service
exists. With an address set it asks the service, and when that fails Today shows
the last real answer if it was made today for the same closet, garment for
garment, in the same units, or else the failure state.

**An answer is kept only for the day and the closet it was made for.** Its
`dayLine` and `takeLine` describe that day's weather, so an answer from another
day would describe another day. Its outfit, or its finding that nothing fits,
describes the closet it was asked about: an empty closet's answer kept in the
morning would otherwise draw a day with nothing on it after garments are added,
and a nothing-fits answer would outlast the coat bought to answer it. Its
sentences print degrees, so it is in the units it was asked in.

**Never the fixture after a failure.** Its answers were made for the sample
closet, so over anybody else's closet they would draw garments the person does
not own.

**The fixtures ship with the closet their answers were made for**,
`fixtures/closet.json`, so docs/Acceptance.md's end-to-end box can be ticked.

**PREMISE:** a failed service is a state the person sees, not one the app hides.
If the app ever has to work offline with no real answer kept, that is a new
decision, not the fixture.

## Consequences

- AGENTS.md rule 1, docs/Acceptance.md and ADR 0001 say "with no service
  address set" where they said "with the network off".
- `pick()` keeps each real answer with the day it was made, the garments it was
  sent and its units, and a failed ask returns it as `kept` when all three match,
  `null` otherwise. A fixture is never kept.
- With no service address and a closet the fixtures were not made for,
  `pick()` fails as `noService`, so Today can tell a build with no service from
  a broken answer.
- No plate draws a kept answer, so how Today says it is showing one is the
  app's to decide. docs/States.md has the row.

## What would show this was wrong

**A demo that needs the fixture with a service set**, which would mean the kept
answer is not doing its job.
