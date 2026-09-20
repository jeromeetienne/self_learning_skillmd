# Milestone 0 report

## Version 000 body

```markdown
# Commit message

Read the staged changes with `git diff --staged`, and write a commit message that describes them.
```

## Version 001 body

```markdown
# Commit message

Read the staged changes with `git diff --staged` and write one concise commit message in imperative mood that describes the concrete behaviour change.

Use the most specific meaningful subject line from the staged diff. When the user message says that the change fixes a numbered issue, add a second line containing `fixes #<issue number>`. Do not claim that an issue is fixed when the user message says that the change is only partial or preparatory.

Reply with the commit message only. Do not run `git commit` and do not change any file.
```

## Answers

### Version 000, `fix_issue_01`

```text
Fix done command crash for missing task index

fixes #12
```

### Version 000, `fix_issue_02`

```text
Fix silent failure for invalid task deletion index
```

### Version 001, `fix_issue_01`

```text
Handle missing task index in done command
fixes #12
```

### Version 001, `fix_issue_02`

```text
Reject invalid task indexes for delete
```

## Tool results

| Version | Test case | `run-target-skill` error message | Skill loaded | Tool ran without an error |
| --- | --- | --- | --- | --- |
| 000 | `fix_issue_01`, initial attempt | `the harness stopped with the exit code 1 before the end of its turn: WARNING: proceeding, even though we could not create PATH aliases: Operation not permitted (os error 1)` followed by `Error: failed to initialize in-process app-server client: Operation not permitted (os error 1)` | no | no |
| 000 | `fix_issue_01`, elevated retry | `null` | yes | yes |
| 000 | `fix_issue_02` | `null` | yes | yes |
| 001 | `fix_issue_01` | `null` | yes | yes |
| 001 | `fix_issue_02` | `null` | yes | yes |

The first version 000 attempt was retried with elevated execution because the harness could not initialize inside the sandbox. The retry and all subsequent harness runs completed successfully.

## Change and reason

Version 001 keeps the target skill frontmatter unchanged and replaces only the body. The new body asks for a concise imperative subject that describes the concrete behaviour change, requires an issue-closing line when the user identifies a fixed numbered issue, and prevents claiming a fix for partial or preparatory work. It also repeats the output and mutation constraints so the harness returns only the commit message and does not commit or edit files.
