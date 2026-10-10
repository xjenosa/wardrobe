# 0014. The app is not published on Apple's App Store

Status: Accepted, 2026-09-28.

## Context

**ADR 0010 made the licence GPL-3.0 and left Apple's App Store in doubt.** The
store's terms are widely held to add restrictions GPL-3.0 forbids, so shipping
there needs an exception every contributor agrees to, and each new contributor
makes that harder. The question was whether to write the exception now, while
one person's code is in.

**This is a capstone.** It has to run on our phones for the demonstration and
in the report. Nobody outside the team needs to download it.

## Decision

**The app is not published on the App Store, and no GPL exception is
written.** It is shown in Expo Go (ADR 0013), which loads the app from a
development server rather than from the store. The licence stays GPL-3.0-only,
as ADR 0010 says.

**PREMISE:** nobody outside the team has to install the app from Apple's store.
If that becomes a goal, this is re-read, and the exception needs the agreement
of everyone whose code is in by then.

## Consequences

- ADR 0010's open question about the App Store is closed.
- Nobody needs a paid Apple developer account.
- An Android build can still be handed out directly or through Google Play,
  where GPL-3.0 raises no such conflict.

## What would show this was wrong

**A reason to put the app in front of strangers on an iPhone**: a grading
requirement, or a portfolio that needs a store page rather than a video.
