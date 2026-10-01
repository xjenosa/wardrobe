# 0013. The app is built with Expo

Status: Accepted, 2026-09-28.

## Context

**A React Native app starts either bare or on Expo.** Bare means the project
owns its iOS and Android projects and everybody needs Xcode or Android Studio.
Expo is a toolchain and a set of modules over React Native that keeps those
projects out of the repository. We are taught Expo, and what the app asks of a
phone (the camera, the photo library, storage on the device) has Expo modules.

## Decision

**The app is an Expo project, in TypeScript, with no `ios/` or `android/`
folder committed.** A member runs `npm start` and opens the app in Expo Go on
their own phone. If a module Expo Go cannot load is ever needed, the answer is a
development build from the same project, not a move to bare.

**PREMISE:** everything the app needs from the phone is covered by Expo's
modules, and the team knows Expo. If a feature needs native code no Expo module
or config plugin reaches, this is re-read.

## Consequences

- Nobody needs Xcode or Android Studio to build a screen.
- `npm start` in README.md starts Expo's server once step 0 exists.
- The generated files are TypeScript already, so the app is too.
- Navigation is chosen with the shell in step 0, not here.

## What would show this was wrong

**A feature stuck on Expo's edge**: the build needs native code, or a module
works in a development build and nowhere a member can test it.
