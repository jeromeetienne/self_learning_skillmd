import type { HarnessName, SplitName } from '../../test_skills/_shared/src/harness_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproTypes — the shapes of the targets, the versions, and the run record of the OPRO loop
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The names of the test skills that the OPRO loop can improve. */
export const TEST_SKILL_NAMES = [
	'skill_choice',
	'commit_message',
	'simplified_technical_english_rewrite',
] as const;

/** The name of one test skill that the OPRO loop can improve. */
export type TestSkillName = typeof TEST_SKILL_NAMES[number];

/** The part of a `SKILL.md` file that the OPRO loop improves: the `description` field, or the body. */
export type SkillPartName = 'description' | 'body';

/** The score of one version of a skill on one run of a test. */
export type TargetScore = {
	/** The percentage that the test gives. */
	scorePercent: number,
	/** The failures of the version on the test cases, one on each line, for the proposer. */
	feedbackText: string,
	/** The whole score record of the test, as written in its score file. */
	scoreRecord: unknown,
};

/** One test skill, seen from the OPRO loop: what to improve, and how to score a version. */
export type OproTarget = {
	/** The name of the test skill. */
	testSkillName: TestSkillName,
	/** The folder that holds one folder for each skill of the test, with the first version of the target skill. */
	skillsFolderPath: string,
	/** The name of the skill that OPRO improves. */
	targetSkillName: string,
	/** The part of the `SKILL.md` file that OPRO improves. */
	skillPartName: SkillPartName,
	/** What the test measures, in a few sentences, for the proposer. */
	testExplanation: string,
	/**
	 * Scores the skills of one folder on some groups of test cases.
	 *
	 * @param options The options of the score.
	 * @param options.harnessName The harness that runs the test.
	 * @param options.skillsFolderPath The folder that holds one folder for each skill.
	 * @param options.splitNames The groups of test cases to run.
	 * @param options.concurrency The number of harnesses that run at the same time.
	 * @returns The score.
	 */
	scoreFn: (options: {
		harnessName: HarnessName,
		skillsFolderPath: string,
		splitNames: SplitName[],
		concurrency: number,
	}) => Promise<TargetScore>,
};

/** One version of the target skill in the history of the OPRO loop. */
export type OproVersion = {
	/** The number of the version: 0 for the first version, then 1, 2, and so on. */
	version_number: number,
	/** The round that proposed the version: 0 for the first version. */
	round_number: number,
	/** The improved part of the `SKILL.md` file. */
	skill_part_text: string,
	/** The folder that holds one folder for each skill, with this version of the target skill. */
	skills_folder_path: string,
	/** The score of each run of the test on the `optimization` split. */
	score_percents: number[],
	/** The average of `score_percents`, which sorts the history. */
	average_score_percent: number,
	/** The failures of the version on the test cases, from its last run. */
	feedback_text: string,
	/** The reason why the proposer failed, or `null` when the version was proposed and scored. */
	error_message: string | null,
};

/** The record of one run of the OPRO loop, as written in `opro_run.json`. */
export type OproRunRecord = {
	/** The test skill that was improved. */
	test_skill_name: TestSkillName,
	/** The harness that proposed and scored the versions. */
	harness_name: HarnessName,
	/** The model that the harness ran. */
	model_name: string,
	/** The skill that was improved. */
	target_skill_name: string,
	/** The part of the `SKILL.md` file that was improved. */
	skill_part_name: SkillPartName,
	/** The number of rounds. */
	round_count: number,
	/** The number of versions that each round proposes. */
	version_count_per_round: number,
	/** The number of runs of the test for each version. */
	score_run_count: number,
	/** When the run started, as an ISO 8601 date and time. */
	started_at: string,
	/** Every version, in the order in which they were proposed. */
	versions: OproVersion[],
	/** The version with the best average score on the `optimization` split, or `null` before the first score. */
	best_version_number: number | null,
	/** The score of the first version on the `final_check` split, or `null` before the end of the run. */
	first_version_final_check_percent: number | null,
	/** The score of the best version on the `final_check` split, or `null` before the end of the run. */
	best_version_final_check_percent: number | null,
};
