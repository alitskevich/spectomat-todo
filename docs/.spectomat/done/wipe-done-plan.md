# wipe-done — Implementation Plan

**Goal:** Add a `wipe` command to the todo-cli that removes all done items and prints the count removed.
**Architecture:** A pure `wipeItems()` domain function filters the item list; the CLI branch computes the count from the length diff and writes the result back via the existing store adapter.
**Tech stack:** Node 20 ESM, Vitest. No new packages.
**Spec:** docs/.spectomat/specs/wipe-done.md

## Global Constraints

- Node 20 ESM — all files use `import`/`export`; no `require`.
- Vitest — test runner; run with `npm test`.
- No new files — only modify existing files: `src/todo.js`, `src/todo.test.js`, `bin/todo.js`, `test/cli.test.js`.
- Pure domain functions in `src/todo.js` — no I/O, no side effects.
- Output message exact format: `Wiped N item(s)\n` to stdout (§3.1, §5.2).
- Usage string exact format: `Usage: todo <add <text>|list|done <id>|remove <id>|wipe>` (§7).
- Integration tests use `spawnSync` with `TODO_FILE` set to a temp file (existing pattern).
- Gate: `npm test` must pass (all tests green) before every commit.

## File map

| File | Responsibility | Created in |
| --- | --- | --- |
| `src/todo.js` | export `wipeItems(items)` — pure filter | Task 1 |
| `src/todo.test.js` | unit tests for `wipeItems` (AC-1.1 – AC-1.4) | Task 1 |
| `bin/todo.js` | `wipe` CLI branch + updated `USAGE_MSG` | Task 2 |
| `test/cli.test.js` | integration tests for `wipe` command (AC-2.1 – AC-2.4) | Task 2 |

## Tasks

| # | File | Component | Covers | Depends on |
| --- | --- | --- | --- | --- |
| 1 | `task-01-domain-function.md` | `wipeItems()` in `src/todo.js` | AC-1.1, AC-1.2, AC-1.3, AC-1.4 | — |
| 2 | `task-02-cli-integration.md` | `wipe` branch in `bin/todo.js` | AC-2.1, AC-2.2, AC-2.3, AC-2.4 | 1 |

## Coverage

| Criterion | Task |
| --- | --- |
| AC-1.1 | 1 |
| AC-1.2 | 1 |
| AC-1.3 | 1 |
| AC-1.4 | 1 |
| AC-2.1 | 2 |
| AC-2.2 | 2 |
| AC-2.3 | 2 |
| AC-2.4 | 2 |

## Rulings

(appended by executing-tasks)
