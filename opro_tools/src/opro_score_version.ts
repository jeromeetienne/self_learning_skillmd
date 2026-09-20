import Fs from 'node:fs';
import Path from 'node:path';
import { Concurrency } from './concurrency.js';
import { HARNESS_MODEL_NAMES } from './harness_types.js';
import type { HarnessName, SplitName } from './harness_types.js';
import { OproTargetFileReader } from './opro_target_file.js';
import { OproTestCaseRun } from './opro_test_case_run.js';
import type { OproTestCaseResult } from './opro_test_case_run.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproScoreVersion — runs every test case of one group on one version, and computes the score and the failures
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The maximum number of failures that the feedback shows to the proposer. */
const FEEDBACK_MAXIMUM_LINE_COUNT = 25;

/** The score of one version on one group of test cases. */
export type OproScoreRecord = {
	/** The harness that ran the test cases. */
	harness_name: HarnessName,
	/** The model that the harness ran. */
	model_name: string,
	/** The folder of the target skill. */
	target_folder_path: string,
	/** The folder of the skills of the version. */
	skills_folder_path: string,
	/** The whole `SKILL.md` file of the version, so that a score file says which version it scored. */
	target_skill_text: string,
	/** The groups of test cases that ran. */
	split_names: SplitName[],
	/** When the score started, as an ISO 8601 date and time. */
	started_at: string,
	/** The number of test cases that ran. */
	test_case_count: number,
	/** The number of test cases that obey every rule. */
	perfect_test_case_count: number,
	/** The number of rule checks: the test cases multiplied by the rules. */
	rule_check_count: number,
	/** The number of rule checks that pass. */
	passed_rule_check_count: number,
	/** The number of test cases that pass, for each rule. */
	passed_count_by_rule: Record<string, number>,
	/** The number of test cases whose harness or judge failed. */
	error_count: number,
	/** The number of test cases whose harness never named the target skill. */
	skill_not_loaded_count: number,
	/** The number of harness runs that the score cost: the test cases, and the judge of each test case. */
	harness_run_count: number,
	/** The percentage of rule checks that pass. */
	score_percent: number,
	/** The failures, one on each line, for the proposer of the OPRO loop. */
	feedback_text: string,
	/** The result of each test case. */
	test_case_results: OproTestCaseResult[],
};

/**
 * Scores one version of the target skill: runs every test case of the selected groups, with a maximum number of
 * harnesses at the same time, and counts the rule checks that pass.
 */
