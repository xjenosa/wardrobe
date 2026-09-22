# 0008. Main refuses a direct push, and the server is what refuses it

## Context

CLAUDE.md has said **branch, then open a pull request, do not push to `main`**
since this repository was set up. On 2026-09-22 both documentation branches were
merged locally and pushed straight to `main`, and **nothing anywhere refused
it.** The rule was correct, it was written down, and it was worth exactly as
much as whoever happened to remember it that day.

**A rule that lives only in a file is enforced by memory**, so it holds when the
work is calm and gives way when the work is busy, which is backwards. With three
people it gets worse rather than better: three memories, one branch, one
deadline.

This is one of the few rules here that does not have to rely on memory. GitHub
will enforce it, and on a public repository that costs nothing.

## Decision

**`main` is a protected branch**, set 2026-09-22:

| | |
|---|---|
| a pull request | required for every change to `main` |
| required approvals | **0 today**, and see below |
| force push | blocked |
| deleting `main` | blocked |
| administrators | **included, not exempt** |

**Administrators are included, and that is the load-bearing line.** The push
this decision exists to prevent was made by the account that owns the
repository. Exempting administrators would have let that exact push through and
left a setting that only disciplines other people.

**Approvals are 0 rather than 1 because there is one collaborator today.**
Requiring an approval before the other two have write access would block the
only person able to merge anything. **Raise it to 1 as soon as all three are
on**, because three people reviewing nothing is the other way to waste this:

```bash
gh api -X PATCH repos/xjenosa/wardrobe/branches/main/protection/required_pull_request_reviews \
  -F required_approving_review_count=1
```

**Proved rather than assumed.** A commit was aimed straight at `main` once the
setting landed, and the server refused it:

```
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: - Changes must be made through a pull request.
```

## Consequences

- **Everybody has to be able to open a pull request.** That is the GitHub CLI
  authenticated once per machine, or the website. docs/Build_Plan.md says how,
  and it goes before step 0.
- **The escape hatch is turning the setting off in Settings**, which takes half
  a minute and is a deliberate, visible act. That is a better hatch than a
  silent bypass, because a silent bypass is what happened.
- One merge in this history did not arrive through a pull request. It is the
  last one that can.

**PREMISE:** more than one person writes here, and the cost of a bad merge is
somebody's lost work. If this ever goes back to being one person's repository,
the protection is friction with nothing on the other side of it, and this is the
file to re-read.
