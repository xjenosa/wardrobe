# 0018. The SDK is the one Expo Go runs

Status: Accepted, 2026-10-20.

## Context

**Each Expo Go runs one SDK.** A project on a newer SDK than the Expo Go on the
phone does not open; Expo Go says the project is incompatible with it. A new
Expo Go reaches the stores only after their review, so it can trail the SDK by
weeks: SDK 58 came out on 29 September 2026, and on 20 October Expo Go in both
the App Store and Google Play was still 57.0.9.

**Every member opens the app in Expo Go from their phone's store** (ADR 0013),
and nothing is built for a store (ADR 0014).

## Decision

**The project is on the SDK the stores' Expo Go runs, not the newest one.**
Today that is SDK 58. Expo Go's version number starts with its SDK, so the
store page says when the next one has arrived. Moving to it is its own pull
request, once Expo Go for it is in both stores.

**PREMISE:** members test in the Expo Go their store gives them, not in a
development build or a pre-release Expo Go. If the app moves to development
builds (ADR 0013's answer for a module Expo Go cannot load), the SDK stops
waiting for Expo Go and this is re-read.

## Consequences

- The project can sit a few weeks behind the newest SDK.
- An SDK upgrade passes the five checks and opens in Expo Go on an iPhone and on
  an Android phone before it is merged.
- "Incompatible with this version of Expo Go" means the project and the phone
  disagree on the SDK, and the fix is in the project, not on the phone.

## What would show this was wrong

**A member who cannot open the app because the two stores moved apart**, one on
the next SDK while the other is not, or an Expo module the app needs that only
the newer SDK has.

## Moved to SDK 58, 2026-10-28

Expo Go 58.0.5 reached the App Store on 22 October and Google Play after it,
and an updated iPhone could no longer open the project. The project moved to
SDK 58: React Native 0.88, React 19.3 and Jest 30. Its tunnel is Expo's own,
so `--tunnel` no longer installs ngrok.
