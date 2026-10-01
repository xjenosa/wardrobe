# 0012. The rules are in AGENTS.md, and CLAUDE.md reads them

Accepted 2026-09-26.

## Context

**The members do not all use the same agent.** Claude reads CLAUDE.md and
follows an `@` import inside it. Other agents read AGENTS.md and follow no
import. With the rules in CLAUDE.md alone, a member on another agent worked
without them.

## Decision

**The rules move from CLAUDE.md into AGENTS.md word for word, and CLAUDE.md
holds the import and one line saying why.** One copy, read through two files.

The same change adds one rule the owner asked for, beside the rule that nothing
is copied out of the private repository this design comes from. **A member who
can open that repository reads it and never writes to it.** It is still not
named and not pointed at, for the reason this file gives under what it does not
do.

**The premise is that every agent a member uses reads CLAUDE.md or AGENTS.md.**
If one reads neither, this is re-read.

## Consequences

- A rule is added to AGENTS.md. One added to CLAUDE.md is seen by Claude alone.
- docs/Build_Plan.md points at AGENTS.md for the rule against pushing to main.
- ADR 0005 and ADR 0011 say CLAUDE.md, as they did when they were written, and
  both rules they name are in AGENTS.md now, which CLAUDE.md still reads.

## Rejected

**A copy of the rules in each file.** Two copies drift, and a member reads
whichever one their agent opens.
