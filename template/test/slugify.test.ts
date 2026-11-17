import { expect, test } from 'bun:test';
import { slugify } from '../src/slugify';

test('lowercases and joins words with dashes', () => expect(slugify('Hello World')).toBe('hello-world'));
test('strips accents', () => expect(slugify('Crème Brûlée à la carte')).toBe('creme-brulee-a-la-carte'));
test('replaces symbols and collapses repeated separators', () => expect(slugify('Rock & Roll -- 100% fun!!')).toBe('rock-roll-100-fun'));
test('trims leading and trailing separators', () => expect(slugify('  --Hi there--  ')).toBe('hi-there'));
test('keeps digits', () => expect(slugify('Top 10 of 2026')).toBe('top-10-of-2026'));
test('empty or symbol-only input gives an empty string', () => {
  expect(slugify('')).toBe('');
  expect(slugify('!!!')).toBe('');
});
