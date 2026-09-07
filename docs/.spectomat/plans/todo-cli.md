# todo-cli — Implementation Plan

**Goal:** Implement a Node ESM CLI todo list with add/list/done/remove commands backed by a JSON file.
**Architecture:** Three modules — pure domain functions (`src/todo.js`), filesystem adapter (`src/store.js`), CLI entry point (`bin/todo.js`) — tested bottom-up with vitest.
**Tech stack:** Node.js ESM, vitest, no production dependencies.
**Spec:** docs/.spectomat/specs/todo-cli.md

## Global Constraints

- Node ESM: `"type": "module"` already set in `package.json`
- No production dependencies beyond Node built-ins (`fs/promises`, `child_process`, `os`, `path`)
- `NEXT_ID = max(existing ids) + 1`, or `1` when store is empty
- `DEFAULT_FILE = "./todo.json"` overridden by `TODO_FILE` env var
- `USAGE_MSG = "Usage: todo <add <text>|list|done <id>|remove <id>>"`
- JSON file written with 2-space indentation
- All error output to stderr; normal output to stdout
- Gates: `npm test` must pass before every commit

---

### Task 1: Pure domain — `src/todo.js`

**Files:**
- Create: `src/todo.js`
- Create (test): `src/todo.test.js`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `createItem(id: number, text: string): Item` — `{ id, text, done: false }`
  - `addItem(items: Item[], text: string): Item[]` — appends new item with NEXT_ID
  - `listItems(items: Item[]): Item[]` — open first (asc id), then done (asc id)
  - `formatItem(item: Item): string` — `"[ ] 1 Buy milk"` or `"[x] 2 Walk dog"`
  - `markDone(items: Item[], id: number): Item[]` — sets `done: true` on matched id
  - `removeItem(items: Item[], id: number): Item[]` — filters out matched id

- [ ] **Step 1: Write the failing tests** — create `src/todo.test.js`:

```js
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
```

- [ ] **Step 2: Run tests, expect FAIL** — `npm test -- src/todo.test.js`, fails with "Cannot find module"

- [ ] **Step 3: Implement `src/todo.js`**:

```js
export function createItem(id, text) {
  return { id, text, done: false };
}

export function addItem(items, text) {
  const id = items.length === 0 ? 1 : Math.max(...items.map((i) => i.id)) + 1;
  return [...items, createItem(id, text)];
}

export function listItems(items) {
  const open = items.filter((i) => !i.done).sort((a, b) => a.id - b.id);
  const done = items.filter((i) => i.done).sort((a, b) => a.id - b.id);
  return [...open, ...done];
}

export function formatItem(item) {
  return `${item.done ? "[x]" : "[ ]"} ${item.id} ${item.text}`;
}

export function markDone(items, id) {
  return items.map((i) => (i.id === id ? { ...i, done: true } : i));
}

export function removeItem(items, id) {
  return items.filter((i) => i.id !== id);
}
```

- [ ] **Step 4: Run tests, expect PASS** — `npm test -- src/todo.test.js`, all green; full suite stays green

- [ ] **Step 5: Commit** — `git add src/todo.js src/todo.test.js && git commit -m "feat(todo-cli): pure domain functions (src/todo.js)"`

---

### Task 2: Filesystem adapter — `src/store.js`

**Files:**
- Create: `src/store.js`
- Create (test): `src/store.test.js`

**Interfaces:**
- Consumes: nothing (uses `fs/promises` directly)
- Produces:
  - `readStore(filePath: string): Promise<Item[]>` — returns `[]` when file absent
  - `writeStore(filePath: string, items: Item[]): Promise<void>` — writes 2-space JSON

- [ ] **Step 1: Write the failing tests** — create `src/store.test.js`:

```js
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
```

- [ ] **Step 2: Run tests, expect FAIL** — `npm test -- src/store.test.js`, fails with "Cannot find module"

- [ ] **Step 3: Implement `src/store.js`**:

```js
import { readFile, writeFile } from "fs/promises";

export async function readStore(filePath) {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

export async function writeStore(filePath, items) {
  await writeFile(filePath, JSON.stringify(items, null, 2) + "\n");
}
```

- [ ] **Step 4: Run tests, expect PASS** — `npm test -- src/store.test.js`, all green; full suite stays green

- [ ] **Step 5: Commit** — `git add src/store.js src/store.test.js && git commit -m "feat(todo-cli): filesystem adapter (src/store.js)"`

---

### Task 3: CLI entry point — `bin/todo.js` + integration tests

**Files:**
- Create: `bin/todo.js`
- Create (test): `test/cli.test.js`

**Interfaces:**
- Consumes: `addItem`, `listItems`, `formatItem`, `markDone`, `removeItem` from `src/todo.js`; `readStore`, `writeStore` from `src/store.js`
- Produces: executable CLI (`node bin/todo.js <cmd> [arg]`)

- [ ] **Step 1: Write the failing integration tests** — create `test/cli.test.js`:

