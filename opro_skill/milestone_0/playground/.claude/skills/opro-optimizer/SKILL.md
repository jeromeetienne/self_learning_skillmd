---
name: opro-optimizer
description: Improves the SKILL.md file of a target skill with OPRO, by running the target skill on its test cases and writing a new version of it. Use when the user asks to run OPRO on a target skill, or to improve a SKILL.md file with OPRO.
---

# OPRO optimizer

This is the smallest version of the OPRO optimizer skill, for milestone 0 of issue #4. It runs one round with one new version, on two test cases, to prove that a harness can run the OPRO loop inside itself. It computes no score, and it checks no rule of the target skill. The next milestones add the score, the rules, the history, and the meta-prompt.

The user message gives three values:

- the target folder, which holds `opro_target.json` and `test_cases.json`
- the harness name, `claude` or `codex`, which runs the target skill on each test case
- the run folder, where you write every file

## Tools

Run every tool with `npx skillmd_opro_tools <tool name> ...`, from any folder of the repository. Each tool writes one JSON object on its standard output. Read that JSON object, and do not guess what a tool did.

- `npx skillmd_opro_tools make-workspace --target-folder <target folder> --skills-folder <skills folder of the version> --test-case-id <test case id>` builds the folder where the harness runs one test case. It prints `workspace_folder_path` and `user_message`.
- `npx skillmd_opro_tools run-target-skill --harness <harness name> --workspace-folder <workspace folder path>` runs the harness on that test case until the end of its turn. It prints `final_text`, which is the answer of the harness, `is_skill_loaded`, and `error_message`. One run takes up to five minutes. Run one test case at a time.

## Steps

1. Read `<target folder>/opro_target.json`. It gives `target_skill_name`, `skill_part_name`, and `skills_folder_path`, which is relative to the target folder.
2. Copy `<target folder>/<skills_folder_path>` to `<run folder>/version_000/skills`. This is the first version of the target skill.
3. Score nothing, but collect the answers of the first version. For each of the two test cases `fix_issue_01` and `fix_issue_02`:
   - run `make-workspace` with `--skills-folder <run folder>/version_000/skills`
   - run `run-target-skill` with the `workspace_folder_path` that `make-workspace` printed
   - write the `final_text` into `<run folder>/version_000/answer_<test case id>.txt`
   - remove the workspace folder
4. Copy `<run folder>/version_000/skills` to `<run folder>/version_001/skills`. Then write a new body of `<run folder>/version_001/skills/<target skill name>/SKILL.md`, which must make a harness write a better commit message than the answers of step 3. Keep the frontmatter of the file, between the two `---` lines, exactly as it is. Change only the body, which is everything after the frontmatter.
5. Repeat step 3 for `<run folder>/version_001/skills`, and write the answers into `<run folder>/version_001/answer_<test case id>.txt`.
6. Write `<run folder>/milestone_0_report.md`, with:
   - the body of version 000 and the body of version 001
   - the two answers of version 000 and the two answers of version 001
   - the `error_message` of every `run-target-skill`, and whether every tool ran without an error
   - what you changed in the body, and why

## Rules

- Never change a file of the repository of the user. Write only inside the run folder, and inside the workspace folders that `make-workspace` builds.
- Never write the answer of a test case yourself. The answer comes from `run-target-skill`, and from nothing else.
- Keep the frontmatter of the `SKILL.md` file of the target skill exactly as it is. The OPRO loop improves one part, and for the commit message target skill that part is the body.
