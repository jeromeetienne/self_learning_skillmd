import { z } from 'zod';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SkillChoiceTypes — the shapes of the test cases and of the score of the skill choice test
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The names of the harnesses that the skill choice test can run. */
export const HARNESS_NAMES = ['claude', 'codex'] as const;

/** The name of one harness that the skill choice test can run. */
export type HarnessName = typeof HARNESS_NAMES[number];

/** The only model that each harness runs: Claude Code runs only Sonnet, and Codex runs only Luna. */
export const HARNESS_MODEL_NAMES: Record<HarnessName, string> = {
	claude: 'claude-sonnet-5',
	codex: 'gpt-5.6-luna',
};

/** The names of the two groups of test cases. */
export const SPLIT_NAMES = ['optimization', 'final_check'] as const;

/** The name of one group of test cases: `optimization` for the OPRO loop, `final_check` for the final description. */
export type SplitName = typeof SPLIT_NAMES[number];

/** Zod schema of one test case of `test_cases.json`. */
export const SkillChoiceTestCaseSchema = z.object({
	/** The unique name of the test case. */
	id: z.string(),
	/** The message that the user sends to the harness. */
	user_message: z.string(),
	/** The skill that the harness must choose, or `null` when the harness must choose no skill. */
	expected_skill_name: z.string().nullable(),
	/** The group of the test case. */
	split: z.enum(SPLIT_NAMES),
});

/** One test case of `test_cases.json`. */
export type SkillChoiceTestCase = z.infer<typeof SkillChoiceTestCaseSchema>;

/** Zod schema of the whole `test_cases.json` file. */
export const SkillChoiceTestCaseFileSchema = z.object({
	/** The skill whose description OPRO improves. */
	target_skill_name: z.string(),
	/** Every test case of the skill choice test. */
	test_cases: z.array(SkillChoiceTestCaseSchema),
});

/** The whole `test_cases.json` file. */
export type SkillChoiceTestCaseFile = z.infer<typeof SkillChoiceTestCaseFileSchema>;

/** The choice of skill that a harness made for one user message. */
export type SkillChoice = {
	/** The name of the skill that the harness loaded, or `null` when the harness loaded no skill. */
	chosenSkillName: string | null,
	/** The text that shows the choice: the commands, the tool calls, or the reason why no skill was loaded. */
	evidence: string,
	/** The reason why the harness failed or ran out of time, or `null` when it did not. */
	errorMessage: string | null,
};

/** The result of one test case, as written in the score file. */
export type SkillChoiceTestCaseResult = {
	/** The `id` of the test case. */
	test_case_id: string,
	/** The group of the test case. */
	split: SplitName,
	/** The message that the user sent to the harness. */
	user_message: string,
	/** The skill that the harness had to choose, or `null` for no skill. */
	expected_skill_name: string | null,
	/** The skill that the harness chose, or `null` for no skill. */
	chosen_skill_name: string | null,
	/** `true` when the chosen skill is the expected skill. */
	is_correct: boolean,
	/** The text that shows the choice. */
	evidence: string,
	/** The reason why the harness failed or ran out of time, or `null` when it did not. */
	error_message: string | null,
	/** How long the harness ran for this test case, in milliseconds. */
	duration_milliseconds: number,
};

/** The score of one run of the skill choice test, as written in the score file. */
export type SkillChoiceScoreRecord = {
	/** The harness that chose the skills. */
	harness_name: HarnessName,
	/** The model that the harness ran. */
	model_name: string,
	/** The folder whose skills were copied for the harness. */
	skills_folder_path: string,
	/** The description of the target skill that was scored. */
	target_skill_description: string,
	/** The groups of test cases that were run. */
	split_names: SplitName[],
	/** When the run started, as an ISO 8601 date and time. */
	started_at: string,
	/** The number of test cases that were run. */
	test_case_count: number,
	/** The number of test cases whose chosen skill is the expected skill. */
	correct_count: number,
	/** The number of test cases for which the harness failed or ran out of time. */
	error_count: number,
	/** The percentage of test cases whose chosen skill is the expected skill. */
	score_percent: number,
	/** The result of each test case. */
	test_case_results: SkillChoiceTestCaseResult[],
};
