# 0020. The request's words are the words the mockup draws

Status: Accepted, 2026-10-20.

## Context

**ADR 0002 sends a word and never a number, but nobody had listed the words.**
Its example said `"row": "Coat"`, and the Add garment screen and the service
both need the closed list it promised.

## Decision

**The app sends the word it shows, and keeps no lookup.**

- `category` is one of the six on Fig 18's Category.
- `warmth` replaces `row`: one of the five under "Not sure?" on Fig 18's Warmth,
  for any category. The service turns each word into what it needs. An
  accessory may leave it out, and the service never picks one.
- `vibe`, and a garment's style, is one of the four on Fig 08's Vibe and
  Fig 18's Style.
- `code` replaces `condition`: the forecast's own WMO weather code. The words
  Today prints for it are the app's, from WMO's published table, and the
  service never reads a word for the sky.

**The lists are printed in README.md's contract and typed in
`src/lib/words.ts`, which takes them from the mockup's own strings, and
`words.test.ts` holds the three to one.** The service answers a word that is not
on its list with a 400 that names the field.

**PREMISE:** the words the screens draw are words the service can understand.
If a screen ever has to show a word the service should not receive, this is
re-read.

## Consequences

- A garment is sent as the person described it, with no translation step to
  drift.
- Adding a word changes the mockup, the contract and the service together, as
  ADR 0002 said it would.

## What would show this was wrong

**A garment none of the five warmths fits**, or a style the four do not cover.
Widen the drawn list; do not add a hidden one.
