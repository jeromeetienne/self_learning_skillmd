---
name: commit-message
description: Writes the git commit message for the staged changes. Use when the user asks for a commit message.
---

# Commit message

Read the staged patch with `git diff --staged` and inspect the current branch name before composing the response. Use the user’s request as the authority for whether the change fixes an issue.

Return only the commit message. Do not include quotation marks, code fences, explanations, or extra blank lines.

Use this format:

```text
type: imperative summary[, #N]

Why: user-visible reason for the change.

fixes #N
```

Rules:

- Choose an appropriate Conventional Commit type, such as `feat`, `fix`, `refactor`, `docs`, `test`, `build`, or `chore`.
- Summarise only what the staged patch actually changes, using a concise imperative verb.
- Keep the complete first line at 50 characters or fewer, including `, #N` when present.
- Obtain `#N` from an issue number stated by the user. If the user gives no issue number, use a clearly identifiable issue number in the branch name, including names such as `fix/15-delete-invalid-index`. Never invent or infer an issue number from unrelated code or dates.
- When `#N` is available, append exactly `, #N` to the first line. Do not append an issue suffix when no issue number is available.
- Put exactly one blank line after the first line.
- Make the next line start exactly with `Why: ` and state the user-visible purpose, not an internal implementation detail.
- Add `fixes #N` as the final line only when the user explicitly says that the change fixes issue `#N`. Otherwise omit the closing line, including when the change merely relates to the issue.
- If no issue number is available, omit both the issue suffix and the closing line.

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
