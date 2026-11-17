import { expect, test } from 'bun:test';
import { compareSemver } from '../src/semver';

test('compares major, minor and patch numerically', () => {
  expect(compareSemver('1.2.3', '1.2.3')).toBe(0);
  expect(compareSemver('2.0.0', '1.9.9')).toBe(1);
  expect(compareSemver('1.10.0', '1.9.0')).toBe(1);
  expect(compareSemver('1.0.2', '1.0.10')).toBe(-1);
});
test('a pre-release is lower than the release', () => {
  expect(compareSemver('1.0.0-alpha', '1.0.0')).toBe(-1);
  expect(compareSemver('1.0.0', '1.0.0-rc.1')).toBe(1);
});
test('pre-release identifiers: numeric < alphanumeric, numbers compare as numbers', () => {
  expect(compareSemver('1.0.0-alpha', '1.0.0-beta')).toBe(-1);
  expect(compareSemver('1.0.0-alpha.2', '1.0.0-alpha.10')).toBe(-1);
  expect(compareSemver('1.0.0-1', '1.0.0-alpha')).toBe(-1);
});
test('a longer pre-release wins when all earlier identifiers are equal', () => {
  expect(compareSemver('1.0.0-alpha', '1.0.0-alpha.1')).toBe(-1);
  expect(compareSemver('1.0.0-alpha.beta', '1.0.0-alpha.1')).toBe(1);
});
test('build metadata is ignored and a leading v is allowed', () => {
  expect(compareSemver('1.0.0+build.5', '1.0.0+other')).toBe(0);
  expect(compareSemver('v1.2.0', '1.2.0')).toBe(0);
});
test('invalid versions throw', () => {
  for (const bad of ['1.2', '1.2.3.4', 'a.b.c', '']) expect(() => compareSemver(bad, '1.0.0')).toThrow();
});
