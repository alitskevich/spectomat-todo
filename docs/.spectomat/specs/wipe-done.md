# wipe-done — todo-cli `wipe` command

Adds a `wipe` command to the todo-cli that removes all done items from the
store in one shot. The organizing idea is the same as every other command:
a pure domain function, a filesystem adapter call, and a thin CLI branch.

Code cites this document by section and line (`§3.4 L316`). Part I is
normative: the loop builds to it and never edits it. A divergence found during
the build is a **reconciliation**, recorded in §11 with a number and a reason.

# Part I — Specification

## 1. System Overview

### 1.1 Purpose

Extend the todo-cli with a `wipe` command that deletes every item whose
`done` field is `true`, leaving open items and their ids unchanged, and
reports the count removed.

### 1.2 Actors

- **User** — runs `todo wipe` from the shell.

### 1.3 The system in one picture

```
User → bin/todo.js (wipe branch) → wipeItems() → writeStore() → stdout
```

Illustrative only.

## 2. Domain Model

### 2.1 `Item`

Inherited unchanged from the existing model.

| Field  | Type    | Meaning                        |
| ------ | ------- | ------------------------------ |
| `id`   | integer | stable, unique within the list |
| `text` | string  | task description               |
| `done` | boolean | `true` = completed             |

## 3. Behaviour

### 3.1 `wipe` command

| Attribute      | Value |
| -------------- | ----- |
| **Trigger**    | `todo wipe` with no arguments |
| **Input**      | current item list read from store |
| **Algorithm**  | §5.1, §5.2 |
| **Output**     | `Wiped N item(s)\n` to stdout, N = count of removed items |
| **Failure**    | read/write errors propagate to stderr via `die()`; exit 1 |
| **Idempotency**| running `wipe` twice is safe; second call removes 0 items |

## 4. External Integrations

No new boundary. The store file path resolves to
`process.env.TODO_FILE ?? "./todo.json"` — same as every other command.

## 5. Normative Algorithms

### 5.1 `wipeItems(items)`

```
function wipeItems(items):
  return items where item.done === false
```

- Input: `Item[]`
- Output: `Item[]` — only items with `done === false`
- Surviving items retain their original ids.

### 5.2 CLI `wipe` branch

```
remaining = wipeItems(items)
count     = items.length - remaining.length
await writeStore(filePath, remaining)
stdout.write("Wiped " + count + " item(s)\n")
exit 0
```

## 6. Architecture

Files touched (no new files created):

| File                  | Change |
| --------------------- | ------ |
| `src/todo.js`         | export `wipeItems(items)` |
| `src/todo.test.js`    | unit tests for `wipeItems` |
| `bin/todo.js`         | add `wipe` branch; update `USAGE_MSG` |
| `test/cli.test.js`    | integration tests for the `wipe` command |

## 7. User Interface

The usage string becomes:

```
Usage: todo <add <text>|list|done <id>|remove <id>|wipe>
```

## 8. Deployment

Not applicable — CLI tool, no server or deploy step.

## 9. Acceptance Criteria

### 9.1 Per component

| Id     | Criterion                                                        | Verified by |
| ------ | ---------------------------------------------------------------- | ----------- |
| AC-1.1 | `wipeItems([])` returns `[]`                                    | unit test   |
| AC-1.2 | `wipeItems` with no done items returns the list unchanged        | unit test   |
| AC-1.3 | `wipeItems` removes only done items; open items and ids unchanged | unit test  |
| AC-1.4 | `wipeItems` with all items done returns `[]`                    | unit test   |

### 9.2 End-to-end (integration)

| Id     | Criterion                                                              | Verified by      |
| ------ | ---------------------------------------------------------------------- | ---------------- |
| AC-2.1 | `todo wipe` with done items prints `Wiped N item(s)` and exits 0      | integration test |
| AC-2.2 | `todo wipe` with no done items prints `Wiped 0 item(s)` and exits 0   | integration test |
| AC-2.3 | after `wipe`, open items remain with ids unchanged                     | integration test |
| AC-2.4 | `todo` with no command includes `wipe` in the usage message            | integration test |

### 9.3 Non-functional

None — no performance or availability targets for this command.

## 10. Decisions

| Id | Decision | Rejected | Why |
| -- | --------- | -------- | --- |
| D1 | `wipeItems` returns `Item[]`; CLI computes count from length diff | return `{ remaining, count }` from function | Pure functions return simple values; CLI owns presentation. `assumed` |
| D2 | Extra arguments after `wipe` are silently ignored | die with usage error | Consistent with existing `list` command behavior. `assumed` |

## 11. Reconciliations

| Id | Sections | Contradiction | Reading built to |
| -- | -------- | ------------- | ---------------- |

# Part II — Building it

## 12. Toolchain and layout

Unchanged: Node 20 ESM, Vitest, no new packages. All changes are additions to
existing files.

## 13. Configuration contract

No new configuration. `TODO_FILE` env var controls store path (inherited).

## 14. Boundaries: ports and fakes

No new boundary. Integration tests use a real file in a `tmp` directory, as
established by the existing test suite.

## 15. Verification

### 15.1 The gates

```bash
cd /Users/alex/Projects/spectomat-todo
npm test
```

All tests must pass (existing 24 + new tests for this feature).

### 15.2 What the gates do not cover

None. All criteria are locally verifiable.

### 15.3 The invariants that must be tests

| Invariant | Why a test and not a rule |
| --------- | ------------------------- |
| count printed = items removed | Arithmetic is trivial but makes the output contract explicit and regression-safe |

## 16. Build sequence

1. Add `wipeItems(items)` to `src/todo.js`; add unit tests in `src/todo.test.js` (AC-1.1 – AC-1.4).
2. Add `wipe` branch to `bin/todo.js`; update `USAGE_MSG`; add integration tests in `test/cli.test.js` (AC-2.1 – AC-2.4).
