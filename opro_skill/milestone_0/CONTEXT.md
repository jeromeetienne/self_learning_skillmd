# Directory Context: `/opro_skill/milestone_0`

## Purpose
The smallest version of the OPRO optimizer skill, and the results of the two runs that prove the assumption of milestone 0 of issue #4: an agent that runs inside a harness can start another harness with `npx`, and can run one round of the OPRO loop.

## Key Exports & Entry Points
- `skills/opro-optimizer/SKILL.md`: the smallest OPRO optimizer skill. One round, one new version, two test cases, no score, no rule check.
- `playground/`: the folder where the outer harness runs. It holds the skill in `.claude/skills/` for Claude Code and in `.agents/skills/` for Codex, and it writes its run folders into `playground/outputs/`, which git ignores.
- `example_results/`: the two run folders of the proof, and the raw JSON Lines of the two outer harness runs and of the probe.
- Command to run this folder with Codex, from `playground/`:
  `codex exec --json --skip-git-repo-check --sandbox workspace-write -c 'sandbox_workspace_write.network_access=true' --model gpt-5.6-luna "Run the opro-optimizer skill. The target folder is <repository>/test_skills/commit_message. The harness name is codex. The run folder is <repository>/opro_skill/milestone_0/playground/outputs/milestone_0_codex." < /dev/null`
- Command to run this folder with Claude Code, from `playground/`:
  `claude --print --model claude-sonnet-5 --output-format stream-json --verbose --no-session-persistence --allowedTools "Skill,Read,Write,Edit,Glob,Grep,Bash" --permission-mode acceptEdits --setting-sources project,local "Run the opro-optimizer skill. The target folder is <repository>/test_skills/commit_message. The harness name is claude. The run folder is <repository>/opro_skill/milestone_0/playground/outputs/milestone_0_claude."`

## Rules
- `playground/.claude/skills/` and `playground/.agents/skills/` are copies of `skills/`. After a change of `skills/`, copy it into both folders again, or the outer harness reads the old skill.
- Close the standard input of the outer harness with `< /dev/null`. Codex waits for more input on an open standard input, and the run never ends.
- The proof stands on the raw JSON Lines of `example_results/`, not on the report that the agent wrote. The report of the Codex run says that one nested harness run was retried "with elevated execution", and the raw log shows two identical commands instead.

## Background
- The results of the two runs, the failure of one nested Codex start, and the rule leak that the Claude Code run showed are written in [issue #4](https://github.com/jeromeetienne/skillmd_opro/issues/4).
