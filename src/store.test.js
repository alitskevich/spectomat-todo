import { describe, it, expect, afterEach } from "vitest";
import { readStore, writeStore } from "./store.js";
import { tmpdir } from "os";
import { join } from "path";
import { unlink } from "fs/promises";

const files = [];
const tmp = () => {
  const f = join(tmpdir(), `todo-store-test-${Date.now()}-${Math.floor(Math.random() * 1e6)}.json`);
  files.push(f);
  return f;
};

afterEach(async () => {
  await Promise.all(files.splice(0).map((f) => unlink(f).catch(() => {})));
});

describe("writeStore / readStore", () => {
  it("AC-6.1: round-trips items as valid JSON", async () => {
    const f = tmp();
    const items = [{ id: 1, text: "Buy milk", done: false }];
    await writeStore(f, items);
    expect(await readStore(f)).toEqual(items);
  });

  it("AC-6.1: file uses 2-space indentation", async () => {
    const f = tmp();
    const { readFile } = await import("fs/promises");
    await writeStore(f, [{ id: 1, text: "x", done: false }]);
    const raw = await readFile(f, "utf8");
    expect(raw).toContain("  \"id\"");
  });

  it("AC-6.2: absent file returns empty array without error", async () => {
    const f = tmp();
    // f was never created
    await unlink(f).catch(() => {});
    expect(await readStore(f)).toEqual([]);
  });
});
