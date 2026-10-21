# 0022. A garment is entered by hand first, and warmth is five words

Status: Accepted, 2026-10-20.

## Context

**Add garment (Figs 17, 17b, 18) assumes a camera and a tagging service.**
README.md has no tagging request or response, and the camera packages are not
installed. The closet's `Garment` carries a name, category, warmth and style
and nothing else, so colours, material, season and a photograph have nowhere to
be saved. Fig 18 and Fig 19 also draw a warmth slider.

## Decision

**Fig 18 is built as the by-hand form, and Fig 19 reuses it.** It is the screen
"Reading failed" ends on (docs/States.md), so it is needed whatever the tagging
turns out to be. The capture and reading screens wait for a tagging contract and
the camera packages.

**Warmth is the five words under "Not sure?" and no slider.** A slider drags a
temperature range, and the range behind a word is the service's (ADR 0001).
Drawing one here would mean computing it here.

**Close discards an unsaved edit, and nothing asks.** Save is the only way to
keep a change, and every other way out leaves the garment as saved. An edit
held for the next opening was built first, and it reopened looking saved while
the closet still showed the old garment, with no way to drop it. A "Not saved
yet." line with a Discard button would have fixed that with words and a button
no plate draws, and a question on leaving interrupts every exit. Max's review
chose discarding, since four short fields are cheap to type again.

**The words with no plate are in `src/strings/capture.ts`**, so `screens.ts`,
which is Max's, stays as it was.

**PREMISE:** the closet stores four fields. When `Garment` gains a photograph,
colours, material or season, the form grows to fill them and Fig 19b is built.

## Consequences

- The form lives in `src/screens/add/` and the editor imports it.
- Category is a row of choices, not the plate's select, since a phone has no
  select to draw in this style. The chips are radios.
- Style and warmth are each one choice that a second tap clears, since
  `Garment.style` is one word and only an accessory may leave warmth out.
- Save and photograph another, Delete and "Worn n times" are not built.

## What would show this was wrong

**A tagging contract that returns a warmth range** rather than a word, or a
decision to hold garments in more than four fields, either of which changes
what the form is for.
