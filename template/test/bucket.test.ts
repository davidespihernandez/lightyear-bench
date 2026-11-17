import { expect, test } from 'bun:test';
import { TokenBucket } from '../src/bucket';

const clock = () => {
  let t = 0;
  return { now: () => t, advance: (ms: number) => (t += ms) };
};

test('starts full and allows up to capacity', () => {
  const c = clock();
  const b = new TokenBucket(3, 1, c.now);
  expect([b.tryTake(), b.tryTake(), b.tryTake(), b.tryTake()]).toEqual([true, true, true, false]);
});
test('refills over time at the given rate', () => {
  const c = clock();
  const b = new TokenBucket(2, 2, c.now);
  b.tryTake(2);
  expect(b.tryTake()).toBe(false);
  c.advance(500);
  expect(b.tryTake()).toBe(true);
  expect(b.tryTake()).toBe(false);
});
test('never exceeds capacity', () => {
  const c = clock();
  const b = new TokenBucket(2, 10, c.now);
  c.advance(60_000);
  expect([b.tryTake(), b.tryTake(), b.tryTake()]).toEqual([true, true, false]);
});
test('taking more than available fails without consuming', () => {
  const c = clock();
  const b = new TokenBucket(5, 1, c.now);
  expect(b.tryTake(6)).toBe(false);
  expect(b.tryTake(5)).toBe(true);
});
test('fractional refill accumulates', () => {
  const c = clock();
  const b = new TokenBucket(1, 1, c.now);
  b.tryTake();
  c.advance(400);
  expect(b.tryTake()).toBe(false);
  c.advance(600);
  expect(b.tryTake()).toBe(true);
});
test('invalid arguments throw', () => {
  expect(() => new TokenBucket(0, 1)).toThrow();
  expect(() => new TokenBucket(1, 0)).toThrow();
  expect(() => new TokenBucket(1, 1).tryTake(0)).toThrow();
});
