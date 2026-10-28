# The build plan

**Five people, one repository, and a drawing for every screen.** This file says
who builds what, in what order, and how a session knows which of the five it is
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

## Before step 0: sign in to GitHub, once per machine

**Everything you write reaches `main` as a pull request**, so your machine has
to be able to push a branch and open one. It takes about a minute.

1. **Accept the invitation to this repository.** It arrives by email and also
   waits at `github.com/xjenosa/wardrobe/invitations`. Until it is accepted,
   every push is refused.
2. **Install the GitHub CLI** if `gh --version` finds nothing:
   `winget install --id GitHub.cli` on Windows, `brew install gh` on a Mac.
   Open a new terminal afterwards so it is on your path.
3. **Sign in:**

   ```bash
   gh auth login
   ```

   Answer **GitHub.com**, then **HTTPS**, then **Yes** to authenticating Git,
   then **Login with a web browser**. It prints a one-time code: copy it, press
   Enter, paste it into the page that opens, and click **Authorize github**.
4. **Check it:**

   ```bash
   gh auth status
   ```

   It names your account. From then on `git push -u origin yourname/what`
   pushes your branch and `gh pr create` opens the pull request.

**No GitHub CLI?** The website opens the pull request instead: push your branch,
open the repository on github.com, and it offers to open one for you. **The push
still needs a sign-in.** Git for Windows opens one in the browser the first
time; on a Mac, Git asks for a password and only accepts a personal access
token, so installing the CLI is the shorter way.

## Who builds what

| | member | GitHub | track | screens | owns these directories |
|---|---|---|---|---|---|
| A | **Max** | `xjenosa` | **the frame** | First run, You | `src/lib/`, `src/theme/`, `src/nav/`, `src/kit/`, `src/screens/firstrun/`, `src/screens/you/` |
| B | **Natasha** | `natashaejercito` | **the day** | No forecast, Today | `src/screens/today/`, `src/lib/forecast/` |
| C | **Minh** | `mhuy1112` | **the weather** | Weather | `src/screens/weather/` |
| D | **Cris** | `flitoo` | **the closet** | Closet | `src/screens/closet/` |
| E | **Paul** | `minsikpaul92` | **capture** | Add garment, Item editor | `src/screens/add/`, `src/screens/editor/` |

**Minh and Cris joined after this plan was first written, and ADR 0016 is the
split.** Paul keeps the heaviest track. C and D are placed provisionally, so
Minh and Cris may swap them.

**The tracks are split by SURFACE and not by layer.** Five people splitting a
React Native app into "screens", "state" and "API" would all edit the same files
all week. Split by surface, each of us owns whole directories and a merge
conflict becomes unusual rather than daily.

**To swap tracks, edit this table in a pull request.** It is the only record.

## The order, and what blocks what

```
  STEP 0  the shell         Max            everybody waits
             |
     +--------------+--------------+--------------+
     |              |              |              |
  STEP 1
  Natasha        Minh           Cris           Paul
  no forecast    no forecast    closet, empty  Add garment
  Today          Weather        Closet         Item editor
     |              |              |              |
     +--------------+--------------+--------------+
             |
  STEP 2  First run         Max
          You
             |
  STEP 3  the seams         all five
```

### Step 0 is the shell, and only one person can write it

**Max builds it first and everybody is blocked until it merges.** It is small on
purpose:

- **The app boots** on a phone and in a simulator. It is an Expo project in
  TypeScript (ADR 0013), and it arrives with ADR 0015's test tooling and the
  checks every pull request has to pass.
- **A navigator** that puts every screen in the table above where its plate
  puts it, under the tab bar or over it (ADR 0017), each one a stub that
  renders its own name.
- **`src/theme/tokens.ts` and `src/strings/drawn.ts` are already written**, by
  `node tools/extract.mjs`, which reads the mockup. **56 tokens and 370 drawn
  sentences.** Nobody types a colour or retypes a sentence: five people
  matching a colour by eye produce five colours, and five people writing the
  same sentence from memory write five sentences.
  Both files are committed, so the app builds without running anything, and
  `node tools/extract.mjs --check` fails when they drift from the drawing.
