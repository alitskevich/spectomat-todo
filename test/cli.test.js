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

describe("edit", () => {
  it("AC-2.1: updates item text and exits 0 with no stdout", () => {
    run(["add", "Buy milk"], tmpFile);
    const r = run(["edit", "1", "Buy oat milk"], tmpFile);
    expect(r.status).toBe(0);
    expect(r.stdout).toBe("");
  });

  it("AC-2.2: todo list shows new text after edit", () => {
    run(["add", "Buy milk"], tmpFile);
    run(["edit", "1", "Buy oat milk"], tmpFile);
    const r = run(["list"], tmpFile);
    expect(r.stdout).toContain("Buy oat milk");
    expect(r.stdout).not.toContain("Buy milk");
  });

  it("AC-2.3: unknown id prints error to stderr and exits 1", () => {
    const r = run(["edit", "99", "anything"], tmpFile);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("Item 99 not found");
  });

  it("AC-2.4: missing id prints usage to stderr and exits 1", () => {
    const r = run(["edit"], tmpFile);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("Usage:");
  });

  it("AC-2.5: missing text prints usage to stderr and exits 1", () => {
    run(["add", "Buy milk"], tmpFile);
    const r = run(["edit", "1"], tmpFile);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("Usage:");
  });
});
