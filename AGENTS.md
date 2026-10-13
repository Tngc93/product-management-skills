# AGENTS.md

Guidance for AI coding agents working in this repository (Codex, Claude Code, Cursor, Copilot and others).

## Project

Product management skills for Claude Code and Codex: PRDs, story slicing, RICE/ICE prioritisation, acceptance criteria, stakeholder updates and spec reviews, with a deterministic linter and scorer.

<!-- repo-onboarding:begin sha=ae2bd6802318 · generated from the repository; edit outside this block, refresh with `repo-onboarding update` -->
## Stack

- **Languages:** JavaScript
- **Runtime:** Node.js >=18.17
- **Package manager:** npm (package.json). Use it; do not mix in another one.
- **License:** MIT

## Commands

| Task | Command | Defined in |
| --- | --- | --- |
| Install dependencies | `npm install` | package.json |
| Test | `npm test` | package.json |
| `lint:examples` | `npm run lint:examples` | package.json |

## Layout

- `.claude-plugin/` Claude Code plugin manifest
- `.codex-plugin/` Codex plugin manifest
- `.github/` GitHub workflows and templates
- `cli/` command-line entry point
- `docs/` documentation
- `examples/` usage examples
- `skills/` agent skills
- `src/` source code
- `test/` tests

Entry points: `cli/pm-skills.mjs`

## CI

Run these locally before pushing; CI runs the same checks.

- `.github/workflows/ci.yml` (CI): `npm test`, `npm run lint:examples`
<!-- repo-onboarding:end -->

## Architecture

Two halves: **skills** an agent follows, and a **zero-dependency CLI** that does the parts that must be exact.

- `skills/<name>/SKILL.md` is the method for one job (write a PRD, slice stories, prioritise, write acceptance criteria, write an update, review a spec). `skills/<name>/template.md` is that job's output shape; `pm-skills template <name>` prints it.
- `cli/pm-skills.mjs` dispatches `lint`, `score` and `template`. Start here.
- `src/markdown.mjs` reads Markdown into lines (with code-fence state), heading sections and pipe tables, all with 1-based line numbers.
- `src/lint.mjs` holds every lint rule, the English and Turkish vague-word lists with their suggested rewrites, and document-type detection (front matter `type:` first, then the title).
- `src/score.mjs` parses RICE or ICE tables, does the arithmetic, ranks, finds close calls and writes Score and Rank columns back.
- `examples/good/` must lint clean; `examples/before/` shows what the linter catches. Both are used by the tests.

## Conventions

- No runtime dependencies; Node.js 18.17 built-ins only.
- The model never does arithmetic: any scoring or counting a skill needs goes into the CLI, and the skill tells the agent to run it.
- Every lint rule has a stable `rule` id, a message that says what is wrong, and a `hint` that says what to write instead. Add English and Turkish wording together.
- Prefer missing a problem to flagging a correct document: a new rule must leave `examples/good/` clean.
- Skills are written as instructions to the agent, in English. They tell the agent to write output in the user's language.
- Examples use a fictional store. Never put a real company, real customer data or internal tool names in examples or tests.

## Before you finish

- Run `npm test` and `npm run lint:examples`.
- A new rule or skill comes with tests in `test/` and, if it changes output, an updated example.
- Add a `CHANGELOG.md` entry for user-visible changes.

## Gotchas

- JavaScript `\b` does not treat Turkish letters as word characters. Word rules use `\p{L}` boundaries with the `u` flag instead; keep it that way when adding words.
- RICE confidence written as `80` means 80%; anything above 1 is divided by 100.
- `${CLAUDE_PLUGIN_ROOT}` is substituted in skill text by Claude Code but not by Codex, so every skill also gives the relative path to the CLI.
