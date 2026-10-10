# 0015. How the app is tested

Status: Accepted, 2026-09-28.

## Context

**Three people will build screens against one fixture and one contract.** What
breaks between them is not a single screen but a seam: `pick()` returning a
shape a screen does not expect, a garment stored by one track and read by
another, the no-forecast state nobody opened for a week. Checks written before
the first screen are cheap; checks added after the report is due are skipped.

## Decision

**Four layers, each doing one job.**

- **Automatic tests, with Jest and React Native Testing Library** on Expo's own
  Jest preset (ADR 0013). `npm test` runs them. They cover:
  - `src/lib/pick.ts` against `fixtures/pick.json`, and against a failing
    service: an error, a timeout, a malformed body, the network dropping
    mid-request. The fixture passes the same shape check `pick()` applies to a
    real response, so the two cannot drift apart unnoticed.
  - `src/lib/store.ts` on a first run with nothing saved, on corrupted data, and
    on a write that fails.
  - Every state a screen draws in `docs/States.md`, the failure states first.
  - The model key the person enters: it is sent to the provider and nowhere
    else, never into a log or an error report.
  - Anything that reads the clock runs on fake timers and a pinned time zone.
- **Types and lint.** Jest strips types without checking them, so
  `tsc --noEmit` runs on its own, and ESLint runs with Expo's configuration.
- **By hand, on a phone.** A screen is done when every box for it in
  `docs/Acceptance.md` is ticked in Expo Go, as AGENTS.md says: verify by
  running the app. The pull request says who ticked it, on which phone, and
  includes the smallest phone and the largest text size anyone on the team has.
- **On every pull request, GitHub runs** the tests, the type check, the linter,
  `node tools/extract.mjs --check` and `node tools/no-leak.mjs`, and branch
  protection lists them as required. A red check is not merged.

**No check is trusted until it has been seen to fail.** When one is added or
changed, the defect it exists for is planted and it must go red; that includes
one pull request that fails on purpose, to prove the branch protection holds.
**Every bug fix comes with a test that fails without it.**

The tooling and the pull-request checks arrive with the shell in step 0. A
screen's tests arrive in the same pull request as the screen.

**PREMISE:** the risk is at the seams and in the failure states, and a capstone
team has no time for tests that drive the whole app by tapping. If the course
asks for a particular kind of testing, or a bug keeps reaching a phone that
these layers let through, this is re-read.

## Consequences

- No end-to-end suite, not even one smoke test: it needs a simulator build on
  every pull request, and the hand pass opens the app anyway. Step 3, the
  seams, is where all three of us tap through it with the network off and on a
  slow one.
- The recommendation is never tested here, because it is not here (rule 1).
  The tests check that the app shows what the fixture says.
- Line endings are already pinned in `.gitattributes`, so the generated-file
  check does not fail between Windows and a Mac.

## What would show this was wrong

**A pull request that passes every check and breaks the app on a phone**, more
than once, in the same way. That is the layer missing.
