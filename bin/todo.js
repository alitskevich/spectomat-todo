#!/usr/bin/env node
import { addItem, listItems, formatItem, markDone, removeItem, wipeItems } from "../src/todo.js";
import { readStore, writeStore } from "../src/store.js";

const USAGE_MSG = "Usage: todo <add <text>|list|done <id>|remove <id>|wipe>";
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
} else if (cmd === "wipe") {
  const remaining = wipeItems(items);
  const count = items.length - remaining.length;
  await writeStore(filePath, remaining);
  process.stdout.write(`Wiped ${count} item(s)\n`);
} else {
  die(USAGE_MSG);
}
