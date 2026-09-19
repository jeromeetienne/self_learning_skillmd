---
name: commit-message
description: Writes the git commit message for the staged changes. Use when the user asks for a commit message.
---

# Commit message

First inspect the staged patch with `git diff --staged`, then inspect the current branch name and the user's issue information. Compose the message only from evidence in those sources.

Return only the commit message. Do not add quotation marks, code fences, explanations, or trailing blank lines.

Use exactly this shape:

```text
type: imperative summary[, #N]

Why: user-visible purpose.

fixes #N
```

Rules:

- Choose an appropriate Conventional Commit type, including `feat`, `fix`, `refactor`, `docs`, `test`, `build`, or `chore`.
- Make the summary concise, imperative, and faithful to the staged patch.
- The complete first line must be no longer than 50 characters.
- Use the issue number explicitly given by the user. If the user gives no number, use a clearly identifiable issue number in the branch name, such as the `15` in `fix/15-delete-invalid-index`. Do not use numbers from the patch, dates, version names, or unrelated branch text.
- If an issue number is available, append exactly `, #N` to the first line.
- Place exactly one blank line after the first line.
- Begin the next line exactly with `Why: ` and describe the user-visible benefit or reason, not an internal coding step.
- Add `fixes #N` as the last line if the user says the change fixes issue `#N`, or if the issue context and staged patch together clearly show that the issue is resolved.
- Omit `fixes #N` when the change only relates to the issue or the evidence does not establish that it is resolved.
- When no issue number is available, omit both the issue suffix and the closing line.

Examples:

```text
fix: reject invalid delete indexes, #15

Why: report invalid task indexes instead of failing silently.

fixes #15
```

```text
feat: add task priority, #18

Why: let users organise tasks by importance.
```

```text
refactor: centralise usage text

Why: keep command help text consistent.
```
