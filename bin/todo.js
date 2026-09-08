#!/usr/bin/env node
import { addItem, listItems, formatItem, markDone, removeItem, wipeItems, formatJson, editItem } from "../src/todo.js";
import { readStore, writeStore } from "../src/store.js";

const USAGE_MSG = "Usage: todo <add <text>|list [--json]|done <id>|remove <id>|wipe|edit <id> <text>>";
const filePath = process.env.TODO_FILE ?? "./todo.json";
const [, , cmd, arg, arg2] = process.argv;

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
  if (arg === "--json") {
    process.stdout.write(formatJson(listItems(items)) + "\n");
  } else if (arg !== undefined) {
    die(USAGE_MSG);
  } else {
    for (const item of listItems(items)) {
      process.stdout.write(formatItem(item) + "\n");
    }
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
} else if (cmd === "edit") {
  if (!arg || !arg2) die(USAGE_MSG);
  const id = parseInt(arg, 10);
  if (!items.find((i) => i.id === id)) die(`Item ${id} not found`);
  await writeStore(filePath, editItem(items, id, arg2));
} else {
  die(USAGE_MSG);
}
