---
name: commit-message
description: Writes the git commit message for the staged changes. Use when the user asks for a commit message.
---

# Commit message

Read the staged changes with `git diff --staged` before writing the message.

Write a Conventional Commit message with this structure:

```text
type: short imperative description, #ISSUE

Why: explain the user-visible reason for the change.

Optional details about the implementation.

fixes #ISSUE
```

Rules:

- Use a valid type such as `feat`, `fix`, `refactor`, `docs`, `test`, `build`, or `chore`, followed by `: `.
- Keep the entire first line at 50 characters or fewer.
- If an issue number is provided by the user or appears in the branch name, end the first line exactly with `, #N`.
- Use a concise imperative description. Omit unnecessary words to stay within 50 characters.
- Leave the second line blank.
- Make the third line begin exactly with `Why: `.
- Include `fixes #N` as the final line, using lowercase `fixes`, only when the change fixes issue `#N`.
- Do not add a closing line when the change merely relates to an issue or does not fix the issue.
- If no issue number is available, omit the issue suffix and the closing line.
- Return only the commit message, without quotation marks or commentary.

Examples:

```text
fix: handle missing task index, #12

Why: prevent the done command from failing silently.

fixes #12
```

```text
feat: add task priority, #18

Why: let users organise tasks by importance.
```

```text
refactor: extract usage text, #25

Why: keep command help text in one reusable constant.
```
