import Path from 'node:path';
import * as Commander from 'commander';
import { HARNESS_MODEL_NAMES, HARNESS_NAMES } from '../../test_skills/_shared/src/harness_types.js';
import type { HarnessName } from '../../test_skills/_shared/src/harness_types.js';
import { OproLoop } from './opro_loop.js';
import { OproTargets } from './opro_targets.js';
import { TEST_SKILL_NAMES } from './opro_types.js';
import type { TestSkillName } from './opro_types.js';

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	RunOpro — the command that improves the target skill of one test skill with the OPRO loop
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The folder where each run folder is written. */
const OUTPUT_FOLDER_PATH = Path.join(__dirname, '..', '..', 'outputs', 'opro');

/**
 * The command `pnpm run run_opro --test-skill <name> --harness <claude|codex>`, which runs the OPRO loop, prints the
 * progress, and writes the run folder into `outputs/opro/`.
 */
export class RunOpro {
	/**
	 * Parses the command line, runs the OPRO loop, and prints the result.
	 *
	 * @param argv The command line of the process.
	 * @returns Nothing.
	 */
	static async main(argv: string[]): Promise<void> {
		const program = new Commander.Command()
			.name('run_opro')
			.description('Improves the target skill of one test skill with the OPRO loop.')
			.addOption(new Commander.Option('--test-skill <test skill name>', 'the test skill to improve')
				.choices(TEST_SKILL_NAMES)
				.makeOptionMandatory())
			.addOption(new Commander.Option('--harness <harness name>', 'the harness that proposes and scores')
				.choices(HARNESS_NAMES)
				.makeOptionMandatory())
			.option('--rounds <count>', 'the number of rounds', '3')
			.option('--versions-per-round <count>', 'the number of versions that each round proposes', '2')
			.option('--score-runs <count>', 'the number of runs of the test for each version, averaged', '1')
			.option('--concurrency <count>', 'the number of harnesses that run at the same time in one score', '4');
		program.parse(argv);
		const options = program.opts<{
			testSkill: TestSkillName,
			harness: HarnessName,
			rounds: string,
			versionsPerRound: string,
			scoreRuns: string,
			concurrency: string,
		}>();

		const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
		const runFolderPath = Path.join(OUTPUT_FOLDER_PATH, `${options.testSkill}_${options.harness}_${timestamp}`);
		console.log(`test skill ${options.testSkill}, harness ${options.harness}, model `
			+ `${HARNESS_MODEL_NAMES[options.harness]}`);
		console.log(`run folder: ${runFolderPath}`);

		const runRecord = await OproLoop.run({
			oproTarget: OproTargets.get(options.testSkill),
			harnessName: options.harness,
			roundCount: RunOpro._parsePositiveInteger('--rounds', options.rounds),
			versionCountPerRound: RunOpro._parsePositiveInteger('--versions-per-round', options.versionsPerRound),
			scoreRunCount: RunOpro._parsePositiveInteger('--score-runs', options.scoreRuns),
			concurrency: RunOpro._parsePositiveInteger('--concurrency', options.concurrency),
			runFolderPath: runFolderPath,
			onMessage: (message) => {
				console.log(message);
			},
		});

		console.log('');
		for (const oproVersion of runRecord.versions) {
			const scoreText = oproVersion.error_message === null
				? `${oproVersion.average_score_percent} percent (${oproVersion.score_percents.join(', ')})`
				: `error: ${oproVersion.error_message}`;
			console.log(`version ${oproVersion.version_number}, round ${oproVersion.round_number}: ${scoreText}`);
		}
		console.log(`best version: ${runRecord.best_version_number}`);
		console.log(`final check: first version ${runRecord.first_version_final_check_percent} percent, `
			+ `best version ${runRecord.best_version_final_check_percent} percent`);
		console.log(`best SKILL.md: ${Path.join(runFolderPath, 'best_SKILL.md')}`);
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Parses one option that must be a positive integer.
	 *
	 * @param optionName The name of the option, for the error message.
	 * @param optionText The text of the option.
	 * @returns The positive integer.
	 */
	static _parsePositiveInteger(optionName: string, optionText: string): number {
		const value = Number.parseInt(optionText, 10);
		if (Number.isInteger(value) === false || value < 1) {
			throw new Error(`${optionName} must be a positive integer, not ${optionText}`);
		}
		return value;
	}
}

await RunOpro.main(process.argv);
