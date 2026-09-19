# Directory Context: `/test_skills/simplified_technical_english_rewrite`

## Purpose
The Simplified Technical English rewrite test: it scores the body of the `simplified-technical-english-rewrite` skill by checking five rules on the rewrite of each paragraph: four by code, and one by a judge.

## Key Exports & Entry Points
- `dotagents_folder/skills/simplified-technical-english-rewrite/SKILL.md`: the target, whose body OPRO improves.
- `playground/`: start `claude` or `codex` here to see the skill live.
- `test_cases.json`: 20 paragraphs of technical text to rewrite.
- `src/`: the scoring script of the test — see its CONTEXT.md.
- `README.md`: the rules, how to run the test, and its results.

## Rules
- The body of `simplified-technical-english-rewrite` is weak on purpose and names no rule, and its description is good, because this test measures only the body.
- Each paragraph of `test_cases.json` is written for this test. It holds no secret, no personal data, and no text copied from another source.
- Each paragraph breaks several rules, so that the weak body starts with a low score.
- The OPRO loop scores a body on the 15 test cases whose `split` is `optimization`. The 5 test cases whose `split` is `final_check` score only the final body, and OPRO never sees them.

## Background
- Without the `meaning_kept` rule, a rewrite that drops the hard sentences would get a perfect score, and OPRO would learn to drop facts.
