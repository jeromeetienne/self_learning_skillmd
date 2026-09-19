---
name: pull-request-description
description: Writes the title and the description of a pull request from the commits of the current branch, with what changed, why, and how to test it. Use when the user asks for a pull request description, a pull request title, or a summary of a branch for the reviewers.
---

# Pull request description

Write the title and the description of a pull request.

1. Read the commits of the current branch that are not on the main branch.
2. Write a title of fewer than 70 characters that says what the pull request does.
3. Write the description in three sections: What, Why, How to test.
4. In "How to test", write the exact commands or the exact steps that a reviewer runs.
5. Name each issue that the pull request closes, with `Closes #N`.
