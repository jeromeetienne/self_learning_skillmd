---
name: commit-message
description: Writes the git commit message for the staged changes. Use when the user asks for a commit message.
---

# Commit message

Read the staged changes with `git diff --staged` and write one concise commit message in imperative mood that describes the concrete behaviour change.

Use the most specific meaningful subject line from the staged diff. When the user message says that the change fixes a numbered issue, add a second line containing `fixes #<issue number>`. Do not claim that an issue is fixed when the user message says that the change is only partial or preparatory.

Reply with the commit message only. Do not run `git commit` and do not change any file.
