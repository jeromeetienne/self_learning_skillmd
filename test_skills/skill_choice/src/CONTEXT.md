# Directory Context: `/test_skills/skill_choice/src`

## Purpose
The scoring script of the skill choice test: it runs a harness on each test case and counts the test cases whose chosen skill is the expected skill.

## Key Exports & Entry Points
- `skill_choice_score.ts`: `SkillChoiceScore`, which scores the skills of one folder, so that OPRO can score a folder that holds a new description.
- `score_the_skill_choice.ts`: the command. From the root of the repository: `pnpm run score_the_skill_choice --harness <claude|codex> [--split optimization|final_check|all] [--test-case-ids <id...>] [--skills-folder <path>]`. It writes each score file into `outputs/skill_choice/`, which git ignores.

## Rules
- Codex runs only `gpt-5.6-luna`, and Claude Code runs only `claude-sonnet-5`, as `HARNESS_MODEL_NAMES` of `skill_choice_types.ts` says. No option changes the model.
- The choice is the first skill whose `SKILL.md` path appears in a tool call or a shell command, even a path that does not exist. After 3 tool calls with no skill, or when the harness ends its turn, the choice is no skill. The harness is stopped as soon as the choice is known.
- The Claude Code run ignores the user settings with `--setting-sources project,local`, and the Codex run ignores `~/.codex/config.toml` with `--ignore-user-config`, so that the plugins of the user compete less with the skills of the test.
- The files of this folder find `test_cases.json` and `dotclaude_folder/` in the parent folder, never in `src/`.

## Background
- The starting of a harness, the working folder, and the concurrency are generic, and move to a shared folder when the second test skill is built.
