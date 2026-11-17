export class LRUCache<K, V> {
  private map = new Map<K, V>();
  constructor(private capacity: number) {
    if (!Number.isInteger(capacity) || capacity < 1) throw new Error('capacity must be a positive integer');
  }
  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    const v = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }
  set(key: K, value: V): void {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) this.map.delete(this.map.keys().next().value as K);
  }
  has(key: K): boolean {
    return this.map.has(key);
  }
  get size(): number {
    return this.map.size;
  }
  keys(): K[] {
    return [...this.map.keys()];
  }
}
