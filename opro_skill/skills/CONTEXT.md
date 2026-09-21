# Directory Context: `/opro_skill/skills`

## Purpose
The OPRO optimizer skill that a person installs: one `SKILL.md` file and its reference files, which an agent reads to run the OPRO loop inside the harness.

## Key Exports & Entry Points
- `opro-optimizer/SKILL.md`: the loop, the tools, and the rules of the loop.
- `opro-optimizer/references/target_folder_format.md`: the data files and the text files that a person writes for a new target skill, and the kinds of check of a rule.
- Command to install this skill: copy `opro-optimizer/` into `~/.claude/skills/` for Claude Code, or into `~/.agents/skills/` for Codex. `opro_skill/playground/` holds a copy for both harnesses, to run the skill from this repository.

## Rules
- The skill holds no code. Every step that needs code runs with `npx skillmd_opro_tools <tool name> ...` — see [opro_tools/src/CONTEXT.md](../../opro_tools/src/CONTEXT.md).
- The skill names no target skill, no test case, and no rule. The target folder, the harness name, and the run folder come from the user message.
- The `SKILL.md` file tells the agent never to read `opro_target.json`, because that file holds the rules, and the OPRO loop measures whether a proposer can discover the rules from the failures.
- Every new version comes from the tool `propose-version`, which runs a separate harness in an empty folder with no skill. The agent that reads this skill decides how many rounds to run, and never writes a version itself.
- A reference file sits inside the skill folder, so that the skill stays one folder that a person copies.

## Background
- The separate proposer keeps the property that the old TypeScript loop had: the proposer sees the meta-prompt and nothing else, so the target skill never influences the proposal, and the context of the agent that runs the loop stays small. Milestone 0 of [issue #4](https://github.com/jeromeetienne/skillmd_opro/issues/4) showed both reasons: an agent that read the checking code copied the rules into the version, and a run of 6 rounds does not fit in the context of one agent.
