# Directory Context: `/opro_skill/example_results`

## Purpose
The results of the two trials of milestone 3 of [issue #4](https://github.com/jeromeetienne/skillmd_opro/issues/4), which prove that the OPRO optimizer skill runs the whole loop inside Codex and inside Claude Code, with no code that is specific to the target skill `commit-message`.

## Key Exports & Entry Points
- `milestone_3_codex_trial/`: the run folder of the trial with Codex, with `opro_run.json`, the folder of each version, the meta-prompt, `best_SKILL.md`, and `opro_report.md`.
- `milestone_3_claude_trial/`: the run folder of the trial with Claude Code. It holds no `opro_report.md`, because the agent answered that it wrote the file and wrote no file.
- `outer_codex_trial.jsonl`, `outer_claude_trial.jsonl`: the raw JSON Lines of the two outer harness runs, with every command that the agent ran.

## Rules
- A trial ran 3 test cases of the `optimization` group and 2 test cases of the `final_check` group, so its scores measure the loop, not the target skill. A score of 3 test cases carries much more noise than a score of 20.
- Read a claim of an agent in the raw JSON Lines, never in the report that the agent wrote.

## Background
- Both trials answered with a version that discovered the form of the commit message from the failures of the test cases, and neither version names a rule or holds a regular expression, so the proposer never saw `opro_target.json`.
