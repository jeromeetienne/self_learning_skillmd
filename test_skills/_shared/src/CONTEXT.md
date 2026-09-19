# Directory Context: `/test_skills/_shared/src`

## Purpose
The code that every test skill uses: the harnesses and their fixed models, the command line of a harness, a harness run until the end of its turn, git with a fixed author, and a map with a maximum concurrency.

## Key Exports & Entry Points
- `harness_types.ts`: `HARNESS_NAMES`, `HARNESS_MODEL_NAMES`, `SPLIT_NAMES`, and their types.
- `harness_command.ts`: `HarnessCommand.build`, the command line of `claude` or `codex`.
- `harness_run.ts`: `HarnessRun.runToEnd`, which returns the last answer of the harness, its commands and tool calls, and its error.
- `git_command.ts`: `GitCommand.run`, which ignores the git configuration of the user.
- `concurrency.ts`: `Concurrency.map`.

## Rules
- Nothing here imports from a test skill folder. A test skill imports from here, never from another test skill.
- Codex runs only `gpt-5.6-luna`, and Claude Code runs only `claude-sonnet-5`. No option of `HarnessCommand.build` changes the model.
- Both harnesses cannot change a file: Codex runs with `--sandbox read-only`, and Claude Code in `--print` mode refuses every tool that is not in `claudeAllowedToolNames` and needs a permission.
- The stdin of a harness is closed, because Codex waits for more input on an open stdin.
- The Claude Code run ignores the user settings with `--setting-sources project,local`, and the Codex run ignores `~/.codex/config.toml` with `--ignore-user-config`.

## Background
- `--allowedTools` of Claude Code takes several values, so it comes before `--setting-sources`, and the user message comes last, after an option that takes one value.
