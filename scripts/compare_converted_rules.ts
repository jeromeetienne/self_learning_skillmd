import Fs from 'node:fs';
import Path from 'node:path';
import { OproRules } from '../opro_tools/src/opro_rules.js';
import type { RuleJudgment } from '../opro_tools/src/opro_rules.js';
import { OproTargetFileReader } from '../opro_tools/src/opro_target_file.js';

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	CompareConvertedRules — checks that the rules as data give the same verdict as the code that they replace
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The root of the repository. */
const REPOSITORY_FOLDER_PATH = Path.join(__dirname, '..');

/** One test case result of a score file that the old code wrote. */
type OldTestCaseResult = {
	/** The name of the test case. */
	test_case_id: string,
	/** The commit message of the commit message test. */
	commit_message?: string | null,
	/** The rewrite of the Simplified Technical English rewrite test. */
	rewritten_text?: string | null,
	/** The skill that the harness loaded, in the skill choice test. */
	chosen_skill_name?: string | null,
	/** `true` when the chosen skill is the expected skill, in the skill choice test. */
	is_correct?: boolean,
	/** The answer of the judge of the Simplified Technical English rewrite test. */
	meaning_judgment?: {
		/** `true` when the rewrite keeps the meaning. */
		is_meaning_kept: boolean,
		/** Why the judge decided so. */
		reason: string,
	} | null,
	/** The verdict of the old code for each rule. */
	rule_checks?: {
		/** The rule. */
		rule_name: string,
		/** `true` when the answer obeys the rule. */
		is_passed: boolean,
	}[],
	/** The reason why the harness or the judge failed. */
	error_message: string | null,
};

/** One test skill to compare: where its old score files are, and how to read the answer of a test case. */
type Comparison = {
	/** The name of the test skill. */
	testSkillName: string,
	/** The folder of the target skill, which holds `opro_target.json`. */
	targetFolderPath: string,
	/** The folders that hold the score files that the old code wrote. */
	scoreFolderPaths: string[],
	/** Reads the answer of one test case result of an old score file. */
	readAnswerFn: (oldTestCaseResult: OldTestCaseResult) => string | null,
	/** Reads the answer of the judge of one test case result, or `null` when the test skill has no judge. */
	readJudgmentFn: (oldTestCaseResult: OldTestCaseResult) => RuleJudgment | null,
	/** The name of the one rule, when the old score file holds a verdict and no rule checks. */
	singleRuleName: string | null,
};

/**
 * Checks that the rules of `opro_target.json` give the same verdict as the code of `test_skills/<name>/src/` that
 * they replace. It runs no harness: it reads the answers of the score files that the old code already wrote, and
 * checks the new rules on them. Milestone 1 of issue #4 asks for this check.
 */
