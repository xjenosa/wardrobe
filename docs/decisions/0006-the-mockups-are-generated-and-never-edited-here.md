# 0006. The mockups are generated, and nobody edits them here

Status: Accepted, 2026-09-19. Amended 2026-09-25 by ADR 0009: one mockup, not two.

## Context

`docs/design/mobile.html` is the seventeen screens this project builds, drawn at
full size in a phone frame. It arrived today and it is the picture everybody
works toward.

**It is OUTPUT.** It is produced from the private repository's design
documents by a tool that reads those files and proves its own result
twenty-five ways: that no comment survives, that no source project is named,
that no logo is drawn, that every class used has a rule, that every plate asked
for is present exactly once, and that the contents list at the head names
exactly the plates the file draws.

## Decision

**Nobody edits this file by hand, for any reason.**

A hand edit is invisible: the file is 240KB of one-line HTML and nothing here
can tell a fix from a drift. The next regeneration silently overwrites it, and
the change is gone with no trace that it existed.

**If a screen is wrong, say so and it is corrected at the source**, where the
correction survives and comes back through the same checks.

**PREMISE:** this file is regenerated whenever the design moves. If that ever
stops being true, this rule stops being useful and it becomes ordinary source.

## Consequences

- A pull request that touches `docs/design/mobile.html` is wrong by construction
  unless it replaces the file wholesale with a fresh generation.
- The file carries no comments, no trailing whitespace and no blank line twice
  over, because the generator checks all three. Do not tidy it; it is tidy.
- It is the only file here generated outside this repository, which is why this
  decision exists at all.
