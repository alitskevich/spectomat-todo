import { describe, it, expect } from "vitest";
import { addItem, listItems, formatItem, markDone, removeItem, wipeItems, formatJson, editItem, markOpen } from "./todo.js";

describe("addItem", () => {
  it("AC-3.1: empty store → id 1, done false", () => {
    const result = addItem([], "Buy milk");
    expect(result[0]).toEqual({ id: 1, text: "Buy milk", done: false });
  });
  it("AC-3.1: id is max(existing)+1", () => {
    const base = [{ id: 3, text: "x", done: false }];
    expect(addItem(base, "y")[1].id).toBe(4);
  });
});

describe("listItems", () => {
  const items = [
    { id: 3, text: "c", done: false },
    { id: 1, text: "a", done: true },
    { id: 2, text: "b", done: false },
  ];
  it("AC-3.2a: open items precede done items", () => {
    const sorted = listItems(items);
    const firstDoneIdx = sorted.findIndex((i) => i.done);
    const lastOpenIdx = sorted.map((i) => i.done).lastIndexOf(false);
    expect(lastOpenIdx).toBeLessThan(firstDoneIdx);
  });
  it("AC-3.2b: ascending id order within each group", () => {
    const sorted = listItems(items);
    expect(sorted.filter((i) => !i.done).map((i) => i.id)).toEqual([2, 3]);
    expect(sorted.filter((i) => i.done).map((i) => i.id)).toEqual([1]);
  });
});

describe("formatItem", () => {
  it("AC-3.2c: open item format", () => {
    expect(formatItem({ id: 1, text: "Buy milk", done: false })).toBe("[ ] 1 Buy milk");
  });
  it("AC-3.2c: done item format", () => {
    expect(formatItem({ id: 2, text: "Walk dog", done: true })).toBe("[x] 2 Walk dog");
  });
});

describe("markDone", () => {
  it("AC-3.3: sets done:true on matched id", () => {
    const updated = markDone([{ id: 1, text: "x", done: false }], 1);
    expect(updated[0].done).toBe(true);
  });
  it("AC-3.3: leaves other items unchanged", () => {
    const items = [
      { id: 1, text: "x", done: false },
      { id: 2, text: "y", done: false },
    ];
    expect(markDone(items, 1)[1].done).toBe(false);
  });
});

describe("removeItem", () => {
  it("AC-3.4: removes item with matching id", () => {
    const items = [
      { id: 1, text: "x", done: false },
      { id: 2, text: "y", done: false },
    ];
    const updated = removeItem(items, 1);
    expect(updated.find((i) => i.id === 1)).toBeUndefined();
    expect(updated.length).toBe(1);
  });
});

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
