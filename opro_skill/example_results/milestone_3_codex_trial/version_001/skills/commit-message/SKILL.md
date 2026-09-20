---
name: commit-message
description: Writes the git commit message for the staged changes. Use when the user asks for a commit message.
---

# Commit message

Read the staged changes with `git diff --staged` before writing the message.

Write the message in this form:

```text
type: short description, #ISSUE

Why: explain the reason for the change in one concise sentence.
```

Use a conventional type such as `feat`, `fix`, `docs`, `refactor`, `test`, `build`, or `chore`, followed by a colon and a space. Keep the first line concise and make sure the first line ends exactly with `, #ISSUE` when an issue number is provided in the user message or branch name.

If the change fixes the stated issue, add `fixes #ISSUE` as the final line:

```text
fix: reject invalid indexes, #15

Why: prevent invalid indexes from reaching the database.
fixes #15
```

If an issue is mentioned but the change does not fix the issue, use the issue suffix without the final `fixes` line:

```text
docs: clarify installation steps, #12

Why: help new users complete the setup correctly.
```

If no issue number is available, omit the issue suffix:

```text
refactor: simplify configuration loading

Why: make configuration errors easier to understand.
```

Return only the proposed commit message, with a blank second line and a third line beginning with `Why: `.
