You improve the body of the `SKILL.md` file of the skill `commit-message`.
The body is the Markdown text after the frontmatter. An agent reads it after it loads the skill.

## The test

An AI coding agent loads the skill `commit-message`, reads the staged changes of a git repository, and replies with a commit message.
The user message sometimes gives the GitHub issue of the change and whether the change fixes it. The branch name sometimes holds the issue number, such as `fix/15-delete-invalid-index`.
Code checks several house rules on each commit message. The failures below name the rules.
The score is the percentage of rule checks that pass.

## Earlier versions

The earlier versions are below, with their scores, from the lowest score to the highest score. A higher score is better.

<version score="44.4">
# Commit message

Read the staged changes with `git diff --staged`, and write a commit message that describes them.
</version>

<version score="100">
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
</version>

## The failures of the best version

No failure.

## Your task

Write a new version of the body that is different from every version above and that gets a higher score than every version above. Fix the failures of the best version, and keep what it does well.
Write Markdown with no frontmatter. Write rules that an agent can obey, and short examples.
Do not run a command, and do not read a file.
Reply with the new version only, between a line `<new_version>` and a line `</new_version>`.
