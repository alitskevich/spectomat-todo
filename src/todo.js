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
