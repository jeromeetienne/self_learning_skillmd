---
name: commit-message
description: Writes the git commit message for the staged changes. Use when the user asks for a commit message.
---

# Commit message

Read the staged changes with `git diff --staged` before writing the message.

Use this format:

```text
type: short imperative summary, #N

Why: explain why the change is needed.
fixes #N
```

Rules:

- Start the first line with a conventional type followed by `: `, such as `feat: `, `fix: `, `refactor: `, `docs: `, or `test: `.
- Keep the complete first line to 50 characters or fewer.
- If the user gives an issue number, or the branch name clearly contains one, end the first line with exactly `, #N`.
- Leave the second line blank.
- Start the third line with exactly `Why: ` and briefly explain the purpose of the change.
- If the change fixes the identified issue, make the final line exactly `fixes #N`.
- Do not add `fixes #N` when the change does not fix an issue.
- Do not include unrelated details, file lists, or attribution.

Example with a fixing issue:

```text
fix: reject invalid task indexes, #15

Why: prevent deletion of tasks that do not exist.
fixes #15
```

Example without an issue:

```text
docs: clarify installation steps

Why: help new users complete setup.
```
