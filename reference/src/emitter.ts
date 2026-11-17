type Fn = (...args: any[]) => void;
export class Emitter {
  private l = new Map<string, { fn: Fn; once: boolean }[]>();
  on(event: string, fn: Fn): this { (this.l.get(event) ?? this.l.set(event, []).get(event)!).push({ fn, once: false }); return this; }
  once(event: string, fn: Fn): this { (this.l.get(event) ?? this.l.set(event, []).get(event)!).push({ fn, once: true }); return this; }
  off(event: string, fn: Fn): this { this.l.set(event, (this.l.get(event) ?? []).filter((x) => x.fn !== fn)); return this; }
  emit(event: string, ...args: any[]): boolean {
    const snapshot = [...(this.l.get(event) ?? [])];
    for (const x of snapshot) {
      if (x.once) this.l.set(event, (this.l.get(event) ?? []).filter((y) => y !== x));
      x.fn(...args);
    }
    return snapshot.length > 0;
  }
}
