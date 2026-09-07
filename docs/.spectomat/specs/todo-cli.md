# todo-cli — Specification

## Part I — Specification

### § 1. Purpose

A tiny command-line to-do list, Node ESM, no dependencies beyond vitest for tests.

### § 2. Domain model

**Item** — the unit of work tracked by this tool.

| Field | Type | Invariant |
|-------|------|-----------|
| `id`   | positive integer | unique, monotonically increasing, never reused |
| `text` | non-empty string | set at creation, never mutated |
| `done` | boolean          | starts `false`; transitions to `true` via `done` command; transition is one-way |

`NEXT_ID = max(existing ids) + 1`, or `1` when the store is empty.

**Store** — the persistent ordered list of Items, backed by a JSON file.

### § 3. Commands

#### § 3.1 `todo add <text>`

- Creates a new Item with `id = NEXT_ID`, `text = <text>`, `done = false`.
- Writes the updated store.
- Prints the new item's id to stdout (integer only, newline-terminated).
- **AC-3.1**: `todo add "Buy milk"` prints a positive integer id and the item appears in the store.

#### § 3.2 `todo list`

- Prints every item, one per line.
- Format: `[ ] <id> <text>` for open items, `[x] <id> <text>` for done items.
- Open items appear first (ascending id order), then done items (ascending id order).
- Empty store → no output, exit 0.
- **AC-3.2a**: open items precede all done items in output.
- **AC-3.2b**: within each group, items are in ascending id order.
- **AC-3.2c**: line format matches `[ ] <id> <text>` or `[x] <id> <text>` exactly (bracket + space + id + space + text).

#### § 3.3 `todo done <id>`

- Marks the item with the given `<id>` as `done = true`.
- Writes the updated store.
- Prints nothing to stdout on success.
- If `<id>` does not exist: prints one-line error to stderr, exits 1 (AC-4.3).
- **AC-3.3**: item with given id has `done = true` after the command.

#### § 3.4 `todo remove <id>`

- Deletes the item with the given `<id>` from the store.
- Writes the updated store.
- Prints nothing to stdout on success.
- If `<id>` does not exist: prints one-line error to stderr, exits 1 (AC-4.3).
- **AC-3.4**: item with given id is absent from the store after the command.

### § 4. Error handling

- Unknown command or missing required argument → print `USAGE_MSG` to stderr, exit 1.
- `<id>` not a positive integer → treat as "id not found".
- Id not found → print one-line error to stderr, exit 1.

`USAGE_MSG = "Usage: todo <add <text>|list|done <id>|remove <id>>"`

- **AC-4.1**: exit code is 1 when the command is unknown.
- **AC-4.2**: exit code is 1 when a required argument is missing.
- **AC-4.3**: exit code is 1 when the referenced id does not exist in the store.
- **AC-4.4**: all error output goes to stderr; normal output goes to stdout.

### § 5. Configuration

| Constant | Value | Override |
|----------|-------|---------|
| `DEFAULT_FILE` | `"./todo.json"` | `TODO_FILE` env var (string path) |

The file path resolves relative to `process.cwd()`.

- **AC-5.1**: when `TODO_FILE` is set, the store reads from and writes to that path instead of `DEFAULT_FILE`.

### § 6. File format

The JSON file is an array of Item objects, all three fields present on every object:

```json
[
  { "id": 1, "text": "Buy milk", "done": false },
  { "id": 2, "text": "Walk dog", "done": true }
]
```

- An absent file is treated as an empty store (no error on startup).
- File is written with 2-space JSON indentation.

- **AC-6.1**: a file written by the tool contains valid JSON matching the array-of-items schema.
- **AC-6.2**: starting from an absent file is not an error; the file is created on the first mutation.

### § 7. Decisions

| # | Decision | Assumed? | Rejected alternative |
|---|----------|----------|---------------------|
| D1 | `NEXT_ID = max(existing) + 1`; gaps after remove are acceptable | no | UUID — overkill for CLI |
| D2 | `done` transition is one-way | assumed (draft silent) | reversible toggle |
| D3 | `remove` physically deletes the item | assumed (draft silent) | soft-delete with `deleted` flag |
| D4 | Entire array rewritten on every mutation | assumed (draft silent) | append-only log |
| D5 | Errors to stderr, normal output to stdout | no | all to stdout |
| D6 | `USAGE_MSG` is a single line (see §4) | no | multi-line help |

### § 8. Reconciliations

_(empty)_

---

## Part II — Building it

### § 9. Toolchain

- Runtime: Node.js ESM (`"type": "module"` in `package.json`)
- Test framework: vitest
- No production dependencies beyond Node built-ins (`fs/promises`, `process`).

### § 10. Module boundaries

| Module | Responsibility | External boundary |
|--------|---------------|-------------------|
| `src/todo.js` | Pure functions over Item arrays: `createItem`, `addItem`, `listItems`, `markDone`, `removeItem` | none |
| `src/store.js` | Filesystem adapter: `readStore(filePath)` → `Item[]`, `writeStore(filePath, items)` | `fs/promises` |
| `bin/todo.js` | CLI: parse `process.argv`, orchestrate todo + store, write stdout/stderr, call `process.exit` | `process`, stdout, stderr |

Tests for `src/todo.js` use no filesystem. Tests for `src/store.js` use a temp file.
Tests for the CLI layer run `bin/todo.js` as a child process or inject the store path via `TODO_FILE`.

### § 11. Build sequence

1. `src/todo.js` — pure domain (no I/O); tests cover all Item operations.
2. `src/store.js` — filesystem adapter; tests cover read/write + absent-file case (AC-6.2).
3. `bin/todo.js` — CLI wiring; integration tests cover all commands and all ACs.

### § 12. Gates

```bash
cd /Users/alex/Projects/spectomat-todo
npm test
```

Every AC id (`AC-x.y`) declared in Part I must have at least one vitest `it`/`test` call whose description references that id.
