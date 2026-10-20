# 0019. The answer carries the day's lines and whether anything fits

Status: Accepted, 2026-10-20.

## Context

**The mockup draws two things the answer did not carry.** Figs 08 and 09 draw a
line under the weather and a take-along line ("Take a beanie and gloves."), and
Fig 09 draws a day nothing owned suits, with "Wear it anyway". AGENTS.md rule 1
says to stop at a screen that needs something the response does not carry, and
the review of the shell stopped there.

## Decision

**Three fields join the answer: `dayLine`, `takeLine` and `fits`.** The two
lines are finished sentences, `""` when there is nothing to say. `fits` is false
on a day nothing owned suits: `wear` is then the closest the closet comes,
`dayLine` holds the headline, `because` says how far it falls short, and
`takeLine` stays. The app changes only its own button words.

**Sentences, not codes.** Which line is said, when and in what order is the
service's knowledge (rule 1), as `because` already is. The app draws each line
that is not empty, as it comes.

**The request gains `units`, and each garment its `name`**, because the
sentences print degrees in the units Settings offers and the reasons name
garments. The number fields stay Celsius.

**An empty closet is still sent**, since Fig 10b draws both lines over it. Its
answer wears nothing: an empty `wear` and `because`, a `suitsC` of `null`, and
`fits` false. The app draws Fig 10b from its own empty closet, never from the
answer.

**PREMISE:** the lines say only what the request lets them, so nothing about
rain later until the request carries the day's hours. When it does, this is
re-read with it.

## Consequences

- The fixtures gain the three fields and two more answers, the day nothing fits
  (Fig 09) and the empty closet (Fig 10b). You's placeholder chooses which day
  the fixture answers.
- How much more the request carries is its own decision, not this one.

## What would show this was wrong

**A line the app has to edit, split or reorder before it can draw it**, which
would mean the app is deciding what to say after all.
