import Fs from 'node:fs';
import Path from 'node:path';
import * as Commander from 'commander';
import { HARNESS_MODEL_NAMES, HARNESS_NAMES, SPLIT_NAMES } from '../../_shared/src/harness_types.js';
import type { HarnessName, SplitName } from '../../_shared/src/harness_types.js';
import { CommitMessageScore } from './commit_message_score.js';
import { RULE_NAMES } from './commit_message_types.js';
import type { CommitMessageTestCaseResult } from './commit_message_types.js';

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ScoreTheCommitMessage — the command that scores the skills of the commit message test with one harness
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The folder of the commit message test, which holds this `src/` folder. */
const COMMIT_MESSAGE_FOLDER_PATH = Path.join(__dirname, '..');

/** The folder where each score file is written. */
const OUTPUT_FOLDER_PATH = Path.join(COMMIT_MESSAGE_FOLDER_PATH, '..', '..', 'outputs', 'commit_message');

/**
 * The command `pnpm run score_the_commit_message --harness <claude|codex>`, which scores the skills of the commit
 * message test, prints each result, and writes the score file into `outputs/commit_message/`.
 */
export class ScoreTheCommitMessage {
	/**
	 * Parses the command line, runs the score, prints it, and writes the score file.
	 *
	 * @param argv The command line of the process.
	 * @returns Nothing.
	 */
	static async main(argv: string[]): Promise<void> {
		const program = new Commander.Command()
			.name('score_the_commit_message')
			.description('Scores the skills of the commit message test with one harness.')
			.addOption(new Commander.Option('--harness <harness name>', 'the harness that writes the commit messages')
				.choices(HARNESS_NAMES)
				.makeOptionMandatory())
			.addOption(new Commander.Option('--split <split name>', 'the group of test cases to run')
				.choices([...SPLIT_NAMES, 'all'])
				.default('optimization'))
			.option('--test-case-ids <test case id...>', 'run only these test cases, in any group')
			.option('--skills-folder <path>', 'the folder that holds one folder for each skill',
				Path.join(COMMIT_MESSAGE_FOLDER_PATH, 'dotagents_folder', 'skills'))
			.option('--concurrency <count>', 'the number of harnesses that run at the same time', '4');
		program.parse(argv);
		const options = program.opts<{
			harness: HarnessName,
			split: SplitName | 'all',
			testCaseIds: string[] | undefined,
			skillsFolder: string,
			concurrency: string,
		}>();

		const splitNames: SplitName[] = options.split === 'all' ? [...SPLIT_NAMES] : [options.split];
		const concurrency = Number.parseInt(options.concurrency, 10);
		if (Number.isInteger(concurrency) === false || concurrency < 1) {
			throw new Error(`--concurrency must be a positive integer, not ${options.concurrency}`);
		}

		console.log(`harness ${options.harness}, model ${HARNESS_MODEL_NAMES[options.harness]}`);
		const scoreRecord = await CommitMessageScore.score({
			harnessName: options.harness,
			skillsFolderPath: Path.resolve(options.skillsFolder),
			baseProjectFolderPath: Path.join(COMMIT_MESSAGE_FOLDER_PATH, 'base_project'),
			testCasesFilePath: Path.join(COMMIT_MESSAGE_FOLDER_PATH, 'test_cases.json'),
			splitNames: splitNames,
			testCaseIds: options.testCaseIds ?? null,
			concurrency: concurrency,
			onTestCaseResult: (testCaseResult) => {
				console.log(ScoreTheCommitMessage._formatTestCaseResult(testCaseResult));
			},
		});

		Fs.mkdirSync(OUTPUT_FOLDER_PATH, {
			recursive: true,
		});
		const timestamp = scoreRecord.started_at.replace(/[:.]/g, '-');
		const scoreFilePath = Path.join(OUTPUT_FOLDER_PATH, `${options.harness}_${timestamp}.json`);
		Fs.writeFileSync(scoreFilePath, JSON.stringify(scoreRecord, null, '\t') + '\n');

		console.log('');
		for (const ruleName of RULE_NAMES) {
			console.log(`${ruleName}: ${scoreRecord.passed_count_by_rule[ruleName]} of ${scoreRecord.test_case_count}`);
		}
		console.log(`score: ${scoreRecord.passed_rule_check_count} of ${scoreRecord.rule_check_count} rule checks, `
			+ `${scoreRecord.score_percent} percent, ${scoreRecord.perfect_test_case_count} perfect test cases, `
			+ `${scoreRecord.error_count} errors, ${scoreRecord.skill_not_loaded_count} without the skill`);
		console.log(`score file: ${scoreFilePath}`);
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Writes one test case result as a few lines of text: the count of rules, the first line of the commit message,
	 * and the reason of each failed rule.
	 *
	 * @param testCaseResult The result of one test case.
	 * @returns The lines of text.
	 */
	static _formatTestCaseResult(testCaseResult: CommitMessageTestCaseResult): string {
		const seconds = Math.round(testCaseResult.duration_milliseconds / 1000);
		const firstLine = (testCaseResult.commit_message ?? '').split('\n')[0] ?? '';
		const lines = [
			`${testCaseResult.passed_rule_count} of ${RULE_NAMES.length} ${testCaseResult.test_case_id}`
				+ ` (${seconds} seconds${testCaseResult.is_skill_loaded ? '' : ', skill not loaded'}): ${firstLine}`,
		];
		for (const ruleCheck of testCaseResult.rule_checks) {
			if (ruleCheck.failure_reason !== null) {
				lines.push(`        ${ruleCheck.rule_name}: ${ruleCheck.failure_reason}`);
			}
		}
		if (testCaseResult.error_message !== null) {
			lines.push(`        error: ${testCaseResult.error_message}`);
		}
		return lines.join('\n');
	}
}

await ScoreTheCommitMessage.main(process.argv);
