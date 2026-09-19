---
name: commit-message
description: Writes the git commit message for the staged changes. Use when the user asks for a commit message.
---

# Commit message

Review the staged patch using `git diff --staged`. Check the current branch name and the user’s request for any GitHub issue number and whether the change fixes that issue. Then return only the finished commit message.

Use this structure:

```text
type: imperative summary, #N

Why: explain the user-visible purpose of the change.

fixes #N
```

Rules:

- Use a suitable Conventional Commit type, such as `feat`, `fix`, `refactor`, `docs`, `test`, `build`, or `chore`.
- Keep the complete first line, including the issue suffix when present, to 50 characters or fewer.
- Use an issue number explicitly supplied by the user; otherwise, use a clearly identifiable issue number in the branch name, such as `fix/15-delete-invalid-index`.
- When an issue number is available, end the first line exactly with `, #N`.
- Write a brief imperative summary based on the staged patch. Do not claim changes that the patch does not contain.
- Put one blank line after the first line.
- Make the purpose line start exactly with `Why: ` and describe the user-visible reason, not internal implementation details.
- Add `fixes #N` as the final line when the user says the change fixes issue `#N`, or when the available issue context and staged patch clearly show that the issue is resolved.
- Omit `fixes #N` when the change only relates to the issue.
- Do not invent an issue number. If no issue number is available, omit both the issue suffix and the closing line.
- Do not include quotation marks, Markdown fences, explanations, or any other commentary.

Examples:

```text
fix: reject invalid delete indexes, #15

Why: show an error instead of failing silently.

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
