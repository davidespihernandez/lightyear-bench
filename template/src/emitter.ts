/** Minimal event emitter. See test/emitter.test.ts. */
export class Emitter {
  on(event: string, fn: (...args: any[]) => void): this {
    throw new Error('not implemented');
  }
  once(event: string, fn: (...args: any[]) => void): this {
    throw new Error('not implemented');
  }
  off(event: string, fn: (...args: any[]) => void): this {
    throw new Error('not implemented');
  }
  /** Returns true if at least one listener ran. */
  emit(event: string, ...args: any[]): boolean {
    throw new Error('not implemented');
  }
}
