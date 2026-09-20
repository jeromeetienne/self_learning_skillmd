import Fs from 'node:fs';
import Path from 'node:path';
import { HarnessRun } from './harness_run.js';
import { HARNESS_MODEL_NAMES } from './harness_types.js';
import type { HarnessName } from './harness_types.js';
import { OproWorkspaceFolder } from './opro_workspace_folder.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproTargetSkillRun — runs one harness on one test case in a workspace, and writes what the harness answered
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The file where the whole result of the run is written, inside the workspace folder. */
const RESULT_FILE_NAME = 'opro_target_skill_run.json';

/** The whole result of one run of the target skill on one test case. */
export type OproTargetSkillRunRecord = {
	/** The name of the test case. */
	test_case_id: string,
	/** The harness that ran the target skill. */
	harness_name: HarnessName,
	/** The model that the harness ran. */
	model_name: string,
	/** The whole message that the user sent to the harness. */
	user_message: string,
	/** The last answer of the harness, or `null` when the harness gave no answer. */
	final_text: string | null,
	/** `true` when the commands and the tool calls of the harness name the target skill. */
	is_skill_loaded: boolean,
	/** The commands and the tool calls of the harness, one on each line. */
	evidence: string,
	/** The reason why the harness failed or ran out of time, or `null` when it did not. */
	error_message: string | null,
	/** How long the run took, in milliseconds. */
	duration_milliseconds: number,
};

/** Runs one harness on the test case of one workspace, until the end of its turn. */
export class OproTargetSkillRun {
	/**
	 * Runs the target skill on the test case of one workspace.
	 *
	 * @param options The options of the run.
	 * @param options.harnessName The harness that runs the target skill.
	 * @param options.workspaceFolderPath The folder that `make-workspace` built.
	 * @returns The whole result of the run, and the file where it was written.
	 */
	static async run({ harnessName, workspaceFolderPath }: {
		harnessName: HarnessName,
		workspaceFolderPath: string,
	}): Promise<{
		runRecord: OproTargetSkillRunRecord,
		resultFilePath: string,
	}> {
		const workspaceRecord = OproWorkspaceFolder.readRecord(workspaceFolderPath);
		const startTime = Date.now();
		const harnessRunResult = await HarnessRun.runToEnd({
			harnessName: harnessName,
			workingFolderPath: workspaceRecord.project_folder_path,
			userMessage: workspaceRecord.user_message,
			claudeAllowedToolNames: workspaceRecord.claude_allowed_tool_names,
			timeoutMilliseconds: workspaceRecord.timeout_milliseconds,
		});
		const runRecord: OproTargetSkillRunRecord = {
			test_case_id: workspaceRecord.test_case_id,
			harness_name: harnessName,
			model_name: HARNESS_MODEL_NAMES[harnessName],
			user_message: workspaceRecord.user_message,
			final_text: harnessRunResult.finalText,
			is_skill_loaded: harnessRunResult.evidence.includes(workspaceRecord.target_skill_name),
			evidence: harnessRunResult.evidence,
			error_message: harnessRunResult.errorMessage,
			duration_milliseconds: Date.now() - startTime,
		};
		const resultFilePath = Path.join(workspaceFolderPath, RESULT_FILE_NAME);
		Fs.writeFileSync(resultFilePath, JSON.stringify(runRecord, null, '\t') + '\n');
		return {
			runRecord: runRecord,
			resultFilePath: resultFilePath,
		};
	}
}
