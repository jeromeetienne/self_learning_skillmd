import Fs from 'node:fs';
import Path from 'node:path';
import { Concurrency } from '../../_shared/src/concurrency.js';
import { HarnessRun } from '../../_shared/src/harness_run.js';
import type { HarnessRunResult } from '../../_shared/src/harness_run.js';
import { HARNESS_MODEL_NAMES } from '../../_shared/src/harness_types.js';
import type { HarnessName, SplitName } from '../../_shared/src/harness_types.js';
import { CommitMessageRules } from './commit_message_rules.js';
import { CommitMessageTestCaseFileSchema, RULE_NAMES } from './commit_message_types.js';
import { CommitMessageWorkingFolder } from './commit_message_working_folder.js';
import type {
	CommitMessageScoreRecord,
	CommitMessageTestCase,
	CommitMessageTestCaseResult,
	RuleName,
} from './commit_message_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	CommitMessageScore — scores the skills of one folder on the test cases of the commit message test
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The time after which the harness is stopped on one test case. */
const TIMEOUT_MILLISECONDS = 300_000;

/** The request that starts every user message. The `user_message` of the test case comes after it. */
const USER_MESSAGE_PREFIX = 'Use the commit-message skill to write the commit message for the staged changes. '
	+ 'Do not run git commit, and do not change any file. Reply with the commit message only.';

/** The tools that Claude Code may call without a question: the tools that read the skill and the staged changes. */
const CLAUDE_ALLOWED_TOOL_NAMES = [
	'Skill',
	'Read',
	'Glob',
	'Grep',
	'Bash(git diff:*)',
	'Bash(git status:*)',
	'Bash(git log:*)',
	'Bash(git show:*)',
];

/**
 * Scores the skills of one folder: for each test case, creates a working folder outside the repository with the
 * staged changes of the test case, runs the harness there until the end of its turn, and checks each rule on the
 * commit message of its answer.
 */
