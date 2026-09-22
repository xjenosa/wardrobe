# CLAUDE.md

Rules only, read on every prompt. What the project IS lives in README.md; what
is not done yet lives in the issues.

A React Native wardrobe app. You photograph your clothes and each morning it
tells you what to wear for the weather. Several people work in this repository
and **it is public**, so both of those change what the rules have to say.

## The two rules that are not style

### 1. THE RECOMMENDATION IS NOT IN THIS REPOSITORY

The app sends the garments and the weather to a service and gets back which
garments to wear and the temperature range they suit. **That service is not
here and its arithmetic is not here.**

- **Do not compute it locally.** Not a clo table, not a lookup, not a formula.
- **Do not add "a simple version for now".** A wrong formula that works is
  harder to remove than one that is missing, because nothing fails while it is
  wrong: the app keeps recommending, just badly, and the day somebody replaces
  it every screenshot in the report changes.
- **If the service is not ready, use the fixture.** `fixtures/pick.json` holds
  the response shape README.md documents, and it is what the app reads with the
  network off.
- **If a screen seems to need something the response does not carry**, say so
  and stop. Either the boundary is in the wrong place or something is leaking,
  and both are decisions rather than code.

The request and response shapes are in README.md and they are the contract.

### 2. THE DRAWING IS OURS

**Do not copy the layout, type, colours or icons of any existing app.** Matching
what a screen SHOWS is normal and fine: hours, temperature, precipitation,
curves. That is how weather has been drawn for a century.

The layout, the type, the colours and the iconography are somebody's product,
and **this repository is public and is portfolio work.** Reproducing another
company's interface is the single change that turns a portfolio piece into
something that has to come down.

## What must never be committed

- **No secrets.** No `.env`, no API key, no service URL that is not meant to be
  public, no token in a config file. Once it is in the history it is in the
  history, and this repository is public.
- **No generated output**: `node_modules/`, build artefacts, `.expo/`.
- **No private context.** `CLAUDE.local.md` and `.claude/settings.local.json`
  are where anything you keep to yourself goes. This file is committed on
  purpose, so that everybody's session reads the same rules; those two are not.
- **`.gitignore` carries no comments and neither does anything else here.** Its
  entries are the list and this section is the reason, and a reason written in
  two places goes stale in one of them.
- **Nothing copied out of the private repository this design comes from.** Some
  of us can open it and **a session can hold both at once**, which is the real
  hazard: asked an ordinary question, an assistant that can see a clo table on
  one side and no clo table on the other reads the absence as a gap to fill, and
  helpfully writes it in. **The failure mode is helpfulness, not theft.** If
  something over there seems needed here, it goes in the API response or gets
  written here in our own words. The cheapest protection is not a rule: **do not
  open both at once.** ADR 0005.

## Working together

- **Branch, then open a pull request. Do not push to `main`.** Four people and
  one branch is four people rewriting each other.
- **One pull request does one thing**, so it can be reviewed and so it can be
  reverted on its own.
- **Never commit or push unless asked.** Arrive with the split already decided
  and run it when the ask comes.
- **Commit subjects are Conventional Commits** (`feat:`, `fix:`, `docs:`,
  `chore:`), no body, no AI co-author trailer.
- **A subject that names three things is a commit that should have been three.**
- **The failure state is not an afterthought.** Build the no-forecast screen
  early and keep it working. An app that only draws sunshine is a demo, and the
  forecast failing is a Tuesday rather than an edge case.

## Conventions

- No em dash (U+2014) anywhere: code, comments, commit messages, chat. A full
  stop usually does the job, otherwise a spaced hyphen.
- Canadian English in anything a person reads.
- **Comments are for a reader who did not write the code.** Keep constraints,
  invariants and non-obvious reasons. Cut narration of what the code already
  shows.
- **Verify by running the app**, not by the types compiling.
- **Every user-facing string comes from one place**, never typed into a view. A
  string in a component is a string nobody can find again.
- **When a decision is made, write it down as an ADR in `docs/decisions/`**, as
  it is made and not later. Next number, kebab-case name, and **state the
  PREMISE inside it, so that when the premise changes there is something to
  re-read.** Add a line to `docs/decisions/README.md`, which is the index a
  session reads instead of opening all of them. A decision that lives only in a
  pull-request comment is a decision the next person re-argues.
- **Keep them short.** An ADR that runs past a page is usually two decisions.
  The ceremony is the point only as far as it forces the premise out; past that
  it is friction, and friction is how a decisions folder stops being written.

## What this file deliberately does NOT do

- **It does not point at any other repository.** Anything this project needs to
  know is in this project. If something here can only be understood by reading
  somewhere else, that is a gap in README.md and it gets fixed here.
- **It does not describe the recommendation service's internals.** They are not
  ours to publish and they are not needed to build a client.
