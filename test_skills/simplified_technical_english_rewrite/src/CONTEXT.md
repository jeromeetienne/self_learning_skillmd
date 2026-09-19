# Directory Context: `/test_skills/simplified_technical_english_rewrite/src`

## Purpose
The scoring script of the Simplified Technical English rewrite test: for each test case, it runs a harness until the end of its turn to rewrite the paragraph, checks four rules with code, and asks a second run of the same harness whether the rewrite keeps the meaning.

## Key Exports & Entry Points
- `simplified_technical_english_rewrite_score.ts`: `SimplifiedTechnicalEnglishRewriteScore`, which scores the skills of one folder, so that OPRO can score a folder that holds a new body.
- `simplified_technical_english_rewrite_rules.ts`: `SimplifiedTechnicalEnglishRewriteRules`, which reads the rewrite from an answer and checks each rule of `RULE_NAMES`.
- `simplified_technical_english_rewrite_meaning_judge.ts`: `SimplifiedTechnicalEnglishRewriteMeaningJudge`, which asks the judge whether the rewrite keeps the meaning.
- `simplified_technical_english_rewrite_working_folder.ts`: `SimplifiedTechnicalEnglishRewriteWorkingFolder`, which creates the rewrite folder, with the skills, and the judge folder, with no skill.
- `score_the_simplified_technical_english_rewrite.ts`: the command. From the root of the repository: `pnpm run score_the_simplified_technical_english_rewrite --harness <claude|codex> [--split optimization|final_check|all] [--test-case-ids <id...>] [--skills-folder <path>] [--concurrency <count>]`. It writes each score file into `outputs/simplified_technical_english_rewrite/`, which git ignores.

## Rules
- The harness and its model come from `test_skills/_shared/src/` — see its CONTEXT.md. The judge uses the same harness and the same fixed model as the rewrite.
- The judge runs in a folder with no skill, so that it never loads the skill that it judges.
- The judge accepts each replacement of a refused word that the house style asks for, such as "can" for "might". Without this, `refused_words` and `meaning_kept` contradict each other, and no version can obey both.
- Code in a code span or a code block is never checked, because it holds names, not prose.
- The rewrite is the content of the first fenced code block of the last answer, or else the whole last answer.
- The score is the percentage of rule checks that pass: five rules for each test case.
- The files of this folder find `test_cases.json` and `dotagents_folder/` in the parent folder, never in `src/`.
