# lightyear-bench

Measure what Fabric's **Lightyear** mode saves on a real coding-agent task. It runs the same Claude Code task, headless, through two Fabric routes (a normal one and a Lightyear one) and compares cost, time, tokens and whether the task was actually solved.

Lightyear is a mode of the Fabric Gateway `llm-router` plugin, currently in preview. Docs: https://docs.fabricgateway.ai/fabric/plugins.md (see the Lightyear page under routing).

## Result (so you don't have to run it)

Claude Code (`claude-sonnet-4-5`) implementing 8 small TypeScript modules until 50 tests pass. 5 runs per route, alternating order, run on 2026-11-16 through a Fabric tenant. Every run solved 50/50 tests and none edited the tests.

| | Normal route | Lightyear route | Difference |
|---|---|---|---|
| Cost per task (median) | $0.390 | **$0.245** | **-37 %** |
| Cost per task (mean) | $0.425 | $0.297 | -30 % |
| Output tokens (median) | 12.8k | **7.9k** | **-38 %** |
| Cache-read tokens (median) | 386k | 199k | -48 % |
| Time per task (median) | 180 s | **141 s** | **-22 %** |
| Turns (median) | 36 | 38 | same |
| Tasks solved | 5/5 | 5/5 | same |

Per run (cost / time): normal $0.348 165 s, $0.349 168 s, $0.548 451 s, $0.390 180 s, $0.492 235 s; Lightyear $0.236 132 s, $0.245 141 s, $0.245 133 s, $0.265 192 s, $0.492 277 s.

How to read it:

