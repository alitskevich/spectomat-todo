# edit-text — `todo edit <id> <text>`

Adds an `edit` command to todo-cli that replaces the text of one item while
keeping its `id` and `done` state unchanged. The same structural pattern as
every other command: a pure domain function in `src/todo.js`, wired in
`bin/todo.js`, vitest tests for both.

Code cites this document by section and line (`§3.4 L316`). Part I is
normative: the loop builds to it and never edits it. A divergence found during
the build is a **reconciliation**, recorded in §11 with a number and a reason.

# Part I — Specification

## 1. System Overview

### 1.1 Purpose

Add `todo edit <id> <text>` to the CLI. When invoked, the item with the given
`id` has its `text` replaced with the new value; `id` and `done` are
unchanged. All other commands are unaffected.

### 1.2 Actors

- **User** — runs `todo edit <id> <text>` from the shell.

### 1.3 The system in one picture

```
User → bin/todo.js (edit branch)
         ├── no id or no text   → die(USAGE_MSG) → stderr, exit 1
         ├── unknown id         → die("Item <id> not found") → stderr, exit 1
         └── found id           → editItem() → writeStore() → exit 0 (no stdout)
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

### 3.1 `edit` command — happy path

| Attribute       | Value |
| --------------- | ----- |
| **Trigger**     | `todo edit <id> <text>` where `<id>` is a known item id |
| **Input**       | `id` (integer), `text` (non-empty string), current store |
| **Algorithm**   | §5.1, §5.2 |
| **Output**      | none to stdout; store updated |
| **Failure**     | write errors propagate via `die()`; exit 1 |
| **Idempotency** | calling with the same args twice leaves the item unchanged after the first call |

### 3.2 `edit` command — unknown id

| Attribute   | Value |
| ----------- | ----- |
| **Trigger** | `todo edit <id> <text>` where `<id>` does not match any item |
| **Output**  | `Item <id> not found` to stderr, exit 1 |

### 3.3 `edit` command — missing or empty arg

| Attribute   | Value |
| ----------- | ----- |
| **Trigger** | `todo edit` with missing `id`, missing `text`, or empty `text` |
| **Output**  | `USAGE_MSG` to stderr, exit 1 |

## 4. External Integrations

No new boundary. Store path resolves to
`process.env.TODO_FILE ?? "./todo.json"` — same as every other command.

## 5. Normative Algorithms

### 5.1 `editItem(items, id, text)`

```
function editItem(items, id, text):
  return items.map(i => i.id === id ? { ...i, text } : i)
```

- Input: `Item[]`, `id` (integer), `text` (non-empty string).
- Output: new `Item[]` with the matching item's `text` updated; all other
  fields and all non-matching items are unchanged.
- If no item matches `id`, returns the array unchanged (caller has already
  verified existence; see §5.2).

### 5.2 CLI `edit` branch

```
[, , cmd, arg, arg2] = process.argv

if cmd === "edit":
  if !arg or !arg2:
    die(USAGE_MSG)
  id = parseInt(arg, 10)
  if !items.find(i => i.id === id):
    die(`Item ${id} not found`)
  await writeStore(filePath, editItem(items, id, arg2))
```

`arg` is the id string, `arg2` is the text. The top-level destructuring must
be updated to capture the fifth element: `const [, , cmd, arg, arg2] = process.argv`.

## 6. Architecture

Files touched (no new files):

| File               | Change |
| ------------------ | ------ |
| `src/todo.js`      | export `editItem(items, id, text)` |
| `src/todo.test.js` | unit tests for `editItem` |
| `bin/todo.js`      | widen destructuring to `arg2`; add `edit` branch; update `USAGE_MSG` |
| `test/cli.test.js` | integration tests for `edit` happy path and error paths |

## 7. User Interface

The usage string becomes:

```
Usage: todo <add <text>|list [--json]|done <id>|remove <id>|wipe|edit <id> <text>>
```

## 8. Deployment

Not applicable — CLI tool, no server or deploy step.

## 9. Acceptance Criteria

### 9.1 Per component

| Id     | Criterion                                                                       | Verified by |
| ------ | ------------------------------------------------------------------------------- | ----------- |
| AC-1.1 | `editItem` replaces `text` of the matching item; `id` and `done` are unchanged | unit test   |
| AC-1.2 | `editItem` does not mutate other items in the array                             | unit test   |
| AC-1.3 | `editItem` with an id absent from the array returns the array unchanged         | unit test   |

### 9.2 End-to-end (integration)

| Id     | Criterion                                                                         | Verified by      |
| ------ | --------------------------------------------------------------------------------- | ---------------- |
| AC-2.1 | `todo edit <id> <text>` updates the item text and exits 0 (no stdout)            | integration test |
| AC-2.2 | After edit, `todo list` shows the new text for that item                          | integration test |
| AC-2.3 | `todo edit <unknown-id> <text>` prints `Item <id> not found` to stderr, exits 1  | integration test |
| AC-2.4 | `todo edit` (no args) prints usage to stderr, exits 1                            | integration test |
| AC-2.5 | `todo edit <id>` (missing text) prints usage to stderr, exits 1                  | integration test |

### 9.3 Non-functional

None — no performance or availability targets for this command.

## 10. Decisions

| Id | Decision | Rejected | Why |
| -- | --------- | -------- | --- |
| D1 | Function named `editItem` in `src/todo.js` | `updateItem`, `changeText` | Mirrors `markDone`, `removeItem` naming; command name is the verb. `assumed` |
| D2 | Destructuring widened to `[, , cmd, arg, arg2]` at top of `bin/todo.js` | read `process.argv[4]` inside the edit branch only | Consistent with the existing destructuring style; symmetric with how `arg` is used. `assumed` |
| D3 | No stdout on success | print confirmation | Consistent with `done` and `remove` commands which also produce no stdout. `assumed` |
| D4 | Empty text (`""`) treated as missing — triggers `die(USAGE_MSG)` | allow empty text | Draft says "empty text: usage message, exit 1"; `!arg2` is falsy for both undefined and empty string. `normative` |
| D5 | `USAGE_MSG` updated to include `edit <id> <text>` | leave unchanged | Accurate usage string is the observable for AC-2.4 and AC-2.5. `assumed` |

## 11. Reconciliations

| Id | Sections | Contradiction | Reading built to |
| -- | -------- | ------------- | ---------------- |

# Part II — Building it

## 12. Toolchain and layout

Unchanged: Node 20 ESM, Vitest, no new packages. All changes are additions to
existing files except the destructuring line in `bin/todo.js`.

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
| `editItem` does not change `id` or `done` | The implementation could accidentally spread new fields; an explicit assertion catches it |
| `todo edit` with missing text exits 1 with usage | The `arg2` check must gate before any lookup is attempted |

## 16. Build sequence

1. Add `editItem(items, id, text)` to `src/todo.js`; add unit tests in `src/todo.test.js` (AC-1.1 – AC-1.3).
2. Update `bin/todo.js`: widen destructuring to `arg2`, add `edit` branch, update `USAGE_MSG`; add integration tests in `test/cli.test.js` (AC-2.1 – AC-2.5).
