# 0024. Screens are built from one kit, in the mockup's type and icons

Status: Accepted, 2026-10-28. Revised the same day with four more pieces, below.

## Context

**Every track has been drawing its own buttons, chips and headers by hand**,
in the phone's own font and with no icons, because there was nothing shared to
draw them with. They already differ from the plates in small ways, a letter
spacing here, a height or a missing icon there, and from each other. Yet the
plates draw the same few pieces on screen after screen: the ink button on Today
and First run, the ruled chip on Today, Closet and the garment form, the notice
on Today and Weather, the title row on Today, Closet, the editor and You, the
pushed top bar on Weather and Add garment, and the segmented choice on Today
and You.

## Decision

**What two or more screens draw alike is built once, in `src/kit/`**, which is
track A's: `Button`, `Chip`, `Notice`, `ScreenHeader`, `TopBar` and
`Segmented`. Each is drawn the way its plates draw it, with its colours from
`tokens.ts`, its typeface from `font.ts` and its icons from `icons.tsx`. Its
words come from its caller, and the few it owns, Back and Close, from
`drawn.ts`, which now also carries the label of every button the plates draw
with only an icon.

**The typeface and the icons come first.** Inter is loaded before anything is
drawn, one family per weight, since one family with three weights only works on
Android 10 and later. The icons are generated from the mockup, as the tokens and
the words are, and each is named by a person in `tools/extract.mjs`.

**A track swaps its own hand-built pieces for the kit's**, in its own pull
request, when it chooses. A piece joins the kit when a second screen needs it,
not before.

**PREMISE:** the plates draw a small set of pieces the same way wherever they
appear, so two screens drawing one differently is a mistake rather than a
design. If the design starts drawing a piece differently per screen on purpose,
this is re-read.

## Consequences

- How a button looks is one edit in one place, and lint already refuses a
  colour, a word or a typeface typed into a kit file.
- `src/kit/` joins track A in docs/Build_Plan.md, so a change to it is a pull
  request to Max, as `src/theme/` already is.
- The kit holds no state and fetches nothing. Every piece is told what to show
  and what to do by its screen.
- Until a track swaps, its screen keeps its own pieces, and they keep passing
  their tests.

## What would show this was wrong

**A kit piece growing a prop that only one screen uses**, more than once. That
is a screen's own piece living in the kit, and it moves back to the screen.

## Four more pieces, 2026-10-28

**The tab bar draws the plate's icons**, Sunrise for Today and Hanger for
Closet, at 22 over the tab names in small capitals, and the two tabs sit
together in the middle of the bar as Figs 06 to 15 draw them rather than spread
to its ends. That is in `src/nav/`, where the tab bar is.

**`Label`, `Field` and `GarmentTile` join the kit.** The label is the small
capitals over a field, which the garment form, Today's Vibe and You's sections
all draw, a hundredth of an em apart in spacing, so the kit draws one. The
field is the garment form's box to type in, on Add garment and the editor
alike; its wrong and hint states are the stylesheet's, since no plate draws
them. The tile is one garment in the closet's grid, with its heart.

**A piece also joins when one screen repeats it many times.** The tile is the
closet's alone, but Fig 15 draws it twenty times and Figs 19 and 19b draw it
again behind the editor, and it joined at Max's ask. The premise above stands.