- **Realistic message: about 30-40 % lower cost and tokens, and about 20-30 % less time, on long coding-agent sessions.** This is in line with what Postman reports in [Lightyear: reducing AI spend](https://fabricgateway.ai/blog/lightyear-reducing-ai-spend/): 40 % cheaper and 31 % faster on average across long-horizon benchmarks (DeepSWE, TerminalBench and others), run with Claude Code and Codex on Opus 5.5 and GPT-6.1-Sol. Our task is much smaller and uses Sonnet 4.5, so treat the match as a sanity check, not a confirmation of their numbers.
- It is an average, not a guarantee: in 1 of 5 Lightyear runs there was no saving ($0.492, same as the expensive normal runs). Four of five were between $0.24 and $0.27.
- Cost is Claude Code's own estimate (`total_cost_usd`). Cross-check it in Fabric Analytics (LLM tab) for the provider-side number.
- One task, one model, 5 runs per route. Measure on your own workload before promising a figure.

### Where it pays off

Lightyear is built for **long agent sessions**: many model calls in a row, as in a coding agent working through a multi-step task. That is where the saving shows up (this benchmark: 38 turns, about 3 minutes).

- **Short loops are not the target.** On a 4-call agent (our `qa-agent-demo` fraud agent) there is little to optimize, and in our test the overhead outweighed the gain. Measure with a long session, not a short one.
- **It is not a semantic cache.** The saving comes from fewer and smaller model calls, not from reusing answers.
- **Providers:** Lightyear routes to Anthropic, OpenAI and Gemini (not Bedrock or Azure OpenAI).
- **Permissions:** Lightyear applies file edits through shell commands (the default in Claude Code 2.1.221 and later). Claude Code therefore needs a shell tool, and in a permission mode that asks you approve those commands as they come, as you would approve any shell command. The fallback to the normal Edit and Write tools applies only when the shell tool is missing or disabled. This benchmark allows shell commands (`--permissive`). With an allow-list of only `bun test`, a headless run cannot approve them and our Lightyear run solved 5/50 tests. Claude Code's `auto` permission mode (`--permission-mode auto`) is the recommended setup for Lightyear; we have not measured it here.

## What the task is

`template/` is a fixture: 8 modules (`slugify`, `duration`, `lru`, `semver`, `csv`, `template`, `bucket`, `emitter`) as stubs that throw `not implemented`, plus 50 tests in `template/test/`. Claude Code is told to implement them one module at a time and test as it goes (`template/TASK.md` and the prompt in `run.ts`). `reference/src/` holds verified solutions (50/50) so you can check the fixture itself.

A run counts as solved only if all 50 tests pass and `test/` was not modified.

## Reproduce it from scratch

### Prerequisites

- A Fabric tenant (Free is fine) with an **Anthropic connection** and a **Fabric API key**.
- [Bun](https://bun.sh) and [Claude Code](https://docs.claude.com/en/docs/claude-code) (`claude` on your PATH).
- Python 3 (only for the summary).
- Budget: about $4-5 for 5 runs per route. Each run is capped at $8 (`--budget`).

### 1. Two routes in Fabric

Create two routes on the same Anthropic connection:

| Route | Base path | Plugin |
|---|---|---|
| Normal | `/anthropic` | none |
| Lightyear | `/anthropic-lightyear` | `llm-router`, mode `lightyear`, scoped to **this route only** |

For the Lightyear route: set the base path (leaving it empty is a common mistake), and leave "Use the client's provider credentials" off so the gateway uses the connection credential. Give the plugin a name of your own; do not save the form with the default scope (`anthropic-route`), because that would apply it to the normal route too. Plugins can take seconds to minutes to apply.

Both routes need the `fg-api-key` header to be accepted (the runner sends it).

### 2. Configure

```bash
cp .env.example .env
# FABRIC_BASE_URL=https://<your-tenant>.dp.fabricgateway.ai   (no route, no trailing slash)
# FABRIC_GATEWAY_KEY=<your Fabric API key>
```

The runner points Claude Code at `<FABRIC_BASE_URL>/<route>` through `ANTHROPIC_BASE_URL`, sends the key as the `fg-api-key` header (`ANTHROPIC_CUSTOM_HEADERS`) and uses `--bare` with a dummy `ANTHROPIC_API_KEY`: the gateway adds the real provider key. See https://docs.fabricgateway.ai/fabric/agents/claude-code.md.

### 3. Optional: check the fixture

```bash
cp -r template /tmp/verify && cp reference/src/*.ts /tmp/verify/src/ && (cd /tmp/verify && bun test)   # 50 pass
```

### 4. Run

```bash
bun run.ts --ping                  # a few cents: confirms both routes answer ("pong")
bun run.ts --reps 5 --permissive   # 10 runs, about 20-30 minutes
python3 -I summarize.py
```

Notes:

- `--permissive` allows any shell command in the throwaway copy of the fixture (it uses an allow rule, not `--dangerously-skip-permissions`, because organizations can disable the bypass mode). Run it from your own terminal. Without it, Claude Code may only read, edit and run `bun test`, and Lightyear fails (see above).
- Before the real runs a **pre-flight** (a few cents) checks that Claude Code can write a file through each route and aborts otherwise. Expect `can write files` twice.
- Options: `--routes anthropic,anthropic-lightyear`, `--model claude-sonnet-4-5`, `--budget 8`, `--reps N`, `--preflight false`.
- Route order alternates on each repetition so time-of-day effects don't favor one side.
- `summarize.py --since <epoch-ms>` ignores older results if you re-run in the same folder.

### 5. Read the output

`summarize.py` prints one row per run (cost, time, turns, output and cache-read tokens, tests passed) and then per-route medians. Only runs that solved all 50 tests enter the medians. Per-run JSON files are in `results/` and never contain the gateway key; each run's working copy stays in `runs/` (ignored by git).

Then cross-check the same runs in the Fabric portal: Analytics, LLM tab (tokens and cost per route), and Traces (with Lightyear you see a Lightyear call followed by the provider call).

## Use your own workload

The strongest customer demo is their own task. Replace `template/` (keep a `test/` folder and a `TASK.md`) and the prompt in `run.ts`, keep `reference/` only if you want to validate it, and update the `50` in `run.ts`/`summarize.py` to your test count.

## Caveats

- Lightyear is in preview; behavior and savings may change.
- Results are from one tenant, one model and one task. Treat the table as an indication, not a benchmark.
