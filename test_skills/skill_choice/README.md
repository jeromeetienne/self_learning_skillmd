# Skill choice test

This test measures whether the `description` field of a skill makes a harness choose that skill for the correct user messages, and only for them.

## The skills

The skills are in `dotagents_folder/skills/`.

- **Target:** `release-notes`. Its description is weak on purpose: "Helps write notes about changes." Its body is good, because this test measures only the description. OPRO improves this description.
- **Neighbors:** these skills compete with the target, and their descriptions never change:
  - `changelog-entry`
  - `pull-request-description`
  - `announcement-post`
  - `migration-guide`

Without neighbors, a vague description that takes every message would get a perfect score.

## The test cases

`test_cases.json` holds 40 user messages, each with the skill that the harness must choose:

| Expected skill | `optimization` | `final_check` |
|---|---|---|
| `release-notes` | 12 | 4 |
| each of the 4 neighbors | 3 | 1 |
| no skill (`null`) | 6 | 2 |

- **`optimization`:** the OPRO loop scores each new description on these 30 test cases.
- **`final_check`:** these 10 test cases score only the final description. OPRO never sees them.

## How the score works

1. For each test case, `score-version` copies the skills into a temporary folder outside this repository. That folder is a small git repository of a project `todo-cli`, with tags and a current branch, like a real project.
2. `score-version` starts the harness in that folder with the user message, 4 test cases at the same time:
   - Codex runs only `gpt-5.6-luna`.
   - Claude Code runs only `claude-sonnet-5`.
3. `score-version` stops the harness as soon as the choice is known:
   - The choice is the first test skill named in a path under a `skills/` folder, in a tool call or a shell command.
   - After 3 tool calls with no test skill, or when the harness ends its turn, the choice is no skill.
   - A skill that is not a test skill, such as a skill of the user, is never a choice.
4. The score is the percentage of test cases whose chosen skill is the expected skill.

## How to run it

From the root of the repository:

```bash
npx skillmd_opro_tools score-version --harness codex --target-folder test_skills/skill_choice --skills-folder test_skills/skill_choice/dotagents_folder/skills --split optimization --output-file outputs/skill_choice/score.json
```

- `--harness <claude|codex>`: the harness that runs the test cases. Required.
- `--split <optimization|final_check>`: the group of test cases to run.
- `--skills-folder <path>`: the skills to score, for example a version folder of an OPRO run.
- `--test-case-ids <id...>`: run only these test cases.
- `--concurrency <count>`: the number of test cases that run at the same time. The default is 4.

The tool prints the score, the count of each rule, and the failures, and writes the whole score record into the output file. The score record holds the evidence of each choice: the commands or the tool calls of the harness.

## Watch it live

`playground/` holds only the links `.claude` and `.agents` to `dotagents_folder/`, so a harness started there finds the five skills of this test. An agent in `playground/` can read `../test_cases.json`, so use `playground/` only to watch the skills, never to score them.

Start Codex, from the root of the repository:

```bash
cd test_skills/skill_choice/playground && codex --model gpt-5.6-luna
```

Or start Claude Code:

```bash
cd test_skills/skill_choice/playground && claude --model claude-sonnet-5
```

Type one message, and look at the first thing that the harness does:

- Codex reads the skill with a shell command, such as `sed -n '1,200p' .agents/skills/release-notes/SKILL.md`.
- Claude Code calls its skill tool, shown as `Skill(release-notes)`.

| Message to type | Expected skill |
|---|---|
| Write the release notes for version 2.0, for the people who use the product. | `release-notes` |
| What changed for our users between v1.0.0 and v1.1.0? Write it for the download page. | `release-notes` |
| Add a line to CHANGELOG.md for the fix of the date parser. | `changelog-entry` |
| Write the title and the description of the pull request for this branch. | `pull-request-description` |
| Write a short Bluesky post that announces version 2.0. | `announcement-post` |
| The format of the settings file changes in version 2.0. Write the steps that a user must follow to upgrade. | `migration-guide` |
| What is the capital of France? | no skill: the harness answers "Paris" |
| Explain what a git tag is. | no skill: the harness answers directly |

With the weak description of `release-notes`, the two `release-notes` messages are the ones most likely to go wrong: the harness can choose `changelog-entry`, or no skill. This repository has no git tag, so after the choice, the skill finds no version to compare. Stop the harness after the choice.

## Results

| Date | Harness | Split | Score | Commit |
|---|---|---|---|---|
| 2026-09-19 | codex | `optimization` | 29 of 30 (96.7 percent) | [4e52afd](https://github.com/jeromeetienne/skillmd_opro/commit/4e52afd) |

With the weak description, the score is already high, so OPRO has little room to improve it.
