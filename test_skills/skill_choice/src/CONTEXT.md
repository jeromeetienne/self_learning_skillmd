# Directory Context: `/test_skills/skill_choice/src`

## Purpose
The scoring script of the skill choice test: it runs a harness on each test case and counts the test cases whose chosen skill is the expected skill.

## Key Exports & Entry Points
- `skill_choice_score.ts`: `SkillChoiceScore`, which scores the skills of one folder, so that OPRO can score a folder that holds a new description.
- `skill_choice_working_folder.ts`: `SkillChoiceWorkingFolder`, which creates the temporary folder where a harness runs: the copy of the skills inside a small git repository of a project `todo-cli`, with the tags `v1.0.0` and `v1.1.0` and the current branch `add-task-priority`.
- `score_the_skill_choice.ts`: the command. From the root of the repository: `pnpm run score_the_skill_choice --harness <claude|codex> [--split optimization|final_check|all] [--test-case-ids <id...>] [--skills-folder <path>]`. It writes each score file into `outputs/skill_choice/`, which git ignores.

## Rules
- Codex runs only `gpt-5.6-luna`, and Claude Code runs only `claude-sonnet-5`, as `HARNESS_MODEL_NAMES` of `skill_choice_types.ts` says. No option changes the model.
- The choice is the first test skill named in a path under a `skills/` folder, at any depth, in a tool call or a shell command, even a path that does not exist, such as `~/.codex/skills/r2/release-notes/SKILL.md`. A skill that is not in the skills folder of the test, such as a skill of the user, is never a choice. After 3 tool calls with no test skill, or when the harness ends its turn, the choice is no skill. The harness is stopped as soon as the choice is known.
- The Claude Code run ignores the user settings with `--setting-sources project,local`, and the Codex run ignores `~/.codex/config.toml` with `--ignore-user-config`, so that the plugins of the user compete less with the skills of the test.
- The files of this folder find `test_cases.json` and `dotclaude_folder/` in the parent folder, never in `src/`.

- The working folder is a git repository, because without one Codex spends its first commands looking for a repository and loads no skill.

## Background
- The starting of a harness, the working folder, and the concurrency are generic, and move to a shared folder when the second test skill is built.
- With a working folder that was not a git repository, Codex scored 25 of 30 on the `optimization` split, and all 5 misses were searches for a repository. With the git repository, Codex scored 29 of 30.
