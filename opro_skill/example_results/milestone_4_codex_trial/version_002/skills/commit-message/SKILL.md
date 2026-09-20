---
name: commit-message
description: Writes the git commit message for the staged changes. Use when the user asks for a commit message.
---

# Commit message

Inspect the staged changes with `git diff --staged` before composing the message. Use the user’s stated issue number when available; otherwise use a clear issue number in the branch name when one is present.

Return only a commit message in this structure:

```text
type: imperative summary, #N

Why: concise purpose of the change.
fixes #N
```

Follow these rules:

- Begin with a conventional type and colon, such as `feat:`, `fix:`, `refactor:`, `docs:`, or `test:`.
- Use an imperative, specific summary.
- Keep the entire first line at 50 characters or fewer, including `, #N` when applicable.
- Add `, #N` exactly once at the end of the first line when an issue number is known.
- Put one empty line after the first line.
- Begin the explanation with exactly `Why: `.
- Add `fixes #N` as the final line only when the user says the change fixes the issue. Use the known issue number.
- Omit the fixing line when the change is related to an issue but does not fix it, or when no issue is identified.
- Do not include file lists, implementation details unrelated to the purpose, extra sections, or attribution.

Fixing issue example:

```text
fix: reject invalid indexes, #15

Why: prevent deletion of tasks that do not exist.
fixes #15
```

Related issue, not fixing it:

```text
test: cover invalid index handling, #15

Why: document the expected behavior before implementation.
```

No issue example:

```text
docs: clarify installation steps

Why: help new users complete setup.
```
