# 0017. Navigation is React Navigation, with the routes in one place

Status: Accepted, 2026-10-20.

## Context

**ADR 0013 left navigation to the shell.** An Expo app has two common choices.
Expo Router turns files into routes: every screen needs a file in one shared
`app/` folder. React Navigation declares the routes in code: the screens can
live anywhere.

**The build is split by directory** (ADR 0007, ADR 0016). Five people each own
their screens' folders, and the plan works because almost nobody edits a file
somebody else owns.

## Decision

**React Navigation, with every screen where its plate puts it.** Today and
Closet are tabs. Weather opens inside the Today tab, so the tab bar stays
(Figs 14 and 14d), and No forecast is Today's own state (Fig 11), not a route.
First run, Add garment, the item editor and You cover the tabs. No navigator
draws a header, because every plate draws its own top bar or none. The routes
are declared once, in `src/nav/`, which is Max's; each screen stays in its own
track's folder.

**PREMISE:** keeping each person inside their own folders matters more than
routes that come from file names. If the app needs links from outside it (deep
links) or a web build, which Expo Router gives for free, this is re-read.

## Consequences

- A new route is a pull request to Max, against `src/nav/routes.ts` and
  `src/nav/RootNavigator.tsx`. Building a screen behind an existing route
  touches only that track's folder.
- Route names are typed, so navigating to one that does not exist fails the
  type check.
- Until a track builds its screen, its route shows a placeholder with the
  screen's name and a way back.
- The navigation test checks where each screen sits, under the tabs or over
  them, so a screen moved off its plate fails it.

## What would show this was wrong

**Pull requests queueing on `src/nav/`**, or a feature that needs a link into
the app from outside it.
