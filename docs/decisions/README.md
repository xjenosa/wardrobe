# Decisions

**One file per decision, numbered, newest last.** A decision that lives only in
a pull-request comment is one the next person re-argues, usually three weeks
later and usually differently.

**Read this index first.** It says what each decision was in a line or two, so a
session can tell whether it needs the file without opening all of them. Open the
one you are pointed at and no others.

**Adding one:** copy the shape of any file here. Next number, kebab-case name,
and keep it short. If an entry needs more than a page, it is probably two
decisions. The four sections are Context, Decision, Consequences, and what would
show it was wrong: **state the premise inside the decision, so that when the
premise changes there is something to re-read.**

---

- **0001 The recommendation comes from a service, not from this repository.**
  The app sends the garments and the weather out and gets back what to wear.
  Computing it here would mean publishing the clothing-insulation table and the
  ranking in a public repository. Records why the fixture is not a convenience.
- **0002 A garment crosses the wire as a WORD, not as a number.** The request
  says `"row": "Coat"` and never what a coat is worth. Sending the value is
  simpler and publishes the table one garment at a time.
- **0003 The no-forecast screen is built first, not last.** A weather-dependent
  app whose weather can fail meets that state on an ordinary day, and a state
  deferred to the end is a state that gets skipped.
- **0004 MIT attribution lives in README.md, not in a NOTICE file.** NOTICE is
  the Apache-2.0 convention. MIT requires the notice to travel and never names a
  filename, and a reviewer reads the README. Records when this flips.
- **0005 Nothing is copied out of the private repository, by a person or by an
  agent.** Some of us can open it, a session can hold both at once, and the
  failure mode is helpfulness rather than theft.
- **0006 The mockups in docs/design are generated, and nobody edits them here.**
  Seventeen screens in a phone frame, produced from the design source and
  checked twenty-five ways. A hand edit is invisible in 240KB of one-line HTML
  and the next regeneration overwrites it.
- **0007 The build splits by surface, not by layer.** Three people own whole
  directories and the screens inside them, rather than everybody editing the
  screens, the state and the API client at once. Max the frame, Natasha the day,
  Paul the wardrobe, and one shell first that everybody waits for.
  docs/Build_Plan.md is the table.
- **0008 The app is light only.** The reskin drew one palette, so no screen
  offers a theme and none is checked in two. The mockup's dark block, theme
  script and Theme row were removed at the source, and tokens.ts has no `dark`
  export.
- **0009 There is no desktop app.** The app ships on phones, so there is one
  mockup, the phone, and the browser frame is deleted rather than left to go
  stale. ADR 0006 is amended to match.
- **0010 The licence is GPL-3.0, not MIT.** Anyone who publishes a changed
  version must publish its source. The credit to Wardrobe stays MIT, and Apple's
  App Store would need an exception every contributor agrees to.
- **0011 The look follows Wardrobe, with credit.** The reskin's palette, type
  and square corners follow Thijs Simonian's Wardrobe on purpose. It is MIT and
  credited, so rule 2 names it as the one exception; its layouts and icons are
  still not taken.
- **0012 The rules are in AGENTS.md, and CLAUDE.md reads them.** Members use
  different agents, so the rules live in the file every agent reads and
  CLAUDE.md imports it. One rule joins them, that the private repository a
  member can open is read and never written.
- **0013 The app is built with Expo.** We are taught it, the phone features the
  app needs have Expo modules, and nobody needs Xcode or Android Studio. No
  `ios/` or `android/` folder is committed.
- **0014 The app is not published on Apple's App Store.** It is a capstone shown
  in Expo Go, so no GPL exception is written and the licence stays
  GPL-3.0-only. Publishing there is a new decision.
- **0015 How the app is tested.** Jest and React Native Testing Library for
  `pick()`, the store and every screen state, failures first; a type check and
  lint beside them; Acceptance.md ticked by hand in Expo Go; all of it plus both
  checks required on every pull request. A check counts once it has failed.
