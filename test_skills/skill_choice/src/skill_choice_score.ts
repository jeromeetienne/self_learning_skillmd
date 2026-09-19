import Fs from 'node:fs';
import Path from 'node:path';
import { SkillChoiceHarness } from './skill_choice_harness.js';
import { SkillChoiceWorkingFolder } from './skill_choice_working_folder.js';
import { HARNESS_MODEL_NAMES, SkillChoiceTestCaseFileSchema } from './skill_choice_types.js';
import type {
	HarnessName,
	SkillChoiceScoreRecord,
	SkillChoiceTestCase,
	SkillChoiceTestCaseResult,
	SplitName,
} from './skill_choice_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SkillChoiceScore — scores the skills of one folder on the test cases of the skill choice test
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The time after which the harness is stopped on one test case. */
const TIMEOUT_MILLISECONDS = 180_000;

/**
 * Scores the skills of one folder: copies them into a temporary folder outside the repository, runs the harness on
 * each test case there, and counts the test cases whose chosen skill is the expected skill.
 */
export class SkillChoiceScore {
	/**
	 * Scores the skills of one folder on the selected test cases.
	 *
	 * @param options The options of the score.
	 * @param options.harnessName The harness that chooses the skills.
	 * @param options.skillsFolderPath The folder that holds one folder for each skill.
	 * @param options.testCasesFilePath The `test_cases.json` file.
	 * @param options.splitNames The groups of test cases to run.
	 * @param options.testCaseIds The test cases to run, or `null` for every test case of the groups.
	 * @param options.concurrency The number of harnesses that run at the same time.
	 * @param options.onTestCaseResult Called after each test case, to show the progress.
	 * @returns The score record.
	 */
	static async score({
		harnessName,
		skillsFolderPath,
		testCasesFilePath,
		splitNames,
		testCaseIds,
		concurrency,
		onTestCaseResult,
	}: {
		harnessName: HarnessName,
		skillsFolderPath: string,
		testCasesFilePath: string,
		splitNames: SplitName[],
		testCaseIds: string[] | null,
		concurrency: number,
		onTestCaseResult: (testCaseResult: SkillChoiceTestCaseResult) => void,
	}): Promise<SkillChoiceScoreRecord> {
		const startedAt = new Date().toISOString();
		const testCaseFile = SkillChoiceTestCaseFileSchema.parse(
			JSON.parse(Fs.readFileSync(testCasesFilePath, 'utf8')),
		);
		const testCases = testCaseFile.test_cases.filter((testCase) => {
			if (testCaseIds !== null) {
				return testCaseIds.includes(testCase.id);
			}
			return splitNames.includes(testCase.split);
		});
		if (testCases.length === 0) {
			throw new Error('no test case matches the selected groups and test case ids');
		}
		const targetSkillDescription = SkillChoiceScore._readDescription(
			Path.join(skillsFolderPath, testCaseFile.target_skill_name, 'SKILL.md'),
		);

		const skillNames = SkillChoiceScore._readSkillNames(skillsFolderPath);
		const workingFolderPath = SkillChoiceWorkingFolder.create(skillsFolderPath);
		let testCaseResults: SkillChoiceTestCaseResult[];
		try {
			testCaseResults = await SkillChoiceScore._mapWithConcurrency(testCases, concurrency, async (testCase) => {
				const testCaseResult = await SkillChoiceScore._runTestCase(
					harnessName,
					workingFolderPath,
					skillNames,
					testCase,
				);
				onTestCaseResult(testCaseResult);
				return testCaseResult;
			});
		} finally {
			Fs.rmSync(workingFolderPath, {
				recursive: true,
				force: true,
			});
		}

		const correctCount = testCaseResults.filter((testCaseResult) => testCaseResult.is_correct).length;
		const errorCount = testCaseResults.filter((testCaseResult) => testCaseResult.error_message !== null).length;
		const scoreRecord: SkillChoiceScoreRecord = {
			harness_name: harnessName,
			model_name: HARNESS_MODEL_NAMES[harnessName],
			skills_folder_path: skillsFolderPath,
			target_skill_description: targetSkillDescription,
			split_names: splitNames,
			started_at: startedAt,
			test_case_count: testCaseResults.length,
			correct_count: correctCount,
			error_count: errorCount,
			score_percent: Math.round(correctCount / testCaseResults.length * 1000) / 10,
			test_case_results: testCaseResults,
		};
		return scoreRecord;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Runs the harness on one test case.
	 *
	 * @param harnessName The harness that chooses the skill.
	 * @param workingFolderPath The temporary folder that holds the copies of the skills.
	 * @param skillNames The names of the test skills.
	 * @param testCase The test case.
	 * @returns The result of the test case.
	 */
	static async _runTestCase(
		harnessName: HarnessName,
		workingFolderPath: string,
		skillNames: string[],
		testCase: SkillChoiceTestCase,
	): Promise<SkillChoiceTestCaseResult> {
		const startTime = Date.now();
		const skillChoice = await SkillChoiceHarness.chooseSkill({
			harnessName: harnessName,
			workingFolderPath: workingFolderPath,
			userMessage: testCase.user_message,
			skillNames: skillNames,
			timeoutMilliseconds: TIMEOUT_MILLISECONDS,
		});
		const testCaseResult: SkillChoiceTestCaseResult = {
			test_case_id: testCase.id,
			split: testCase.split,
			user_message: testCase.user_message,
			expected_skill_name: testCase.expected_skill_name,
			chosen_skill_name: skillChoice.chosenSkillName,
			is_correct: skillChoice.errorMessage === null
				&& skillChoice.chosenSkillName === testCase.expected_skill_name,
			evidence: skillChoice.evidence,
			error_message: skillChoice.errorMessage,
			duration_milliseconds: Date.now() - startTime,
		};
		return testCaseResult;
	}

	/**
	 * Reads the names of the test skills: each folder of the skills folder that holds a `SKILL.md` file.
	 *
	 * @param skillsFolderPath The folder that holds one folder for each skill.
	 * @returns The names of the test skills.
	 */
	static _readSkillNames(skillsFolderPath: string): string[] {
		const skillNames = Fs.readdirSync(skillsFolderPath).filter((entryName) => {
			return Fs.existsSync(Path.join(skillsFolderPath, entryName, 'SKILL.md'));
		});
		return skillNames;
	}

	/**
	 * Reads the `description` field of the frontmatter of one `SKILL.md` file.
	 *
	 * @param skillFilePath The `SKILL.md` file.
	 * @returns The description, or an empty string when the file has no description.
	 */
	static _readDescription(skillFilePath: string): string {
		const skillText = Fs.readFileSync(skillFilePath, 'utf8');
		const match = /^description:\s*(.*)$/m.exec(skillText);
		if (match === null) {
			return '';
		}
		return (match[1] ?? '').trim();
	}

	/**
	 * Calls a function on each item, with at most `concurrency` calls at the same time, and keeps the order of the
	 * items in the results.
	 *
	 * @param items The items.
	 * @param concurrency The maximum number of calls at the same time.
	 * @param itemFn The function to call on each item.
	 * @returns The results, in the order of the items.
	 */
	static async _mapWithConcurrency<Item, Result>(
		items: Item[],
		concurrency: number,
		itemFn: (item: Item) => Promise<Result>,
	): Promise<Result[]> {
		const results: Result[] = new Array(items.length);
		let nextIndex = 0;
		const workerCount = Math.max(1, Math.min(concurrency, items.length));
		const workers = Array.from({
			length: workerCount,
		}, async () => {
			while (nextIndex < items.length) {
				const index = nextIndex;
				nextIndex += 1;
				results[index] = await itemFn(items[index] as Item);
			}
		});
		await Promise.all(workers);
		return results;
	}
}
