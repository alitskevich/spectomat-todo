# reopen-item — `todo reopen <id>`

Adds a `reopen` command to todo-cli that clears the done mark of one item.
The item keeps its `id` and `text`; only `done` flips to `false`. The same
structural pattern as every other command: a pure domain function in
`src/todo.js`, wired in `bin/todo.js`, vitest tests for both.

Code cites this document by section and line (`§3.4 L316`). Part I is
normative: the loop builds to it and never edits it. A divergence found during
the build is a **reconciliation**, recorded in §11 with a number and a reason.

# Part I — Specification

## 1. System Overview

### 1.1 Purpose

Add `todo reopen <id>` to the CLI. When invoked, the item with the given `id`
has its `done` field reset to `false`; `id` and `text` are unchanged.
Reopening an already-open item is not an error and produces no output.

### 1.2 Actors

- **User** — runs `todo reopen <id>` from the shell.

### 1.3 The system in one picture

```
User → bin/todo.js (reopen branch)
         ├── no id arg            → die(USAGE_MSG) → stderr, exit 1
         ├── unknown id           → die("Item <id> not found") → stderr, exit 1
         └── found id             → markOpen() → writeStore() → exit 0 (no stdout)
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

### 3.1 `reopen` command — happy path

| Attribute       | Value |
| --------------- | ----- |
| **Trigger**     | `todo reopen <id>` where `<id>` is a known item id |
| **Input**       | `id` (integer), current store |
| **Algorithm**   | §5.1, §5.2 |
| **Output**      | none to stdout; store updated with `done: false` for matching item |
| **Failure**     | write errors propagate via `die()`; exit 1 |
| **Idempotency** | reopening an already-open item writes the store with the same value and exits 0 — end state unchanged |

### 3.2 `reopen` command — unknown id

| Attribute   | Value |
| ----------- | ----- |
| **Trigger** | `todo reopen <id>` where `<id>` does not match any item |
| **Output**  | `Item <id> not found` to stderr, exit 1 |

### 3.3 `reopen` command — missing id

| Attribute   | Value |
| ----------- | ----- |
| **Trigger** | `todo reopen` with missing `id` argument |
| **Output**  | `USAGE_MSG` to stderr, exit 1 |

## 4. External Integrations

No new boundary. Store path resolves to
`process.env.TODO_FILE ?? "./todo.json"` — same as every other command.

## 5. Normative Algorithms

### 5.1 `markOpen(items, id)`

```
function markOpen(items, id):
  return items.map(i => i.id === id ? { ...i, done: false } : i)
```

- Input: `Item[]`, `id` (integer).
- Output: new `Item[]` with the matching item's `done` set to `false`; all
  other fields and all non-matching items are unchanged.
- If no item matches `id`, returns the array unchanged (caller has already
  verified existence; see §5.2).
- If the matching item already has `done: false`, the output is logically
  identical to the input; the store is still written (see D3).

### 5.2 CLI `reopen` branch

```
const [, , cmd, arg] = process.argv  // existing destructuring, unchanged

if cmd === "reopen":
  if !arg:
    die(USAGE_MSG)
  id = parseInt(arg, 10)
  if !items.find(i => i.id === id):
    die(`Item ${id} not found`)
  await writeStore(filePath, markOpen(items, id))
```

## 6. Architecture

Files touched (no new files):

| File               | Change |
| ------------------ | ------ |
| `src/todo.js`      | export `markOpen(items, id)` |
| `src/todo.test.js` | unit tests for `markOpen` |
| `bin/todo.js`      | add `reopen` branch; update `USAGE_MSG` |
| `test/cli.test.js` | integration tests for `reopen` happy path and error paths |

## 7. User Interface

The usage string after this feature is added:

```
Usage: todo <add <text>|list [--json]|done <id>|remove <id>|wipe|edit <id> <text>|reopen <id>>
```

`edit <id> <text>` is contributed by the `edit-text` feature (spec in
`specs/edit-text.md`), which is planned and built before this one. `assumed`.

## 8. Deployment

Not applicable — CLI tool, no server or deploy step.

## 9. Acceptance Criteria

### 9.1 Per component

| Id     | Criterion                                                                          | Verified by |
| ------ | ---------------------------------------------------------------------------------- | ----------- |
| AC-1.1 | `markOpen` sets `done: false` on the matching item; `id` and `text` are unchanged | unit test   |
| AC-1.2 | `markOpen` does not mutate other items in the array                                | unit test   |
| AC-1.3 | `markOpen` with an id absent from the array returns the array unchanged            | unit test   |
| AC-1.4 | `markOpen` on an already-open item returns array with `done: false` (no-op state) | unit test   |

### 9.2 End-to-end (integration)

| Id     | Criterion                                                                         | Verified by      |
| ------ | --------------------------------------------------------------------------------- | ---------------- |
| AC-2.1 | `todo reopen <id>` on a done item sets it open and exits 0 (no stdout)           | integration test |
| AC-2.2 | After reopen, `todo list` shows `[ ]` for that item                               | integration test |
| AC-2.3 | `todo reopen <id>` on an already-open item exits 0 (no stdout, no error)         | integration test |
| AC-2.4 | `todo reopen <unknown-id>` prints `Item <id> not found` to stderr, exits 1       | integration test |
| AC-2.5 | `todo reopen` (no arg) prints usage to stderr, exits 1                           | integration test |

### 9.3 Non-functional

None — no performance or availability targets for this command.

## 10. Decisions

| Id | Decision | Rejected | Why |
| -- | --------- | -------- | --- |
| D1 | Function named `markOpen` in `src/todo.js` | `reopenItem`, `clearDone` | Mirrors `markDone` exactly; symmetric naming for the inverse operation. `assumed` |
| D2 | `USAGE_MSG` includes `reopen <id>` after `edit <id> <text>` | add `reopen` before `edit` | `edit-text` is planned and built first (alphabetical order). `assumed` |
| D3 | Always write the store, even when item was already open | skip write if no change | Simpler code; matches pattern of `markDone` which writes unconditionally. `assumed` |
| D4 | No stdout on success | print confirmation | Consistent with `done` and `remove` commands. `assumed` |
| D5 | The existing `[, , cmd, arg]` destructuring is unchanged | widen for second arg | `reopen` takes only one arg, so no widening is needed. `normative` |

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

All tests must pass (existing 39 + new tests for this feature).

### 15.2 What the gates do not cover

None. All criteria are locally verifiable.

### 15.3 Invariants that must be tests

| Invariant | Why a test and not a rule |
| --------- | ------------------------- |
| `markOpen` does not change `id` or `text` | The implementation could accidentally spread new fields; an explicit assertion catches it |
| `todo reopen` on an already-open item exits 0 | The idempotency requirement (§3.1) needs an explicit test case, not just the happy path |

## 16. Build sequence

1. Add `markOpen(items, id)` to `src/todo.js`; add unit tests in `src/todo.test.js` (AC-1.1 – AC-1.4).
2. Update `bin/todo.js`: add `reopen` branch, update `USAGE_MSG`; add integration tests in `test/cli.test.js` (AC-2.1 – AC-2.5).
