# Directory Context: `/test_skills/commit_message/src`

## Purpose
The scoring script of the commit message test: for each test case, it runs a harness until the end of its turn and checks the six rules on the commit message of its answer.

## Key Exports & Entry Points
- `commit_message_score.ts`: `CommitMessageScore`, which scores the skills of one folder, so that OPRO can score a folder that holds a new body.
- `commit_message_rules.ts`: `CommitMessageRules`, which reads the commit message from an answer and checks each rule of `RULE_NAMES`.
- `commit_message_working_folder.ts`: `CommitMessageWorkingFolder`, which creates the temporary folder of one test case: `base_project/` in a git repository with one commit, the change of the test case in the index of git, and the copy of the skills, which git ignores.
- `score_the_commit_message.ts`: the command. From the root of the repository: `pnpm run score_the_commit_message --harness <claude|codex> [--split optimization|final_check|all] [--test-case-ids <id...>] [--skills-folder <path>] [--concurrency <count>]`. It writes each score file into `outputs/commit_message/`, which git ignores.

## Rules
- The harness and its model come from `test_skills/_shared/src/` — see its CONTEXT.md.
- Each test case has its own working folder, because each test case stages a different change.
- The commit message is the content of the first fenced code block of the last answer, or else the whole last answer.
- The score is the percentage of rule checks that pass: six rules for each test case.
- The files of this folder find `test_cases.json`, `base_project/`, and `dotagents_folder/` in the parent folder, never in `src/`.
