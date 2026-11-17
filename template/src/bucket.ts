/** Token bucket rate limiter with an injectable clock. See test/bucket.test.ts. */
export class TokenBucket {
  constructor(capacity: number, refillPerSecond: number, now: () => number = Date.now) {
    throw new Error('not implemented');
  }
  tryTake(count = 1): boolean {
    throw new Error('not implemented');
  }
}
