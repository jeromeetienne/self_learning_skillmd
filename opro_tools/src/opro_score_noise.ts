import Fs from 'node:fs';
import Path from 'node:path';
import type { HarnessName, SplitName } from './harness_types.js';
import { OproScoreVersion } from './opro_score_version.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproScoreNoise — measures how much the score of the same version moves between two runs of the same group
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The measured noise of the score of one target skill. */
export type OproScoreNoiseResult = {
	/** The score of each run, in the order of the runs. */
	scorePercents: number[],
	/** The average of the scores. */
	averageScorePercent: number,
	/** The standard deviation of the scores of the runs. */
	standardDeviationPercent: number,
	/**
	 * The standard deviation of the score that the movement of each test case gives, which reads far more than the
	 * few scores of the runs, and which three runs already measure.
	 */
	testCaseStandardDeviationPercent: number,
	/** The difference between the highest score and the lowest score. */
	spreadPercent: number,
	/**
	 * The number to write in `score_noise_percent` of `opro_target.json`: two times the higher of the two standard
	 * deviations above.
	 */
	scoreNoisePercent: number,
	/** The score files of the runs. */
	scoreFilePaths: string[],
	/** The number of harness runs that the measurement cost. */
	harnessRunCount: number,
};

/**
 * Measures the noise of the score of one target skill: runs the same version of the skills several times on the same
 * group of test cases, and reads how much the score moves. The OPRO loop needs this number to decide when two
 * versions are too close to be separated by one run each.
 */
export class OproScoreNoise {
	/**
	 * Measures the noise of the score.
	 *
	 * @param options The options of the measurement.
	 * @param options.harnessName The harness that runs the target skill and the judge.
	 * @param options.targetFolderPath The folder of the target skill.
	 * @param options.skillsFolderPath The folder of the skills of the version that runs every time.
	 * @param options.splitName The group of test cases to run.
	 * @param options.runCount How many times the group runs. Three runs are the fewest that say anything.
	 * @param options.concurrency The number of test cases that run at the same time.
	 * @param options.outputFolderPath The folder where the score file of each run is written.
	 * @param options.onRunFinished Called after each run, to show the progress.
	 * @returns The measured noise.
	 */
	static async measure({
		harnessName,
		targetFolderPath,
		skillsFolderPath,
		splitName,
		runCount,
		concurrency,
		outputFolderPath,
		onRunFinished,
	}: {
		harnessName: HarnessName,
		targetFolderPath: string,
		skillsFolderPath: string,
		splitName: SplitName,
		runCount: number,
		concurrency: number,
		outputFolderPath: string,
		onRunFinished: (runNumber: number, scorePercent: number) => void,
	}): Promise<OproScoreNoiseResult> {
		Fs.mkdirSync(outputFolderPath, {
			recursive: true,
		});
		const scorePercents: number[] = [];
		const scoreFilePaths: string[] = [];
		const passedRuleCountsByTestCase: Record<string, number[]> = {};
		let ruleCheckCount = 0;
		let harnessRunCount = 0;
		for (let runNumber = 1; runNumber <= runCount; runNumber += 1) {
			const scoreRecord = await OproScoreVersion.score({
				harnessName: harnessName,
				targetFolderPath: targetFolderPath,
				skillsFolderPath: skillsFolderPath,
				splitNames: [splitName],
				testCaseIds: null,
				concurrency: concurrency,
				stopBelowPercent: null,
				keepWorkspaces: false,
				onTestCaseResult: () => {
					return undefined;
				},
			});
			const scoreFilePath = Path.join(outputFolderPath, `noise_score_${runNumber}.json`);
			Fs.writeFileSync(scoreFilePath, JSON.stringify(scoreRecord, null, '\t') + '\n');
			ruleCheckCount = scoreRecord.rule_check_count;
			for (const testCaseResult of scoreRecord.test_case_results) {
				const passedRuleCounts = passedRuleCountsByTestCase[testCaseResult.test_case_id] ?? [];
				passedRuleCounts.push(testCaseResult.passed_rule_count);
				passedRuleCountsByTestCase[testCaseResult.test_case_id] = passedRuleCounts;
			}
			scorePercents.push(scoreRecord.score_percent);
			scoreFilePaths.push(scoreFilePath);
			harnessRunCount = harnessRunCount + scoreRecord.harness_run_count;
			onRunFinished(runNumber, scoreRecord.score_percent);
		}

		const averageScorePercent = scorePercents.reduce((total, scorePercent) => {
			return total + scorePercent;
		}, 0) / scorePercents.length;
		const variance = scorePercents.reduce((total, scorePercent) => {
			return total + (scorePercent - averageScorePercent) ** 2;
		}, 0) / scorePercents.length;
		const standardDeviationPercent = Math.sqrt(variance);
		const testCaseStandardDeviationPercent = OproScoreNoise._readTestCaseStandardDeviationPercent(
			passedRuleCountsByTestCase, ruleCheckCount);
		return {
			scorePercents: scorePercents,
			averageScorePercent: OproScoreNoise._round(averageScorePercent),
			standardDeviationPercent: OproScoreNoise._round(standardDeviationPercent),
			testCaseStandardDeviationPercent: OproScoreNoise._round(testCaseStandardDeviationPercent),
			spreadPercent: OproScoreNoise._round(Math.max(...scorePercents) - Math.min(...scorePercents)),
			scoreNoisePercent: OproScoreNoise._round(
				Math.max(standardDeviationPercent, testCaseStandardDeviationPercent) * 2),
			scoreFilePaths: scoreFilePaths,
			harnessRunCount: harnessRunCount,
		};
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Reads the standard deviation of the score from the movement of each test case: the variance of the score is the
	 * sum of the variances of the test cases, because the test cases run one apart from the other. Three runs of a
	 * group of fifteen test cases therefore give forty-five numbers, and not three, so the estimate says something
	 * even when the three scores of the runs land on the same number.
	 *
	 * @param passedRuleCountsByTestCase The number of rules that each test case obeyed, in each run.
	 * @param ruleCheckCount The number of rule checks of one run: the test cases multiplied by the rules.
	 * @returns The standard deviation of the score, in percent.
	 */
	static _readTestCaseStandardDeviationPercent(
		passedRuleCountsByTestCase: Record<string, number[]>,
		ruleCheckCount: number,
	): number {
		if (ruleCheckCount === 0) {
			return 0;
		}
		let variance = 0;
		for (const passedRuleCounts of Object.values(passedRuleCountsByTestCase)) {
			const averagePassedRuleCount = passedRuleCounts.reduce((total, passedRuleCount) => {
				return total + passedRuleCount;
			}, 0) / passedRuleCounts.length;
			variance = variance + passedRuleCounts.reduce((total, passedRuleCount) => {
				return total + (passedRuleCount - averagePassedRuleCount) ** 2;
			}, 0) / passedRuleCounts.length;
		}
		return Math.sqrt(variance) / ruleCheckCount * 100;
	}

	/**
	 * Rounds one percentage to one decimal.
	 *
	 * @param value The percentage.
	 * @returns The rounded percentage.
	 */
	static _round(value: number): number {
		return Math.round(value * 10) / 10;
	}
}
