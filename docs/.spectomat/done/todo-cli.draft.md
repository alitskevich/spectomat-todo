# todo-cli

A tiny command-line to-do list, Node ESM, no dependencies beyond vitest for tests.

Usage:

```
todo add "Buy milk"        # prints the new item's id
todo list                  # prints "[ ] 1 Buy milk" per item, done items as "[x]"
todo done 1                # marks item 1 done
todo remove 1              # deletes item 1
```

- Items live in a JSON file. Default path `./todo.json`; `TODO_FILE` env var overrides it.
- Ids are increasing integers, never reused.
- `list` shows open items first, then done items, each group in id order.
- Unknown command or missing argument: print a one-line usage message and exit 1.
- Keep the core (add/list/done/remove over a store) as pure functions in `src/todo.js`, the file I/O in `src/store.js`, the CLI in `bin/todo.js`. Tests with vitest.
