# Directory Context: `/test_skills`

## Purpose
Holds one folder for each test skill: the skills that OPRO improves, the test cases that score them, and a folder where a person starts `claude` or `codex` to see them live.

## Key Exports & Entry Points
- `skill_choice/`: the skill choice test, which scores the `description` field of `release-notes` — see its CONTEXT.md.
- `commit_message/`: the commit message test, which scores the body of `commit-message` with six rules — see its CONTEXT.md.
- `python_docstring/`: the Python docstring test, which scores the body of `python-docstring` with eight rules, and which a person wrote from the data files alone — see its CONTEXT.md.
- `simplified_technical_english_rewrite/`: the Simplified Technical English rewrite test, which scores the body of `simplified-technical-english-rewrite` with four rules and one rule checked by a judge — see its CONTEXT.md.

## Rules
- Each test skill folder holds the same parts, and can hold more, such as `base_project/`:
  - `dotagents_folder/skills/<skill-name>/SKILL.md`: the skills of the test.
  - `playground/`: holds only the links `.claude` and `.agents`, both to `../dotagents_folder`. A person starts `claude` or `codex` in `playground/` to watch the skills live.
  - `test_cases.json`: the test cases and their expected answers.
  - `opro_target.json`, `test_explanation.md`, and, for a test skill with a judge, `judge_rubric.md`: the data files that the tools of `opro_tools/` read. Their format is in [opro_skill/skills/opro-optimizer/references/target_folder_format.md](../opro_skill/skills/opro-optimizer/references/target_folder_format.md).
- A test skill folder holds no code. Every check of every rule, and the recipe of the workspace, are data that the generic tools of [opro_tools/](../opro_tools/CONTEXT.md) read.
- `score-version` never runs a harness inside this repository. It copies the skills into a temporary folder outside the repository, which is a small git repository of its own, and runs the harness there, because an agent in `playground/` reads `../test_cases.json`.
- Codex runs only `gpt-5.6-luna`, and Claude Code runs only `claude-sonnet-5`. The tools always pass the model, and no option changes it.
- The field `score_noise_percent` of `opro_target.json` holds a number that `measure-score-noise` measured on the first version of the skills of that folder, never a guessed number. A folder whose number is missing makes the OPRO loop use 8 percent and say so.
- Each test skill has its own `dotagents_folder/`, so the skills of one test never compete with the skills of another test.
- A skill folder name equals the `name` field of its `SKILL.md`, and uses lowercase letters, numbers, and hyphens only.

## Background
- `claude` reads `.claude/skills/`, and `codex` reads `.agents/skills/`, a path found in the codex-cli 0.154.0 program. Neither reads `skills/` directly, so `playground/` links to `dotagents_folder/`.
- The Agent Skills specification, which Codex and other harnesses follow, accepts only lowercase letters, numbers, and hyphens in a skill name.
- A link at the root of the repository would make the Claude Code sessions that build this repository load the test skills too.
