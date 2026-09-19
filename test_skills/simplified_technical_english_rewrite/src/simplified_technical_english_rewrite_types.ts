import { z } from 'zod';
import { SPLIT_NAMES } from '../../_shared/src/harness_types.js';
import type { HarnessName, SplitName } from '../../_shared/src/harness_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SimplifiedTechnicalEnglishRewriteTypes — the shapes of the test cases and of the score of the rewrite test
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The names of the rules that are checked on each rewrite: four by code, and `meaning_kept` by a judge. */
export const RULE_NAMES = [
	'sentence_length',
	'no_abbreviation',
	'no_you',
	'refused_words',
	'meaning_kept',
] as const;

/** The name of one rule that is checked on each rewrite. */
export type RuleName = typeof RULE_NAMES[number];

/** Zod schema of one test case of `test_cases.json`. */
export const SimplifiedTechnicalEnglishRewriteTestCaseSchema = z.object({
	/** The unique name of the test case. */
	id: z.string(),
	/** The group of the test case. */
	split: z.enum(SPLIT_NAMES),
	/** The paragraph that the harness rewrites. */
	source_text: z.string(),
});

/** One test case of `test_cases.json`. */
export type SimplifiedTechnicalEnglishRewriteTestCase = z.infer<typeof SimplifiedTechnicalEnglishRewriteTestCaseSchema>;

/** Zod schema of the whole `test_cases.json` file. */
export const SimplifiedTechnicalEnglishRewriteTestCaseFileSchema = z.object({
	/** The skill whose body OPRO improves. */
	target_skill_name: z.string(),
	/** Every test case of the rewrite test. */
	test_cases: z.array(SimplifiedTechnicalEnglishRewriteTestCaseSchema),
});

/** Zod schema of the answer of the judge that checks the meaning. */
export const MeaningJudgmentSchema = z.object({
	/** `true` when the rewrite keeps every fact and every instruction of the source, and adds none. */
	is_meaning_kept: z.boolean(),
	/** Why the judge decided so, in one sentence. */
	reason: z.string(),
});

/** The answer of the judge that checks the meaning. */
export type MeaningJudgment = z.infer<typeof MeaningJudgmentSchema>;

/** The check of one rule on one rewrite. */
export type RuleCheck = {
	/** The rule. */
	rule_name: RuleName,
	/** `true` when the rewrite obeys the rule. */
	is_passed: boolean,
	/** Why the rewrite does not obey the rule, or `null` when it obeys it. */
	failure_reason: string | null,
};

/** The result of one test case, as written in the score file. */
export type SimplifiedTechnicalEnglishRewriteTestCaseResult = {
	/** The `id` of the test case. */
	test_case_id: string,
	/** The group of the test case. */
	split: SplitName,
	/** The paragraph that the harness rewrote. */
	source_text: string,
	/** The rewrite read from the last answer, or `null` when the harness gave no answer. */
	rewritten_text: string | null,
	/** `true` when the harness read the `SKILL.md` file of the target skill. */
	is_skill_loaded: boolean,
	/** The answer of the judge, or `null` when the judge did not answer. */
	meaning_judgment: MeaningJudgment | null,
	/** The check of each rule. */
	rule_checks: RuleCheck[],
	/** The number of rules that the rewrite obeys. */
	passed_rule_count: number,
	/** The commands and the tool calls of the harness that rewrote the paragraph. */
	evidence: string,
	/** The reason why the harness or the judge failed or ran out of time, or `null` when neither did. */
	error_message: string | null,
	/** How long the rewrite and the judgment took, in milliseconds. */
	duration_milliseconds: number,
};

/** The score of one run of the rewrite test, as written in the score file. */
export type SimplifiedTechnicalEnglishRewriteScoreRecord = {
	/** The harness that rewrote the paragraphs and judged the meaning. */
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
	/** The number of test cases whose rewrite obeys every rule. */
	perfect_test_case_count: number,
	/** The number of rule checks, which is the number of rules multiplied by the number of test cases. */
	rule_check_count: number,
	/** The number of rule checks that passed. */
	passed_rule_check_count: number,
	/** For each rule, the number of test cases whose rewrite obeys it. */
	passed_count_by_rule: Record<RuleName, number>,
	/** The number of test cases for which the harness or the judge failed or ran out of time. */
	error_count: number,
	/** The number of test cases for which the harness did not read the `SKILL.md` file of the target skill. */
	skill_not_loaded_count: number,
	/** The percentage of rule checks that passed. */
	score_percent: number,
	/** The result of each test case. */
	test_case_results: SimplifiedTechnicalEnglishRewriteTestCaseResult[],
};
