# The folder of a target skill

A person who wants the OPRO loop to improve one skill writes one folder. The folder holds data files and text files. It holds no code.

```
<target folder>/
	opro_target.json          the shape of the test: the run mode, the workspace recipe, and the rules
	test_cases.json           the test cases, with their group and their expected answer
	test_explanation.md       what the test measures, in a few sentences, for the proposer
	judge_rubric.md           the question of the judge, when a rule has the kind `judge`
	workspace_commits.json    the commits of the workspace, when the recipe names this file
	dotagents_folder/skills/  the first version of the skills, one folder for each skill
	base_project/             the files that the workspace recipe copies, when it copies a folder
```

## `opro_target.json`

| Field | What it holds |
|---|---|
| `target_skill_name` | The skill that the OPRO loop improves. |
| `skill_part_name` | `description` or `body`: the part of the `SKILL.md` file that the OPRO loop improves. |
| `skills_folder_path` | The folder of the first version of the skills, relative to the target folder. |
| `test_explanation_file_path` | The file that says what the test measures. |
| `run_mode` | `answer` runs the harness until the end of its turn and checks its last answer. `skill_choice` stops the harness as soon as it names a skill of the skills folder, and the answer is the name of that skill. |
| `user_message_template` | The message that the user sends to the harness. `{{field}}` holds a field of the test case. |
| `answer_extraction` | `first_code_block_or_whole_answer` or `whole_answer`. |
| `trim_line_ends` | `true` removes the spaces at the end of each line of the answer. |
| `claude_allowed_tool_names` | The tools that Claude Code may call without a question. |
| `timeout_milliseconds` | The time after which the harness is stopped. |
| `workspace_recipe` | How to build the folder where the harness runs. |
| `rules` | The rules that every answer must obey. The score is the percentage of rule checks that pass. |
| `judge` | The rubric file and the timeout of the judge, or `null`. |
| `score_noise_percent` | How much the score of the same version moves between two runs of the whole `optimization` group, in percent, or `null` when nobody measured it yet. |

### `score_noise_percent`

The OPRO loop needs this number to know when two versions are too close to be separated. Measure it one time for each target folder, with the first version of the skills:

```
npx skillmd_opro_tools measure-score-noise --harness <name> --target-folder <path> --skills-folder <path>/dotagents_folder/skills --split optimization --run-count 3 --output-folder <path>
```

The tool scores the same version three times and prints `score_noise_percent`, which is two standard deviations of the score. It reads the standard deviation from the movement of each test case, not only from the three scores of the runs, because three runs of a group of fifteen test cases give forty-five numbers instead of three: the three runs of `commit_message` all scored 55.6 percent while single test cases moved between one and four rules of six, and the movement of the test cases gives 4.1 percent.

Write that number in `opro_target.json`. The measured numbers of this repository are in `test_skills/<name>/opro_target.json`, and both are near 4 percent with Codex on 15 test cases, not the 8 percent that the OPRO loop uses when the number is missing.

### `workspace_recipe`

- `copy_folder_path`: the folder to copy into the project, relative to the target folder, or `null`.
- `git_repository`: `null` for no git repository, or an object with:
  - `initial_branch_name`: the branch of the first commit.
  - `first_commit_date`: the date of the first commit, as an ISO 8601 date and time.
  - `day_count_between_commits`: the number of days between two commits.
  - `commits`: the commits to write, each with `branch_name`, `message`, `files` (a map of path to text, or `null` to commit every file that is there), and `tag_name`.
  - `commits_file_path`: a file that holds `{"commits": [...]}`, instead of `commits`.
  - `stage_file_changes`: `true` puts the file changes of the test case in the index of git, for a test about staged changes.

### `rules`

A rule has a `name` and a list of `checks`. The first check whose `when` the test case obeys is the check of that test case, so one rule gives exactly one verdict for each test case, and the score never changes its meaning.

A condition of `when` has a `field` of the test case, an `operator` (`is_null`, `is_not_null`, `equals`, `not_equals`), and a `value` for the last two.

