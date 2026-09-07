# wipe-done · Task 1: `wipeItems()` domain function

**Plan:** docs/.spectomat/plans/wipe-done.md
**Spec:** docs/.spectomat/specs/wipe-done.md — §5.1, §9.1
**Covers:** AC-1.1, AC-1.2, AC-1.3, AC-1.4
**Depends on:** none

## Goal

`wipeItems(items)` exported from `src/todo.js` and verified by four unit tests.

## Constraints

- Node 20 ESM — all files use `import`/`export`; no `require`.
- Vitest — test runner; run with `npm test`.
- Pure domain function in `src/todo.js` — no I/O, no side effects.
- Gate: `npm test` must pass (all tests green) before the commit.

## Files

- Modify: `src/todo.js` — append `wipeItems` export
- Modify: `src/todo.test.js` — append `wipeItems` describe block

## Interfaces

- Consumes: nothing from earlier tasks.
- Produces: `wipeItems(items: Item[]): Item[]` — exported from `src/todo.js`; consumed by Task 2.

## Steps

- [ ] **Step 1: Write the failing tests** — append to `src/todo.test.js`:

```js
import { addItem, listItems, formatItem, markDone, removeItem, wipeItems } from "./todo.js";

describe("wipeItems", () => {
  it("AC-1.1: empty list → empty list", () => {
    expect(wipeItems([])).toEqual([]);
  });
  it("AC-1.2: no done items → list unchanged", () => {
    const items = [
      { id: 1, text: "a", done: false },
      { id: 2, text: "b", done: false },
    ];
    expect(wipeItems(items)).toEqual(items);
  });
  it("AC-1.3: removes only done items; open items and ids unchanged", () => {
    const items = [
      { id: 1, text: "a", done: false },
      { id: 2, text: "b", done: true },
      { id: 3, text: "c", done: false },
    ];
    expect(wipeItems(items)).toEqual([
      { id: 1, text: "a", done: false },
      { id: 3, text: "c", done: false },
    ]);
  });
  it("AC-1.4: all done → empty list", () => {
    const items = [
      { id: 1, text: "a", done: true },
      { id: 2, text: "b", done: true },
    ];
    expect(wipeItems(items)).toEqual([]);
  });
});
```

Note: update the import at the top of `src/todo.test.js` to include `wipeItems`.

- [ ] **Step 2: Run it, expect FAIL** — `npm test -- src/todo.test.js`; fails with `wipeItems is not a function` (or similar).

- [ ] **Step 3: Minimal implementation** — append to `src/todo.js`:

```js
export function wipeItems(items) {
  return items.filter((i) => !i.done);
}
```

- [ ] **Step 4: Run it, expect PASS** — `npm test`; all tests green (existing 24 + 4 new = 28 passing).

- [ ] **Step 5: Commit**:

```bash
git add src/todo.js src/todo.test.js
git commit -m "feat(wipe-done): add wipeItems domain function (AC-1.1–AC-1.4)"
```

## Rulings

(appended by executing-tasks)

## Result

(filled by executing-tasks when the task is done)

- Commits: <base7>..<head7>
- Tests: <n>/<n> (<files>)
- Review: spec ✅ · quality: <clean | K parked>
