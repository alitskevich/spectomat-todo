import { describe, it, expect } from "vitest";
import { addItem, listItems, formatItem, markDone, removeItem } from "./todo.js";

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
