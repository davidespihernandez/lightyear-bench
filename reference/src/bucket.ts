export class TokenBucket {
  private tokens: number;
  private last: number;
  constructor(private capacity: number, private rate: number, private now: () => number = Date.now) {
    if (!(capacity > 0) || !(rate > 0)) throw new Error('capacity and rate must be positive');
    this.tokens = capacity;
    this.last = now();
  }
  tryTake(count = 1): boolean {
    if (!(count > 0)) throw new Error('count must be positive');
    const t = this.now();
    this.tokens = Math.min(this.capacity, this.tokens + ((t - this.last) / 1000) * this.rate);
    this.last = t;
    if (this.tokens < count) return false;
    this.tokens -= count;
    return true;
  }
}
