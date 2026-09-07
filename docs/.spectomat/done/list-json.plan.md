# list-json — Implementation Plan

**Goal:** Add a `--json` flag to `todo list` that outputs the item list as a compact JSON array.
**Architecture:** One new pure function `formatJson` in the domain layer (`src/todo.js`); the CLI layer (`bin/todo.js`) gains a flag dispatch branch that routes `--json` to `formatJson`, no-arg to the existing plain format, and any other arg to `die()`. Integration tests cover both the JSON output and the regression of plain output.
**Tech stack:** Node 20 ESM, Vitest — no new packages.
**Spec:** docs/.spectomat/specs/list-json.md

## Global Constraints

- Node 20 ESM; no new npm packages
- All tests must pass before every commit: `npm test` from repo root
- An implementer subagent never runs git; the controller commits after each task
- `formatJson(items)` returns compact JSON string with no trailing newline; CLI adds `"\n"`
- Each JSON element has exactly the keys `id`, `text`, `done` — no extra fields
- `USAGE_MSG` updated to `"Usage: todo <add <text>|list [--json]|done <id>|remove <id>|wipe>"`
- Any `arg` to `list` that is neither `undefined` nor `"--json"` triggers `die(USAGE_MSG)`

## File map

| File               | Responsibility                                        | Created in |
| ------------------ | ----------------------------------------------------- | ---------- |
| `src/todo.js`      | export `formatJson(items)` pure formatting function   | Task 1     |
| `src/todo.test.js` | unit tests for `formatJson` (AC-1.1 – AC-1.3)        | Task 1     |
| `bin/todo.js`      | flag dispatch in `list` branch; update `USAGE_MSG`   | Task 2     |
| `test/cli.test.js` | integration tests for `list --json` (AC-2.1 – AC-2.4) | Task 2   |

## Tasks

| #  | File                          | Component             | Covers                        | Depends on |
| -- | ----------------------------- | --------------------- | ----------------------------- | ---------- |
| 1  | `task-01-format-json.md`      | `formatJson` function | AC-1.1, AC-1.2, AC-1.3       | —          |
| 2  | `task-02-cli-flag.md`         | CLI flag dispatch     | AC-2.1, AC-2.2, AC-2.3, AC-2.4 | 1        |

## Coverage

| Criterion | Task |
| --------- | ---- |
| AC-1.1    | 1    |
| AC-1.2    | 1    |
| AC-1.3    | 1    |
| AC-2.1    | 2    |
| AC-2.2    | 2    |
| AC-2.3    | 2    |
| AC-2.4    | 2    |

## Rulings

(appended by executing-tasks for decisions that cross tasks: `- Task N · <decision> — <why> — <cost if wrong>`)
