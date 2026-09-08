# edit-text · Task 2: CLI `edit` branch

**Plan:** docs/.spectomat/plans/edit-text.md
**Spec:** docs/.spectomat/specs/edit-text.md — §3.1, §3.2, §3.3, §5.2, §7, §9.2
**Covers:** AC-2.1, AC-2.2, AC-2.3, AC-2.4, AC-2.5
**Depends on:** Task 1

## Goal

`bin/todo.js` dispatches `edit <id> <text>` to `editItem`, reports errors to stderr, and `USAGE_MSG` reflects `edit <id> <text>`; integration tests for all five ACs pass.

## Constraints

- Node 20 ESM; no new npm packages
- All tests must pass before every commit: `npm test` from repo root
- An implementer subagent never runs git; the controller commits
- `USAGE_MSG` must become exactly: `"Usage: todo <add <text>|list [--json]|done <id>|remove <id>|wipe|edit <id> <text>>"`
- Argv destructuring widened to `const [, , cmd, arg, arg2] = process.argv;` at **line 7** of `bin/todo.js`
- Empty text (`""`) treated as missing — `!arg2` is falsy for both `undefined` and `""` — triggers `die(USAGE_MSG)`
- No stdout on success

## Files

- Modify: `bin/todo.js` — update import, argv destructuring (line 7), USAGE_MSG (line 5), add `edit` branch before final `else`
- Modify: `test/cli.test.js` — append `describe("edit", ...)` block at the bottom

## Interfaces

- Consumes: `editItem(items: Item[], id: number, text: string): Item[]` from `src/todo.js` (produced by Task 1)
- Produces: nothing consumed by later tasks

## Steps

- [ ] **Step 1: Write the failing integration tests** — append to `test/cli.test.js`:

```js
describe("edit", () => {
  it("AC-2.1: updates item text and exits 0 with no stdout", () => {
    run(["add", "Buy milk"], tmpFile);
    const r = run(["edit", "1", "Buy oat milk"], tmpFile);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });

  it("AC-2.2: todo list shows new text after edit", () => {
    run(["add", "Buy milk"], tmpFile);
    run(["edit", "1", "Buy oat milk"], tmpFile);
    const r = run(["list"], tmpFile);
    expect(r.stdout).toContain("Buy oat milk");
    expect(r.stdout).not.toContain("Buy milk");
  });

  it("AC-2.3: unknown id prints error to stderr and exits 1", () => {
    const r = run(["edit", "99", "anything"], tmpFile);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("Item 99 not found");
  });

  it("AC-2.4: missing id prints usage to stderr and exits 1", () => {
    const r = run(["edit"], tmpFile);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("Usage:");
  });

  it("AC-2.5: missing text prints usage to stderr and exits 1", () => {
    run(["add", "Buy milk"], tmpFile);
    const r = run(["edit", "1"], tmpFile);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("Usage:");
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** — `npm test -- test/cli.test.js`; AC-2.1 and others fail (`edit` command not yet wired)

- [ ] **Step 3: Minimal implementation** — apply these four edits to `bin/todo.js`:

**Edit 1 — update the import** (line 2, add `editItem`):
```js
import { addItem, listItems, formatItem, markDone, removeItem, wipeItems, formatJson, editItem } from "../src/todo.js";
```

**Edit 2 — update `USAGE_MSG`** (line 5):
```js
const USAGE_MSG = "Usage: todo <add <text>|list [--json]|done <id>|remove <id>|wipe|edit <id> <text>>";
```

**Edit 3 — widen argv destructuring** (line 7):
```js
const [, , cmd, arg, arg2] = process.argv;
```

**Edit 4 — add `edit` branch** before the final `} else {` at the bottom of `bin/todo.js`:
```js
} else if (cmd === "edit") {
  if (!arg || !arg2) die(USAGE_MSG);
  const id = parseInt(arg, 10);
  if (!items.find((i) => i.id === id)) die(`Item ${id} not found`);
  await writeStore(filePath, editItem(items, id, arg2));
} else {
  die(USAGE_MSG);
}
```

- [ ] **Step 4: Run it, expect PASS** — `npm test`; all tests pass (existing 42 + 5 new = 47)

- [ ] **Step 5: Commit** — message `feat(edit-text): wire edit command in CLI`; the controller stages `bin/todo.js` and `test/cli.test.js` and commits — implementer does not run git

## Rulings

## Result
