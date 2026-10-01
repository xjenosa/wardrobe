# 0008. The app is light only

Status: Accepted, 2026-09-25. Carried out the same day: the mockup draws no
dark palette, no theme script and no Theme row, and `src/theme/tokens.ts` has no
`dark` export.

## Context

**The reskin drew one palette.** It changed 18 of the 55 values in the mockup's
light palette and designed nothing for dark: of the 28 dark overrides the mockup
still carries, 18 now repeat their light value and the other 10 are the old
skin's, shadows mostly. There is no dark palette for this design, and this
repository does not make one up, because the drawing comes from the design
source (ADR 0006).

## Decision

**The app has one palette, the light one, and stays light when the phone is in
dark mode.** No screen offers a choice of theme, and no screen is checked in two
palettes.

**PREMISE:** the design has no dark palette. If it gains one, this is re-read.

## Consequences

- **The mockup drew what this rules out**: a dark block in its stylesheet, a
  script that follows the system setting, and a Theme row on Fig 23 offering
  Light, Dark and System. All three were removed at the source, never here.
- **`src/theme/tokens.ts` has no `dark` export.** The extractor writes one only
  when the drawing carries a dark palette, never `dark = light`, so code written
  for dark mode fails to build instead of quietly drawing light.
- docs/Acceptance.md asks that a screen stays light with the phone in dark mode,
  instead of asking for a dark palette.

## What would show this was wrong

**A dark palette designed at the source.** The extractor then exports it again,
the compiler finds every place that needs it, and this decision is replaced.
