# Directory Context: `/test_skills`

## Purpose
Holds one folder for each test skill: the skills that OPRO improves, the test cases that score them, and a folder where a person starts `claude` or `codex` to see them live.

## Key Exports & Entry Points
- `skill_choice/`: the skill choice test, which scores the `description` field of `release-notes` — see its CONTEXT.md.

## Rules
- Each test skill folder holds the same three parts:
  - `dotclaude_folder/skills/<skill-name>/SKILL.md`: the skills of the test.
  - `playground/`: holds only the links `.claude` and `.agents`, both to `../dotclaude_folder`. Start `claude` or `codex` in `playground/`.
  - `test_cases.json`: the test cases and their expected answers.
- The test cases never sit in `playground/` or in `dotclaude_folder/`, so a live agent never reads the expected answers.
- Each test skill has its own `dotclaude_folder/`, so the skills of one test never compete with the skills of another test.
- A skill folder name equals the `name` field of its `SKILL.md`, and uses lowercase letters, numbers, and hyphens only.

## Background
- `claude` reads `.claude/skills/`, and `codex` reads `.agents/skills/`, a path found in the codex-cli 0.154.0 program. Neither reads `skills/` directly, so `playground/` links to `dotclaude_folder/`.
- The Agent Skills specification, which Codex and other harnesses follow, accepts only lowercase letters, numbers, and hyphens in a skill name.
- A link at the root of the repository would make the Claude Code sessions that build this repository load the test skills too.
