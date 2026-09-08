# reopen-item · Task 2: CLI `reopen` branch

**Plan:** docs/.spectomat/plans/reopen-item.md
**Spec:** docs/.spectomat/specs/reopen-item.md — §3.1, §3.2, §3.3, §5.2, §7, §9.2
**Covers:** AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5
**Depends on:** Task 1

## Goal

`bin/todo.js` dispatches `reopen <id>` to `markOpen`, reports errors to stderr, and `USAGE_MSG` reflects `reopen <id>`; integration tests for all five ACs pass.

## Constraints

- Node 20 ESM; no new npm packages
- All tests must pass before every commit: `npm test` from repo root
- An implementer subagent never runs git; the controller commits
- `USAGE_MSG` must become exactly: `"Usage: todo <add <text>|list [--json]|done <id>|remove <id>|wipe|edit <id> <text>|reopen <id>>"`
- Argv destructuring `const [, , cmd, arg, arg2] = process.argv;` is already in place — do NOT change it; `reopen` uses `arg` only
- No stdout on success
- Reopening an already-open item: exits 0, no output — the function handles this naturally

## Files

- Modify: `bin/todo.js` — update import, USAGE_MSG, add `reopen` branch before final `else`
- Modify: `test/cli.test.js` — append `describe("reopen", ...)` block at the bottom

## Interfaces

- Consumes: `markOpen(items: Item[], id: number): Item[]` from `src/todo.js` (produced by Task 1)
- Produces: nothing consumed by later tasks

## Steps

- [ ] **Step 1: Write the failing integration tests** — append to `test/cli.test.js`:

```js
describe("reopen", () => {
  it("AC-2.1: marks a done item as open and exits 0 with no stdout", () => {
    run(["add", "Buy milk"], tmpFile);
    run(["done", "1"], tmpFile);
    const r = run(["reopen", "1"], tmpFile);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });

  it("AC-2.2: todo list shows [ ] for reopened item", () => {
    run(["add", "Buy milk"], tmpFile);
    run(["done", "1"], tmpFile);
    run(["reopen", "1"], tmpFile);
    const r = run(["list"], tmpFile);
    expect(r.stdout).toContain("[ ] 1 Buy milk");
  });

  it("AC-2.3: reopening an already-open item exits 0 with no stdout", () => {
    run(["add", "Buy milk"], tmpFile);
    const r = run(["reopen", "1"], tmpFile);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });

  it("AC-2.4: unknown id prints error to stderr and exits 1", () => {
    const r = run(["reopen", "99"], tmpFile);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("Item 99 not found");
  });

  it("AC-2.5: missing id prints usage to stderr and exits 1", () => {
    const r = run(["reopen"], tmpFile);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("Usage:");
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** — `npm test -- test/cli.test.js`; AC-2.1 and others fail (`reopen` command not yet wired)

- [ ] **Step 3: Minimal implementation** — apply these three edits to `bin/todo.js`:

**Edit 1 — update the import** (line 2, add `markOpen`):
```js
import { addItem, listItems, formatItem, markDone, removeItem, wipeItems, formatJson, editItem, markOpen } from "../src/todo.js";
```

**Edit 2 — update `USAGE_MSG`** (line 5):
```js
const USAGE_MSG = "Usage: todo <add <text>|list [--json]|done <id>|remove <id>|wipe|edit <id> <text>|reopen <id>>";
```

**Edit 3 — add `reopen` branch** before the final `} else {` at the bottom of `bin/todo.js`:
```js
} else if (cmd === "reopen") {
  if (!arg) die(USAGE_MSG);
  const id = parseInt(arg, 10);
  if (!items.find((i) => i.id === id)) die(`Item ${id} not found`);
  await writeStore(filePath, markOpen(items, id));
} else {
  die(USAGE_MSG);
}
```

- [ ] **Step 4: Run it, expect PASS** — `npm test`; all tests pass (existing 51 + 5 new = 56)

- [ ] **Step 5: Commit** — message `feat(reopen-item): wire reopen command in CLI`; the controller stages `bin/todo.js` and `test/cli.test.js` and commits — implementer does not run git

## Rulings

## Result
