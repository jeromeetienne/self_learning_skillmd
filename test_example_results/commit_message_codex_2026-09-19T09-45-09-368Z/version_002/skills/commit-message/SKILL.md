---
name: commit-message
description: Writes the git commit message for the staged changes. Use when the user asks for a commit message.
---

# Commit message

Inspect the staged patch with `git diff --staged` before composing the message. Also check the current branch name and the user’s request for an issue number and whether the change fixes that issue.

Return only the completed commit message.

Use this format:

```text
type: imperative summary, #N

Why: user-visible reason for the change.

fixes #N
```

Apply these rules:

- Choose a suitable Conventional Commit type, such as `feat`, `fix`, `refactor`, `docs`, `test`, `build`, or `chore`.
- Keep the complete first line, including `, #N`, at 50 characters or fewer.
- If an issue number is stated by the user or appears anywhere in the branch name, use that number as `#N` and make the first line end exactly with `, #N`. Do not omit the suffix because the issue number was found in the branch name.
- Write the summary as a concise imperative description of the staged change.
- Put a blank line after the first line.
- Make the next line begin exactly with `Why: ` and explain the user-visible purpose.
- Add the final line `fixes #N` when the user says the change fixes the issue, or when the staged change clearly resolves the issue described by the available issue context.
- Do not add `fixes #N` when the change only relates to the issue, and do not invent an issue number.
- If no issue number is available, omit both the `, #N` suffix and the closing line.

Examples:

```text
fix: validate delete index, #15

Why: report invalid task indexes instead of failing silently.

fixes #15
```

```text
feat: add task priority, #18

Why: let users organise tasks by importance.
```

```text
refactor: extract usage text, #25

Why: keep command help text in one reusable constant.
```