- **`src/lib/pick.ts`**: sends the request in README.md and returns the
  response. **With no `EXPO_PUBLIC_PICK_URL` set it answers from `fixtures/`**,
  which is how every screen gets built before a service exists (ADR 0021). The
  answers were made for the sample closet in `fixtures/closet.json`, and You's
  stub puts that closet on the phone and chooses which day the fixture answers.
  With an address set, a failed ask comes back with the day's last real answer
  beside it, when one is kept.
- **`src/lib/store.ts`**: save and load the closet on the device. One module, so
  that two tracks storing garments do not write two. A change is made to the
  closet as saved, one at a time, and a closet that could not be read is never
  written over.

**Step 0 is done when each of the five can run the app, land on a stub for
their own screens where its plate puts it, save the closet and read it back,
and ask `pick()` about the sample closet and get the fixture back.**

### Step 1 is four tracks, in parallel

**Natasha starts with No forecast, not with Today, and Minh starts with Weather
that has no forecast.** ADR 0003 says why, and it is the one ordering rule in
this repository: an app whose weather can fail meets that state on an ordinary
Tuesday, and a state left until last is a state that gets skipped. Fig 11 and
Fig 14d are the drawings. Weather reads the forecast through Natasha's
`src/lib/forecast/`, so Minh builds against its shape from the first day.

**Cris starts with the empty closet.** Fig 06, captioned *"the real first
screen"*, is what a new person actually sees. Then the full grid.

**Paul starts with Add garment**, the camera and the confirm form, then the
editor, which reuses that form. Garments saved there are what the Closet shows.

### Step 2 is the frame, and it comes after the middle

**First run and You are last of the screens on purpose.** First run is the door
into a closet that has to exist before the door means anything, and You is a
settings list whose rows mostly switch things the other tracks built.

### Step 3 is the seams, and it is all five together

The things no single track can finish alone: moving between screens, the state
after a garment is added, what Today shows when the closet is empty, and one
pass over the whole app with the network off.

## The rules that keep five people out of each other's way

- **Branch as `yourname/what`.** `natasha/no-forecast`, `cris/closet-grid`.
- **Never push to `main`.** AGENTS.md says so; this says it again because it is
  the rule that costs the most when it is broken.
- **One pull request does one thing**, so it can be reviewed and so it can be
  reverted on its own.
- **If you need to change a file outside your directories, open a pull request
  against it and say who it is for.** `src/lib/`, `src/theme/` and `src/kit/`
  are Max's after step 0. This is not ceremony: two people editing a theme token
  on the same afternoon is how five people lose a day.
- **A screen is done when every box in [`docs/Acceptance.md`](Acceptance.md) is
  ticked.** That file is what stops "done" being a matter of opinion.
- **Every state a screen has is in [`docs/States.md`](States.md)**, with the
  plate that draws it and, where the mockup draws none, what to build instead.
  Loading, empty and failed are not left to be invented once per track.
- **The plates are the specification.** Open `docs/design/mobile.html`, find the
  figure, and compare.

## The plates, and which track each belongs to

| plate | screen | track |
|---|---|---|
| Fig 05 | First run, your reference photo | Max |
| Fig 06 | Closet, empty | Cris |
| Fig 08, 08d, 09, 10b, 12 | Today and its states | Natasha |
| Fig 11 | Today, the forecast failed | **Natasha, first** |
| Fig 14 | Weather | Minh |
| Fig 14d | Weather, no cached forecast | **Minh, first** |
| Fig 15 | Closet | Cris |
| Fig 17, 17b, 18 | Add garment | Paul |
| Fig 19, 19b | Item editor | Paul |
| Fig 23 | You | Max |

**Seventeen plates, eight screens, five people.** Open
[`docs/design/mobile.html`](design/mobile.html) in a browser and read the
caption under each frame.

## What this plan does not decide

- **An Outfits screen.** The mockup draws none, and ADR 0016 holds it back until
  a track runs out of work.
- **Where the recommendation service lives.** Out of scope for this repository
  by ADR 0001. Until one exists, every screen runs on the fixture.
