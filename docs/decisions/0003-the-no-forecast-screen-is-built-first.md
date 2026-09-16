# 0003. The no-forecast screen is built first, not last

Status: Accepted, 2026-09-16.

## Context

Every screen in this app depends on a forecast that can fail: no network, a
refused location, an API that is down or rate-limited.

## Decision

**Build the no-forecast state early and keep it working.** It is not the last
item on the list and it is not a nice-to-have.

## Consequences

**A state deferred to the end is a state that gets skipped**, because the end is
where the time runs out. This is the single most likely screen to be missing
from a submission, and the single easiest one for a reviewer to find: turn off
the wifi.

**It also shapes the code.** An app built with the failure in mind keeps the
fetch, the cache and the drawing separate, because it has to. One built
happy-path-first tangles them and gets untangled later, under time pressure.

**An app that only draws sunshine is a demo, not an app.**

## What would show this was wrong

Nothing realistic. The cost is a day early instead of a day late.
