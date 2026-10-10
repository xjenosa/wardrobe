# 0016. The build splits five ways

Status: Accepted, 2026-10-04. Replaces the three-way table in ADR 0007; the
split by surface stands.

## Context

**The team grew from three to five.** The professor added Minh and Cris on
2026-10-04, after the plan was written for Max, Natasha and Paul. ADR 0007's
premise says to re-read the split when the team changes size. Nobody yet knows
what Minh and Cris are strongest at.

## Decision

**Five tracks over the same eight screens, still split by surface.**

- **A, Max, the frame:** the shell, First run, You.
- **B, Natasha, the day:** No forecast, Today, and the forecast fetch in
  `src/lib/forecast/`.
- **C, Minh, the weather:** Weather and its charts.
- **D, Cris, the closet:** Closet, from empty to the full grid.
- **E, Paul, capture:** Add garment and Item editor, which share one garment
  form, so they stay with one person.

**Paul keeps the heaviest track and the new members take the lighter ones**,
because their strengths are not known yet. C and D are placed provisionally:
Minh and Cris may swap them by editing the table in docs/Build_Plan.md.

**No screen is added.** An Outfits screen was considered and held back. It
would need drawing at the source first (ADR 0006), and under rule 1 it could
only show what was worn or picked, never put outfits together itself.

**PREMISE:** five people and eight screens, with the two new tracks lighter on
purpose. If C or D runs out of work while B or E falls behind, or if an Outfits
screen is drawn, this is re-read.

## Consequences

- Natasha gives Weather to Minh and keeps the forecast fetch, which Weather
  reads. A change Weather needs there is a pull request to Natasha.
- Paul gives Closet to Cris. The Closet reads garments through
  `src/lib/store.ts`, as Paul's screens write them.
- The first free track takes on whatever comes next, Outfits most likely.

## What would show this was wrong

**One track idle for a week while another falls behind.** Then the lines move,
in the table, by pull request.
