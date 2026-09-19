import Fs from 'node:fs';
import Path from 'node:path';
import * as Commander from 'commander';
import { SkillChoiceScore } from './skill_choice_score.js';
import { HARNESS_MODEL_NAMES, HARNESS_NAMES, SPLIT_NAMES } from './skill_choice_types.js';
import type { HarnessName, SkillChoiceTestCaseResult, SplitName } from './skill_choice_types.js';

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	ScoreTheSkillChoice — the command that scores the skills of the skill choice test with one harness
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The folder of the skill choice test, which holds this `src/` folder. */
const SKILL_CHOICE_FOLDER_PATH = Path.join(__dirname, '..');

/** The folder where each score file is written. */
const OUTPUT_FOLDER_PATH = Path.join(SKILL_CHOICE_FOLDER_PATH, '..', '..', 'outputs', 'skill_choice');

/**
 * The command `pnpm run score_the_skill_choice --harness <claude|codex>`, which scores the skills of the skill choice
 * test, prints each result, and writes the score file into `outputs/skill_choice/`.
 */
export class ScoreTheSkillChoice {
	/**
	 * Parses the command line, runs the score, prints it, and writes the score file.
	 *
	 * @param argv The command line of the process.
	 * @returns Nothing.
	 */
	static async main(argv: string[]): Promise<void> {
		const program = new Commander.Command()
			.name('score_the_skill_choice')
			.description('Scores the skills of the skill choice test with one harness.')
			.addOption(new Commander.Option('--harness <harness name>', 'the harness that chooses the skills')
				.choices(HARNESS_NAMES)
				.makeOptionMandatory())
			.addOption(new Commander.Option('--split <split name>', 'the group of test cases to run')
				.choices([...SPLIT_NAMES, 'all'])
				.default('optimization'))
			.option('--test-case-ids <test case id...>', 'run only these test cases, in any group')
			.option('--skills-folder <path>', 'the folder that holds one folder for each skill',
				Path.join(SKILL_CHOICE_FOLDER_PATH, 'dotagents_folder', 'skills'))
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
		const scoreRecord = await SkillChoiceScore.score({
			harnessName: options.harness,
			skillsFolderPath: Path.resolve(options.skillsFolder),
			testCasesFilePath: Path.join(SKILL_CHOICE_FOLDER_PATH, 'test_cases.json'),
			splitNames: splitNames,
			testCaseIds: options.testCaseIds ?? null,
			concurrency: concurrency,
			onTestCaseResult: (testCaseResult) => {
				console.log(ScoreTheSkillChoice._formatTestCaseResult(testCaseResult));
			},
		});

		Fs.mkdirSync(OUTPUT_FOLDER_PATH, {
			recursive: true,
		});
		const timestamp = scoreRecord.started_at.replace(/[:.]/g, '-');
		const scoreFilePath = Path.join(OUTPUT_FOLDER_PATH, `${options.harness}_${timestamp}.json`);
		Fs.writeFileSync(scoreFilePath, JSON.stringify(scoreRecord, null, '\t') + '\n');

		console.log('');
		console.log(`score: ${scoreRecord.correct_count} of ${scoreRecord.test_case_count} correct, `
			+ `${scoreRecord.score_percent} percent, ${scoreRecord.error_count} errors`);
		console.log(`score file: ${scoreFilePath}`);
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Writes one test case result as one line of text.
	 *
	 * @param testCaseResult The result of one test case.
	 * @returns The line of text.
	 */
	static _formatTestCaseResult(testCaseResult: SkillChoiceTestCaseResult): string {
		const mark = testCaseResult.is_correct ? 'correct' : 'wrong  ';
		const seconds = Math.round(testCaseResult.duration_milliseconds / 1000);
		let line = `${mark} ${testCaseResult.test_case_id}: expected ${testCaseResult.expected_skill_name ?? 'no skill'}`
			+ `, chosen ${testCaseResult.chosen_skill_name ?? 'no skill'} (${seconds} seconds)`;
		if (testCaseResult.error_message !== null) {
			line += `\n        error: ${testCaseResult.error_message}`;
		}
		return line;
	}
}

await ScoreTheSkillChoice.main(process.argv);
