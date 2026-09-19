import { z } from 'zod';
import { SPLIT_NAMES } from '../../_shared/src/harness_types.js';
import type { HarnessName, SplitName } from '../../_shared/src/harness_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	CommitMessageTypes — the shapes of the test cases and of the score of the commit message test
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The names of the rules that code checks on each commit message. */
export const RULE_NAMES = [
	'conventional_type',
	'first_line_length',
	'blank_second_line',
	'issue_number',
	'fixes_keyword',
	'no_attribution',
] as const;

/** The name of one rule that code checks on each commit message. */
export type RuleName = typeof RULE_NAMES[number];

/** Zod schema of one change to one file of the base project. */
export const FileChangeSchema = z.object({
	/** The path of the file in the project. */
	path: z.string(),
	/**
	 * The text to replace, which must occur exactly once in the file. `null` writes the whole file with `new_text`,
	 * or deletes the file when `new_text` is `null` too.
	 */
	old_text: z.string().nullable(),
	/** The new text, or `null` to delete the file. */
	new_text: z.string().nullable(),
});

/** One change to one file of the base project. */
export type FileChange = z.infer<typeof FileChangeSchema>;

/** Zod schema of one test case of `test_cases.json`. */
export const CommitMessageTestCaseSchema = z.object({
	/** The unique name of the test case. */
	id: z.string(),
	/** The group of the test case. */
	split: z.enum(SPLIT_NAMES),
	/** What the user adds to the fixed request, such as the issue of the change. It can be empty. */
	user_message: z.string(),
	/** The GitHub issue of the change, or `null` when the change has no issue. */
	issue_number: z.number().int().positive().nullable(),
	/** `true` when the change fixes a bug. With an issue number, the change closes the issue. */
	is_fix: z.boolean(),
	/** The changes that the test case stages in the base project, applied in this order. */
	file_changes: z.array(FileChangeSchema).min(1),
});

/** One test case of `test_cases.json`. */
export type CommitMessageTestCase = z.infer<typeof CommitMessageTestCaseSchema>;

/** Zod schema of the whole `test_cases.json` file. */
export const CommitMessageTestCaseFileSchema = z.object({
	/** The skill whose body OPRO improves. */
	target_skill_name: z.string(),
	/** Every test case of the commit message test. */
	test_cases: z.array(CommitMessageTestCaseSchema),
});

/** The whole `test_cases.json` file. */
export type CommitMessageTestCaseFile = z.infer<typeof CommitMessageTestCaseFileSchema>;

/** The check of one rule on one commit message. */
export type RuleCheck = {
	/** The rule. */
	rule_name: RuleName,
	/** `true` when the commit message obeys the rule. */
	is_passed: boolean,
	/** Why the commit message does not obey the rule, or `null` when it obeys it. */
	failure_reason: string | null,
};

/** The result of one test case, as written in the score file. */
export type CommitMessageTestCaseResult = {
	/** The `id` of the test case. */
	test_case_id: string,
	/** The group of the test case. */
	split: SplitName,
	/** The message that the user sent to the harness. */
	user_message: string,
	/** The last answer of the harness, or `null` when the harness gave no answer. */
	final_text: string | null,
	/** The commit message read from the last answer, or `null` when the harness gave no answer. */
	commit_message: string | null,
	/** `true` when the harness read the `SKILL.md` file of the target skill. */
	is_skill_loaded: boolean,
	/** The check of each rule. */
	rule_checks: RuleCheck[],
	/** The number of rules that the commit message obeys. */
	passed_rule_count: number,
	/** The commands and the tool calls of the harness. */
	evidence: string,
	/** The reason why the harness failed or ran out of time, or `null` when it did not. */
	error_message: string | null,
	/** How long the harness ran for this test case, in milliseconds. */
	duration_milliseconds: number,
};

/** The score of one run of the commit message test, as written in the score file. */
export type CommitMessageScoreRecord = {
	/** The harness that wrote the commit messages. */
	harness_name: HarnessName,
	/** The model that the harness ran. */
	model_name: string,
	/** The folder whose skills were copied for the harness. */
	skills_folder_path: string,
	/** The `SKILL.md` file of the target skill that was scored. */
	target_skill_text: string,
	/** The groups of test cases that were run. */
	split_names: SplitName[],
	/** When the run started, as an ISO 8601 date and time. */
	started_at: string,
	/** The number of test cases that were run. */
	test_case_count: number,
	/** The number of test cases whose commit message obeys every rule. */
	perfect_test_case_count: number,
	/** The number of rule checks, which is the number of rules multiplied by the number of test cases. */
	rule_check_count: number,
	/** The number of rule checks that passed. */
	passed_rule_check_count: number,
	/** For each rule, the number of test cases whose commit message obeys it. */
	passed_count_by_rule: Record<RuleName, number>,
	/** The number of test cases for which the harness failed or ran out of time. */
	error_count: number,
	/** The number of test cases for which the harness did not read the `SKILL.md` file of the target skill. */
	skill_not_loaded_count: number,
	/** The percentage of rule checks that passed. */
	score_percent: number,
	/** The result of each test case. */
	test_case_results: CommitMessageTestCaseResult[],
};
