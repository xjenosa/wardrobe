# 0004. MIT attribution lives in README.md, not in a NOTICE file

Status: Accepted, 2026-09-16.

## Context

This project adapts ideas from an MIT-licensed project. **MIT has exactly one
condition**: the copyright notice and the permission notice travel with any
copied code or substantial portion.

The question was where they travel TO.

## Decision

**In README.md, under Acknowledgements, with the full licence text in a
`<details>` block.**

## Consequences

**A separate `NOTICE` file is the Apache-2.0 convention**, where that licence
requires a file by that name, and the pattern large projects use when a build
generates hundreds of entries. **MIT never names a filename.** It says the
notice must be included, and a README section includes it.

**A reviewer reads the README.** They may never open NOTICE. For one attributed
dependency, a second file is heavier than the content warrants and splits the
credit away from the place people look for it.

**The `<details>` block is what makes it work**: the condition is met in full,
and twenty lines of legalese do not sit between a reader and the project.

## What would show this was wrong, and it will

**npm dependencies.** The moment this project has a lockfile, it has hundreds of
transitive MIT and BSD licences, and those belong in a GENERATED
`THIRD-PARTY-NOTICES.txt`. A hand-maintained list of them is stale the first
time somebody runs `npm install`. **That is a change of scale, not a reversal:
this decision covers the attributions we chose, not the ones a tool pulls in.**
