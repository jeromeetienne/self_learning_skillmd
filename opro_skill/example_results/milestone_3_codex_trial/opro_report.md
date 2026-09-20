# OPRO trial report

- Target skill: `commit-message`
- Harness: `codex`
- Best version: version 1
- Best skill: `best_SKILL.md`
- Observable harness runs: 11 direct invocations (10 scored test cases and 1 proposer run)

Optimization group, using `fix_issue_01`, `fix_issue_02`, and `no_issue_01`:

- Version 0: 61.1%
- Version 1: 88.9%

Final-check group, using `fix_issue_05` and `no_issue_07`:

- Version 0: 50.0%
- Version 1: 83.3%

Version 1 improved the commit-message body instructions by adding the formatting requirements revealed by the optimization failures, including the required explanation line and issue-closing format.

This was a cheap trial, so these scores say nothing about the real score: three optimization cases and two final-check cases have much more noise than the complete groups.

Copy `best_SKILL.md` over the target skill's `SKILL.md` only when you want to keep the proposed change.
