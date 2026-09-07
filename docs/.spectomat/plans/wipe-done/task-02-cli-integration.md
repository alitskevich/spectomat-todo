# wipe-done · Task 2: `wipe` CLI branch + integration tests

**Plan:** docs/.spectomat/plans/wipe-done.md
**Spec:** docs/.spectomat/specs/wipe-done.md — §3.1, §5.2, §7, §9.2
**Covers:** AC-2.1, AC-2.2, AC-2.3, AC-2.4
**Depends on:** Task 1 (`wipeItems` exported from `src/todo.js`)

## Goal

`todo wipe` command wired in `bin/todo.js` with updated usage string, verified by four integration tests.

## Constraints

- Node 20 ESM — all files use `import`/`export`; no `require`.
- Vitest — test runner; run with `npm test`.
- Output message exact format: `Wiped N item(s)\n` to stdout (§3.1, §5.2).
- Usage string exact format: `Usage: todo <add <text>|list|done <id>|remove <id>|wipe>` (§7).
- Integration tests use `spawnSync` with `TODO_FILE` set to a temp file (existing pattern in `test/cli.test.js`).
- Gate: `npm test` must pass (all tests green) before the commit.

## Files

- Modify: `bin/todo.js` — import `wipeItems`; add `wipe` branch; update `USAGE_MSG`
- Modify: `test/cli.test.js` — append `wipe` describe block

## Interfaces

- Consumes: `wipeItems(items: Item[]): Item[]` from `src/todo.js` (produced by Task 1).
- Produces: nothing for later tasks.

## Steps

- [x] **Step 1: Write the failing tests** — append to `test/cli.test.js`:

```js
describe("wipe", () => {
  it("AC-2.1: removes done items, prints 'Wiped N item(s)'", () => {
    run(["add", "a"], tmpFile);
    run(["add", "b"], tmpFile);
    run(["done", "1"], tmpFile);
    const r = run(["wipe"], tmpFile);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe("Wiped 1 item(s)");
  });

  it("AC-2.2: no done items → 'Wiped 0 item(s)', exits 0", () => {
    run(["add", "a"], tmpFile);
    const r = run(["wipe"], tmpFile);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe("Wiped 0 item(s)");
  });

  it("AC-2.3: open items remain with ids unchanged after wipe", () => {
    run(["add", "a"], tmpFile); // id 1
    run(["add", "b"], tmpFile); // id 2
    run(["done", "1"], tmpFile);
    run(["wipe"], tmpFile);
    const r = run(["list"], tmpFile);
    expect(r.stdout.trim()).toBe("[ ] 2 b");
  });

  it("AC-2.4: usage message includes 'wipe'", () => {
    const r = run([], tmpFile);
    expect(r.stderr).toContain("wipe");
    expect(r.status).toBe(1);
  });
});
```

- [x] **Step 2: Run it, expect FAIL** — `npm test -- test/cli.test.js`; wipe tests fail with exit code 1 (unknown command).

- [x] **Step 3: Minimal implementation** — edit `bin/todo.js`:

  1. Update the import line to include `wipeItems`:
  ```js
  import { addItem, listItems, formatItem, markDone, removeItem, wipeItems } from "../src/todo.js";
  ```

  2. Update `USAGE_MSG`:
  ```js
  const USAGE_MSG = "Usage: todo <add <text>|list|done <id>|remove <id>|wipe>";
  ```

  3. Add the `wipe` branch before the final `else` clause:
  ```js
  } else if (cmd === "wipe") {
    const remaining = wipeItems(items);
    const count = items.length - remaining.length;
    await writeStore(filePath, remaining);
    process.stdout.write(`Wiped ${count} item(s)\n`);
  } else {
  ```

- [x] **Step 4: Run it, expect PASS** — `npm test`; all tests green (28 existing + 4 new = 32 passing).

- [x] **Step 5: Commit**:

```bash
git add bin/todo.js test/cli.test.js
git commit -m "feat(wipe-done): wire wipe command in CLI, add integration tests (AC-2.1–AC-2.4)"
```

## Rulings

- Shared `tmpFile` between wipe tests means AC-2.2 runs on state left by AC-2.1 (zero done items after wipe) — this is the existing pattern for all cli tests; tests still pass correctly — cost: negligible
- `count` via `items.length - remaining.length` is correct arithmetic — no issue

## Result

- Commits: ebb7ec7..dfae007
- Tests: 32/32 (src/todo.test.js, src/store.test.js, test/cli.test.js)
- Review: spec ✅ · quality: 2 minor parked
