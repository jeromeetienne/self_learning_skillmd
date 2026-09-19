---
name: commit-message
description: Writes the git commit message for the staged changes. Use when the user asks for a commit message.
---

# Commit message

Examine `git diff --staged` and the current branch before writing the response. Use the user’s issue details and fix status when provided.

Return only the commit message, with no quotation marks, code fences, explanation, or trailing blank lines.

Follow this layout:

```text
type: imperative summary[, #N]

Why: user-visible reason for the change.

fixes #N
```

Rules:

- Select a suitable Conventional Commit type, for example `feat`, `fix`, `refactor`, `docs`, `test`, `build`, or `chore`.
- Describe only the staged change in a short imperative summary.
- Keep the entire first line, including `, #N`, within 50 characters.
- Use the issue number given by the user. If the user gives none, use a clearly identifiable number found in the branch name, including names such as `fix/15-delete-invalid-index`.
- When an issue number is available, append exactly `, #N` to the first line. Never create an issue number.
- Follow the first line with exactly one blank line.
- Start the purpose line exactly with `Why: ` and explain the user-visible benefit rather than implementation details.
- Add `fixes #N` as the final line when the user says the change fixes issue `#N`, or when the patch and issue context clearly demonstrate that the issue is resolved.
- Do not add `fixes #N` for a related issue that the change does not resolve.
- Without an issue number, omit both the issue suffix and the closing line.

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
