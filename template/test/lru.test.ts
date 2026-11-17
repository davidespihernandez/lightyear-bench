import { expect, test } from 'bun:test';
import { LRUCache } from '../src/lru';

test('stores and reads values', () => {
  const c = new LRUCache<string, number>(2);
  c.set('a', 1);
  expect(c.get('a')).toBe(1);
  expect(c.get('z')).toBeUndefined();
  expect(c.has('a')).toBe(true);
  expect(c.size).toBe(1);
});
test('evicts the least recently used entry when full', () => {
  const c = new LRUCache<string, number>(2);
  c.set('a', 1);
  c.set('b', 2);
  c.set('c', 3);
  expect(c.has('a')).toBe(false);
  expect(c.keys()).toEqual(['b', 'c']);
});
test('get refreshes recency', () => {
  const c = new LRUCache<string, number>(2);
  c.set('a', 1);
  c.set('b', 2);
  c.get('a');
  c.set('c', 3);
  expect(c.has('b')).toBe(false);
  expect(c.keys()).toEqual(['a', 'c']);
});
test('set on an existing key updates the value and refreshes recency without growing', () => {
  const c = new LRUCache<string, number>(2);
  c.set('a', 1);
  c.set('b', 2);
  c.set('a', 10);
  expect(c.size).toBe(2);
  expect(c.get('a')).toBe(10);
  expect(c.keys()).toEqual(['b', 'a']);
});
test('has does not refresh recency', () => {
  const c = new LRUCache<string, number>(2);
  c.set('a', 1);
  c.set('b', 2);
  c.has('a');
  expect(c.keys()).toEqual(['a', 'b']);
});
test('capacity must be a positive integer', () => {
  expect(() => new LRUCache(0)).toThrow();
  expect(() => new LRUCache(-1)).toThrow();
  expect(() => new LRUCache(1.5)).toThrow();
});
