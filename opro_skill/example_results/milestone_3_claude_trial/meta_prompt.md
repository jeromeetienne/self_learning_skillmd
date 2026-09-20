You improve the body of the `SKILL.md` file of the skill `commit-message`.
The body is the Markdown text after the frontmatter. An agent reads it after it loads the skill.

## The test

An AI coding agent loads the skill `commit-message`, reads the staged changes of a git repository, and replies with a commit message.
The user message sometimes gives the GitHub issue of the change and whether the change fixes it. The branch name sometimes holds the issue number, such as `fix/15-delete-invalid-index`.
Code checks several house rules on each commit message. The failures below name the rules.
The score is the percentage of rule checks that pass.

## Earlier versions

The earlier versions are below, with their scores, from the lowest score to the highest score. A higher score is better.

<version score="11.1">
# Commit message

Read the staged changes with `git diff --staged`, and write a commit message that describes them.
</version>

## The failures of the best version

- fix_issue_01: conventional_type: the first line does not start with a type such as "feat: " or "fix: "
- fix_issue_01: first_line_length: 1 lines have more than 50 characters, such as: Fix crash in `completeTask` when index does not exist
- fix_issue_01: issue_suffix: the first line does not end with ", #12"
- fix_issue_01: why_line: the second line is not blank, or the third line does not start with "Why: "
- fix_issue_01: fixes_last_line: the change fixes the issue #12, but the last line is not "fixes #12"
- fix_issue_01: no_attribution: the answer holds Co-Authored-By, which the rule refuses
- fix_issue_02: conventional_type: the first line does not start with a type such as "feat: " or "fix: "
- fix_issue_02: first_line_length: 1 lines have more than 50 characters, such as: Fix delete command silently failing on invalid index
- fix_issue_02: issue_suffix: the first line does not end with ", #15"
- fix_issue_02: why_line: the second line is not blank, or the third line does not start with "Why: "
- fix_issue_02: fixes_last_line: the change fixes the issue #15, but the last line is not "fixes #15"
- fix_issue_02: no_attribution: the answer holds Co-Authored-By, which the rule refuses
- no_issue_01: conventional_type: the first line does not start with a type such as "feat: " or "fix: "
- no_issue_01: first_line_length: 1 lines have more than 50 characters, such as: Add task count summary to the `list` command output
- no_issue_01: why_line: the second line is not blank, or the third line does not start with "Why: "
- no_issue_01: no_attribution: the answer holds Co-Authored-By, which the rule refuses

## Your task

Write a new version of the body that is different from every version above and that gets a higher score than every version above. Fix the failures of the best version, and keep what it does well.
Write Markdown with no frontmatter. Write rules that an agent can obey, and short examples.
Do not run a command, and do not read a file.
Reply with the new version only, between a line `<new_version>` and a line `</new_version>`.