export class OproScoreVersion {
	/**
	 * Scores one version.
	 *
	 * @param options The options of the score.
	 * @param options.harnessName The harness that runs the target skill and the judge.
	 * @param options.targetFolderPath The folder of the target skill.
	 * @param options.skillsFolderPath The folder of the skills of the version.
	 * @param options.splitNames The groups of test cases to run.
	 * @param options.testCaseIds The test cases to run, or `null` for every test case of the groups.
	 * @param options.concurrency The number of test cases that run at the same time.
	 * @param options.keepWorkspaces `true` when the workspace folders stay on the disk after the run.
	 * @param options.onTestCaseResult Called after each test case, to show the progress.
	 * @returns The score record.
	 */
	static async score({
		harnessName,
		targetFolderPath,
		skillsFolderPath,
		splitNames,
		testCaseIds,
		concurrency,
		keepWorkspaces,
		onTestCaseResult,
	}: {
		harnessName: HarnessName,
		targetFolderPath: string,
		skillsFolderPath: string,
		splitNames: SplitName[],
		testCaseIds: string[] | null,
		concurrency: number,
		keepWorkspaces: boolean,
		onTestCaseResult: (testCaseResult: OproTestCaseResult) => void,
	}): Promise<OproScoreRecord> {
		const startedAt = new Date().toISOString();
		const oproTargetFile = OproTargetFileReader.readTargetFile(targetFolderPath);
		OproScoreVersion._checkJudgeRuleCount(oproTargetFile.rules.length, targetFolderPath, oproTargetFile);
		const testCases = OproTargetFileReader.readTestCases(targetFolderPath, splitNames).filter((testCase) => {
			return testCaseIds === null || testCaseIds.includes(testCase.id);
		});
		if (testCaseIds !== null) {
			const foundTestCaseIds = testCases.map((testCase) => testCase.id);
			const missingTestCaseIds = testCaseIds.filter((testCaseId) => {
				return foundTestCaseIds.includes(testCaseId) === false;
			});
			if (missingTestCaseIds.length > 0) {
				throw new Error(`the group ${splitNames.join(', ')} of ${targetFolderPath} holds no test case named `
					+ missingTestCaseIds.join(', '));
			}
		}
		if (testCases.length === 0) {
			throw new Error('no test case matches the selected groups and test case names');
		}
		const rubricText = oproTargetFile.judge === null
			? null
			: Fs.readFileSync(Path.resolve(targetFolderPath, oproTargetFile.judge.rubric_file_path), 'utf8');
		const targetSkillText = Fs.readFileSync(
			Path.join(skillsFolderPath, oproTargetFile.target_skill_name, 'SKILL.md'),
			'utf8',
		);

		const testCaseResults = await Concurrency.map(testCases, concurrency, async (testCase) => {
			const testCaseResult = await OproTestCaseRun.run({
				harnessName: harnessName,
				targetFolderPath: targetFolderPath,
				oproTargetFile: oproTargetFile,
				skillsFolderPath: skillsFolderPath,
				testCase: testCase,
				rubricText: rubricText,
				keepWorkspace: keepWorkspaces,
			});
			onTestCaseResult(testCaseResult);
			return testCaseResult;
		});

		const ruleNames = oproTargetFile.rules.map((ruleDefinition) => ruleDefinition.name);
		const passedCountByRule: Record<string, number> = {};
		for (const ruleName of ruleNames) {
			passedCountByRule[ruleName] = testCaseResults.filter((testCaseResult) => {
				return testCaseResult.rule_checks.some((ruleCheck) => {
					return ruleCheck.rule_name === ruleName && ruleCheck.is_passed === true;
				});
			}).length;
		}
		const ruleCheckCount = testCaseResults.length * ruleNames.length;
		const passedRuleCheckCount = testCaseResults.reduce((total, testCaseResult) => {
			return total + testCaseResult.passed_rule_count;
		}, 0);
		return {
			harness_name: harnessName,
			model_name: HARNESS_MODEL_NAMES[harnessName],
			target_folder_path: targetFolderPath,
			skills_folder_path: skillsFolderPath,
			target_skill_text: targetSkillText,
			split_names: splitNames,
			started_at: startedAt,
			test_case_count: testCaseResults.length,
			perfect_test_case_count: testCaseResults.filter((testCaseResult) => {
				return testCaseResult.passed_rule_count === ruleNames.length;
			}).length,
			rule_check_count: ruleCheckCount,
			passed_rule_check_count: passedRuleCheckCount,
			passed_count_by_rule: passedCountByRule,
			error_count: testCaseResults.filter((testCaseResult) => testCaseResult.error_message !== null).length,
			skill_not_loaded_count: testCaseResults.filter((testCaseResult) => {
				return testCaseResult.is_skill_loaded === false;
			}).length,
			harness_run_count: testCaseResults.reduce((total, testCaseResult) => {
				return total + testCaseResult.harness_run_count;
			}, 0),
			score_percent: Math.round(passedRuleCheckCount / ruleCheckCount * 1000) / 10,
			feedback_text: OproScoreVersion.buildFeedback(testCaseResults),
			test_case_results: testCaseResults,
		};
	}

	/**
	 * Writes the failures of one score, one on each line, for the proposer of the OPRO loop.
	 *
	 * @param testCaseResults The results of the test cases.
	 * @returns The failures, one on each line.
	 */
	static buildFeedback(testCaseResults: OproTestCaseResult[]): string {
		const feedbackLines: string[] = [];
		for (const testCaseResult of testCaseResults) {
			for (const ruleCheck of testCaseResult.rule_checks) {
				if (ruleCheck.failure_reason !== null) {
					feedbackLines.push(`- ${testCaseResult.test_case_id}: ${ruleCheck.rule_name}: `
						+ ruleCheck.failure_reason);
				}
			}
		}
		if (feedbackLines.length === 0) {
			return 'No failure.';
		}
		const keptLines = feedbackLines.slice(0, FEEDBACK_MAXIMUM_LINE_COUNT);
		if (feedbackLines.length > keptLines.length) {
			keptLines.push(`- and ${feedbackLines.length - keptLines.length} more failures`);
		}
		return keptLines.join('\n');
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Checks that the target file has at most one rule of the kind `judge`, because it has one rubric file.
	 *
	 * @param ruleCount The number of rules, which the caller already read.
	 * @param targetFolderPath The folder of the target skill, for the error message.
	 * @param oproTargetFile The target file.
	 * @returns Nothing.
	 */
	static _checkJudgeRuleCount(
		ruleCount: number,
		targetFolderPath: string,
		oproTargetFile: { rules: { name: string, checks: { kind: string }[] }[], judge: unknown },
	): void {
		const judgeRuleNames = oproTargetFile.rules.filter((ruleDefinition) => {
			return ruleDefinition.checks.some((checkDefinition) => checkDefinition.kind === 'judge');
		}).map((ruleDefinition) => ruleDefinition.name);
		if (judgeRuleNames.length > 1) {
			throw new Error(`${targetFolderPath} has ${judgeRuleNames.length} rules of the kind judge `
				+ `(${judgeRuleNames.join(', ')}), and one rubric file. Keep one rule of the kind judge.`);
		}
		if (judgeRuleNames.length === 1 && oproTargetFile.judge === null) {
			throw new Error(`the rule ${judgeRuleNames[0]} of ${targetFolderPath} has the kind judge, and `
				+ 'opro_target.json has no judge');
		}
		if (ruleCount === 0) {
			throw new Error(`${targetFolderPath} has no rule`);
		}
	}
}
