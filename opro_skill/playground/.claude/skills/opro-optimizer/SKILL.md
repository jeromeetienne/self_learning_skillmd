---
name: opro-optimizer
description: Improves the description field or the body of a SKILL.md file with OPRO, by scoring it on the test cases of its target folder, asking for new versions, and keeping the version with the best score. Use when the user asks to run OPRO on a skill, to optimize a SKILL.md file, or to improve a skill against its test cases.
---

# OPRO optimizer

You run the OPRO loop on one target skill: you score the first version of its `SKILL.md` file, ask for new versions, score them, keep the scored history, and report the version with the best score. Every step that needs code is a tool that you run with `npx skillmd_opro_tools <tool name> ...`. You write no code.

OPRO comes from the paper [Large Language Models as Optimizers](https://arxiv.org/abs/2309.03409). The loop keeps four ideas of the paper and of this repository:

1. **The scored history.** Every version and its score stay in `opro_run.json`.
2. **The meta-prompt.** The proposer sees the history from the lowest score to the highest score, and the failures of the best version.
3. **The `optimization` group.** It scores every version, and the proposer sees its failures.
4. **The `final_check` group.** It scores only the first version and the best version, and the proposer never sees it. It says whether the improvement is real or whether the loop learned the `optimization` group by heart.

## What the user message must give you

- **The target folder**: the folder that holds `opro_target.json` and `test_cases.json`. Its format is in `references/target_folder_format.md` of this skill.
- **The harness name**: `claude` or `codex`. The same harness runs the target skill, the judge, and the proposer, with its fixed model.
- **The run folder**: where you write every file. It must hold no run yet.
- **The number of rounds**, and **the number of versions for each round**. Use 3 rounds and 1 version for each round when the user gives no number.
- **The number of score runs for each version**: how many times each version is scored, and the scores are averaged. Use 1 when the user gives no number. The score has noise of 5 to 8 points, so a run that must separate two close versions needs 3.

Ask the user for the target folder, the harness name, and the run folder when the user message gives none of them. Never guess a path.

## The tools

Run each tool from any folder of the repository. Each tool writes one JSON object on its standard output, and its progress on its standard error. Read the JSON object, and never guess what a tool did.

| Tool | What it does |
|---|---|
| `init-run --run-folder <path> --target-folder <path> --harness <name>` | Starts the run: writes `version_000/skills/` with the first version, and `opro_run.json`. It prints the name of the target skill, the part that the loop improves, the number of test cases of each group, and the names of the rules. |
| `score-version --harness <name> --target-folder <path> --skills-folder <path> --split <optimization\|final_check> --output-file <path> [--concurrency <count>] [--test-case-ids <id...>]` | Runs every test case of one group on one version, checks every rule, asks the judge when a rule needs one, writes the whole score record into the output file, and prints the score, the count of each rule, and the failures. |
| `record-version --run-folder <path> --target-folder <path> --harness <name> --version-number <n> --round-number <r> [--skills-folder <path>] [--score-file <path...>] [--final-check-score-file <path>] [--error-message <text>]` | Adds one version and its scores to `opro_run.json`, chooses the best version, counts the harness runs of the version, and prints every version with its score. |
| `propose-version --run-folder <path> --harness <name>` | Asks a separate harness run for a new version, from the meta-prompt of the scored history, and writes `version_<n>/skills/` with that new version. It prints the number of the new version, its folder, and `same_as_version_number` when the text is the same as an earlier version. |
| `finish-run --run-folder <path>` | Copies the `SKILL.md` file of the best version to `best_SKILL.md`, and prints the summary of the run. |

The tool `build-meta-prompt --run-folder <path>` writes the meta-prompt without running a proposer. Use it only when the user asks to see the meta-prompt.

## The loop

1. Run `init-run`. Read the number of test cases of each group, and tell the user how many harness runs the whole loop will cost: for each version, the number of test cases of the `optimization` group multiplied by the number of score runs, plus one run for each test case when the target skill has a judge, plus one run for the proposer.
2. Score version 0, as many times as the number of score runs, each time into its own file:
   `score-version ... --split optimization --skills-folder <run folder>/version_000/skills --output-file <run folder>/version_000/optimization_score_1.json`
3. Record version 0: `record-version ... --version-number 0 --round-number 0 --skills-folder <run folder>/version_000/skills --score-file <every score file of version 0>`.
4. For each round, and for each version of that round:
   - Run `propose-version`. When it prints an `error_message`, run `record-version` with the version number that it printed and `--error-message <that message>`, and go on with the next version.
   - When it prints `same_as_version_number`, the proposer wrote a version that the history already holds. Do not score it. Run `record-version` with `--error-message "the proposer wrote the same version as version <number>"`, and go on.
   - Score the new version on the `optimization` group, as many times as the number of score runs, into `<run folder>/version_<n>/optimization_score_<number>.json`.
   - Record the new version with its score files, its skills folder, and the round number.
5. When every round is done, score the `final_check` group one time for version 0, and one time for the best version, into `<run folder>/version_<n>/final_check_score.json`. Record each one with `--final-check-score-file`. When the best version is version 0, score it one time only.
6. Run `finish-run`.
7. Write the report into the file `<run folder>/opro_report.md`, with the Write tool, before you answer the user. The report holds the score of each version on the `optimization` group, the two scores on the `final_check` group, the number of the best version, the path of `best_SKILL.md`, and the number of harness runs that `finish-run` printed. Never count the harness runs yourself. Say in one sentence what the best version changed, and tell the user to copy `best_SKILL.md` over the `SKILL.md` file of the target skill when the user wants to keep it.
8. Answer the user with the same report, and with the path of `opro_report.md`.

## Rules

- **Never read the rules of the target skill.** `opro_target.json` holds them, so never open that file, and never open the files of `test_cases.json`, of a score file, or of `src/` to find out what a rule checks. The loop measures whether a `SKILL.md` file can discover the rules from the failures of the test cases. When you write the rules into a version yourself, the score measures nothing. The tools give you every value that you need.
- **Never write a version yourself.** Every new version comes from `propose-version`, which asks a separate harness run. You are not the proposer, for three reasons: the separate run reads the meta-prompt in a folder with no skill, so the target skill and its rules never influence the proposal; your context holds the loop, and a run of several rounds does not fit in one context; and a version that you write from the failures that you already read cannot be told apart from a version that you wrote from the rules. You decide how many rounds and how many versions to run, and nothing else.
- **Never change a file of the user outside the run folder.** Each version is a copy in the run folder. The `SKILL.md` file of the target folder never changes. Only the user copies `best_SKILL.md` over it.
- **Never score the `final_check` group before the last step**, and never show a failure of the `final_check` group to a proposer. `propose-version` never sees it, so do not paste it into a message.
- **Run one tool at a time.** One score of 20 test cases takes several minutes, and a run of the harness inside the harness can fail at the start. When a tool fails before its turn ends, run the same command a second time, and only then report the failure: milestone 0 of issue #4 saw one nested start of seven fail, and the same command pass right after.
- **Keep the whole answer of a test case out of your context.** Read the score, the count of each rule, and the failures that `score-version` prints. Open a score file only when the user asks for one answer.
- **Stop and tell the user** when two rounds in a row give no version with a score above the best score, or when the user set a number of harness runs and the loop reached it. Do not start a new round on your own after that.

## A cheap trial before a full run

A full run costs many harness runs. When the user asks for a trial, or when the target folder is new, run one round with `--test-case-ids <three names>` on the `optimization` group, and say in the report that the scores of a trial say nothing about the real score, because three test cases have much more noise than twenty.

## Reference files

- `references/target_folder_format.md`: the data files and the text files of a target folder, the kinds of check of a rule, and the two groups of test cases. Read it when the user asks how to write a new target folder, or when a tool refuses a target folder.
