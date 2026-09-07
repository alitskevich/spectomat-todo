# list-json · Task 1: `formatJson` function

**Plan:** docs/.spectomat/plans/list-json.md
**Spec:** docs/.spectomat/specs/list-json.md — §5.1, §6, §9.1
**Covers:** AC-1.1, AC-1.2, AC-1.3
**Depends on:** none

## Goal

`formatJson(items)` is exported from `src/todo.js` and unit-tested in `src/todo.test.js`.

## Constraints

- Node 20 ESM; no new npm packages
- All tests must pass before every commit: `npm test` from repo root
- An implementer subagent never runs git; the controller commits
- `formatJson(items)` returns compact JSON string (no indent, no trailing newline)
- Each JSON element has exactly the keys `id`, `text`, `done` — no extra fields
- Empty list → returns the string `"[]"`
- Input array is already ordered by the caller; `formatJson` does not sort

## Files

- Modify: `src/todo.js` — append `formatJson` export
- Modify: `src/todo.test.js` — append `describe("formatJson", ...)` block

## Interfaces

- Consumes: nothing from earlier tasks
- Produces: `formatJson(items: Item[]): string` — imported by Task 2 via `src/todo.js`

## Steps

- [x] **Step 1: Write the failing test** — append to `src/todo.test.js`:

```js
import { addItem, listItems, formatItem, markDone, removeItem, wipeItems, formatJson } from "./todo.js";

// ... existing describes unchanged ...

describe("formatJson", () => {
  it("AC-1.1: empty list returns '[]'", () => {
    expect(formatJson([])).toBe("[]");
  });

  it("AC-1.2: output has exactly id, text, done per item — no extra fields", () => {
    const result = JSON.parse(formatJson([{ id: 1, text: "Buy milk", done: false }]));
    expect(Object.keys(result[0]).sort()).toEqual(["done", "id", "text"]);
  });

  it("AC-1.3: preserves caller ordering — open by id first, then done by id", () => {
    const items = listItems([
      { id: 2, text: "b", done: false },
      { id: 3, text: "c", done: true },
      { id: 1, text: "a", done: false },
    ]);
    const result = JSON.parse(formatJson(items));
    expect(result[0]).toMatchObject({ id: 1, done: false });
    expect(result[1]).toMatchObject({ id: 2, done: false });
    expect(result[2]).toMatchObject({ id: 3, done: true });
  });
});
```

Note: only the import line and the new `describe` block are added; all existing tests are untouched.

- [x] **Step 2: Run it, expect FAIL** — `npm test -- src/todo.test.js`, fails with "formatJson is not a function" (or similar import error)

- [x] **Step 3: Minimal implementation** — append to `src/todo.js`:

```js
export function formatJson(items) {
  return JSON.stringify(items.map((i) => ({ id: i.id, text: i.text, done: i.done })));
}
```

- [x] **Step 4: Run it, expect PASS** — `npm test`; all tests pass (existing 32 + 3 new = 35)

- [x] **Step 5: Commit** — message `feat(list-json): add formatJson pure function`; the controller stages `src/todo.js` and `src/todo.test.js` and commits — implementer does not run git

## Rulings

- AC-1.3 test routes through `listItems()` to produce the sorted input — parked Minor: `listItems` has its own test suite; coupling is low-risk and the intent is clear — if `listItems` sort order ever changes, the test fails loudly, which is desirable
- AC-1.2 key-set check does not verify values are faithfully copied — parked Minor: the one-liner projection makes value-copy bugs impossible; asserting the key set is sufficient for the field-whitelist invariant

## Result

- Commits: 71ee4b8..0c0b76a
- Tests: 35/35 (src/todo.test.js + test/cli.test.js)
- Review: spec ✅ · quality: 2 parked Minor
