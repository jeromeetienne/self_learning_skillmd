---
name: commit-message
description: Writes the git commit message for the staged changes. Use when the user asks for a commit message.
---

# Commit message

Read the staged changes with `git diff --staged`. Read the user message for the issue number, if the user message names one, and for whether the change fixes an issue.

Write the commit message in this exact shape.

1. First line: a Conventional Commits type (`feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, or `revert`), an optional scope in parentheses, then a colon, a space, and a short summary of the change. The whole first line must be 50 characters or fewer.
   - When the user message names a GitHub issue, end the first line with a comma, a space, and the issue number written as `#` followed by the number.
   - When the user message names no GitHub issue, do not write the character `#` anywhere in the commit message.
2. Second line: blank.
3. Third line: the word `Why:`, a space, then one sentence that says why the change was made.
4. When the change fixes a GitHub issue, add a blank line after the line that starts with `Why:`, then a last line that is exactly the word `fixes`, a space, and the issue number written as `#` followed by the number.
5. When the change does not fix a GitHub issue, do not write `fixes`, `closes`, `resolves`, or another word that closes a GitHub issue, followed by a `#` and a number, anywhere in the commit message.
6. Never name the author of the commit or the tool that wrote it. Do not write `Co-Authored-By`, `Generated with`, `Claude`, `Codex`, `Anthropic`, or `OpenAI` anywhere in the commit message.

Reply with the commit message only.
