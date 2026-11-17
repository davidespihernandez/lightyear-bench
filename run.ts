/**
 * A/B Claude Code through two Fabric routes (with and without Lightyear), headless, on the same task.
 *
 *   bun run.ts --reps 5 [--routes anthropic,anthropic-lightyear] [--model claude-sonnet-4-5] [--budget 8]
 *               [--permissive] [--preflight false] [--ping]
 *
 * Needs FABRIC_BASE_URL and FABRIC_GATEWAY_KEY (Bun loads ./.env automatically; see .env.example).
 * Each run gets a fresh copy of ./template, then `claude -p --bare ... --output-format json`, then `bun test`.
 * By default Claude Code may only read/search, edit files and run `bun test`. With --permissive it may run any
 * shell command (needed for Lightyear's code mode): only use it on this throwaway copy of the fixture.
 * Results go to ./results/*.json (never contains the gateway key).
 */
import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { $ } from 'bun';

const arg = (k: string, d?: string) => {
  const i = process.argv.indexOf('--' + k);
  return i < 0 ? d : process.argv[i + 1]?.startsWith('--') || process.argv[i + 1] === undefined ? 'true' : process.argv[i + 1];
};
const routes = (arg('routes', 'anthropic,anthropic-lightyear') as string).split(',');
const reps = Number(arg('reps', '1'));
const model = arg('model', 'claude-sonnet-4-5') as string;
const budget = arg('budget', '8') as string;
const ping = arg('ping') === 'true';
const permissive = arg('permissive') === 'true';
const key = process.env.FABRIC_GATEWAY_KEY;
const base = (process.env.FABRIC_BASE_URL ?? '').replace(/\/(anthropic[^/]*)?\/?$/, '');
if (!key || !base) throw new Error('Set FABRIC_GATEWAY_KEY and FABRIC_BASE_URL (copy .env.example to .env).');

const here = import.meta.dir;
const TASK = `Read TASK.md and do it. Work one module at a time, in the order src/index.ts lists them: read that module's test file, implement the module, run only that module's tests (bun test test/<name>.test.ts), and fix it until it passes before you start the next module. Do not write several modules before testing. When every module passes, run the full suite (bun test) once and stop.`;
const prompt = ping ? 'Reply with exactly: pong' : TASK;
// --permissive: any shell command is allowed by a permission rule (no bypass flag; organization policy may disable bypass mode).
const allowed = permissive ? 'Read,Glob,Grep,Edit,Write,Bash' : 'Read,Glob,Grep,Edit,Write,Bash(bun test:*)';
const envFor = (route: string) => ({
  ...process.env,
  ANTHROPIC_BASE_URL: `${base}/${route}`,
  ANTHROPIC_CUSTOM_HEADERS: `fg-api-key: ${key}`,
  ANTHROPIC_API_KEY: 'sk-ant-unused-the-gateway-adds-the-real-key',
});

// Pre-flight (a few cents): prove Claude Code can really write a file through each route before the expensive runs.
if (!ping && arg('preflight') !== 'false') {
  for (const route of routes) {
    const dir = join(here, 'runs', `preflight-${route}`);
    await rm(dir, { recursive: true, force: true });
    await mkdir(dir, { recursive: true });
    await $`claude -p ${'Create a file named preflight.txt containing the word ok, then stop.'} --bare --output-format json --model ${model} --allowedTools ${allowed} --max-budget-usd 1 --no-session-persistence`
      .cwd(dir)
      .env(envFor(route))
      .nothrow()
      .quiet();
    const ok = await Bun.file(join(dir, 'preflight.txt')).exists();
    console.log(`pre-flight ${route}: ${ok ? 'can write files' : 'CANNOT write files'}`);
    if (!ok) {
      console.log('Aborting: fix permissions first (see --permissive), no tokens were spent on the real task.');
      process.exit(1);
    }
  }
}

await mkdir(join(here, 'results'), { recursive: true });
// Alternate which route goes first on each repetition.
const order = Array.from({ length: reps }, (_, i) => (i % 2 === 0 ? routes : [...routes].reverse())).flat();
for (const route of order) {
  const dir = join(here, 'runs', `${Date.now()}-${route}`);
  await rm(dir, { recursive: true, force: true });
  await cp(join(here, 'template'), dir, { recursive: true });
  const started = Date.now();
  const p = await $`claude -p ${prompt} --bare --output-format json --model ${model} --allowedTools ${allowed} --max-budget-usd ${budget} --no-session-persistence`
    .cwd(dir)
    .env(envFor(route))
    .nothrow()
    .quiet();
  const ms = Date.now() - started;
  let out: any = null;
  try {
    out = JSON.parse(p.stdout.toString());
  } catch {
    /* keep the raw output below */
  }
  let tests = { pass: 0, fail: 0, raw: '' };
  let testsTouched = false;
  if (!ping) {
    const t = await $`bun test 2>&1`.cwd(dir).nothrow().quiet();
    const txt = t.stdout.toString();
    tests = { pass: Number(/(\d+) pass/.exec(txt)?.[1] ?? 0), fail: Number(/(\d+) fail/.exec(txt)?.[1] ?? 0), raw: txt.split('\n').slice(-6).join('\n') };
    const d = await $`diff -rq ${join(here, 'template', 'test')} ${join(dir, 'test')}`.nothrow().quiet();
    testsTouched = d.exitCode !== 0;
  }
  const rec = {
    route,
    model,
    ms,
    exit: p.exitCode,
    isError: out?.is_error ?? null,
    turns: out?.num_turns ?? null,
    apiMs: out?.duration_api_ms ?? null,
    costUsd: out?.total_cost_usd ?? null,
    usage: out?.usage ?? null,
    modelUsage: out?.modelUsage ?? null,
    result: String(out?.result ?? p.stdout.toString()).slice(0, 300),
    stderr: p.stderr.toString().slice(0, 300),
    tests,
    testsTouched,
    dir,
  };
  await writeFile(join(here, 'results', `${route}-${Date.now()}.json`), JSON.stringify(rec, null, 2));
  console.log(
    `[${route}] ${Math.round(ms / 1000)}s exit=${p.exitCode} turns=${rec.turns} cost=${rec.costUsd} tests=${tests.pass}/${tests.pass + tests.fail}${testsTouched ? ' TESTS EDITED' : ''} ${ping ? rec.result.slice(0, 60) : ''}`,
  );
}
