# 0010. The licence is GPL-3.0, not MIT

Status: Accepted, 2026-09-25.

## Context

**This repository was MIT**, which lets anyone take the app, change it and ship
the changed version with its source closed. Every commit so far is by one
author, so that author can still change the licence alone.

## Decision

**The repository is licensed under the GNU General Public License, version 3
only (GPL-3.0-only).** LICENSE holds the licence text as the Free Software
Foundation publishes it, and README.md says so under Licence.

**PREMISE:** anyone who publishes a changed version must publish its source.
Strictly, the source goes with the changed version to whoever receives it, and
they may pass both on. If the premise stops being the goal, this is re-read.

## Consequences

- **The credit to Wardrobe stays MIT, where ADR 0004 put it.** MIT code can be
  carried into a GPL-3.0 work as long as its notice travels with it, so that
  acknowledgement does not change.
- **Every contribution from now on is GPL-3.0.** Once a second person's code is
  in, changing the licence again needs the agreement of everyone whose code is
  in it.
- **Apple's App Store is in doubt.** Its terms are widely held to add
  restrictions that GPL-3.0 forbids, which is why GPL apps have been pulled from
  it before. Shipping there needs an exception every contributor agrees to.
  Google Play and a direct download raise no such conflict.
- **Version 3 only, not "or any later version".** A later GPL is a new decision.

## What would show this was wrong

**A changed version that reaches people without being handed to them.** GPL-3.0
binds a version that is conveyed; one that only runs as a hosted service escapes
it. If that becomes the worry, the answer is AGPL-3.0.
