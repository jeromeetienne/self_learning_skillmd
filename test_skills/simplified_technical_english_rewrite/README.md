# Simplified Technical English rewrite test

This test measures whether the body of a skill makes a harness rewrite a technical paragraph in the house style, which is based on ASD-STE100 Simplified Technical English, without a change of meaning.

## The skill

The skill is `dotagents_folder/skills/simplified-technical-english-rewrite/SKILL.md`. Its description is good, and its body is weak on purpose: it says only to use simple words and short sentences. It names no rule. OPRO improves this body.

## The rules

Five rules are checked on each rewrite. Code checks the first four, and a judge checks the last one:

| Rule | The rewrite obeys the rule when |
|---|---|
| `sentence_length` | each sentence has 20 words or fewer, the limit of ASD-STE100 for a procedure |
| `no_abbreviation` | it has no word of two or more capital letters, such as `API`, no abbreviation with a period, such as `e.g.`, and no short form of a word, such as `repo` or `config` |
| `no_contraction` | it has no contraction, such as `don't` or `it's` |
| `refused_words` | it has no word of the house list of refused words, such as `ensure`, `via`, `might`, `should`, or `in order to` |
| `meaning_kept` | the judge says that it keeps every fact, number, condition, and instruction of the paragraph, and adds no fact |

Code in a code span or a code block is never checked. The house list of refused words is `REFUSED_WORDS` in `src/simplified_technical_english_rewrite_rules.ts`.

## The test cases

`test_cases.json` holds 20 paragraphs of technical text: 15 in `optimization` and 5 in `final_check`. Each paragraph breaks several rules: long sentences, abbreviations, contractions, and refused words.

## How the score works

1. The script creates two temporary folders outside this repository, each an empty git repository: the rewrite folder, with a copy of the skills, and the judge folder, with no skill.
2. For each test case, the script starts the harness in the rewrite folder, 4 test cases at the same time:
   - Codex runs only `gpt-5.6-luna`, in a read-only sandbox.
   - Claude Code runs only `claude-sonnet-5`, and may call only the tools that read the skill.
3. The user message asks the harness to use the skill, to rewrite the paragraph, and to reply with the rewritten text only.
4. Code checks four rules on the rewrite. Then the same harness, with the same model, runs in the judge folder and says whether the rewrite keeps the meaning.
5. The score is the percentage of rule checks that pass: 5 rules for each of the 15 test cases, 75 checks.

## How to run it

From the root of the repository:

```bash
pnpm run score_the_simplified_technical_english_rewrite --harness codex
```

The options are the same as for the other tests: `--harness`, `--split`, `--test-case-ids`, `--skills-folder`, and `--concurrency`.

Each run prints one line for each test case with the reason of each failed rule, then the count of each rule. It writes a score file into `outputs/simplified_technical_english_rewrite/`, which git ignores.

The `claude` harness must run in a terminal of the user, because a Claude Code desktop session cannot start `claude`.

## Watch it live

Start `claude` or `codex` in `playground/`. That folder holds only the links `.claude` and `.agents` to `dotagents_folder/`. Ask the harness to rewrite a paragraph in Simplified Technical English.

## Results

No run yet.
