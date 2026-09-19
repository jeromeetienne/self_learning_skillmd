# Simplified Technical English rewrite test

This test measures whether the body of a skill makes a harness rewrite a technical paragraph in the house style, which is based on ASD-STE100 Simplified Technical English, without a change of meaning.

## The skill

The skill is `dotagents_folder/skills/simplified-technical-english-rewrite/SKILL.md`. Its description is good, and its body is weak on purpose: it says only to use simple words and short sentences. It names no rule. OPRO improves this body.

## The rules

Five rules are checked on each rewrite. Code checks the first four, and a judge checks the last one. `no_you` and the list of refused words are house rules, which a model cannot guess without the skill:

| Rule | The rewrite obeys the rule when |
|---|---|
| `sentence_length` | each sentence has 20 words or fewer, the limit of ASD-STE100 for a procedure |
| `no_abbreviation` | it has no word of two or more capital letters, such as `API`, no abbreviation with a period, such as `e.g.`, no short form of a word, such as `repo` or `config`, and no contraction, such as `don't` or `it's` |
| `no_you` | it never speaks to the reader with `you` or `your`: an instruction uses the imperative, such as "Restart the server", and a description uses a thing as its subject, such as "The server restarts" |
| `refused_words` | it has no word of the house list of refused words, such as `ensure`, `via`, `might`, `should`, or `in order to` |
| `meaning_kept` | the judge says that it keeps every fact, number, condition, and instruction of the paragraph, and adds no fact |

Code in a code span or a code block is never checked. The house list of refused words is `REFUSED_WORDS` in `src/simplified_technical_english_rewrite_rules.ts`.

## The test cases

`test_cases.json` holds 20 paragraphs of technical text: 15 in `optimization` and 5 in `final_check`. Each paragraph breaks several rules: long sentences, abbreviations, contractions, refused words, and `you`.

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

`playground/` holds only the links `.claude` and `.agents` to `dotagents_folder/`, so a harness started there finds the skill of this test.

Start Codex, from the root of the repository:

```bash
cd test_skills/simplified_technical_english_rewrite/playground && codex --model gpt-5.6-luna --sandbox read-only
```

Or start Claude Code:

```bash
cd test_skills/simplified_technical_english_rewrite/playground && claude --model claude-sonnet-5
```

The harness reads `.agents/skills/simplified-technical-english-rewrite/SKILL.md` (Codex) or calls `Skill(simplified-technical-english-rewrite)` (Claude Code), then answers with the rewrite. The weak skill names no rule, so the answer usually keeps some abbreviations and refused words. The "Answer that obeys every rule" column shows what OPRO must teach the skill to write.

| Message to type | Answer that obeys every rule |
|---|---|
| Rewrite in Simplified Technical English: You'll need to restart the app after you change the config, otherwise the new values won't be loaded. | Restart the application after a change to the configuration. The application loads the new values only when it starts. |
| Rewrite in Simplified Technical English: Please ensure that the DB is backed up prior to running the migration script. | Make a backup of the database. Then run the migration script. |
| Rewrite in Simplified Technical English: The API might return a 500 error if the request body is larger than approx. 1 MB. | The application programming interface can return the error 500 when the request body is larger than about 1 megabyte. |
| Rewrite in Simplified Technical English: In order to reduce the build time, the CI pipeline caches the deps between runs, but you should clear the cache via the dashboard if a dep is updated. | To make the build faster, the continuous integration pipeline keeps the dependencies between runs. When a dependency changes, clear this cache on the dashboard. |

Each answer that obeys every rule has no sentence longer than 20 words, no abbreviation such as `API`, `DB`, `CI`, `MB`, `app`, `deps`, or `you'll`, no `you` or `your`, and no refused word such as `ensure`, `prior`, `might`, `should`, `via`, or `in order to`. Each answer also keeps every fact, which the judge checks.

## Results

| Date | Harness | Split | Score | Commit |
|---|---|---|---|---|
| 2026-09-19 | codex | `optimization` | 57 of 75 rule checks (76 percent) | [0d3f77e](https://github.com/jeromeetienne/skillmd_opro/commit/0d3f77e) |

- `no_contraction` passed on all 15 test cases, so it taught nothing to OPRO. After this run, `no_you` replaced it, and the contractions moved into `no_abbreviation`.
- The 4 refusals of the judge were real changes of meaning, such as "you can try" rewritten as an order.
