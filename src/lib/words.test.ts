/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';

import fixture from '../../fixtures/pick.json';
import { drawn } from '../strings/drawn';
import { sampleCloset } from './sample';
import { categories, units, vibes, warmths } from './words';

/* ONE LIST, WRITTEN THREE TIMES: drawn by the mockup, typed here, and printed
   in README.md's contract (ADR 0020). This holds the three to one, so a word
   changed in one place and not the others fails here and not on the wire. */
const readme = readFileSync(join(__dirname, '../../README.md'), 'utf8').replace(/\r\n/g, '\n');

const listed = (field: string) => {
  const row = readme.match(new RegExp('^\\| `' + field + '` \\| (.+) \\|$', 'm'));
  if (!row) throw new Error('README.md lists no ' + field);
  return [...row[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
};

it.each([
  ['category', categories],
  ['warmth', warmths],
  ['vibe', vibes],
  ['units', units],
])('README.md lists the same %s words as src/lib/words.ts', (field, words) => {
  expect(listed(field)).toEqual([...words]);
});

it("uses Fig 08's Vibe for a garment's Style on Fig 18", () => {
  const f = drawn.fig18;
  expect([f.everyday, f.smart, f.active, f.occasion]).toEqual([...vibes]);
});

/* The example in README.md is the sample closet and the fixture, word for word. */
it("README.md's example is the sample closet asked about and the fixture answered", () => {
  const block = readme.match(/```\nPOST \/pick\n\n([^]*?)\n\n200\n\n([^]*?)\n```/);
  if (!block) throw new Error('README.md has no POST /pick example');
  const [sent, answered] = [JSON.parse(block[1]), JSON.parse(block[2])];
  expect(sent.garments).toEqual(sampleCloset);
  expect(answered).toEqual(fixture);
  expect(vibes).toContain(sent.vibe);
  expect(units).toContain(sent.units);
});
