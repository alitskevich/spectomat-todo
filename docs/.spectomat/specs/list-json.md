# list-json — `todo list --json`

Adds a `--json` flag to the `todo list` command so scripts can consume the
item list as structured data. The organizing idea is the same as every other
command: a pure formatting function in `src/todo.js`, a flag branch in
`bin/todo.js`, and the existing `listItems()` ordering unchanged.

Code cites this document by section and line (`§3.4 L316`). Part I is
normative: the loop builds to it and never edits it. A divergence found during
the build is a **reconciliation**, recorded in §11 with a number and a reason.

# Part I — Specification

## 1. System Overview

### 1.1 Purpose

Extend `todo list` with an optional `--json` flag. When present, output is a
JSON array instead of the human-readable format. Plain `todo list` (no flag)
is unchanged. Any unrecognised flag is an error.

### 1.2 Actors

- **User** — runs `todo list [--json]` from the shell or a script.

### 1.3 The system in one picture

```
User → bin/todo.js (list branch)
         ├── no arg   → listItems() → formatItem() × N → stdout (unchanged)
         ├── --json   → listItems() → formatJson()      → stdout
         └── other    → die(USAGE_MSG)
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

### 3.1 `list` command — plain (unchanged)

| Attribute  | Value |
| ---------- | ----- |
| **Trigger**| `todo list` with no argument |
| **Input**  | current item list read from store |
| **Output** | one formatted line per item (open by id, then done by id) via `formatItem()` |
| **Failure**| read errors propagate to stderr via `die()`; exit 1 |

### 3.2 `list --json` command

| Attribute       | Value |
| --------------- | ----- |
| **Trigger**     | `todo list --json` |
| **Input**       | current item list read from store |
| **Algorithm**   | §5.1, §5.2 |
| **Output**      | one line of compact JSON to stdout; see §5.1 |
| **Failure**     | read errors propagate to stderr via `die()`; exit 1 |
| **Idempotency** | read-only; always safe to repeat |

### 3.3 `list <other>` — error path

| Attribute   | Value |
| ----------- | ----- |
| **Trigger** | `todo list` followed by any argument other than `--json` |
| **Output**  | `USAGE_MSG` to stderr, exit 1 |

## 4. External Integrations

No new boundary. Store path resolves to
`process.env.TODO_FILE ?? "./todo.json"` — same as every other command.

## 5. Normative Algorithms

### 5.1 `formatJson(items)`

```
ITEM_KEYS = ["id", "text", "done"]

function formatJson(items):
  projected = items.map(i => { id: i.id, text: i.text, done: i.done })
  return JSON.stringify(projected)
```

- Input: `Item[]` (already ordered by the caller via `listItems()`).
- Output: compact JSON string (no indent, no trailing newline).
- Exactly the three keys in `ITEM_KEYS` — no extra fields.
- Empty list → `"[]"`.

### 5.2 CLI `list` branch (updated)

```
[, , cmd, arg] = process.argv

if cmd === "list":
  if arg === undefined:
    for item in listItems(items):
      stdout.write(formatItem(item) + "\n")
  else if arg === "--json":
    stdout.write(formatJson(listItems(items)) + "\n")
  else:
    die(USAGE_MSG)
```

## 6. Architecture

Files touched (no new files):

| File               | Change |
| ------------------ | ------ |
| `src/todo.js`      | export `formatJson(items)` |
| `src/todo.test.js` | unit tests for `formatJson` |
| `bin/todo.js`      | update `list` branch; update `USAGE_MSG` |
| `test/cli.test.js` | integration tests for `list --json` and error path |

## 7. User Interface

The usage string becomes:

```
Usage: todo <add <text>|list [--json]|done <id>|remove <id>|wipe>
```

## 8. Deployment

Not applicable — CLI tool, no server or deploy step.

## 9. Acceptance Criteria

### 9.1 Per component

| Id     | Criterion                                                                   | Verified by |
| ------ | --------------------------------------------------------------------------- | ----------- |
| AC-1.1 | `formatJson([])` returns `"[]"`                                             | unit test   |
| AC-1.2 | `formatJson` output contains exactly `id`, `text`, `done` per item (no extra fields) | unit test |
| AC-1.3 | `formatJson` preserves the caller's ordering (open by id, then done by id)  | unit test   |

### 9.2 End-to-end (integration)

| Id     | Criterion                                                                    | Verified by      |
| ------ | ---------------------------------------------------------------------------- | ---------------- |
| AC-2.1 | `todo list --json` with items prints a valid JSON array and exits 0          | integration test |
| AC-2.2 | `todo list --json` with empty store prints `[]` and exits 0                  | integration test |
| AC-2.3 | `todo list` (no flag) output is byte-identical to pre-change behaviour       | integration test |
| AC-2.4 | `todo list <other>` prints usage to stderr and exits 1                       | integration test |

### 9.3 Non-functional

None — no performance or availability targets for this flag.

## 10. Decisions

| Id | Decision | Rejected | Why |
| -- | --------- | -------- | --- |
| D1 | Function named `formatJson` in `src/todo.js` | inline in CLI branch | Consistent with existing `formatItem`; keeps CLI thin. `assumed` |
| D2 | Compact JSON (no indent); trailing newline added by CLI, not by `formatJson` | pretty-print; newline inside function | Compact is script-friendly; separation mirrors `formatItem` pattern. `assumed` |
| D3 | Any `arg` that is not `undefined` and not `"--json"` triggers `die(USAGE_MSG)` | silently ignore unknown flags | Draft says "any other flag is an error". `normative` |
| D4 | `USAGE_MSG` updated to show `list [--json]` | leave usage unchanged | Accurate usage string is the observable for AC-2.4. `assumed` |

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

All tests must pass (existing 32 + new tests for this feature).

### 15.2 What the gates do not cover

None. All criteria are locally verifiable.

### 15.3 The invariants that must be tests

| Invariant | Why a test and not a rule |
| --------- | ------------------------- |
| Output contains exactly `id`, `text`, `done` — no extra fields | `JSON.stringify` of an `Item` would include all fields; the projection must be explicit |
| Plain `list` output is byte-identical to pre-change | Flag branching could silently break the no-arg path |

## 16. Build sequence

1. Add `formatJson(items)` to `src/todo.js`; add unit tests in `src/todo.test.js` (AC-1.1 – AC-1.3).
2. Update `list` branch in `bin/todo.js` with flag dispatch and updated `USAGE_MSG`; add integration tests in `test/cli.test.js` (AC-2.1 – AC-2.4).
