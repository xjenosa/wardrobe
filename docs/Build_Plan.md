# The build plan

**Three people, one repository, and a drawing for every screen.** This file says
who builds what, in what order, and how a session knows which of the three it is
working for.

`README.md` says what the app IS. This says how it gets built.

## Which of us are you?

**Your session finds out by asking git, not by asking you.**

```bash
git config user.name
```

That name picks your row in the table below, **whether it is your first name or
your GitHub username**: the table has both. **If it matches neither, stop and
set it** before writing anything, because your branch name and your commits
both depend on it.

```bash
git config user.name "Your Name"
git config user.email "you@example.com"
```

## Who builds what

| | member | GitHub | track | screens | owns these directories |
|---|---|---|---|---|---|
| A | **Max** | `xjenosa` | **the frame** | First run, You | `src/lib/`, `src/theme/`, `src/nav/`, `src/screens/firstrun/`, `src/screens/you/` |
| B | **Natasha** | `natashaejercito` | **the day** | No forecast, Today, Weather | `src/screens/today/`, `src/screens/weather/`, `src/lib/forecast/` |
| C | **Paul** | `minsikpaul92` | **the wardrobe** | Closet, Add garment, Item editor | `src/screens/closet/`, `src/screens/add/`, `src/screens/editor/` |

**The tracks are split by SURFACE and not by layer.** Three people splitting a
React Native app into "screens", "state" and "API" would all edit the same files
all week. Split by surface, each of us owns whole directories and a merge
conflict becomes unusual rather than daily.

**To swap tracks, edit this table in a pull request.** It is the only record.

## The order, and what blocks what

```
  STEP 0  the shell          Max         everybody waits
             |
             +--------------------+--------------------+
             |                    |                    |
  STEP 1  no forecast        Natasha     closet, empty        Paul
          Today                          Closet
          Weather                        Add garment
                                         Item editor
             |                    |                    |
             +--------------------+--------------------+
             |
  STEP 2  First run          Max
          You
             |
  STEP 3  the seams          all three
```

### Step 0 is the shell, and only one person can write it

**Max builds it first and everybody is blocked until it merges.** It is small on
purpose:

- **The app boots** on a phone and in a simulator.
- **A navigator** with a route per screen in the table above, each one a stub
  that renders its own name.
- **`src/theme/tokens.ts` and `src/strings/drawn.ts` are already written**, by
  `node tools/extract.mjs`, which reads the mockup. **55 tokens and 323 drawn
  sentences.** Nobody types a colour or retypes a sentence: three people
  matching a colour by eye produce three colours, and three people writing the
  same sentence from memory write three sentences.
  Both files are committed, so the app builds without running anything, and
  `node tools/extract.mjs --check` fails when they drift from the drawing.
- **`src/lib/pick.ts`**: sends the request in README.md and returns the
  response. **With no `PICK_URL` set it reads `fixtures/pick.json`**, which is
  how every screen gets built before a service exists.
- **`src/lib/store.ts`**: save and load the closet on the device. One module, so
  that two tracks storing garments do not write two.

**Step 0 is done when each of the three can run the app, land on a stub for
their own screens, and call `pick()` and get the fixture back.**

### Step 1 is the two big tracks, in parallel

**Natasha starts with No forecast, not with Today.** ADR 0003 says why, and it
is the one ordering rule in this repository: an app whose weather can fail meets
that state on an ordinary Tuesday, and a state left until last is a state that
gets skipped. Fig 11 and Fig 14d are the drawings.

**Paul starts with the empty closet.** Fig 06, captioned *"the real first
screen"*, is what a new person actually sees. Then the full grid, then Add, then
the editor.

### Step 2 is the frame, and it comes after the middle

**First run and You are last of the screens on purpose.** First run is the door
into a closet that has to exist before the door means anything, and You is a
settings list whose rows mostly switch things the other two tracks built.

### Step 3 is the seams, and it is all three together

The things no single track can finish alone: moving between screens, the state
after a garment is added, what Today shows when the closet is empty, and one
pass over the whole app with the network off.

## The rules that keep three people out of each other's way

- **Branch as `yourname/what`.** `natasha/no-forecast`, `paul/closet-grid`.
- **Never push to `main`.** CLAUDE.md says so; this says it again because it is
  the rule that costs the most when it is broken.
- **One pull request does one thing**, so it can be reviewed and so it can be
  reverted on its own.
- **If you need to change a file outside your directories, open a pull request
  against it and say who it is for.** `src/lib/` and `src/theme/` are Max's after
  step 0. This is not ceremony: two people editing a theme token on the same
  afternoon is how three people lose a day.
- **A screen is done when every box in [`docs/Acceptance.md`](Acceptance.md) is
  ticked.** That file is what stops "done" being a matter of opinion.
- **Every state a screen has is in [`docs/States.md`](States.md)**, with the
  plate that draws it and, where the mockup draws none, what to build instead.
  Loading, empty and failed are not left to be invented three times.
- **The plates are the specification.** Open `docs/design/mobile.html`, find the
  figure, and compare.

## The plates, and which track each belongs to

| plate | screen | track |
|---|---|---|
| Fig 05 | First run, your reference photo | Max |
| Fig 06 | Closet, empty | Paul |
| Fig 08, 08d, 09, 10b, 12 | Today and its states | Natasha |
| Fig 11 | Today, the forecast failed | **Natasha, first** |
| Fig 14 | Weather | Natasha |
| Fig 14d | Weather, no cached forecast | **Natasha, first** |
| Fig 15 | Closet | Paul |
| Fig 17, 17b, 18 | Add garment | Paul |
| Fig 19, 19b | Item editor | Paul |
| Fig 23 | You | Max |

**Seventeen plates, eight screens, three people.** Open
[`docs/design/mobile.html`](design/mobile.html) or
[`docs/design/desktop.html`](design/desktop.html) in a browser and read the
caption under each frame.

## What this plan does not decide

- **Which React Native toolchain.** Expo or bare is Max's call in step 0, and it
  belongs in an ADR when it is made.
- **Testing.** Nothing here says what is tested or how. That is a decision, it
  is not made, and it should be made before step 1 rather than after step 3.
- **Where the recommendation service lives.** Out of scope for this repository
  by ADR 0001. Until one exists, every screen runs on the fixture.
