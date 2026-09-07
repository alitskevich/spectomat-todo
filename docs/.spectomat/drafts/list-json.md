# show list as JSON

Add a `--json` flag to `todo list` so scripts can consume the list.

```
todo list --json
```

- Prints a JSON array of the same items `list` would print, in the same order (open first, then done, each group by id).
- Each element: `{"id": 1, "text": "Buy milk", "done": false}` — exactly those three keys.
- Empty list prints `[]`.
- Plain `todo list` output stays exactly as it is.
- Any other flag on `list` is an error: usage message, exit 1.
- Keep the formatting decision in `src/todo.js` as a pure function (`formatJson` or similar), wire the flag in `bin/todo.js`, tests for both.
