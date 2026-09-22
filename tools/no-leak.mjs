#!/usr/bin/env node
/*
 * no-leak: nothing from the private repository this design comes from is in
 * this one. Run it on every pull request.
 *
 *   node tools/no-leak.mjs
 *
 * WHY THIS EXISTS RATHER THAN ANOTHER PARAGRAPH IN CLAUDE.md. That file already
 * says not to copy anything across, and names the real hazard: a session can
 * hold both repositories at once, and **the failure mode is helpfulness, not
 * theft.** Asked an ordinary question, an assistant that can see a value on one
 * side and a gap on the other fills the gap.
 *
 * A RULE THAT RELIES ON SOMEBODY OBEYING IT IS WEAKER THAN A CHECK THAT FAILS.
 * Three of us, three sessions, one public repository and a deadline. The rule
 * stays, because it explains why; this makes it enforceable.
 *
 * THE FORBIDDEN NAMES ARE STORED AS HASHES. Writing them into a public file to
 * check that they are not in a public file would be the leak itself.
 */
import { execSync } from 'node:child_process';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';

const results = [];
const add = (id, rule, rows, ok) => results.push({ id, rule, rows, ok: ok ?? rows.length === 0 });

const files = execSync('git ls-files', { encoding: 'utf8', maxBuffer: 1 << 28 })
  .trim().split('\n')
  .filter(f => existsSync(f) && statSync(f).isFile())
  .filter(f => !/\.(png|jpe?g|gif|webp|ico|pdf|woff2?|ttf|otf|mp4|zip)$/i.test(f));

const read = f => readFileSync(f, 'utf8');
const here = (f, i, s) => f + ':' + (s.slice(0, i).split('\n').length);

/* ---------------------------------------------------- 1. the source name --- */
/* first 16 hex of sha256, lowercased word. The names never appear here. */
const FORBIDDEN = new Set(['254ca8cd30010565', '6c485707c8e38d05']);
const h = w => createHash('sha256').update(w).digest('hex').slice(0, 16);
{
  const bad = [];
  for (const f of files) {
    const s = read(f);
    for (const m of s.matchAll(/[A-Za-z][A-Za-z0-9-]{3,}/g)) {
      if (FORBIDDEN.has(h(m[0].toLowerCase()))) bad.push(here(f, m.index, s));
    }
  }
  add('no-source-name', 'the private project is named nowhere in this repository', [...new Set(bad)]);
}

/* ------------------------------------------------ 2. the insulation table --- */
/* A TWO-ENDED RANGE IS A ROW OF THE TABLE. ADR 0002 records where the line
   falls: the app may say a garment is good to about a temperature, and may
   never print the band it suits. */
{
  const SIGN = '[+\\u2212-]?', DEG = '\\s*(?:\\u00b0|deg\\b)';
  const RANGE = new RegExp(SIGN + '\\s?[0-9]{1,2}' + DEG + '\\s*(?:to|\\u2013|\\u2014)\\s*' + SIGN + '\\s?[0-9]{1,2}' + DEG, 'g');
  const bad = [];
  for (const f of files) {
    const s = read(f);
    for (const m of s.matchAll(RANGE)) bad.push(here(f, m.index, s) + '  ' + m[0].trim());
  }
  add('no-rated-range', 'no drawn or stored range encodes what a garment suits', bad);
}

/* ------------------------------------------------------ 3. a clo lookup --- */
/* A garment word beside a number, three or more times in one file, is a table
   however it is spelled. The API sends a word and gets a decision back. */
{
  const GARMENT = '(?:coat|parka|jacket|knit|sweater|jumper|shirt|tee|t-shirt|trousers|jeans|shorts|skirt|dress|boots?|shoes?|sneakers?|scarf|gloves|hat|beanie|socks|base ?layer|fleece|vest|hoodie)';
  const PAIR = new RegExp('["\'`]?' + GARMENT + '["\'`]?\\s*[:=,]\\s*[+-]?[0-9]+(?:\\.[0-9]+)?', 'gi');
  const bad = [];
  for (const f of files) {
    const s = read(f);
    const hits = [...s.matchAll(PAIR)];
    if (hits.length >= 3) bad.push(f + '  ' + hits.length + ' garment-to-number pairs, e.g. ' + hits[0][0].trim());
  }
  add('no-clo-table', 'no file pairs garments with numbers, which is a table however it is spelled', bad);
}

