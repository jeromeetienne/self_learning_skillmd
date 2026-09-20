# Directory Context: `/opro_tools/src`

## Purpose
The generic tools that the OPRO optimizer skill runs with `npx`. Each tool does one step that an agent cannot do by itself: it builds the workspace of one test case, or it runs a harness on that workspace until the end of its turn.

## Key Exports & Entry Points
- `cli.ts`: `OproToolsCli`, the command line `npx skillmd_opro_tools <tool name> ...`. The two tools of milestone 0 are `make-workspace` and `run-target-skill`. Each tool writes one JSON object on its standard output.
- `opro_target_file.ts`: `OproTargetFileReader` and the Zod schemas of `opro_target.json` and `test_cases.json`, the two data files that a person writes for a new target skill.
- `opro_workspace_folder.ts`: `OproWorkspaceFolder.make`, which builds the workspace of one test case from the recipe of `opro_target.json`, and `OproWorkspaceFolder.readRecord`.
- `opro_target_skill_run.ts`: `OproTargetSkillRun.run`, which runs one harness on the test case of one workspace.
- `harness_types.ts`, `harness_command.ts`, `harness_run.ts`, `git_command.ts`: the same files as in `test_skills/_shared/src/`. Milestone 6 of issue #4 deletes the copies in `test_skills/_shared/src/`, and this folder keeps the only copy.

## Rules
- Nothing here holds code that is specific to one target skill. Everything that is specific to one target skill is data in `opro_target.json` and in `test_cases.json`.
- Nothing here imports from `opro/`, from `test_skills/`, or from any other folder of the repository. The package must work after it is published on its own.
- Nothing here runs the OPRO loop. The loop lives in the `SKILL.md` file of the OPRO optimizer skill, and the agent of the harness runs it.
- A workspace holds `opro_workspace.json` and a `project/` folder, and the harness runs in `project/`, so that the harness never reads the record of its own test case.
- The skills of the version under test go into `project/.claude/skills` and `project/.agents/skills`, and both folders are excluded from git, so that they never appear in the staged changes.

## Background
- The package is named `skillmd_opro_tools` until issue #3 finds a better name for the project.
- The command line of each harness, and the reason why each option is there, come from `test_skills/_shared/src/CONTEXT.md`.
- Milestone 0 of issue #4 proved that both harnesses can run these tools inside themselves. See [opro_skill/milestone_0/CONTEXT.md](../../opro_skill/milestone_0/CONTEXT.md).
