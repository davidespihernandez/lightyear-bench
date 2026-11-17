const UNITS: Record<string, number> = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
export function parseDuration(input: string): number {
  const s = input.trim();
  if (!s) throw new Error('empty duration');
  const re = /(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)/y;
  let total = 0;
  let pos = 0;
  while (pos < s.length) {
    re.lastIndex = pos;
    const m = re.exec(s);
    if (!m) throw new Error(`invalid duration: ${input}`);
    total += Number(m[1]) * UNITS[m[2]];
    pos = re.lastIndex;
    while (s[pos] === ' ') pos++;
  }
  return Math.round(total);
}
