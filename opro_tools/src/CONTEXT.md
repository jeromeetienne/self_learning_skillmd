# Directory Context: `/opro_tools/src`

## Purpose
The generic tools that the OPRO optimizer skill runs with `npx`. Each tool does one step that an agent cannot do by itself: it builds a workspace, runs a harness, checks the rules, asks the judge, computes a score, reads or replaces a part of a `SKILL.md` file, keeps the scored history, or writes the meta-prompt.

## Key Exports & Entry Points
- `cli.ts`: `OproToolsCli`, the command line `npx skillmd_opro_tools <tool name> ...`, with the tools `make-workspace`, `run-target-skill`, `score-version`, `read-skill-part`, `write-skill-part`, `record-version`, and `build-meta-prompt`. Each tool writes one JSON object on its standard output, and its progress on its standard error.
- `opro_target_file.ts`: `OproTargetFileReader` and the Zod schemas of `opro_target.json` and `test_cases.json`. The format is written in [opro_skill/references/target_folder_format.md](../../opro_skill/references/target_folder_format.md).
- `opro_workspace_folder.ts`: `OproWorkspaceFolder.make`, which builds the workspace of one test case from the recipe: the copied folder, the commits, the file changes, and the skills of the version.
- `opro_test_case_run.ts`: `OproTestCaseRun.run`, which runs one test case from end to end, and `opro_score_version.ts`: `OproScoreVersion.score`, which runs a whole group of test cases and counts the rule checks that pass.
- `opro_rules.ts`: `OproRules`, the engine that checks the rules as data, and `opro_judge.ts`: `OproJudge.judge`, which asks a second run of the same harness the question of the rubric file.
- `opro_skill_choice_run.ts`: `OproSkillChoiceRun.chooseSkill`, the run mode `skill_choice`, which stops the harness as soon as it names a skill of the skills folder.
- `opro_run_record.ts`: `OproRunRecord`, the scored history of one run in `opro_run.json`, and `opro_meta_prompt.ts`: `OproMetaPrompt.build`, the meta-prompt of OPRO.
- `harness_types.ts`, `harness_command.ts`, `harness_run.ts`, `git_command.ts`, `concurrency.ts`: the same files as in `test_skills/_shared/src/`. Milestone 6 of issue #4 deletes the copies in `test_skills/_shared/src/`, and this folder keeps the only copy.

## Rules
- Nothing here holds code that is specific to one target skill. Everything that is specific to one target skill is data in the folder of that target skill.
- Nothing here imports from `opro/`, from `test_skills/`, or from any other folder of the repository. The package must work after it is published on its own.
- Nothing here runs the OPRO loop. The loop lives in the `SKILL.md` file of the OPRO optimizer skill, and the agent of the harness runs it. No tool decides how many rounds to run or which version to propose next.
- A workspace holds `opro_workspace.json` and a `project/` folder, and the harness runs in `project/`, so that the harness never reads the record of its own test case.
- The skills of the version under test go into `project/.claude/skills` and `project/.agents/skills`, and both folders are excluded from git, so that they never appear in the staged changes and never appear in the history that the harness reads.
- The judge runs in an empty git repository with no skill, so that it never loads the skill that it judges.
- A target skill has one rubric file, so at most one rule has the kind `judge`. `score-version` refuses a target folder with more.
- `score-version` writes the whole score record into a file, and prints only the score, the counts, and the failures, so that the agent that runs the loop never holds the answer of every test case in its context.

## Background
- The rules as data give the same verdict as the code that they replace: `pnpm run compare_converted_rules` checked 3842 rule checks of the stored score files, with no mismatch. See [scripts/CONTEXT.md](../../scripts/CONTEXT.md).
- The command line of each harness, and the reason why each option is there, come from `test_skills/_shared/src/CONTEXT.md`.
- Milestone 0 of issue #4 proved that both harnesses can run these tools inside themselves. See [opro_skill/milestone_0/CONTEXT.md](../../opro_skill/milestone_0/CONTEXT.md).
