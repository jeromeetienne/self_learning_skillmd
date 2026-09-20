# Directory Context: `/opro_skill/playground`

## Purpose
The folder where a person starts Claude Code or Codex to run the OPRO optimizer skill of this repository, without installing the skill in the home folder of the person.

## Key Exports & Entry Points
- `.claude/skills/opro-optimizer/`: the copy of `opro_skill/skills/opro-optimizer/` that Claude Code reads.
- `.agents/skills/opro-optimizer/`: the copy of `opro_skill/skills/opro-optimizer/` that Codex reads.
- `outputs/`: the run folders of the runs that start from this folder. Git ignores this folder.
- Command to start Codex from this folder:
  `codex exec --json --skip-git-repo-check --sandbox danger-full-access --model gpt-5.6-luna "Run the opro-optimizer skill on this target skill. The target folder is <repository>/test_skills/commit_message. The harness name is codex. The run folder is <repository>/opro_skill/playground/outputs/<run name>." < /dev/null`
- Command to start Claude Code from this folder:
  `claude --print --model claude-sonnet-5 --output-format stream-json --verbose --no-session-persistence --allowedTools "Skill,Read,Write,Edit,Glob,Grep,Bash" --permission-mode acceptEdits --setting-sources project,local "Run the opro-optimizer skill on this target skill. The target folder is <repository>/test_skills/commit_message. The harness name is claude. The run folder is <repository>/opro_skill/playground/outputs/<run name>."`

## Rules
- Start the outer Codex with `--sandbox danger-full-access`. With `--sandbox workspace-write`, every harness that the tools start inside the outer Codex stops at once with `failed to initialize in-process app-server client: Operation not permitted (os error 1)`.
- Close the standard input of the outer harness with `< /dev/null`. Codex waits for more input on an open standard input, and the run never ends.
- After a change of `opro_skill/skills/opro-optimizer/`, copy it into `.claude/skills/` and into `.agents/skills/` again, or the outer harness reads the old skill.

## Background
- The sandbox rule above comes from the trial of milestone 3 of [issue #4](https://github.com/jeromeetienne/skillmd_opro/issues/4): the same nested start fails in 171 milliseconds under `--sandbox workspace-write`, and answers in 8.5 seconds under `--sandbox danger-full-access`.
