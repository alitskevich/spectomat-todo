# edit-text — Implementation Plan

**Goal:** Add `todo edit <id> <text>` that replaces an item's text in place, keeping `id` and `done` unchanged.
**Architecture:** One new pure function `editItem` in the domain layer (`src/todo.js`); the CLI layer (`bin/todo.js`) widens its argv destructuring to capture a fifth element and dispatches to `editItem`. No new files; no new packages.
**Tech stack:** Node 20 ESM, Vitest — no new packages.
**Spec:** docs/.spectomat/specs/edit-text.md

## Global Constraints

- Node 20 ESM; no new npm packages
- All tests must pass before every commit: `npm test` from repo root
- An implementer subagent never runs git; the controller commits after each task
- `editItem(items, id, text)` returns a new `Item[]` — never mutates input
- Empty text (`""`) is treated as missing — triggers `die(USAGE_MSG)` (`!arg2` is falsy for both `undefined` and `""`)
- No stdout on success
- `USAGE_MSG` updated to `"Usage: todo <add <text>|list [--json]|done <id>|remove <id>|wipe|edit <id> <text>>"`
- Argv destructuring widened to `[, , cmd, arg, arg2]` at top of `bin/todo.js`

## File map

| File               | Responsibility                                            | Created in |
| ------------------ | --------------------------------------------------------- | ---------- |
| `src/todo.js`      | export `editItem(items, id, text)` pure function          | Task 1     |
| `src/todo.test.js` | unit tests for `editItem` (AC-1.1 – AC-1.3)             | Task 1     |
| `bin/todo.js`      | widen destructuring; add `edit` branch; update USAGE_MSG  | Task 2     |
| `test/cli.test.js` | integration tests for `edit` (AC-2.1 – AC-2.5)           | Task 2     |

## Tasks

| #  | File                    | Component           | Covers                                        | Depends on |
| -- | ----------------------- | ------------------- | --------------------------------------------- | ---------- |
| 1  | `task-01-edit-item.md`  | `editItem` function | AC-1.1, AC-1.2, AC-1.3                       | —          |
| 2  | `task-02-cli-edit.md`   | CLI `edit` branch   | AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5      | 1          |

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
| AC-2.5    | 2    |

## Rulings

(appended by executing-tasks for decisions that cross tasks: `- Task N · <decision> — <why> — <cost if wrong>`)
