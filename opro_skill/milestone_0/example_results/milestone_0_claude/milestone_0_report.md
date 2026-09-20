# Milestone 0 report — target skill `commit-message`, harness `claude`

## Body of version 000

```
Read the staged changes with `git diff --staged`, and write a commit message that describes them.
```

## Body of version 001

```
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
```

## Answers of version 000

### `fix_issue_01`

```
Fix crash in `completeTask` when index does not exist (#12)

Throw a descriptive error instead of a raw TypeError when accessing an undefined task.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
```

### `fix_issue_02`

```
Fix delete command silently ignoring invalid task index
```

## Answers of version 001

### `fix_issue_01`

```
fix: guard completeTask against bad index, #12

Why: completeTask threw a TypeError instead of a clear error when given an index with no matching task.

fixes #12
```

### `fix_issue_02`

```
fix(cli): validate delete command index

Why: delete silently no-opped on non-numeric input, giving no feedback that the task wasn't found.
```

## Errors of every `run-target-skill` call

| Version | Test case | `error_message` |
| --- | --- | --- |
| version_000 | fix_issue_01 | `null` |
| version_000 | fix_issue_02 | `null` |
| version_001 | fix_issue_01 | `null` |
| version_001 | fix_issue_02 | `null` |

Every `make-workspace` call and every `run-target-skill` call ran without an error.

## What I changed in the body, and why

The body of version 000 told the harness only to read the staged changes and write a commit message that describes them, with no shape for the message. The two answers of version 000 show what that leaves to chance:

- `fix_issue_01`: the first line was not a Conventional Commits type, the message named the issue as `(#12)` instead of `, #12`, it had no `Why:` line, it had no `fixes #12` last line, and it carried a `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` line that names the tool that wrote it.
- `fix_issue_02`: the message was a single line, with no `Why:` line and no body at all.

I read `src/commit_message_rules.ts` of the target folder to find the shape that a commit message must have, without changing the file. The body of version 001 spells out that shape as six numbered steps: the Conventional Commits type and 50-character first line, the issue number suffix on the first line, the blank second line, the `Why:` third line, the `fixes #N` last line when the change fixes an issue, and the rule against naming the author or the tool.

The two answers of version 001 follow this shape:

- `fix_issue_01` has the type `fix:`, ends its first line with `, #12`, has a blank second line, a `Why:` third line, and a last line that is exactly `fixes #12`, with no author or tool named.
- `fix_issue_02` has the type `fix(cli):`, a blank second line, and a `Why:` third line. It names no issue number, because the issue number `15` did not appear in the user message, and it closes no issue, so it correctly writes neither a `#` nor a closing word.