class CompareConvertedRules {
	/**
	 * Compares the verdicts of every test skill, and writes what it found.
	 *
	 * @returns Nothing.
	 */
	static main(): void {
		const comparisons = CompareConvertedRules._buildComparisons();
		let totalCheckCount = 0;
		let totalMismatchCount = 0;
		for (const comparison of comparisons) {
			const { checkCount, mismatchLines } = CompareConvertedRules._compare(comparison);
			totalCheckCount += checkCount;
			totalMismatchCount += mismatchLines.length;
			console.log(`${comparison.testSkillName}: ${checkCount} rule checks, ${mismatchLines.length} mismatches`);
			for (const mismatchLine of mismatchLines.slice(0, 10)) {
				console.log(`  ${mismatchLine}`);
			}
			if (mismatchLines.length > 10) {
				console.log(`  and ${mismatchLines.length - 10} more mismatches`);
			}
		}
		console.log('');
		console.log(`total: ${totalCheckCount} rule checks, ${totalMismatchCount} mismatches`);
		if (totalMismatchCount > 0) {
			process.exitCode = 1;
		}
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Builds the comparison of each test skill.
	 *
	 * @returns The comparisons.
	 */
	static _buildComparisons(): Comparison[] {
		return [
			{
				testSkillName: 'commit_message',
				targetFolderPath: Path.join(REPOSITORY_FOLDER_PATH, 'test_skills', 'commit_message'),
				scoreFolderPaths: [
					Path.join(REPOSITORY_FOLDER_PATH, 'test_example_results'),
					Path.join(REPOSITORY_FOLDER_PATH, 'outputs', 'commit_message'),
				],
				readAnswerFn: (oldTestCaseResult) => oldTestCaseResult.commit_message ?? null,
				readJudgmentFn: () => null,
				singleRuleName: null,
			},
			{
				testSkillName: 'simplified_technical_english_rewrite',
				targetFolderPath: Path.join(
					REPOSITORY_FOLDER_PATH, 'test_skills', 'simplified_technical_english_rewrite'),
				scoreFolderPaths: [
					Path.join(REPOSITORY_FOLDER_PATH, 'test_example_results'),
					Path.join(REPOSITORY_FOLDER_PATH, 'outputs', 'simplified_technical_english_rewrite'),
				],
				readAnswerFn: (oldTestCaseResult) => oldTestCaseResult.rewritten_text ?? null,
				readJudgmentFn: (oldTestCaseResult) => {
					const meaningJudgment = oldTestCaseResult.meaning_judgment;
					if (meaningJudgment === null || meaningJudgment === undefined) {
						return null;
					}
					return {
						is_passed: meaningJudgment.is_meaning_kept,
						reason: meaningJudgment.reason,
					};
				},
				singleRuleName: null,
			},
			{
				testSkillName: 'skill_choice',
				targetFolderPath: Path.join(REPOSITORY_FOLDER_PATH, 'test_skills', 'skill_choice'),
				scoreFolderPaths: [Path.join(REPOSITORY_FOLDER_PATH, 'outputs', 'skill_choice')],
				readAnswerFn: (oldTestCaseResult) => oldTestCaseResult.chosen_skill_name ?? null,
				readJudgmentFn: () => null,
				singleRuleName: 'expected_skill',
			},
		];
	}

	/**
	 * Compares the verdicts of one test skill.
	 *
	 * @param comparison The comparison.
	 * @returns The number of rule checks, and one line for each mismatch.
	 */
	static _compare(comparison: Comparison): {
		checkCount: number,
		mismatchLines: string[],
	} {
		const oproTargetFile = OproTargetFileReader.readTargetFile(comparison.targetFolderPath);
		const testCases = OproTargetFileReader.readTestCases(comparison.targetFolderPath, null);
		const mismatchLines: string[] = [];
		let checkCount = 0;

		for (const scoreFilePath of CompareConvertedRules._findScoreFilePaths(comparison)) {
			const scoreRecord = JSON.parse(Fs.readFileSync(scoreFilePath, 'utf8')) as {
				test_case_results?: OldTestCaseResult[],
			};
			for (const oldTestCaseResult of scoreRecord.test_case_results ?? []) {
				const testCase = testCases.find((candidateTestCase) => {
					return candidateTestCase.id === oldTestCaseResult.test_case_id;
				});
				if (testCase === undefined) {
					continue;
				}
				const answerText = comparison.readAnswerFn(oldTestCaseResult);
				const judgeRuleName = oproTargetFile.rules.find((ruleDefinition) => {
					return ruleDefinition.checks.some((checkDefinition) => checkDefinition.kind === 'judge');
				})?.name;
				const judgmentByRuleName: Record<string, RuleJudgment | null> = {};
				if (judgeRuleName !== undefined) {
					judgmentByRuleName[judgeRuleName] = comparison.readJudgmentFn(oldTestCaseResult);
				}
				const newRuleChecks = OproRules.check({
					answerText: answerText,
					testCase: testCase,
					ruleDefinitions: oproTargetFile.rules,
					judgmentByRuleName: judgmentByRuleName,
					missingAnswerFailureReason: oproTargetFile.run_mode === 'skill_choice'
						? oldTestCaseResult.error_message
						: 'the harness gave no answer',
				});
				const oldVerdictByRuleName = CompareConvertedRules._readOldVerdicts(comparison, oldTestCaseResult);
				for (const newRuleCheck of newRuleChecks) {
					const oldVerdict = oldVerdictByRuleName[newRuleCheck.rule_name];
					if (oldVerdict === undefined) {
						continue;
					}
					checkCount += 1;
					if (oldVerdict !== newRuleCheck.is_passed) {
						mismatchLines.push(`${Path.basename(Path.dirname(scoreFilePath))}/`
							+ `${Path.basename(scoreFilePath)} ${oldTestCaseResult.test_case_id} `
							+ `${newRuleCheck.rule_name}: the code said ${oldVerdict}, the data says `
							+ `${newRuleCheck.is_passed}. Answer: ${JSON.stringify(answerText)?.slice(0, 200)}`);
					}
				}
			}
		}
		return {
			checkCount: checkCount,
			mismatchLines: mismatchLines,
		};
	}

	/**
	 * Reads the verdict of the old code for each rule of one test case result.
	 *
	 * @param comparison The comparison.
	 * @param oldTestCaseResult The test case result of an old score file.
	 * @returns The verdict of the old code, by the name of the rule.
	 */
	static _readOldVerdicts(
		comparison: Comparison,
		oldTestCaseResult: OldTestCaseResult,
	): Record<string, boolean> {
		if (comparison.singleRuleName !== null) {
			return {
				[comparison.singleRuleName]: oldTestCaseResult.is_correct === true,
			};
		}
		const verdictByRuleName: Record<string, boolean> = {};
		for (const oldRuleCheck of oldTestCaseResult.rule_checks ?? []) {
			verdictByRuleName[oldRuleCheck.rule_name] = oldRuleCheck.is_passed;
		}
		return verdictByRuleName;
	}

	/**
	 * Finds every score file of one test skill, in the folders of its comparison.
	 *
	 * @param comparison The comparison.
	 * @returns The paths of the score files.
	 */
	static _findScoreFilePaths(comparison: Comparison): string[] {
		const scoreFilePaths: string[] = [];
		for (const scoreFolderPath of comparison.scoreFolderPaths) {
			if (Fs.existsSync(scoreFolderPath) === false) {
				continue;
			}
			const entries = Fs.readdirSync(scoreFolderPath, {
				recursive: true,
				encoding: 'utf8',
			});
			for (const entry of entries) {
				if (entry.endsWith('.json') === false || entry.endsWith('opro_run.json') === true) {
					continue;
				}
				const entryPath = Path.join(scoreFolderPath, entry);
				if (entryPath.includes(comparison.testSkillName) === false
					&& scoreFolderPath.includes(comparison.testSkillName) === false) {
					continue;
				}
				scoreFilePaths.push(entryPath);
			}
		}
		return scoreFilePaths;
	}
}

CompareConvertedRules.main();
