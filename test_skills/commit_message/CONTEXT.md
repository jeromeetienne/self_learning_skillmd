# Directory Context: `/test_skills/commit_message`

## Purpose
The commit message test: it scores the body of the `commit-message` skill by checking six rules, with code, on the commit message that a harness writes for the staged changes of each test case.

## Key Exports & Entry Points
- `dotagents_folder/skills/commit-message/SKILL.md`: the target, whose body OPRO improves.
- `base_project/`: the files of the small project `todo-cli`, before the change of a test case.
- `playground/`: start `claude` or `codex` here to see the skill live.
- `test_cases.json`: 20 changes to stage, each with its branch, its user message, its issue number, and whether the change is a fix.
- `src/`: the scoring script of the test — see its CONTEXT.md.
- `README.md`: the rules, how to run the test, and its results.

## Rules
- The body of `commit-message` is weak on purpose and names no rule, and its description is good, because this test measures only the body.
- The `user_message` of a test case never names a rule. It gives only the facts, and some test cases give the issue only in `branch_name`.
- Most rules are house rules that a model cannot guess, so that the weak body starts with a low score and OPRO has room to improve it.
- Each `old_text` of `file_changes` occurs exactly once in its file of `base_project/`, after the changes before it in the same test case.
- The code of `base_project/` is never type checked, and a change may leave a bug in it, because the test reads only the commit message.
- The OPRO loop scores a body on the 15 test cases whose `split` is `optimization`. The 5 test cases whose `split` is `final_check` score only the final body, and OPRO never sees them.

## Background
- The one commit of `base_project/` has a message with no style, so that a harness cannot copy the rules from the git log.