/* ------------------------------------------- 4. a path into another repo --- */
{
  const PATHS = /(?:[A-Za-z]:[\\/](?:Users|Documents)[^\s"'`)]{4,})|(?:\.\.[\\/]){3,}|(?:^|[\s"'`(])_recon\b/gm;
  const bad = [];
  for (const f of files) {
    if (f === 'tools/no-leak.mjs') continue;
    const s = read(f);
    for (const m of s.matchAll(PATHS)) bad.push(here(f, m.index, s) + '  ' + m[0].trim().slice(0, 50));
  }
  add('no-private-path', 'nothing points at a path outside this repository', bad);
}

/* ------------------------------------------------- 5. a foreign decision --- */
/* This repository numbers its own decisions from 0001. A citation above the
   highest one here came from somewhere else. */
{
  /* READ THE NUMBER, DO NOT COUNT CHARACTERS TO IT. This was slice(16, 20),
     which is one off and yields "001-", so every comparison was against NaN and
     a planted citation far above this repository's range walked straight
     through. It was the one check of six its own planted defect defeated.

     AND THE NUMBER IS NOT WRITTEN HERE, which is the second lesson of the same
     day: the decision forbidding a two-ended band spelled one as its example,
     and this comment first spelled a foreign decision number as its own. A rule
     that has to exempt itself has a hole in it, so both describe the shape. */
  const own = files.map(f => (f.match(/^docs\/decisions\/([0-9]{4})-/) || [])[1])
    .filter(Boolean).map(Number);
  const top = own.length ? Math.max(...own) : 0;
  const bad = [];
  for (const f of files) {
    const s = read(f);
    for (const m of s.matchAll(/\bADR\s*([0-9]{4})\b/g)) {
      if (Number(m[1]) > top) bad.push(here(f, m.index, s) + '  ADR ' + m[1] + ', and this repository stops at ' + String(top).padStart(4, '0'));
    }
  }
  add('no-foreign-decision', 'every decision cited is one this repository holds', bad);
}

/* -------------------------------------------------------- 6. a secret --- */
{
  const SECRET = /(?:sk-[A-Za-z0-9]{12,})|(?:AKIA[0-9A-Z]{12,})|(?:ghp_[A-Za-z0-9]{20,})|(?:BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY)|(?:(?:api[_-]?key|secret|password|token)\s*[:=]\s*["'`][^"'`\s]{12,})/gi;
  const bad = [];
  for (const f of files) {
    if (f === 'tools/no-leak.mjs') continue;
    const s = read(f);
    for (const m of s.matchAll(SECRET)) bad.push(here(f, m.index, s) + '  ' + m[0].slice(0, 12) + '...');
  }
  add('no-secret', 'no key, token or private key is committed', bad);
}

/* ------------------------------------------------- 7. the check ran wide --- */
/* THE VACUOUS PASS THIS REFUSES. Six checks over an empty file list would all
   pass and say nothing. */
add('read-the-repository', 'the scan opened the whole repository', [],
  files.length >= 10 && files.some(f => f.startsWith('docs/design/')));

let bad = 0;
for (const r of results) {
  if (!r.ok) bad++;
  console.log((r.ok ? 'ok   ' : 'FAIL ') + r.id.padEnd(22) +
    (r.ok ? r.rule : r.rows.length + ' places break this: ' + r.rule));
  if (!r.ok) for (const row of r.rows.slice(0, 8)) console.log('        ' + row);
}
console.log('\n' + files.length + ' files read. ' + (bad ? bad + ' FAILING CHECKS' : 'nothing from the private repository is here') + '\n');
process.exit(bad ? 1 : 0);
