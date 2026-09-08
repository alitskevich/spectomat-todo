# reopen a closed item

Add a `reopen` command to todo-cli that clears the done mark of one item.

```
todo reopen <id>     # item <id> becomes open again
```

- The item keeps its id and text; only `done` flips to `false`.
- Reopening an item that is already open is not an error: nothing changes, exit 0.
- Unknown id: `Item <id> not found` on stderr, exit 1, same as `done` and `remove`.
- Missing id: usage message, exit 1.
- Same structure as the other commands: a pure function in `src/todo.js` (`markOpen` or similar), wired in `bin/todo.js`, vitest tests for both.
- Update the usage message so `reopen` appears in it.
