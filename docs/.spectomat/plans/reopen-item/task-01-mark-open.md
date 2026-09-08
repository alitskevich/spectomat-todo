# reopen-item · Task 1: `markOpen` function

**Plan:** docs/.spectomat/plans/reopen-item.md
**Spec:** docs/.spectomat/specs/reopen-item.md — §5.1, §6, §9.1
**Covers:** AC-1.1, AC-1.2, AC-1.3, AC-1.4
**Depends on:** none

## Goal

`markOpen(items, id)` is exported from `src/todo.js` and unit-tested in `src/todo.test.js`.

## Constraints

- Node 20 ESM; no new npm packages
- All tests must pass before every commit: `npm test` from repo root
- An implementer subagent never runs git; the controller commits
- `markOpen(items, id)` returns a new `Item[]` — never mutates input
- Only `done` is updated (set to `false`); `id` and `text` are untouched on every item
- If no item matches `id`, returns the array unchanged (caller verifies existence before calling)
- If the matching item already has `done: false`, output is logically identical to input — store is still written by the caller

## Files

- Modify: `src/todo.js` — append `markOpen` export at the bottom
- Modify: `src/todo.test.js` — update import line to add `markOpen`; append `describe("markOpen", ...)` block at the bottom

## Interfaces

- Consumes: nothing from earlier tasks
- Produces: `markOpen(items: Item[], id: number): Item[]` — imported by Task 2 via `src/todo.js`

## Steps

- [x] **Step 1: Write the failing test** — update the import line and append to `src/todo.test.js`:

Update **line 2** of `src/todo.test.js` (the import, currently ends with `editItem`):
```js
import { addItem, listItems, formatItem, markDone, removeItem, wipeItems, formatJson, editItem, markOpen } from "./todo.js";
```

Append at the bottom of `src/todo.test.js`:
```js
describe("markOpen", () => {
  it("AC-1.1: sets done to false on matching item; id and text are unchanged", () => {
    const items = [{ id: 1, text: "Buy milk", done: true }];
    const result = markOpen(items, 1);
    expect(result[0]).toEqual({ id: 1, text: "Buy milk", done: false });
  });

  it("AC-1.2: does not mutate other items in the array", () => {
    const items = [
      { id: 1, text: "Buy milk", done: true },
      { id: 2, text: "Walk dog", done: false },
    ];
    const result = markOpen(items, 1);
    expect(result[1]).toEqual({ id: 2, text: "Walk dog", done: false });
    expect(result.length).toBe(2);
  });

  it("AC-1.3: id absent from array returns array unchanged", () => {
    const items = [{ id: 1, text: "Buy milk", done: true }];
    const result = markOpen(items, 99);
    expect(result).toEqual(items);
  });

  it("AC-1.4: already-open item returns done: false (no-op state)", () => {
    const items = [{ id: 1, text: "Buy milk", done: false }];
    const result = markOpen(items, 1);
    expect(result[0]).toEqual({ id: 1, text: "Buy milk", done: false });
  });
});
```

- [x] **Step 2: Run it, expect FAIL** — `npm test -- src/todo.test.js`; fails with "markOpen is not a function" (or similar import error)

- [x] **Step 3: Minimal implementation** — append to `src/todo.js`:

```js
export function markOpen(items, id) {
  return items.map((i) => (i.id === id ? { ...i, done: false } : i));
}
```

- [x] **Step 4: Run it, expect PASS** — `npm test`; all tests pass (existing 47 + 4 new = 51)

- [x] **Step 5: Commit** — message `feat(reopen-item): add markOpen pure function`; the controller stages `src/todo.js` and `src/todo.test.js` and commits — implementer does not run git

## Rulings

## Result

- Commits: 876bba7..d033fcd
- Tests: 51/51 (src/todo.test.js + test/cli.test.js)
- Review: spec ✅ · quality: clean
