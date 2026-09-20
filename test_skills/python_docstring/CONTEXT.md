# Directory Context: `/test_skills/python_docstring`

## Purpose
The Python docstring test: it scores the body of the `python-docstring` skill by checking eight rules on the docstring that the skill writes for one Python function. This folder holds data files and text files only, and no code.

## Key Exports & Entry Points
- `dotagents_folder/skills/python-docstring/SKILL.md`: the target, whose body OPRO improves.
- `playground/`: start `claude` or `codex` here to see the skill live.
- `opro_target.json`, `test_cases.json`, `test_explanation.md`: the data files and the text file that the OPRO optimizer skill reads. Their format is in [opro_skill/skills/opro-optimizer/references/target_folder_format.md](../../opro_skill/skills/opro-optimizer/references/target_folder_format.md).
- Command to run the OPRO loop on this folder: start `claude` or `codex` in `opro_skill/playground/` and ask for the `opro-optimizer` skill with this folder as the target folder.

## Rules
- This folder holds no `src/` folder and no scoring script. Every check of every rule is data in `opro_target.json`, which is the point of this test skill: it proves that a person who writes only the data files can add a target skill.
- The body of `python-docstring` is weak on purpose and names no rule, and its description is good, because this test measures only the body.
- Each function of `test_cases.json` is written for this test. It holds no secret, no personal data, and no code copied from another source.
- Six of the twenty functions return no value, and six raise an error, so that the rules `returns_section` and `raises_section` each have test cases on both sides of their condition.
- A regular expression of a rule uses the field `flags` for `m` or `i`, never an inline group such as `(?m)`, which the engine refuses.

## Background
- The rules `returns_section` and `raises_section` read the fields `has_return` and `raises_error` of the test case with a `when` condition, and `first_parameter_named` reads `{{first_parameter}}`, so this folder tests the two parts of the data format that the three older target folders use the least.
- The fourth target skill comes from milestone 5 of [issue #4](https://github.com/jeromeetienne/skillmd_opro/issues/4).
