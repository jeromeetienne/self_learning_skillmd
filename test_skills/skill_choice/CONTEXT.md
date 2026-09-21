# Directory Context: `/test_skills/skill_choice`

## Purpose
The skill choice test: it scores the `description` field of `release-notes` by checking which skill a model chooses for each user message.

## Key Exports & Entry Points
- `dotagents_folder/skills/release-notes/SKILL.md`: the target, whose description OPRO improves.
- `dotagents_folder/skills/`: also holds the four neighbor skills: `changelog-entry`, `pull-request-description`, `announcement-post`, and `migration-guide`.
- `playground/`: start `claude` or `codex` here to see the choice live.
- `test_cases.json`: 40 user messages, each with the skill that a model must choose: 16 for `release-notes`, 4 for each neighbor, and 8 for no skill.
- `README.md`: what the test measures, how to run it, and its results.

## Rules
- The description of `release-notes` is weak on purpose, and its body is good, because this test measures only the description.
- The descriptions of the four neighbor skills never change during a test.
- An `expected_skill_name` of `null` means that the model must choose no skill.
- The OPRO loop scores a description on the 30 test cases whose `split` is `optimization`. The 10 test cases whose `split` is `final_check` score only the final description, and OPRO never sees them.
- A test case has only one correct answer that a person agrees with. A message that a person could put under two skills is not a test case.

## Background
- Without neighbors, a vague description that takes every message would get a perfect score, and OPRO would learn to write vague descriptions.
