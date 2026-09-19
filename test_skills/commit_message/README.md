# Commit message test

This test measures whether the body of a skill makes a harness obey the rules of a commit message. Code checks each rule, so no second model is needed.

## The skill

The skill is `dotagents_folder/skills/commit-message/SKILL.md`. Its description is good, and its body is weak on purpose: it says only to read `git diff --staged` and to describe the changes. It names no rule. OPRO improves this body.

## The rules

Code checks six rules on each commit message. Most are house rules, which a model cannot guess without the skill:

| Rule | The commit message obeys the rule when |
|---|---|
| `conventional_type` | the first line starts with a Conventional Commits type, such as `feat: ` or `fix(cli): ` |
| `first_line_length` | the first line has 50 characters or fewer |
| `issue_suffix` | the first line ends with `, #N` when the change has the issue `N`, and the commit message names no issue when the change has none |
| `why_line` | the second line is blank, and the third line starts with `Why: ` |
| `fixes_last_line` | the last line is exactly `fixes #N` when the change fixes the issue `N`, and the commit message has no word that closes an issue, such as `closes #N`, in every other case |
| `no_attribution` | it does not name its author or its tool, such as `Co-Authored-By` or `Generated with` |

## The test cases

`test_cases.json` holds 20 changes to the small project `todo-cli` of `base_project/`:

| Kind of change | `optimization` | `final_check` |
|---|---|---|
| fixes an issue | 4 | 2 |
| is about an issue, and does not close it | 5 | 2 |
| has no issue | 6 | 1 |

- **`optimization`:** the OPRO loop scores each new body on these 15 test cases.
- **`final_check`:** these 5 test cases score only the final body. OPRO never sees them.

The user message of a test case gives only the facts, and never names a rule. The facts are hard to find on purpose:

- In 6 test cases, the issue number is only in the branch name, such as `fix/15-delete-invalid-index`.
- Some user messages use a word that the rules refuse, such as "Closes the bug report #21" for a fix, or "This resolves the first part of #31" for a change that does not close the issue.

## How the score works

1. For each test case, the script creates a temporary folder outside this repository: `base_project/` in a git repository with one commit, the change of the test case in the index of git, and a copy of the skills.
2. The script starts the harness in that folder, 4 test cases at the same time:
   - Codex runs only `gpt-5.6-luna`, in a read-only sandbox.
   - Claude Code runs only `claude-sonnet-5`, and may call only the tools that read the skill and git.
3. The user message asks the harness to use the `commit-message` skill, to write the commit message for the staged changes, and to reply with the commit message only. The user message of the test case comes after it.
4. The harness runs until the end of its turn. The commit message is the first fenced code block of its last answer, or else the whole last answer.
5. The score is the percentage of rule checks that pass: 6 rules for each of the 15 test cases, 90 checks.

## How to run it

From the root of the repository:

```bash
pnpm run score_the_commit_message --harness codex
```

The options are the same as for the skill choice test: `--harness`, `--split`, `--test-case-ids`, `--skills-folder`, and `--concurrency`.

Each run prints one line for each test case with the reason of each failed rule, then the count of each rule. It writes a score file into `outputs/commit_message/`, which git ignores. The score file holds the last answer, the commit message, and the commands or the tool calls of each test case.

The `claude` harness must run in a terminal of the user, because a Claude Code desktop session cannot start `claude`.

## Watch it live

Start `claude` or `codex` in `playground/`. That folder holds only the links `.claude` and `.agents` to `dotagents_folder/`, and has no staged change, so stage a change of your own in another project, or use `playground/` only to see that the harness finds the skill.

## Results

| Date | Harness | Split | Score | Commit |
|---|---|---|---|---|
| 2026-09-19 | codex | `optimization` | 79 of 90 rule checks (87.8 percent) | [0eced72](https://github.com/jeromeetienne/skillmd_opro/commit/0eced72) |

This run used the first rules, which were too easy: only `conventional_type` failed, 4 of 15. The rules and the test cases changed after this run.
