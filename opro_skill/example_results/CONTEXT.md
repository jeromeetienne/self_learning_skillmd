# Directory Context: `/opro_skill/example_results`

## Purpose
The results of the trials of milestone 3 and milestone 4 of [issue #4](https://github.com/jeromeetienne/skillmd_opro/issues/4), which prove that the OPRO optimizer skill runs the whole loop inside Codex and inside Claude Code, with no code that is specific to the target skill `commit-message`.

## Key Exports & Entry Points
- `milestone_3_codex_trial/`: the run folder of the trial with Codex, with `opro_run.json`, the folder of each version, the meta-prompt, `best_SKILL.md`, and `opro_report.md`.
- `milestone_3_claude_trial/`: the run folder of the trial with Claude Code. It holds no `opro_report.md`, because the agent answered that it wrote the file and wrote no file.
- `milestone_4_codex_trial/`: the run folder of the trial of the cost rules, with two rounds. The agent scored version 1 one time, because its score was far above the best version, and scored version 2 two times, because its first score equalled the score of version 1.
- `outer_codex_trial.jsonl`, `outer_claude_trial.jsonl`, `outer_codex_trial_milestone_4.jsonl`: the raw JSON Lines of the outer harness runs, with every command that the agent ran.

## Rules
- A trial ran 3 test cases of the `optimization` group and 2 test cases of the `final_check` group, so its scores measure the loop, not the target skill. A score of 3 test cases carries much more noise than a score of 20.
- Read a claim of an agent in the raw JSON Lines, never in the report that the agent wrote.
- The trial of milestone 4 costs 18 harness runs. The same trial before the cost rules, with one score run of every version, cost 24.

## Background
- Both trials answered with a version that discovered the form of the commit message from the failures of the test cases, and neither version names a rule or holds a regular expression, so the proposer never saw `opro_target.json`.