export class CommitMessageScore {
	/**
	 * Scores the skills of one folder on the selected test cases.
	 *
	 * @param options The options of the score.
	 * @param options.harnessName The harness that writes the commit messages.
	 * @param options.skillsFolderPath The folder that holds one folder for each skill.
	 * @param options.baseProjectFolderPath The folder of the base project.
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
		baseProjectFolderPath,
		testCasesFilePath,
		splitNames,
		testCaseIds,
		concurrency,
		onTestCaseResult,
	}: {
		harnessName: HarnessName,
		skillsFolderPath: string,
		baseProjectFolderPath: string,
		testCasesFilePath: string,
		splitNames: SplitName[],
		testCaseIds: string[] | null,
		concurrency: number,
		onTestCaseResult: (testCaseResult: CommitMessageTestCaseResult) => void,
	}): Promise<CommitMessageScoreRecord> {
		const startedAt = new Date().toISOString();
		const testCaseFile = CommitMessageTestCaseFileSchema.parse(
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
		const targetSkillName = testCaseFile.target_skill_name;
		const targetSkillText = Fs.readFileSync(Path.join(skillsFolderPath, targetSkillName, 'SKILL.md'), 'utf8');

		const testCaseResults = await Concurrency.map(testCases, concurrency, async (testCase) => {
			const testCaseResult = await CommitMessageScore._runTestCase({
				harnessName: harnessName,
				skillsFolderPath: skillsFolderPath,
				baseProjectFolderPath: baseProjectFolderPath,
				targetSkillName: targetSkillName,
				testCase: testCase,
			});
			onTestCaseResult(testCaseResult);
			return testCaseResult;
		});

		const passedCountByRule = {} as Record<RuleName, number>;
		for (const ruleName of RULE_NAMES) {
			passedCountByRule[ruleName] = testCaseResults.filter((testCaseResult) => {
				return testCaseResult.rule_checks.some((ruleCheck) => {
					return ruleCheck.rule_name === ruleName && ruleCheck.is_passed === true;
				});
			}).length;
		}
		const ruleCheckCount = testCaseResults.length * RULE_NAMES.length;
		const passedRuleCheckCount = testCaseResults.reduce((total, testCaseResult) => {
			return total + testCaseResult.passed_rule_count;
		}, 0);
		const scoreRecord: CommitMessageScoreRecord = {
			harness_name: harnessName,
			model_name: HARNESS_MODEL_NAMES[harnessName],
			skills_folder_path: skillsFolderPath,
			target_skill_text: targetSkillText,
			split_names: splitNames,
			started_at: startedAt,
			test_case_count: testCaseResults.length,
			perfect_test_case_count: testCaseResults.filter((testCaseResult) => {
				return testCaseResult.passed_rule_count === RULE_NAMES.length;
			}).length,
			rule_check_count: ruleCheckCount,
			passed_rule_check_count: passedRuleCheckCount,
			passed_count_by_rule: passedCountByRule,
			error_count: testCaseResults.filter((testCaseResult) => testCaseResult.error_message !== null).length,
			skill_not_loaded_count: testCaseResults.filter((testCaseResult) => {
				return testCaseResult.is_skill_loaded === false;
			}).length,
			score_percent: Math.round(passedRuleCheckCount / ruleCheckCount * 1000) / 10,
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
	 * Runs the harness on one test case in its own working folder, and checks the rules on its commit message.
	 *
	 * @param options The options of the test case.
	 * @param options.harnessName The harness that writes the commit message.
	 * @param options.skillsFolderPath The folder that holds one folder for each skill.
	 * @param options.baseProjectFolderPath The folder of the base project.
	 * @param options.targetSkillName The skill whose body is scored.
	 * @param options.testCase The test case.
	 * @returns The result of the test case.
	 */
	static async _runTestCase({ harnessName, skillsFolderPath, baseProjectFolderPath, targetSkillName, testCase }: {
		harnessName: HarnessName,
		skillsFolderPath: string,
		baseProjectFolderPath: string,
		targetSkillName: string,
		testCase: CommitMessageTestCase,
	}): Promise<CommitMessageTestCaseResult> {
		const startTime = Date.now();
		const userMessage = testCase.user_message === ''
			? USER_MESSAGE_PREFIX
			: `${USER_MESSAGE_PREFIX}\n\n${testCase.user_message}`;
		const workingFolderPath = CommitMessageWorkingFolder.create({
			baseProjectFolderPath: baseProjectFolderPath,
			skillsFolderPath: skillsFolderPath,
			branchName: testCase.branch_name,
			fileChanges: testCase.file_changes,
		});
		let harnessRunResult: HarnessRunResult;
		try {
			harnessRunResult = await HarnessRun.runToEnd({
				harnessName: harnessName,
				workingFolderPath: workingFolderPath,
				userMessage: userMessage,
				claudeAllowedToolNames: CLAUDE_ALLOWED_TOOL_NAMES,
				timeoutMilliseconds: TIMEOUT_MILLISECONDS,
			});
		} finally {
			Fs.rmSync(workingFolderPath, {
				recursive: true,
				force: true,
			});
		}

		const commitMessage = harnessRunResult.finalText === null
			? null
			: CommitMessageRules.readCommitMessage(harnessRunResult.finalText);
		const ruleChecks = CommitMessageRules.check(commitMessage, testCase);
		const testCaseResult: CommitMessageTestCaseResult = {
			test_case_id: testCase.id,
			split: testCase.split,
			user_message: userMessage,
			final_text: harnessRunResult.finalText,
			commit_message: commitMessage,
			is_skill_loaded: harnessRunResult.evidence.includes(targetSkillName),
			rule_checks: ruleChecks,
			passed_rule_count: ruleChecks.filter((ruleCheck) => ruleCheck.is_passed === true).length,
			evidence: harnessRunResult.evidence,
			error_message: harnessRunResult.errorMessage,
			duration_milliseconds: Date.now() - startTime,
		};
		return testCaseResult;
	}
}
