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

1. The script copies the skills into a temporary folder outside this repository. That folder is a small git repository of a project `todo-cli`, with tags and a current branch, like a real project.
2. For each test case, the script starts the harness in that folder with the user message, 4 test cases at the same time:
   - Codex runs only `gpt-5.6-luna`.
   - Claude Code runs only `claude-sonnet-5`.
3. The script stops the harness as soon as the choice is known:
   - The choice is the first test skill named in a path under a `skills/` folder, in a tool call or a shell command.
   - After 3 tool calls with no test skill, or when the harness ends its turn, the choice is no skill.
   - A skill that is not a test skill, such as a skill of the user, is never a choice.
4. The score is the percentage of test cases whose chosen skill is the expected skill.

## How to run it

From the root of the repository:

```bash
pnpm run score_the_skill_choice --harness codex
```

Options:

- `--harness <claude|codex>`: the harness that chooses the skills. Required.
- `--split <optimization|final_check|all>`: the group of test cases to run. The default is `optimization`.
- `--test-case-ids <id...>`: run only these test cases.
- `--skills-folder <path>`: score another skills folder, for example a folder that holds a new description.
- `--concurrency <count>`: the number of harnesses that run at the same time. The default is 4.

Each run prints one line for each test case, and writes a score file into `outputs/skill_choice/`, which git ignores. The score file holds the evidence of each choice: the commands or the tool calls of the harness.

The `claude` harness must run in a terminal of the user, because a Claude Code desktop session cannot start `claude`.

## Watch it live

Start `claude` or `codex` in `playground/`. That folder holds only the links `.claude` and `.agents` to `dotagents_folder/`. An agent in `playground/` can read `../test_cases.json`, so use `playground/` only to watch the skills, never to score them.

## Results

| Date | Harness | Split | Score | Commit |
|---|---|---|---|---|
| 2026-09-19 | codex | `optimization` | 29 of 30 (96.7 percent) | [4e52afd](https://github.com/jeromeetienne/skillmd_opro/commit/4e52afd) |

With the weak description, the score is already high, so OPRO has little room to improve it.
