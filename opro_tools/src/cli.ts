import Fs from 'node:fs';
import Path from 'node:path';
import * as Commander from 'commander';
import { HARNESS_NAMES, SPLIT_NAMES } from './harness_types.js';
import type { HarnessName, SplitName } from './harness_types.js';
import { OproMetaPrompt } from './opro_meta_prompt.js';
import { OproRunRecord } from './opro_run_record.js';
import { OproScoreVersion } from './opro_score_version.js';
import { OproSkillFile } from './opro_skill_file.js';
import { OproTargetFileReader } from './opro_target_file.js';
import { OproTargetSkillRun } from './opro_target_skill_run.js';
import { OproWorkspaceFolder } from './opro_workspace_folder.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproToolsCli — the command line of the generic tools that the OPRO optimizer skill runs with npx
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The command line `npx skillmd_opro_tools <tool name> ...`. Each tool writes one JSON object on its standard output,
 * and its progress on its standard error, so that the agent that runs the OPRO optimizer skill reads one small
 * result and never the whole answer of every test case.
 */
export class OproToolsCli {
	/**
	 * Parses the command line and runs one tool.
	 *
	 * @param argv The command line of the process.
	 * @returns Nothing.
	 */
	static async main(argv: string[]): Promise<void> {
		const program = new Commander.Command()
			.name('skillmd_opro_tools')
			.description('The generic tools of the OPRO optimizer skill.');

		OproToolsCli._addMakeWorkspace(program);
		OproToolsCli._addRunTargetSkill(program);
		OproToolsCli._addScoreVersion(program);
		OproToolsCli._addSkillPartTools(program);
		OproToolsCli._addRecordVersion(program);
		OproToolsCli._addBuildMetaPrompt(program);

		await program.parseAsync(argv);
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	The tools
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Adds the tool `make-workspace`.
	 *
	 * @param program The command line.
	 * @returns Nothing.
	 */
	static _addMakeWorkspace(program: Commander.Command): void {
		program.command('make-workspace')
			.description('Builds the workspace of one test case, where a harness runs the target skill.')
			.requiredOption('--target-folder <path>', 'the folder of the target skill, which holds opro_target.json')
			.requiredOption('--skills-folder <path>', 'the folder of the skills of the version under test')
			.requiredOption('--test-case-id <id>', 'the name of the test case')
			.option('--workspace-parent-folder <path>', 'the folder that holds the workspace, instead of the '
				+ 'temporary folder of the operating system')
			.action((options: {
				targetFolder: string,
				skillsFolder: string,
				testCaseId: string,
				workspaceParentFolder?: string,
			}) => {
				const { workspaceFolderPath, workspaceRecord } = OproWorkspaceFolder.make({
					targetFolderPath: Path.resolve(options.targetFolder),
					skillsFolderPath: Path.resolve(options.skillsFolder),
					testCase: options.testCaseId,
					workspaceParentFolderPath: options.workspaceParentFolder === undefined
						? null
						: Path.resolve(options.workspaceParentFolder),
				});
				OproToolsCli._printJson({
					workspace_folder_path: workspaceFolderPath,
					project_folder_path: workspaceRecord.project_folder_path,
					test_case_id: workspaceRecord.test_case_id,
					user_message: workspaceRecord.user_message,
				});
			});
	}

	/**
	 * Adds the tool `run-target-skill`.
	 *
	 * @param program The command line.
	 * @returns Nothing.
	 */
	static _addRunTargetSkill(program: Commander.Command): void {
		program.command('run-target-skill')
			.description('Runs one harness on the test case of one workspace, until the end of its turn.')
			.addOption(new Commander.Option('--harness <harness name>', 'the harness that runs the target skill')
				.choices(HARNESS_NAMES)
				.makeOptionMandatory())
			.requiredOption('--workspace-folder <path>', 'the folder that make-workspace built')
			.action(async (options: {
				harness: HarnessName,
				workspaceFolder: string,
			}) => {
				const { runRecord, resultFilePath } = await OproTargetSkillRun.run({
					harnessName: options.harness,
					workspaceFolderPath: Path.resolve(options.workspaceFolder),
				});
				OproToolsCli._printJson({
					test_case_id: runRecord.test_case_id,
					harness_name: runRecord.harness_name,
					model_name: runRecord.model_name,
					final_text: runRecord.final_text,
					is_skill_loaded: runRecord.is_skill_loaded,
					error_message: runRecord.error_message,
					duration_milliseconds: runRecord.duration_milliseconds,
					result_file_path: resultFilePath,
				});
			});
	}

	/**
	 * Adds the tool `score-version`.
	 *
	 * @param program The command line.
	 * @returns Nothing.
	 */
	static _addScoreVersion(program: Commander.Command): void {
		program.command('score-version')
			.description('Runs every test case of one group on one version, and writes the score file.')
			.addOption(new Commander.Option('--harness <harness name>', 'the harness that runs the target skill')
				.choices(HARNESS_NAMES)
				.makeOptionMandatory())
			.requiredOption('--target-folder <path>', 'the folder of the target skill, which holds opro_target.json')
			.requiredOption('--skills-folder <path>', 'the folder of the skills of the version to score')
			.addOption(new Commander.Option('--split <group name>', 'the group of test cases to run')
				.choices(SPLIT_NAMES)
				.default('optimization'))
			.requiredOption('--output-file <path>', 'the file where the whole score record is written')
			.option('--test-case-ids <id...>', 'the test cases to run, instead of the whole group')
			.option('--concurrency <count>', 'the number of test cases that run at the same time', '4')
			.option('--keep-workspaces', 'leave the workspace folder of each test case on the disk')
			.action(async (options: {
				harness: HarnessName,
				targetFolder: string,
				skillsFolder: string,
				split: SplitName,
				outputFile: string,
				testCaseIds?: string[],
				concurrency: string,
				keepWorkspaces?: boolean,
			}) => {
				let finishedCount = 0;
				const scoreRecord = await OproScoreVersion.score({
					harnessName: options.harness,
					targetFolderPath: Path.resolve(options.targetFolder),
					skillsFolderPath: Path.resolve(options.skillsFolder),
					splitNames: [options.split],
					testCaseIds: options.testCaseIds ?? null,
					concurrency: OproToolsCli._parsePositiveInteger('--concurrency', options.concurrency),
					keepWorkspaces: options.keepWorkspaces === true,
					onTestCaseResult: (testCaseResult) => {
						finishedCount += 1;
						process.stderr.write(`${finishedCount} ${testCaseResult.test_case_id}: `
							+ `${testCaseResult.passed_rule_count} of ${testCaseResult.rule_checks.length} rules\n`);
					},
				});
				const outputFilePath = Path.resolve(options.outputFile);
				Fs.mkdirSync(Path.dirname(outputFilePath), {
					recursive: true,
				});
				Fs.writeFileSync(outputFilePath, JSON.stringify(scoreRecord, null, '\t') + '\n');
				OproToolsCli._printJson({
					score_percent: scoreRecord.score_percent,
					split_name: options.split,
					test_case_count: scoreRecord.test_case_count,
					rule_check_count: scoreRecord.rule_check_count,
					passed_rule_check_count: scoreRecord.passed_rule_check_count,
					passed_count_by_rule: scoreRecord.passed_count_by_rule,
					error_count: scoreRecord.error_count,
					skill_not_loaded_count: scoreRecord.skill_not_loaded_count,
					feedback_text: scoreRecord.feedback_text,
					score_file_path: outputFilePath,
				});
			});
	}

	/**
	 * Adds the tools `read-skill-part` and `write-skill-part`.
	 *
	 * @param program The command line.
	 * @returns Nothing.
	 */
	static _addSkillPartTools(program: Commander.Command): void {
		program.command('read-skill-part')
			.description('Reads the description field or the body of a SKILL.md file.')
			.requiredOption('--skill-file <path>', 'the SKILL.md file')
			.addOption(new Commander.Option('--part <part name>', 'the part to read')
				.choices(['description', 'body'])
				.default('body'))
			.action((options: {
				skillFile: string,
				part: 'description' | 'body',
			}) => {
				const skillFilePath = Path.resolve(options.skillFile);
				const skillText = Fs.readFileSync(skillFilePath, 'utf8');
				OproToolsCli._printJson({
					skill_file_path: skillFilePath,
					part_name: options.part,
					part_text: OproSkillFile.readPart(skillText, options.part),
				});
			});

		program.command('write-skill-part')
			.description('Replaces the description field or the body of a SKILL.md file, and keeps the other part.')
			.requiredOption('--skill-file <path>', 'the SKILL.md file to change')
			.addOption(new Commander.Option('--part <part name>', 'the part to replace')
				.choices(['description', 'body'])
				.default('body'))
			.requiredOption('--part-file <path>', 'the file that holds the new text of the part')
			.action((options: {
				skillFile: string,
				part: 'description' | 'body',
				partFile: string,
			}) => {
				const skillFilePath = Path.resolve(options.skillFile);
				const skillText = Fs.readFileSync(skillFilePath, 'utf8');
				const partText = Fs.readFileSync(Path.resolve(options.partFile), 'utf8').trim();
				const newSkillText = OproSkillFile.replacePart(skillText, options.part, partText);
				Fs.writeFileSync(skillFilePath, newSkillText);
				OproToolsCli._printJson({
					skill_file_path: skillFilePath,
					part_name: options.part,
					character_count: partText.length,
				});
			});
	}

	/**
	 * Adds the tool `record-version`.
	 *
	 * @param program The command line.
	 * @returns Nothing.
	 */
	static _addRecordVersion(program: Commander.Command): void {
		program.command('record-version')
			.description('Adds one version and its scores to opro_run.json, and chooses the best version.')
			.requiredOption('--run-folder <path>', 'the folder of the run')
			.requiredOption('--target-folder <path>', 'the folder of the target skill')
			.addOption(new Commander.Option('--harness <harness name>', 'the harness of the run')
				.choices(HARNESS_NAMES)
				.makeOptionMandatory())
			.requiredOption('--version-number <number>', 'the number of the version')
			.option('--round-number <number>', 'the round that proposed the version', '0')
			.option('--skills-folder <path>', 'the folder of the skills of the version')
			.option('--score-file <path...>', 'the score files of the version on the optimization group')
			.option('--final-check-score-file <path>', 'the score file of the version on the final_check group')
			.option('--harness-run-count <count>', 'the number of harness runs that the version cost', '0')
			.option('--error-message <text>', 'why the version was not scored')
			.action((options: {
				runFolder: string,
				targetFolder: string,
				harness: HarnessName,
				versionNumber: string,
				roundNumber: string,
				skillsFolder?: string,
				scoreFile?: string[],
				finalCheckScoreFile?: string,
				harnessRunCount: string,
				errorMessage?: string,
			}) => {
				OproToolsCli._recordVersion(options);
			});
	}

	/**
	 * Adds the tool `build-meta-prompt`.
	 *
	 * @param program The command line.
	 * @returns Nothing.
	 */
	static _addBuildMetaPrompt(program: Commander.Command): void {
		program.command('build-meta-prompt')
			.description('Writes the meta-prompt of OPRO from the scored history of one run.')
			.requiredOption('--run-folder <path>', 'the folder of the run')
			.option('--output-file <path>', 'the file where the meta-prompt is written')
			.action((options: {
				runFolder: string,
				outputFile?: string,
			}) => {
				const runFolderPath = Path.resolve(options.runFolder);
				const runRecord = OproRunRecord.read(runFolderPath, OproRunRecord.buildNewRecord({
					targetFolderPath: '',
					targetSkillName: '',
					skillPartName: 'body',
					harnessName: 'claude',
				}));
				const oproTargetFile = OproTargetFileReader.readTargetFile(runRecord.target_folder_path);
				const testExplanation = Fs.readFileSync(
					Path.resolve(runRecord.target_folder_path, oproTargetFile.test_explanation_file_path),
					'utf8',
				);
				const metaPrompt = OproMetaPrompt.build(runRecord, testExplanation);
				const outputFilePath = options.outputFile === undefined
					? Path.join(runFolderPath, 'meta_prompt.md')
					: Path.resolve(options.outputFile);
				Fs.writeFileSync(outputFilePath, metaPrompt + '\n');
				OproToolsCli._printJson({
					meta_prompt_file_path: outputFilePath,
					version_count: runRecord.versions.length,
					best_version_number: runRecord.best_version_number,
					character_count: metaPrompt.length,
				});
			});
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Adds one version to `opro_run.json`.
	 *
	 * @param options The options of the tool `record-version`.
	 * @returns Nothing.
	 */
	static _recordVersion(options: {
		runFolder: string,
		targetFolder: string,
		harness: HarnessName,
		versionNumber: string,
		roundNumber: string,
		skillsFolder?: string,
		scoreFile?: string[],
		finalCheckScoreFile?: string,
		harnessRunCount: string,
		errorMessage?: string,
	}): void {
		const runFolderPath = Path.resolve(options.runFolder);
		const targetFolderPath = Path.resolve(options.targetFolder);
		const oproTargetFile = OproTargetFileReader.readTargetFile(targetFolderPath);
		const runRecord = OproRunRecord.read(runFolderPath, OproRunRecord.buildNewRecord({
			targetFolderPath: targetFolderPath,
			targetSkillName: oproTargetFile.target_skill_name,
			skillPartName: oproTargetFile.skill_part_name,
			harnessName: options.harness,
		}));
		const versionNumber = OproToolsCli._parseNumber('--version-number', options.versionNumber);
		const earlierVersion = runRecord.versions.find((candidateVersion) => {
			return candidateVersion.version_number === versionNumber;
		});

		const scoreFilePaths = options.scoreFile ?? [];
		const scorePercents = scoreFilePaths.map((scoreFilePath) => {
			return OproToolsCli._readScoreFile(scoreFilePath).score_percent;
		});
		const lastScoreFilePath = scoreFilePaths[scoreFilePaths.length - 1];
		const feedbackText = lastScoreFilePath === undefined
			? (earlierVersion?.feedback_text ?? '')
			: OproToolsCli._readScoreFile(lastScoreFilePath).feedback_text;
		const skillsFolderPath = options.skillsFolder === undefined
			? (earlierVersion?.skills_folder_path ?? '')
			: Path.resolve(options.skillsFolder);
		const skillPartText = skillsFolderPath === ''
			? (earlierVersion?.skill_part_text ?? '')
			: OproSkillFile.readPart(
				Fs.readFileSync(Path.join(skillsFolderPath, oproTargetFile.target_skill_name, 'SKILL.md'), 'utf8'),
				oproTargetFile.skill_part_name,
			);
		const finalCheckPercent = options.finalCheckScoreFile === undefined
			? (earlierVersion?.final_check_percent ?? null)
			: OproToolsCli._readScoreFile(options.finalCheckScoreFile).score_percent;
		const allScorePercents = scorePercents.length === 0
			? (earlierVersion?.score_percents ?? [])
			: scorePercents;

		OproRunRecord.addVersion(runFolderPath, runRecord, {
			version_number: versionNumber,
			round_number: OproToolsCli._parseNumber('--round-number', options.roundNumber),
			skill_part_text: skillPartText,
			skills_folder_path: skillsFolderPath,
			score_percents: allScorePercents,
			average_score_percent: allScorePercents.length === 0
				? 0
				: Math.round(allScorePercents.reduce((total, scorePercent) => {
					return total + scorePercent;
				}, 0) / allScorePercents.length * 10) / 10,
			feedback_text: feedbackText,
			final_check_percent: finalCheckPercent,
			harness_run_count: OproToolsCli._parseNumber('--harness-run-count', options.harnessRunCount)
				+ (earlierVersion?.harness_run_count ?? 0),
			error_message: options.errorMessage ?? null,
		});

		OproToolsCli._printJson({
			run_record_file_path: Path.join(runFolderPath, 'opro_run.json'),
			best_version_number: runRecord.best_version_number,
			versions: runRecord.versions.map((versionRecord) => {
				return {
					version_number: versionRecord.version_number,
					round_number: versionRecord.round_number,
					average_score_percent: versionRecord.average_score_percent,
					score_percents: versionRecord.score_percents,
					final_check_percent: versionRecord.final_check_percent,
					error_message: versionRecord.error_message,
				};
			}),
		});
	}

	/**
	 * Reads one score file that `score-version` wrote.
	 *
	 * @param scoreFilePath The path of the score file.
	 * @returns The score and the failures.
	 */
	static _readScoreFile(scoreFilePath: string): {
		score_percent: number,
		feedback_text: string,
	} {
		return JSON.parse(Fs.readFileSync(Path.resolve(scoreFilePath), 'utf8')) as {
			score_percent: number,
			feedback_text: string,
		};
	}

	/**
	 * Writes one JSON object on the standard output.
	 *
	 * @param value The object to write.
	 * @returns Nothing.
	 */
	static _printJson(value: unknown): void {
		console.log(JSON.stringify(value, null, '\t'));
	}

	/**
	 * Parses one option that must be a whole number that is zero or more.
	 *
	 * @param optionName The name of the option, for the error message.
	 * @param optionText The text of the option.
	 * @returns The number.
	 */
	static _parseNumber(optionName: string, optionText: string): number {
		const value = Number.parseInt(optionText, 10);
		if (Number.isInteger(value) === false || value < 0) {
			throw new Error(`${optionName} must be a whole number that is zero or more, not ${optionText}`);
		}
		return value;
	}

	/**
	 * Parses one option that must be a positive whole number.
	 *
	 * @param optionName The name of the option, for the error message.
	 * @param optionText The text of the option.
	 * @returns The positive whole number.
	 */
	static _parsePositiveInteger(optionName: string, optionText: string): number {
		const value = Number.parseInt(optionText, 10);
		if (Number.isInteger(value) === false || value < 1) {
			throw new Error(`${optionName} must be a positive whole number, not ${optionText}`);
		}
		return value;
	}
}

await OproToolsCli.main(process.argv);
