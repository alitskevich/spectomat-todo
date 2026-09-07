# list-json · Task 2: CLI flag dispatch

**Plan:** docs/.spectomat/plans/list-json.md
**Spec:** docs/.spectomat/specs/list-json.md — §3.2, §3.3, §5.2, §7, §9.2
**Covers:** AC-2.1, AC-2.2, AC-2.3, AC-2.4
**Depends on:** Task 1

## Goal

`bin/todo.js` dispatches `--json` to `formatJson`, errors on unknown flags, and `USAGE_MSG` reflects `list [--json]`; integration tests for all four ACs pass.

## Constraints

- Node 20 ESM; no new npm packages
- All tests must pass before every commit: `npm test` from repo root
- An implementer subagent never runs git; the controller commits
- `USAGE_MSG` must become exactly: `"Usage: todo <add <text>|list [--json]|done <id>|remove <id>|wipe>"`
- Any `arg` to `list` that is not `undefined` and not `"--json"` triggers `die(USAGE_MSG)`
- CLI writes `formatJson(listItems(items)) + "\n"` to stdout; `formatJson` adds no newline
- Plain `todo list` (no flag) output must remain byte-identical to current behaviour

## Files

- Modify: `bin/todo.js` — update import, `USAGE_MSG`, and `list` branch
- Modify: `test/cli.test.js` — append `describe("list --json", ...)` block

## Interfaces

- Consumes: `formatJson(items: Item[]): string` from `src/todo.js` (produced by Task 1)
- Produces: nothing consumed by later tasks

## Steps

- [ ] **Step 1: Write the failing integration tests** — append to `test/cli.test.js`:

```js
describe("list --json", () => {
  it("AC-2.1: prints a valid JSON array and exits 0", () => {
    run(["add", "Buy milk"], tmpFile);
    run(["add", "Walk dog"], tmpFile);
    run(["done", "1"], tmpFile);
    const r = run(["list", "--json"], tmpFile);
    expect(r.status).toBe(0);
    const parsed = JSON.parse(r.stdout.trim());
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
    expect(parsed[0]).toMatchObject({ id: 2, text: "Walk dog", done: false });
    expect(parsed[1]).toMatchObject({ id: 1, text: "Buy milk", done: true });
  });

  it("AC-2.2: empty store prints [] and exits 0", () => {
    const r = run(["list", "--json"], tmpFile);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe("[]");
  });

  it("AC-2.3: plain list output is byte-identical to pre-change behaviour", () => {
    run(["add", "Buy milk"], tmpFile);
    const r = run(["list"], tmpFile);
    expect(r.status).toBe(0);
    expect(r.stdout.trim()).toBe("[ ] 1 Buy milk");
  });

  it("AC-2.4: list <other> prints usage to stderr and exits 1", () => {
    const r = run(["list", "--unknown"], tmpFile);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("Usage:");
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** — `npm test -- test/cli.test.js`, AC-2.1 and AC-2.4 fail (unknown flag not handled, `--json` not recognised)

- [ ] **Step 3: Minimal implementation** — apply these two edits to `bin/todo.js`:

**Edit 1 — update the import** (add `formatJson` to the named imports):

```js
import { addItem, listItems, formatItem, markDone, removeItem, wipeItems, formatJson } from "../src/todo.js";
```

**Edit 2 — update `USAGE_MSG`**:

```js
const USAGE_MSG = "Usage: todo <add <text>|list [--json]|done <id>|remove <id>|wipe>";
```

**Edit 3 — replace the `list` branch** (currently `for (const item of listItems(items)) ...`):

```js
} else if (cmd === "list") {
  if (arg === "--json") {
    process.stdout.write(formatJson(listItems(items)) + "\n");
  } else if (arg !== undefined) {
    die(USAGE_MSG);
  } else {
    for (const item of listItems(items)) {
      process.stdout.write(formatItem(item) + "\n");
    }
  }
}
```

- [ ] **Step 4: Run it, expect PASS** — `npm test`; all tests pass (existing 32 + 3 unit = 35 + 4 integration = 39)

- [ ] **Step 5: Commit** — message `feat(list-json): wire --json flag in CLI`; the controller stages `bin/todo.js` and `test/cli.test.js` and commits — implementer does not run git

## Rulings

(appended by executing-tasks: `- <decision> — <why> — <cost if wrong>`)

## Result

(filled by executing-tasks when the task is done)

- Commits: <base7>..<head7>
- Tests: <n>/<n> (<files>)
- Review: spec ✅ · quality: <clean | K parked>
