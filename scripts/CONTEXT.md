# Directory Context: `/scripts`

## Purpose
The scripts of the repository that belong to no package: today, the one script that checks the move of the rules from code to data.

## Key Exports & Entry Points
- `compare_converted_rules.ts`: `pnpm run compare_converted_rules`. It reads every score file that the old code wrote, in `test_example_results/` and in `outputs/`, checks the rules of `opro_target.json` on the answers that those files hold, and compares each verdict with the verdict of the old code. It runs no harness and costs nothing.

## Rules
- A script here runs no harness and calls no model, so that it stays free to run.
- This folder disappears with the code that it checks, when milestone 6 of issue #4 deletes `test_skills/<name>/src/`.

## Background
- Milestone 1 of [issue #4](https://github.com/jeromeetienne/skillmd_opro/issues/4) asks for this check: the rules as data must give the same verdict as the code that they replace.
