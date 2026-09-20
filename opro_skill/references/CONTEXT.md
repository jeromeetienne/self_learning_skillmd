# Directory Context: `/opro_skill/references`

## Purpose
The reference files that the `SKILL.md` file of the OPRO optimizer skill links, so that the `SKILL.md` file stays short and an agent reads a reference file only when it needs it.

## Key Exports & Entry Points
- `target_folder_format.md`: the data files and the text files that a person writes for a new target skill: `opro_target.json`, `test_cases.json`, `test_explanation.md`, and `judge_rubric.md`.

## Rules
- A reference file describes the data, never the code of `opro_tools/`. When a tool changes its options, the `SKILL.md` file changes, not a reference file.
- A reference file never holds the rules of a target skill, because the proposer must discover them from the failures.

## Background
- The format comes from milestone 1 of [issue #4](https://github.com/jeromeetienne/skillmd_opro/issues/4), which asks that a person writes data and text for a new target skill, and never code.
