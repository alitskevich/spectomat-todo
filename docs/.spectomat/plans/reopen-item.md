# reopen-item — Implementation Plan

**Goal:** Add `todo reopen <id>` that clears the done mark of one item; idempotent on already-open items.
**Architecture:** One new pure function `markOpen` in the domain layer (`src/todo.js`); the CLI layer (`bin/todo.js`) adds a `reopen` branch using the existing `arg` capture. No new files; no new packages.
**Tech stack:** Node 20 ESM, Vitest — no new packages.
**Spec:** docs/.spectomat/specs/reopen-item.md

## Global Constraints

- Node 20 ESM; no new npm packages
- All tests must pass before every commit: `npm test` from repo root
- An implementer subagent never runs git; the controller commits after each task
- `markOpen(items, id)` returns a new `Item[]` — never mutates input
- No stdout on success
- `USAGE_MSG` updated to `"Usage: todo <add <text>|list [--json]|done <id>|remove <id>|wipe|edit <id> <text>|reopen <id>>"`
- Argv destructuring stays `[, , cmd, arg, arg2]` — `reopen` uses only `arg`; no change needed

## File map

| File               | Responsibility                                            | Created in |
| ------------------ | --------------------------------------------------------- | ---------- |
| `src/todo.js`      | export `markOpen(items, id)` pure function                | Task 1     |
| `src/todo.test.js` | unit tests for `markOpen` (AC-1.1 – AC-1.4)             | Task 1     |
| `bin/todo.js`      | add `reopen` branch; update `USAGE_MSG`                  | Task 2     |
| `test/cli.test.js` | integration tests for `reopen` (AC-2.1 – AC-2.5)         | Task 2     |

## Tasks

| #  | File                      | Component           | Covers                                        | Depends on |
| -- | ------------------------- | ------------------- | --------------------------------------------- | ---------- |
| 1  | `task-01-mark-open.md`    | `markOpen` function | AC-1.1, AC-1.2, AC-1.3, AC-1.4              | —          |
| 2  | `task-02-cli-reopen.md`   | CLI `reopen` branch | AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5      | 1          |

## Coverage

| Criterion | Task |
| --------- | ---- |
| AC-1.1    | 1    |
| AC-1.2    | 1    |
| AC-1.3    | 1    |
| AC-1.4    | 1    |
| AC-2.1    | 2    |
| AC-2.2    | 2    |
| AC-2.3    | 2    |
| AC-2.4    | 2    |
| AC-2.5    | 2    |

## Rulings

(appended by executing-tasks for decisions that cross tasks: `- Task N · <decision> — <why> — <cost if wrong>`)
