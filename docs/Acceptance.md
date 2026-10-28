# How you know a screen is done

**"Done" cannot be a matter of opinion when five people are deciding it
separately.** Every box below is something you can check by looking, in a
minute, without asking anybody.

**Check them against the mockup, not against memory.** Open
[`docs/design/mobile.html`](design/mobile.html), find the figure, put it beside
the running app.

## Every screen, before its own list

- [ ] **Every colour comes from `src/theme/tokens.ts`.** No hex or colour name
      in a component; `npm run lint` refuses both.
- [ ] **Every word is set in the mockup's typeface**, a face from
      `src/theme/font.ts` and never the phone's own. `npm run lint` refuses a
      family typed into a style; a style with no family at all gets past it,
      so look.
- [ ] **Every word comes from `src/strings/`.** No sentence typed into a view.
      `npm run lint` refuses one written into a view, a label or an alert; one
      put in a variable first gets past it, so look.
- [ ] **It works with no service address set**, on the fixtures and the sample
      closet, end to end.
- [ ] **Its loading state is drawn**, and is the shape of what is coming rather
      than a spinner over nothing.
- [ ] **Its failure state is drawn**, and keeps whatever the screen already had.
- [ ] **It stays light with the phone in dark mode.** There is one palette,
      ADR 0008.
- [ ] **Nothing is hard-coded to one device width.** The mockup is a 390pt
      frame; the app runs on other phones.

## First run, Fig 05

- [x] Asks for one photograph and explains what it is for in one line.
- [x] Can be skipped, and skipping does not block the closet.

## Closet, Figs 06 and 15

- [ ] **Empty is a real screen**, Fig 06, with one instruction and one way
      forward. It is not the grid with nothing in it.
- [ ] The grid matches Fig 15's tile proportion and spacing.
- [ ] Tapping a garment opens the item editor.

## Add garment, Figs 17, 17b and 18

- [ ] **Tagging starts when the shutter fires**, not when the confirm screen
      opens. Fig 17b is a wait that is already doing work.
- [ ] The photograph is visible for the whole wait and is never discarded on
      failure.
- [ ] Confirm shows what the app decided and lets every field be corrected
      before saving.

## Today, Figs 08, 08d, 09, 10b, 11 and 12

- [ ] **The pick comes from `pick()` and is never computed locally.** ADR 0001.
      A clo table, a lookup or a formula in this repository fails this box.
- [ ] Shows the weather, the outfit and the reason, in that order.
- [ ] **Fig 08d**: when the pick has arrived and the picture has not, the pieces
      are listed rather than the screen being blank.
- [ ] **Fig 09**: when nothing fits, it says so and still offers to wear it
      anyway.
- [ ] **Fig 10b**: an empty closet points at the closet, not at the weather.
- [ ] **Fig 11**: the forecast failing is a normal screen, built first.

## Weather, Figs 14 and 14d

- [ ] Shows the day the pick was made from and marks the hours it covers.
- [ ] **Fig 14d**: no cached forecast is its own screen.
- [ ] A cached forecast always shows when it was fetched.

## Item editor, Figs 19 and 19b

- [ ] Two pages, swiped: the cut-out and your photograph.
- [ ] An edit survives leaving the screen.

## You, Fig 23

- [ ] The list is grouped in sections, in the order Fig 23 draws them.
- [ ] **There is no theme setting**, and Fig 23 draws none. ADR 0008.
- [ ] Anything that can fail is visible without scrolling.

## What this file does not cover

**What the checks already prove.** ADR 0015 says how the app is tested: the
tests, the type check and lint run on every pull request, and a red one is not
merged. These boxes are what those checks cannot see, so a person ticks them in
Expo Go.
