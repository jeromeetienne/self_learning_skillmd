# Directory Context: `/opro_tools/src`

## Purpose
The generic tools that the OPRO optimizer skill runs with `npx`. Each tool does one step that an agent cannot do by itself: it builds a workspace, runs a harness, checks the rules, asks the judge, computes a score, measures the noise of the score, reads or replaces a part of a `SKILL.md` file, keeps the scored history, or writes the meta-prompt.

## Key Exports & Entry Points
- `cli.ts`: `OproToolsCli`, the command line `npx skillmd_opro_tools <tool name> ...`, with the tools `init-run`, `make-workspace`, `run-target-skill`, `score-version`, `measure-score-noise`, `read-skill-part`, `write-skill-part`, `record-version`, `build-meta-prompt`, `propose-version`, and `finish-run`. Each tool writes one JSON object on its standard output, and its progress on its standard error.
- `opro_target_file.ts`: `OproTargetFileReader` and the Zod schemas of `opro_target.json` and `test_cases.json`. The format is written in [opro_skill/skills/opro-optimizer/references/target_folder_format.md](../../opro_skill/skills/opro-optimizer/references/target_folder_format.md).
- `opro_workspace_folder.ts`, `opro_test_case_run.ts`, `opro_score_version.ts`, `opro_score_noise.ts`: the workspace of one test case, the run of one test case, the score of one group of test cases, and the noise of the score of one target skill.
- `opro_rules.ts`, `opro_judge.ts`, `opro_answer.ts`, `opro_skill_choice_run.ts`: the engine that checks the rules as data, the judge of the rubric file, the reading of an answer, and the run mode `skill_choice`.
- `opro_run_folder.ts`, `opro_run_record.ts`, `opro_meta_prompt.ts`, `opro_proposer.ts`: the folders of a run, the scored history in `opro_run.json`, the meta-prompt of OPRO, and the separate harness run that proposes a version.
- `harness_types.ts`, `harness_command.ts`, `harness_run.ts`, `git_command.ts`, `concurrency.ts`: the same files as in `test_skills/_shared/src/`. Milestone 6 of issue #4 deletes the copies there, and this folder keeps the only copy.

## Rules
- Nothing here holds code that is specific to one target skill. Everything specific to one target skill is data in the folder of that target skill.
- Nothing here imports from `opro/`, from `test_skills/`, or from any other folder of the repository. The package must work after it is published on its own.
- Nothing here runs the OPRO loop. The loop lives in the `SKILL.md` file of the OPRO optimizer skill, and the agent of the harness runs it. No tool decides how many rounds to run or which version to propose next.
- A workspace holds `opro_workspace.json` and a `project/` folder, the harness runs in `project/`, and the skills of the version go into `project/.claude/skills` and `project/.agents/skills`, which git excludes, so that the harness never reads its own record and never sees the skills in the staged changes.
- The judge and the proposer each run in an empty git repository with no skill: the judge never loads the skill that it judges, and the proposer reads the meta-prompt and nothing else, so the rules stay out of its reach.
- A target skill has one rubric file, so at most one rule has the kind `judge`. `score-version` refuses a target folder with more.
- `score-version` writes the whole score record into a file, and prints only the score, the counts, and the failures, so that the agent of the loop never holds the answer of every test case in its context.
- The noise of the score is measured, never guessed: `measure-score-noise` prints it, a person writes it in `score_noise_percent` of `opro_target.json`, and `init-run` prints it to the agent of the loop.
- `score-version` with `--stop-below-percent` stops as soon as the version cannot reach that score; its `score_percent` then holds the highest score that the version can still reach, with `stopped_early` set to `true`, so a partial score never looks like a full score.
- `propose-version` asks the proposer again when it repeats a version of the history, and tells it which version it repeated, because a repeated version costs a score run and adds nothing to the history.
- The tools count the harness runs: `score-version` counts one run for each test case and one for each judge, `propose-version` writes its attempts in `version_<n>/proposal.json`, `record-version` adds the runs of the score files that it did not count yet, and `finish-run` prints the total. No agent counts a harness run.

## Background
- The rules as data give the same verdict as the code that they replace: `pnpm run compare_converted_rules` checked 3842 rule checks with no mismatch. See [scripts/CONTEXT.md](../../scripts/CONTEXT.md).
- The command line of each harness, and the reason why each option is there, come from `test_skills/_shared/src/CONTEXT.md`.
- No agent counts a harness run because both agents of the trials of milestone 3 of [issue #4](https://github.com/jeromeetienne/skillmd_opro/issues/4) printed a wrong number.
- Milestone 0 of issue #4 proved that both harnesses can run these tools inside themselves. See [opro_skill/milestone_0/CONTEXT.md](../../opro_skill/milestone_0/CONTEXT.md).
