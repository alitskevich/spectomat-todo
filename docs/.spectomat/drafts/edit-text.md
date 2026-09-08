# edit an item's text

Add an `edit` command to todo-cli that replaces the text of one item.

```
todo edit <id> <text>     # item <id> now reads <text>
```

- `<text>` is one argument, quoted when it has spaces, exactly like `add <text>`.
- The item keeps its id and done state; only `text` changes.
- Unknown id: `Item <id> not found` on stderr, exit 1, same as `done` and `remove`.
- Missing id or missing text (or empty text): usage message, exit 1.
- Same structure as the other commands: a pure function in `src/todo.js` (`editItem` or similar), wired in `bin/todo.js`, vitest tests for both.
- Update the usage message so `edit` appears in it.
