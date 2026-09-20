# Directory Context: `/opro_skill`

## Purpose
The OPRO optimizer skill: the `SKILL.md` file that a person installs in Claude Code or in Codex, and that an agent reads to run the OPRO loop inside the harness, with no TypeScript script to start it.

## Key Exports & Entry Points
- `milestone_0/`: the smallest version of the OPRO optimizer skill, which proves that a harness can run the OPRO loop inside itself — see its own [CONTEXT.md](milestone_0/CONTEXT.md).

## Rules
- A skill of this folder holds no code. Every step that needs code runs with `npx skillmd_opro_tools <tool name> ...` — see [opro_tools/CONTEXT.md](../opro_tools/CONTEXT.md).
- A skill of this folder names no target skill. The target folder, the harness name, and the run folder come from the user message.

## Background
- The OPRO optimizer skill comes from [issue #2](https://github.com/jeromeetienne/skillmd_opro/issues/2), and its plan is [issue #4](https://github.com/jeromeetienne/skillmd_opro/issues/4).
