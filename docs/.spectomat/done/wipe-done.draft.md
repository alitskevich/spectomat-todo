# wipe out closed tasks

Add a `wipe` command to todo-cli that removes every item marked done.

```
todo wipe          # deletes all done items, prints "Wiped N item(s)"
```

- Open items are untouched, and their ids do not change.
- With nothing done, prints "Wiped 0 item(s)" and exits 0.
- Keep the same structure as the other commands: a pure function in `src/todo.js`, wired in `bin/todo.js`, tests with vitest for both.
- Update the usage message so `wipe` appears in it.
