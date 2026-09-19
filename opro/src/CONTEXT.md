# Directory Context: `/opro/src`

## Purpose
The OPRO loop: it improves one part of the `SKILL.md` file of the target skill of one test skill, by asking a harness for new versions and scoring each version with the test.

## Key Exports & Entry Points
- `opro_loop.ts`: `OproLoop.run`, the loop: score the first version, then in each round propose versions, score them, and add them to the history, then score the first version and the best version on `final_check`.
- `opro_proposer.ts`: `OproProposer`, which builds the meta-prompt and reads the new version from the answer of the harness.
- `opro_targets.ts`: `OproTargets.get`, which describes each test skill: the target skill, the improved part, the explanation of the test for the proposer, and the score function.
- `opro_skill_file.ts`: `OproSkillFile`, which reads and replaces the `description` field or the body of a `SKILL.md` file.
- `run_opro.ts`: the command. From the root of the repository: `pnpm run run_opro --test-skill <skill_choice|commit_message|simplified_technical_english_rewrite> --harness <claude|codex> [--rounds <count>] [--versions-per-round <count>] [--score-runs <count>] [--concurrency <count>]`. It writes each run folder into `outputs/opro/`, which git ignores.

## Rules
- This folder imports the score of each test skill, and a test skill never imports from this folder.
- The loop never changes the skills of the repository. Each version is a copy of the skills folder of the test in `outputs/opro/<run>/version_<number>/skills/`, and the best version is copied to `best_SKILL.md`. A person copies it into the repository.
- The proposer sees only the `optimization` split: the scores and the failures. The `final_check` split scores only the first version and the best version.
- The proposer is the same harness with the same fixed model as the score, and runs in a folder with no skill.
- The skill choice test improves the `description` field. The two other tests improve the body.
- The best version has the highest average score on the `optimization` split. On a tie, the earlier version wins.
- `opro_run.json` is written after each version, so that a run that stops early keeps every version scored so far.

## Background
- OPRO comes from the paper [Large Language Models as Optimizers](https://arxiv.org/abs/2309.03409). The meta-prompt shows the versions from the lowest score to the highest score, as in the paper.
- The answer of the proposer is marked with `<new_version>` tags, because a body can hold its own fenced code blocks.
