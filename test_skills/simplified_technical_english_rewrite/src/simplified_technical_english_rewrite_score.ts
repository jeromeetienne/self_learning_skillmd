import Fs from 'node:fs';
import Path from 'node:path';
import { Concurrency } from '../../_shared/src/concurrency.js';
import { HarnessRun } from '../../_shared/src/harness_run.js';
import { HARNESS_MODEL_NAMES } from '../../_shared/src/harness_types.js';
import type { HarnessName, SplitName } from '../../_shared/src/harness_types.js';
import { SimplifiedTechnicalEnglishRewriteMeaningJudge } from './simplified_technical_english_rewrite_meaning_judge.js';
import { SimplifiedTechnicalEnglishRewriteRules } from './simplified_technical_english_rewrite_rules.js';
import {
	RULE_NAMES,
	SimplifiedTechnicalEnglishRewriteTestCaseFileSchema,
} from './simplified_technical_english_rewrite_types.js';
import type {
	MeaningJudgment,
	RuleName,
	SimplifiedTechnicalEnglishRewriteScoreRecord,
	SimplifiedTechnicalEnglishRewriteTestCase,
	SimplifiedTechnicalEnglishRewriteTestCaseResult,
} from './simplified_technical_english_rewrite_types.js';
import {
	SimplifiedTechnicalEnglishRewriteWorkingFolder,
} from './simplified_technical_english_rewrite_working_folder.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SimplifiedTechnicalEnglishRewriteScore — scores the skills of one folder on the rewrite test
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The time after which the harness is stopped on one rewrite or one judgment. */
const TIMEOUT_MILLISECONDS = 300_000;

/** The request that starts every user message. The `source_text` of the test case comes after it. */
const USER_MESSAGE_PREFIX = 'Use the simplified-technical-english-rewrite skill to rewrite the text below. '
	+ 'Do not change any file. Reply with the rewritten text only.';

/** The tools that Claude Code may call without a question: the tools that read the skill. */
const CLAUDE_ALLOWED_TOOL_NAMES = [
	'Skill',
	'Read',
	'Glob',
];

/**
 * Scores the skills of one folder: for each test case, runs the harness until the end of its turn to rewrite the
 * paragraph, checks four rules on the rewrite with code, and asks a second run of the same harness whether the rewrite
 * keeps the meaning.
 */
export class SimplifiedTechnicalEnglishRewriteScore {
	/**
	 * Scores the skills of one folder on the selected test cases.
	 *
	 * @param options The options of the score.
	 * @param options.harnessName The harness that rewrites the paragraphs and judges the meaning.
	 * @param options.skillsFolderPath The folder that holds one folder for each skill.
	 * @param options.testCasesFilePath The `test_cases.json` file.
	 * @param options.splitNames The groups of test cases to run.
	 * @param options.testCaseIds The test cases to run, or `null` for every test case of the groups.
	 * @param options.concurrency The number of test cases that run at the same time.
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
		onTestCaseResult: (testCaseResult: SimplifiedTechnicalEnglishRewriteTestCaseResult) => void,
	}): Promise<SimplifiedTechnicalEnglishRewriteScoreRecord> {
		const startedAt = new Date().toISOString();
		const testCaseFile = SimplifiedTechnicalEnglishRewriteTestCaseFileSchema.parse(
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

		const rewriteFolderPath = SimplifiedTechnicalEnglishRewriteWorkingFolder.createRewriteFolder(skillsFolderPath);
		const judgeFolderPath = SimplifiedTechnicalEnglishRewriteWorkingFolder.createJudgeFolder();
		let testCaseResults: SimplifiedTechnicalEnglishRewriteTestCaseResult[];
		try {
			testCaseResults = await Concurrency.map(testCases, concurrency, async (testCase) => {
				const testCaseResult = await SimplifiedTechnicalEnglishRewriteScore._runTestCase({
					harnessName: harnessName,
					rewriteFolderPath: rewriteFolderPath,
					judgeFolderPath: judgeFolderPath,
					targetSkillName: targetSkillName,
					testCase: testCase,
				});
				onTestCaseResult(testCaseResult);
				return testCaseResult;
			});
		} finally {
			for (const folderPath of [rewriteFolderPath, judgeFolderPath]) {
				Fs.rmSync(folderPath, {
					recursive: true,
					force: true,
				});
			}
		}

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
		const scoreRecord: SimplifiedTechnicalEnglishRewriteScoreRecord = {
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
	 * Rewrites the paragraph of one test case, judges the meaning of the rewrite, and checks each rule.
	 *
	 * @param options The options of the test case.
	 * @param options.harnessName The harness that rewrites and judges.
	 * @param options.rewriteFolderPath The folder with the skills where the harness rewrites.
	 * @param options.judgeFolderPath The folder with no skill where the harness judges.
	 * @param options.targetSkillName The skill whose body is scored.
	 * @param options.testCase The test case.
	 * @returns The result of the test case.
	 */
	static async _runTestCase({ harnessName, rewriteFolderPath, judgeFolderPath, targetSkillName, testCase }: {
		harnessName: HarnessName,
		rewriteFolderPath: string,
		judgeFolderPath: string,
		targetSkillName: string,
		testCase: SimplifiedTechnicalEnglishRewriteTestCase,
	}): Promise<SimplifiedTechnicalEnglishRewriteTestCaseResult> {
		const startTime = Date.now();
		const harnessRunResult = await HarnessRun.runToEnd({
			harnessName: harnessName,
			workingFolderPath: rewriteFolderPath,
			userMessage: `${USER_MESSAGE_PREFIX}\n\n${testCase.source_text}`,
			claudeAllowedToolNames: CLAUDE_ALLOWED_TOOL_NAMES,
			timeoutMilliseconds: TIMEOUT_MILLISECONDS,
		});
		const rewrittenText = harnessRunResult.finalText === null
			? null
			: SimplifiedTechnicalEnglishRewriteRules.readRewrittenText(harnessRunResult.finalText);

		let meaningJudgment: MeaningJudgment | null = null;
		let errorMessage = harnessRunResult.errorMessage;
		if (rewrittenText !== null && rewrittenText !== '') {
			const meaningJudgeResult = await SimplifiedTechnicalEnglishRewriteMeaningJudge.judge({
				harnessName: harnessName,
				judgeFolderPath: judgeFolderPath,
				sourceText: testCase.source_text,
				rewrittenText: rewrittenText,
				timeoutMilliseconds: TIMEOUT_MILLISECONDS,
			});
			meaningJudgment = meaningJudgeResult.meaningJudgment;
			errorMessage = errorMessage ?? meaningJudgeResult.errorMessage;
		}

		const ruleChecks = SimplifiedTechnicalEnglishRewriteRules.check(rewrittenText, meaningJudgment);
		const testCaseResult: SimplifiedTechnicalEnglishRewriteTestCaseResult = {
			test_case_id: testCase.id,
			split: testCase.split,
			source_text: testCase.source_text,
			rewritten_text: rewrittenText,
			is_skill_loaded: harnessRunResult.evidence.includes(targetSkillName),
			meaning_judgment: meaningJudgment,
			rule_checks: ruleChecks,
			passed_rule_count: ruleChecks.filter((ruleCheck) => ruleCheck.is_passed === true).length,
			evidence: harnessRunResult.evidence,
			error_message: errorMessage,
			duration_milliseconds: Date.now() - startTime,
		};
		return testCaseResult;
	}
}
