# 0007. The build splits by surface, and not by layer

## Context

Three of us are building this app at once, from one repository, with seventeen
drawn states across eight screens. A three-way split has to decide what each
person owns.

The obvious split is by layer: one does screens, one does state, one does the
API client. It is also the wrong one. Every feature crosses all three layers, so
all three of us would edit the same files every day, and every pull request
would touch everybody's work.

## Decision

**Split by SURFACE. Each of us owns whole directories and the screens inside
them.** docs/Build_Plan.md holds the table and the order.

- **Max, the frame:** First run, You, and the shared floor in `src/lib/`,
  `src/theme/` and `src/nav/`.
- **Natasha, the day:** No forecast, Today, Weather.
- **Paul, the wardrobe:** Closet, Add garment, Item editor.

**One person writes the shell first and the other two wait.** Navigation, the
design tokens, the string table, the pick client and the storage module cannot
be written three times.

**A session works out which of us it is from `git config user.name`**, so nobody
has to be told and nobody can guess wrong.

## Consequences

- A merge conflict becomes unusual rather than daily.
- Changing a file outside your directories is a pull request against its owner.
- The shell is a bottleneck for a day or two, which is the price.

**PREMISE:** three people, one repository, eight screens that divide cleanly
into three groups of similar size. If the team changes size, or if one track
turns out to be twice the work of the others, re-read this.
