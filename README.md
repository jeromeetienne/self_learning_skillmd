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

## OPRO results

| Test skill | Best OPRO run: `final_check`, first version to best version | Details |
|---|---|---|
| Skill choice | no run yet | |
| Commit message | 50 percent to 100 percent | [OPRO runs](test_skills/commit_message/README.md#opro-runs) |
| Simplified Technical English rewrite | 68 percent to 88 percent, with 3 score runs for each version | [OPRO runs](test_skills/simplified_technical_english_rewrite/README.md#opro-runs) |

In each run, OPRO found its big improvement in round 1. Later rounds did not beat it by more than the noise of the score.

## Layout

- `opro/`: the OPRO loop, which improves the target skill of one test skill. See [opro/src/CONTEXT.md](opro/src/CONTEXT.md).
- `opro_skill/`: the OPRO optimizer skill, the `SKILL.md` file that runs the OPRO loop inside the harness. See its [CONTEXT.md](opro_skill/CONTEXT.md).
- `opro_tools/`: the npm package `skillmd_opro_tools`, the generic tools that the OPRO optimizer skill runs with `npx`. See its [CONTEXT.md](opro_tools/CONTEXT.md).
- `test_example_results/`: a copy of the run folders of the OPRO runs of the "OPRO results" section, with every version and every score file.
- `test_skills/`: one folder for each test skill, with its skills, its test cases, and a `playground/` folder where you start `claude` or `codex`. See its [CONTEXT.md](test_skills/CONTEXT.md).

## Commands

- `pnpm install`: installs the packages.
- `pnpm run score_the_skill_choice --harness <claude|codex>`: scores the skill choice test. See [test_skills/skill_choice/src/CONTEXT.md](test_skills/skill_choice/src/CONTEXT.md).
- `pnpm run score_the_commit_message --harness <claude|codex>`: scores the commit message test. See [test_skills/commit_message/src/CONTEXT.md](test_skills/commit_message/src/CONTEXT.md).
- `pnpm run score_the_simplified_technical_english_rewrite --harness <claude|codex>`: scores the Simplified Technical English rewrite test. See [test_skills/simplified_technical_english_rewrite/src/CONTEXT.md](test_skills/simplified_technical_english_rewrite/src/CONTEXT.md).
- `pnpm run run_opro --test-skill <test skill name> --harness <claude|codex>`: runs the OPRO loop on one test skill. See [opro/src/CONTEXT.md](opro/src/CONTEXT.md).
- `npx skillmd_opro_tools <tool name> ...`: runs one generic tool of the OPRO optimizer skill. See [opro_tools/src/CONTEXT.md](opro_tools/src/CONTEXT.md).
- `pnpm run copy_opro_results_to_test_example_results`: copies every run folder of `outputs/opro/` into `test_example_results/`, so that git keeps them.
- `pnpm run typecheck`: checks the types.

## Rules

- Session files hold secrets and personal data. Never commit a session file to this repository.
