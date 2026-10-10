# 0005. Nothing is copied out of the private repository, by a person or by an agent

Status: Accepted, 2026-09-16.

## Context

**Some of us can read the private repository this project's design comes from.**
Access was granted deliberately, so that everybody can see the design mockups and
build toward the same picture. That is a good reason and it is not in question
here.

**What follows from it is.** ADR 0001 keeps the recommendation arithmetic out of
this repository because this repository is public. That protects it from
strangers. It does nothing about a person who can open both, and **nothing at
all about an assistant that is holding both at once.**

## The failure mode is helpfulness, not theft

**Nobody is going to decide to leak anything.** Here is how it happens instead:

> Somebody has both projects open in one session and asks a perfectly ordinary
> question: *"the range this outfit suits looks wrong, can you check the
> maths?"* The assistant finds the clo table in the private repository, sees
> that this project has no such table, and helpfully writes one in. It has
> answered the question. The commit is small, it is green, and it is public.

**An agent with two repositories in context has no way to know that the boundary
between them is the point.** It reads a missing table as a gap to fill, because
from the inside that is exactly what a gap looks like.

## Decision

**Nothing crosses from the private repository into this one.** Not a constant,
not a function, not a test fixture, not a doc paragraph, not a comment.

**If something over there seems to be needed over here, it is one of two
things** and neither is a copy:

1. **It belongs in the API response**, in which case it is added to the contract
   and comes back over the wire like everything else.
2. **It belongs in this repository's own README**, in which case it is written
   here in our own words, because the reader is somebody with no access at all.

**And the cheapest protection is not a rule: do not open both at once.** A
session holding only this repository cannot copy from a repository it cannot
see. Use two windows.

## What IS fine, so the rule does not read as "never look"

- **Reading the design mockups.** They are why the access exists. Matching what
  a screen SHOWS is the job.
- **Rebuilding a screen's LAYOUT** from that picture, in React Native, in this
  repository's own code.
- **Asking a question about the private project in a session that holds only the
  private project.** The boundary is about what gets WRITTEN here.

## Consequences

**A number that would have been a one-line copy becomes a conversation.** That
is slower and it is the intended cost: the conversation is where somebody
notices that the client is being asked to know something it should not.

**This rule is also in CLAUDE.md**, because that is what an assistant reads on
every prompt, and this is a rule that has to fire before the first line is
written rather than at review.

## What would show this was wrong

**If the private repository stops being private**, the reason evaporates and
this becomes ceremony. Nothing else does: not trust, not convenience, and not
the fact that everyone involved has read access.
