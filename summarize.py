"""Summarize results/*.json of run.ts: one row per run, then medians and means per route.

    python3 -I summarize.py [--since <epoch-ms>]

Runs with fewer than 50 passing tests (or edited tests) are marked NO and left out of the medians:
a run that did not solve the task is not comparable to one that did.
"""
import glob, json, os, statistics as st, sys

here = os.path.dirname(os.path.abspath(__file__))
since = int(sys.argv[sys.argv.index('--since') + 1]) if '--since' in sys.argv else 0
rows = []
for f in sorted(glob.glob(os.path.join(here, 'results', '*.json'))):
    ts = int(f.rsplit('-', 1)[1].split('.')[0])
    r = json.load(open(f))
    total = r['tests']['pass'] + r['tests']['fail']
    if ts < since or total == 0:  # skips pings and old runs
        continue
    r['ts'] = ts
    r['ok'] = r['tests']['pass'] == 50 and not r['testsTouched']
    rows.append(r)

print('| Route | OK | Tests | Turns | Cost | Time | Out tok | Cache read |')
print('|---|---|---|---|---|---|---|---|')
for r in sorted(rows, key=lambda r: (r['route'], r['ts'])):
    u = r['usage'] or {}
    print(f"| {r['route']} | {'yes' if r['ok'] else 'NO'} | {r['tests']['pass']}/50 | {r['turns']} | ${r['costUsd']:.3f} | {r['ms']//1000}s | {u.get('output_tokens')} | {u.get('cache_read_input_tokens')} |")

print()
med = {}
for route in sorted({r['route'] for r in rows}):
    ok = [r for r in rows if r['route'] == route and r['ok']]
    n = len([r for r in rows if r['route'] == route])
    if not ok:
        print(f'{route}: {n} runs, none solved the task')
        continue
    med[route] = (st.median(r['costUsd'] for r in ok), st.median(r['ms'] for r in ok) / 1000, st.median((r['usage'] or {}).get('output_tokens', 0) for r in ok))
    print(f"{route}: {len(ok)}/{n} solved | median cost ${med[route][0]:.3f} (mean ${st.mean(r['costUsd'] for r in ok):.3f}) | turns {st.median(r['turns'] for r in ok)} | time {med[route][1]:.0f}s | output tokens {med[route][2]:.0f}")

if len(med) == 2:
    (a, x), (b, y) = med.items()
    pct = lambda p, q: f'{(q - p) / p * 100:+.0f} %'
    print(f'\n{b} vs {a} (medians): cost {pct(x[0], y[0])}, time {pct(x[1], y[1])}, output tokens {pct(x[2], y[2])}')
