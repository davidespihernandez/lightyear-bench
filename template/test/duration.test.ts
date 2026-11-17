import { expect, test } from 'bun:test';
import { parseDuration } from '../src/duration';

test('single units', () => {
  expect(parseDuration('250ms')).toBe(250);
  expect(parseDuration('45s')).toBe(45_000);
  expect(parseDuration('10m')).toBe(600_000);
  expect(parseDuration('2h')).toBe(7_200_000);
  expect(parseDuration('1d')).toBe(86_400_000);
});
test('combined units, in any order', () => {
  expect(parseDuration('1h30m')).toBe(5_400_000);
  expect(parseDuration('1d 2h 3m 4s 5ms')).toBe(86_400_000 + 7_200_000 + 180_000 + 4_000 + 5);
  expect(parseDuration('30m1h')).toBe(5_400_000);
});
test('decimals are allowed', () => expect(parseDuration('1.5h')).toBe(5_400_000));
test('"m" is minutes and "ms" is milliseconds', () => {
  expect(parseDuration('5m')).toBe(300_000);
  expect(parseDuration('5ms')).toBe(5);
});
test('invalid input throws', () => {
  for (const bad of ['', 'abc', '10', '5x', '1h-30m', 'h']) expect(() => parseDuration(bad)).toThrow();
});
