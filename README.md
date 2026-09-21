# skillmd_opro

A prototype that improves SKILL.md files with OPRO (Optimization by Prompting), to learn how well a self-improving agent can work.

## Goal

- Learn how OPRO works on a SKILL.md file, the format that Claude Code, Codex, and other AI coding agents read.
- Measure how efficient OPRO is: the best score and the cost after each round.
- Keep the tool generic, so that a person can say "apply OPRO to this skill" for any SKILL.md that has test cases and a score.

## How OPRO works

1. Keep a history of the versions of a SKILL.md, each with its score.
2. Show the history, sorted by score, to a model, and ask the model for a new version that gets a higher score.
3. Run the new version on the test cases, and score it.
4. Add the new version and its score to the history.
5. Repeat for a fixed number of rounds, and keep the version with the best score.

OPRO comes from the paper [Large Language Models as Optimizers](https://arxiv.org/abs/2309.03409) (Chengrun Yang and others, 2023).

## Where the test cases come from

The past sessions of Claude Code and Codex show the points of friction. Each point of friction is connected to the skill that caused it, or to a skill that was not used. Each point of friction then becomes a test case: the user message and a check.

## Test skills

Each test skill starts weak on purpose, so that OPRO has room to improve it.

1. **Skill choice.** Tests the `description` field. The target is `release-notes`, among four neighbor skills. The score is the percentage of user messages for which the model chooses the correct skill.
2. **Commit message.** Tests the body of a SKILL.md that has rules. The target is `commit-message`. Code checks six rules on the commit message that the harness writes for 20 staged changes.
3. **Simplified Technical English rewrite.** Tests a style skill. The target is `simplified-technical-english-rewrite`. Code checks four rules on the rewrite of 20 paragraphs, such as the length of the sentences and the abbreviations, and a judge checks that the meaning did not change.
4. **Python docstring.** Tests the body of a skill that writes the docstring of a Python function. The target is `python-docstring`. A person wrote this test skill with data files only, and no code of this repository is specific to it.

Each test skill is a target folder: data files and text files only, which the generic tools read. The format is in [target_folder_format.md](opro_skill/skills/opro-optimizer/references/target_folder_format.md).

## OPRO results

The runs of the OPRO optimizer skill, in Codex with `gpt-5.6-luna`, from milestone 5 of [issue #4](https://github.com/jeromeetienne/skillmd_opro/issues/4#issuecomment-5759795431):

| Test skill | `final_check`, first version to best version | Harness runs |
|---|---|---|
| Skill choice | 100 percent, no improvement: the first version already scored 100 percent | 83 |
| Commit message | 50 percent to 100 percent | 204 |
| Simplified Technical English rewrite | 80 percent to 88 percent | 263 |
| Python docstring | 62.5 percent to 100 percent | 149 |

In each run, OPRO found its big improvement in the first rounds. Later rounds did not beat it by more than the noise of the score. The runs of the old TypeScript loop are in the "OPRO runs" section of the `README.md` file of each test skill.

## Layout

- `opro_skill/`: the OPRO optimizer skill, the `SKILL.md` file that runs the OPRO loop inside the harness. See its [CONTEXT.md](opro_skill/CONTEXT.md).
- `opro_tools/`: the npm package `skillmd_opro_tools`, the generic tools that the OPRO optimizer skill runs with `npx`. See its [CONTEXT.md](opro_tools/CONTEXT.md).
- `test_example_results/`: the run folders of the runs of the old TypeScript loop, which milestone 6 of issue #4 deleted, with every version and every score file.
- `test_skills/`: one folder for each test skill, with its skills, its test cases, and a `playground/` folder where you start `claude` or `codex`. See its [CONTEXT.md](test_skills/CONTEXT.md).

## Commands

- `pnpm install`: installs the packages.
- `npx skillmd_opro_tools score-version --harness <claude|codex> --target-folder test_skills/<test skill name> --skills-folder test_skills/<test skill name>/dotagents_folder/skills --split optimization --output-file <path>`: scores one test skill. See [opro_tools/src/CONTEXT.md](opro_tools/src/CONTEXT.md).
- To run the OPRO loop, start `claude` or `codex` in `opro_skill/playground/`, and ask it to run the `opro-optimizer` skill. See [opro_skill/playground/CONTEXT.md](opro_skill/playground/CONTEXT.md).
- `pnpm run typecheck`: checks the types.

## Rules

- Session files hold secrets and personal data. Never commit a session file to this repository.