| Kind of check | What it checks | Its fields |
|---|---|---|
| `regular_expression_must_match` | The answer matches the pattern. | `pattern`, `flags`, `scope` |
| `regular_expression_must_not_match` | The answer does not match the pattern. | `pattern`, `flags`, `scope` |
| `maximum_line_length` | No line is longer than `maximum` characters. | `maximum`, `scope` |
| `maximum_sentence_word_count` | No sentence has more than `maximum` words. | `maximum` |
| `refused_patterns` | The answer holds none of the patterns. | `patterns`, `allowed_words` |
| `expected_answer` | The answer equals the field `expected_field` of the test case. | `expected_field` |
| `judge` | A second run of the same harness answers the question of `judge_rubric.md`. | none |

Every check also takes `scope` (`whole`, `first_line`, `last_line`), `remove_code` (`true` replaces every code block and every code span with one word, because code holds names and not prose), and `failure_message`.

A pattern of `refused_patterns` has a `kind` (`word` or `regular_expression`), a `value`, and `flags`.

Every `pattern`, every `value`, and every `failure_message` can hold `{{field}}`, which the tools replace with the field of the test case. In a pattern, the value is escaped, so that a field that holds `a.b` never matches `axb`.

## `test_cases.json`

```json
{
	"target_skill_name": "commit-message",
	"test_cases": [
		{
			"id": "fix_issue_01",
			"split": "optimization",
			"user_message": "This change fixes issue #12.",
			"issue_number": 12,
			"is_fix": true,
			"branch_name": "main",
			"file_changes": [
				{ "path": "src/index.ts", "old_text": "...", "new_text": "..." }
			]
		}
	]
}
```

- `id` and `split` are the only fields that every test case must hold. `split` is `optimization` or `final_check`.
- `branch_name` and `file_changes` belong to the workspace recipe. Every other field belongs to the rules and to `user_message_template`, which read it by its name.
- The `optimization` group scores every version, and the proposer sees its failures. The `final_check` group scores only the first version and the best version, and the proposer never sees it.

## `judge_rubric.md`

The question of the judge. It can hold `{{field}}` of the test case and `{{answer}}`, which holds the answer of the target skill. The judge must reply with one JSON object: `{"is_passed": true or false, "reason": "one sentence"}`.

One target skill has one rubric file, so at most one rule has the kind `judge`.

## What the rules must never do

The OPRO loop measures whether a `SKILL.md` file can discover the rules from the failures of the test cases. The rules therefore stay out of reach of the proposer: the meta-prompt holds the explanation of the test and the failures, and never `opro_target.json`. A target folder must never put the rules in `test_explanation.md`, and the agent that runs the OPRO optimizer skill must never read `opro_target.json` to write a new version.

## A worked example to copy

The repository `skillmd_opro` holds three target folders that a person copies for a new target skill:

- `test_skills/commit_message/`: the run mode `answer`, a workspace built from a copied folder and a list of commits, and six rules of the kinds `regular_expression_must_match`, `regular_expression_must_not_match`, and `maximum_line_length`.
- `test_skills/simplified_technical_english_rewrite/`: the run mode `answer`, a workspace with no git repository, and rules of the kinds `refused_patterns`, `maximum_sentence_word_count`, and `judge`, with `judge_rubric.md`.
- `test_skills/skill_choice/`: the run mode `skill_choice`, a workspace whose commits come from `workspace_commits.json`, and one rule of the kind `expected_answer`.

To write a new target folder, copy the folder that has the nearest run mode, then change, in this order:

1. `dotagents_folder/skills/`: the first version of the skills, with the skill that the OPRO loop improves.
2. `opro_target.json`: `target_skill_name`, `skill_part_name`, `user_message_prefix`, the workspace recipe, and the rules.
3. `test_cases.json`: the test cases, with about two thirds in the group `optimization` and one third in the group `final_check`.
4. `test_explanation.md`: what the test measures, in a few sentences, with no rule in it.
