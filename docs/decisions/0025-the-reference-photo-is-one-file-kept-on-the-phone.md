# 0025. The reference photo is one file kept on the phone

Status: Accepted, 2026-10-28.

## Context

**Fig 05 asks for one photograph of the person**, so that a render has
somebody to dress, and says it is stored the way the rest of the wardrobe is
and can be replaced or removed at any time (Fig 23's Change and Remove). ADR
0022 held the camera packages back for garments, because a garment photograph
needs a tagging contract first. A photo of the person needs no tagging. Expo
Go carries `expo-image-picker`, which opens the camera and the photo library,
and `expo-file-system` (ADR 0013, ADR 0018).

## Decision

**First run takes the photo with the camera or chooses it from the library,
through `expo-image-picker`, and `src/lib/reference.ts` keeps one copy of it
in the app's own documents**, where the system does not clear it, as the
picker's own copy may be. A new photo replaces the old only once it has been
copied, so a failed copy keeps the photo there was. Nothing sends it anywhere
yet, because the render that would is not built.

**Skipping keeps nothing and blocks nothing.** First run is reached from You
until step 3 makes it the screen a first launch opens on, since that moves
where every track's screens, and their tests, start.

**PREMISE:** one photo is enough, it stays on the phone until a render sends
it, and Expo Go carries both modules. If renders need several photos, or the
photo has to go somewhere a render does not, this is re-read.

## Consequences

- The camera asks for permission the first time. A refused camera still
  leaves the library and skipping, and the screen says how to allow it.
- docs/States.md gains First run's two failures, the camera refused and the
  photo not kept.
- Capture for garments is unchanged and still waits, as ADR 0022 says.

## What would show this was wrong

**A photo that disappears on its own**, which would mean the system clears
that folder after all, or a camera that does not open in Expo Go.
