# 0011. The look follows Wardrobe, with credit

Status: Accepted, 2026-09-25.

## Context

**The reskin moved the app's look toward Wardrobe**, Thijs Simonian's app that
this project already adapts and credits (ADR 0004): a quiet off-white page,
near-black type, square corners, one sans-serif and uppercase labels. That is
the intent, not an accident.

**CLAUDE.md rule 2 forbids copying the type or colours of any existing app**, so
as written the reskin breaks it. The rule guards against one failure: a public
portfolio piece that reproduces a company's interface and has to come down.
Wardrobe is not that case. It is open source under the MIT License and README.md
already names it.

## Decision

**The app's visual style may follow Wardrobe's: its palette, type and shapes.**
Rule 2 names Wardrobe as its one exception, and README.md credits Wardrobe for
the look as well as for the idea. **The exception covers the style only.** The
layouts and icons are this project's own, and every other app stays under rule
2.

**PREMISE:** Wardrobe is open source under a licence that allows this, and it is
credited where a reader looks. If its licence changes, its author objects, or
the credit comes out of README.md, this is re-read.

## Consequences

- CLAUDE.md rule 2 gains one sentence naming the exception and this decision.
- README.md's acknowledgement of Wardrobe credits the visual style.
- A reviewer who sees the resemblance reads this instead of re-arguing rule 2.
- Taking Wardrobe's layouts or icons is a new decision, not covered here.

## What would show this was wrong

**Somebody taking the app for Wardrobe, or for a look that is passed off as
ours.** Either means the style has gone past following into copying, and the
look moves back toward this project's own design.
