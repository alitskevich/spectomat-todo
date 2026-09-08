# edit-text · Task 1: `editItem` function

**Plan:** docs/.spectomat/plans/edit-text.md
**Spec:** docs/.spectomat/specs/edit-text.md — §5.1, §6, §9.1
**Covers:** AC-1.1, AC-1.2, AC-1.3
**Depends on:** none

## Goal

`editItem(items, id, text)` is exported from `src/todo.js` and unit-tested in `src/todo.test.js`.

## Constraints

- Node 20 ESM; no new npm packages
- All tests must pass before every commit: `npm test` from repo root
- An implementer subagent never runs git; the controller commits
- `editItem(items, id, text)` returns a new `Item[]` — never mutates input
- Only `text` is updated; `id` and `done` are untouched on every item
- If no item matches `id`, returns the array unchanged (caller verifies existence before calling)

## Files

- Modify: `src/todo.js` — append `editItem` export at the bottom
- Modify: `src/todo.test.js` — update import line to add `editItem`; append `describe("editItem", ...)` block at the bottom

## Interfaces

- Consumes: nothing from earlier tasks
- Produces: `editItem(items: Item[], id: number, text: string): Item[]` — imported by Task 2 via `src/todo.js`

## Steps

- [ ] **Step 1: Write the failing test** — update the import line and append to `src/todo.test.js`:

Update **line 2** of `src/todo.test.js` (the import):
```js
import { addItem, listItems, formatItem, markDone, removeItem, wipeItems, formatJson, editItem } from "./todo.js";
```

Append at the bottom of `src/todo.test.js`:
```js
describe("editItem", () => {
  it("AC-1.1: replaces text on the matching item; id and done are unchanged", () => {
    const items = [{ id: 1, text: "Buy milk", done: false }];
    const result = editItem(items, 1, "Buy oat milk");
    expect(result[0]).toEqual({ id: 1, text: "Buy oat milk", done: false });
  });

  it("AC-1.2: does not mutate other items in the array", () => {
    const items = [
      { id: 1, text: "Buy milk", done: false },
      { id: 2, text: "Walk dog", done: true },
    ];
    const result = editItem(items, 1, "Buy oat milk");
    expect(result[1]).toEqual({ id: 2, text: "Walk dog", done: true });
    expect(result.length).toBe(2);
  });

  it("AC-1.3: id absent from array returns array unchanged", () => {
    const items = [{ id: 1, text: "Buy milk", done: false }];
    const result = editItem(items, 99, "anything");
    expect(result).toEqual(items);
  });
});
```

- [ ] **Step 2: Run it, expect FAIL** — `npm test -- src/todo.test.js`; fails with "editItem is not a function" (or similar import error)

- [ ] **Step 3: Minimal implementation** — append to `src/todo.js`:

```js
export function editItem(items, id, text) {
  return items.map((i) => (i.id === id ? { ...i, text } : i));
}
```

- [ ] **Step 4: Run it, expect PASS** — `npm test`; all tests pass (existing 39 + 3 new = 42)

- [ ] **Step 5: Commit** — message `feat(edit-text): add editItem pure function`; the controller stages `src/todo.js` and `src/todo.test.js` and commits — implementer does not run git

## Rulings

## Result
