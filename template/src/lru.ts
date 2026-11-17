/** Least-recently-used cache. See test/lru.test.ts. */
export class LRUCache<K, V> {
  constructor(capacity: number) {
    throw new Error('not implemented');
  }
  get(key: K): V | undefined {
    throw new Error('not implemented');
  }
  set(key: K, value: V): void {
    throw new Error('not implemented');
  }
  has(key: K): boolean {
    throw new Error('not implemented');
  }
  get size(): number {
    throw new Error('not implemented');
  }
  /** Keys from least to most recently used. */
  keys(): K[] {
    throw new Error('not implemented');
  }
}
