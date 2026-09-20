import Path from 'node:path';
import * as Commander from 'commander';
import { HARNESS_NAMES } from './harness_types.js';
import type { HarnessName } from './harness_types.js';
import { OproTargetSkillRun } from './opro_target_skill_run.js';
import { OproWorkspaceFolder } from './opro_workspace_folder.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproToolsCli — the command line of the generic tools that the OPRO optimizer skill runs with npx
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * The command line `npx skillmd_opro_tools <tool name> ...`. Each tool writes one JSON object on its standard output,
 * so that the agent that runs the OPRO optimizer skill can read it.
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
					testCaseId: options.testCaseId,
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

		await program.parseAsync(argv);
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Writes one JSON object on the standard output.
	 *
	 * @param value The object to write.
	 * @returns Nothing.
	 */
	static _printJson(value: unknown): void {
		console.log(JSON.stringify(value, null, '\t'));
	}
}

await OproToolsCli.main(process.argv);