```js
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { spawnSync } from "child_process";
import { tmpdir } from "os";
import { join } from "path";
import { unlink } from "fs/promises";

const BIN = new URL("../bin/todo.js", import.meta.url).pathname;

function run(args, todoFile) {
  return spawnSync("node", [BIN, ...args], {
    encoding: "utf8",
    env: { ...process.env, TODO_FILE: todoFile },
  });
}

let tmpFile;
beforeEach(() => {
  tmpFile = join(tmpdir(), `todo-cli-${Date.now()}.json`);
});
afterEach(async () => {
  await unlink(tmpFile).catch(() => {});
});

describe("add", () => {
  it("AC-3.1: prints positive integer id", () => {
    const r = run(["add", "Buy milk"], tmpFile);
    expect(r.status).toBe(0);
    expect(parseInt(r.stdout.trim(), 10)).toBeGreaterThan(0);
  });
});

describe("list", () => {
  it("AC-3.2c: format matches [ ] id text", () => {
    run(["add", "Buy milk"], tmpFile);
    const r = run(["list"], tmpFile);
    expect(r.stdout.trim()).toBe("[ ] 1 Buy milk");
  });

  it("AC-3.2a: open items precede done items", () => {
    run(["add", "a"], tmpFile);
    run(["add", "b"], tmpFile);
    run(["done", "1"], tmpFile);
    const lines = run(["list"], tmpFile).stdout.trim().split("\n");
    expect(lines[0]).toMatch(/^\[ \]/);
    expect(lines[1]).toMatch(/^\[x\]/);
  });

  it("AC-3.2b: ascending id within each group", () => {
    run(["add", "a"], tmpFile); // id 1
    run(["add", "b"], tmpFile); // id 2
    run(["add", "c"], tmpFile); // id 3
    run(["done", "1"], tmpFile);
    const lines = run(["list"], tmpFile).stdout.trim().split("\n");
    // open: 2, 3; done: 1
    expect(lines[0]).toContain(" 2 ");
    expect(lines[1]).toContain(" 3 ");
    expect(lines[2]).toContain(" 1 ");
  });
});

describe("done", () => {
  it("AC-3.3: marks item done, shows [x] in list", () => {
    run(["add", "x"], tmpFile);
    run(["done", "1"], tmpFile);
    const r = run(["list"], tmpFile);
    expect(r.stdout.trim()).toBe("[x] 1 x");
  });
});

describe("remove", () => {
  it("AC-3.4: item absent after remove", () => {
    run(["add", "x"], tmpFile);
    run(["remove", "1"], tmpFile);
    const r = run(["list"], tmpFile);
    expect(r.stdout.trim()).toBe("");
  });
});

describe("errors", () => {
  it("AC-4.1: unknown command exits 1", () => {
    expect(run(["bogus"], tmpFile).status).toBe(1);
  });

  it("AC-4.2: missing argument to add exits 1", () => {
    expect(run(["add"], tmpFile).status).toBe(1);
  });

  it("AC-4.2: missing argument to done exits 1", () => {
    expect(run(["done"], tmpFile).status).toBe(1);
  });

  it("AC-4.3: id not found exits 1", () => {
    expect(run(["done", "99"], tmpFile).status).toBe(1);
  });

  it("AC-4.4: error goes to stderr, stdout empty", () => {
    const r = run(["bogus"], tmpFile);
    expect(r.stderr.trim()).toBeTruthy();
    expect(r.stdout.trim()).toBe("");
  });
});

describe("config", () => {
  it("AC-5.1: TODO_FILE isolates stores", async () => {
    const f1 = join(tmpdir(), `todo-f1-${Date.now()}.json`);
    const f2 = join(tmpdir(), `todo-f2-${Date.now()}.json`);
    try {
      run(["add", "in-f1"], f1);
      run(["add", "in-f2"], f2);
      expect(run(["list"], f1).stdout).toContain("in-f1");
      expect(run(["list"], f1).stdout).not.toContain("in-f2");
      expect(run(["list"], f2).stdout).toContain("in-f2");
    } finally {
      await unlink(f1).catch(() => {});
      await unlink(f2).catch(() => {});
    }
  });
});
```

- [ ] **Step 2: Run tests, expect FAIL** — `npm test -- test/cli.test.js`, fails with "Cannot find module" or ENOENT on bin/todo.js

- [ ] **Step 3: Implement `bin/todo.js`** (create `bin/` directory first):

```js
#!/usr/bin/env node
import { addItem, listItems, formatItem, markDone, removeItem } from "../src/todo.js";
import { readStore, writeStore } from "../src/store.js";

const USAGE_MSG = "Usage: todo <add <text>|list|done <id>|remove <id>>";
const filePath = process.env.TODO_FILE ?? "./todo.json";
const [, , cmd, arg] = process.argv;

function die(msg) {
  process.stderr.write(msg + "\n");
  process.exit(1);
}

const items = await readStore(filePath);

if (cmd === "add") {
  if (!arg) die(USAGE_MSG);
  const updated = addItem(items, arg);
  await writeStore(filePath, updated);
  process.stdout.write(updated[updated.length - 1].id + "\n");
} else if (cmd === "list") {
  for (const item of listItems(items)) {
    process.stdout.write(formatItem(item) + "\n");
  }
} else if (cmd === "done") {
  if (!arg) die(USAGE_MSG);
  const id = parseInt(arg, 10);
  if (!items.find((i) => i.id === id)) die(`Item ${id} not found`);
  await writeStore(filePath, markDone(items, id));
} else if (cmd === "remove") {
  if (!arg) die(USAGE_MSG);
  const id = parseInt(arg, 10);
  if (!items.find((i) => i.id === id)) die(`Item ${id} not found`);
  await writeStore(filePath, removeItem(items, id));
} else {
  die(USAGE_MSG);
}
```

- [ ] **Step 4: Run tests, expect PASS** — `npm test`, all suites green

- [ ] **Step 5: Commit** — `git add bin/todo.js test/cli.test.js && git commit -m "feat(todo-cli): CLI entry point and integration tests (bin/todo.js)"`
