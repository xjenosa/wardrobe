# 0006. The mockups are generated, and nobody edits them here

Status: Accepted, 2026-09-19.

## Context

`docs/design/mobile.html` and `docs/design/desktop.html` are the seventeen
screens this project builds, drawn at full size in a phone and a browser frame.
They arrived today and they are the picture everybody works toward.

**They are OUTPUT.** They are produced from the private repository's design
documents by a tool that reads those files and proves its own result
twenty-five ways: that no comment survives, that no source project is named,
that no logo is drawn, that every class used has a rule, that every plate asked
for is present exactly once, and that the contents list at the head names
exactly the plates the file draws.

## Decision

**Nobody edits these two files by hand, for any reason.**

A hand edit is invisible: the file is 240KB of one-line HTML and nothing here
can tell a fix from a drift. The next regeneration silently overwrites it, and
the change is gone with no trace that it existed.

**If a screen is wrong, say so and it is corrected at the source**, where the
correction survives, applies to both frames at once, and comes back through the
same checks.

**PREMISE:** these files are regenerated whenever the design moves. If that ever
stops being true, this rule stops being useful and they become ordinary source.

## Consequences

- A pull request that touches `docs/design/*.html` is wrong by construction
  unless it replaces both files wholesale with a fresh generation.
- The files carry no comments, no trailing whitespace and no blank line twice
  over, because the generator checks all three. Do not tidy them; they are tidy.
- They are the only files here that are not written by a person, which is why
  this decision exists at all.
