# 0009. There is no desktop app

Status: Accepted, 2026-09-25.

## Context

**The mockup came in two frames**: `docs/design/mobile.html`, a phone, and
`docs/design/desktop.html`, the same seventeen screens in a browser. This is a
React Native app (README.md), docs/Acceptance.md measures every screen against a
390pt phone frame and asks that it run on other phones, and no track in
docs/Build_Plan.md builds anything wider. The browser frame drew an app nobody
was building, and it was a second generated file to keep in step with every
regeneration.

## Decision

**The app ships on phones only, and there is one mockup: the phone.** The
desktop mockup is deleted rather than left to go stale.

**PREMISE:** the app has one form factor. If a tablet, web or desktop build is
ever planned, this is re-read.

## Consequences

- ADR 0006 governs one generated file instead of two, and is amended to say so.
- README.md and docs/Build_Plan.md point at the phone mockup only.

## What would show this was wrong

**A request for the app anywhere but a phone.** A wider frame then comes back
from the design source before any code does, because the plates are the
specification.
