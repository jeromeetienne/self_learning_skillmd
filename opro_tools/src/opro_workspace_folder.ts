import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import { GitCommand } from './git_command.js';
import { OproTargetFileReader } from './opro_target_file.js';
import type { FileChange, OproTargetFile, TestCase } from './opro_target_file.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproWorkspaceFolder — builds the folder where a harness runs one test case of one version of the target skill
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The folder names where each harness reads the installed skills of a project. */
const HARNESS_SKILLS_PARENT_FOLDER_NAMES = ['.claude', '.agents'];

/** The record that `make-workspace` writes, and that `run-target-skill` reads. */
export type OproWorkspaceRecord = {
	/** The name of the test case. */
	test_case_id: string,
	/** The skill that the test case runs. */
	target_skill_name: string,
	/** The folder where the harness runs. */
	project_folder_path: string,
	/** The whole message that the user sends to the harness. */
	user_message: string,
	/** The tools that Claude Code may call without a question. */
	claude_allowed_tool_names: string[],
	/** The time after which the harness is stopped. */
	timeout_milliseconds: number,
};

/**
 * Builds the workspace of one test case from the recipe of `opro_target.json`: a temporary folder that holds the
 * record of the workspace and a `project/` folder, where the harness runs. The project holds the copied folder of the
 * recipe, a git repository when the recipe asks for one, the file changes of the test case, and the skills of the
 * version under test. The skills are excluded from git, so that they never appear in the staged changes.
 */
export class OproWorkspaceFolder {
	/**
	 * Builds the workspace of one test case.
	 *
	 * @param options The options of the workspace.
	 * @param options.targetFolderPath The folder of the target skill, which holds `opro_target.json`.
	 * @param options.skillsFolderPath The folder that holds one folder for each skill, with the version under test.
	 * @param options.testCaseId The name of the test case.
	 * @param options.workspaceParentFolderPath The folder that holds the workspace, or `null` for the temporary
	 * folder of the operating system.
	 * @returns The record of the workspace, and the folder that holds it.
	 */
	static make({ targetFolderPath, skillsFolderPath, testCaseId, workspaceParentFolderPath }: {
		targetFolderPath: string,
		skillsFolderPath: string,
		testCaseId: string,
		workspaceParentFolderPath: string | null,
	}): {
		workspaceFolderPath: string,
		workspaceRecord: OproWorkspaceRecord,
	} {
		const oproTargetFile = OproTargetFileReader.readTargetFile(targetFolderPath);
		const testCase = OproTargetFileReader.readTestCase(targetFolderPath, testCaseId);

		const parentFolderPath = workspaceParentFolderPath ?? Os.tmpdir();
		Fs.mkdirSync(parentFolderPath, {
			recursive: true,
		});
		const workspaceFolderPath = Fs.mkdtempSync(Path.join(parentFolderPath, 'opro_workspace_'));
		const projectFolderPath = Path.join(workspaceFolderPath, 'project');
		Fs.mkdirSync(projectFolderPath);

		OproWorkspaceFolder._copyFolder(targetFolderPath, oproTargetFile, projectFolderPath);
		OproWorkspaceFolder._startGitRepository(oproTargetFile, projectFolderPath, testCase);
		OproWorkspaceFolder._installSkills(skillsFolderPath, projectFolderPath);
		OproWorkspaceFolder._applyFileChanges(projectFolderPath, testCase.file_changes);
		OproWorkspaceFolder._stageFileChanges(oproTargetFile, projectFolderPath);

		const workspaceRecord: OproWorkspaceRecord = {
			test_case_id: testCase.id,
			target_skill_name: oproTargetFile.target_skill_name,
			project_folder_path: projectFolderPath,
			user_message: testCase.user_message === ''
				? oproTargetFile.user_message_prefix
				: `${oproTargetFile.user_message_prefix}\n\n${testCase.user_message}`,
			claude_allowed_tool_names: oproTargetFile.claude_allowed_tool_names,
			timeout_milliseconds: oproTargetFile.timeout_milliseconds,
		};
		Fs.writeFileSync(
			Path.join(workspaceFolderPath, 'opro_workspace.json'),
			JSON.stringify(workspaceRecord, null, '\t') + '\n',
		);
		return {
			workspaceFolderPath: workspaceFolderPath,
			workspaceRecord: workspaceRecord,
		};
	}

	/**
	 * Reads the record that `make-workspace` wrote into one workspace folder.
	 *
	 * @param workspaceFolderPath The folder of the workspace.
	 * @returns The record of the workspace.
	 */
	static readRecord(workspaceFolderPath: string): OproWorkspaceRecord {
		const filePath = Path.join(workspaceFolderPath, 'opro_workspace.json');
		return JSON.parse(Fs.readFileSync(filePath, 'utf8')) as OproWorkspaceRecord;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Copies the folder of the recipe into the project.
	 *
	 * @param targetFolderPath The folder of the target skill.
	 * @param oproTargetFile The target file.
	 * @param projectFolderPath The folder of the project.
	 * @returns Nothing.
	 */
	static _copyFolder(targetFolderPath: string, oproTargetFile: OproTargetFile, projectFolderPath: string): void {
		const copyFolderPath = oproTargetFile.workspace_recipe.copy_folder_path;
		if (copyFolderPath === null) {
			return;
		}
		Fs.cpSync(Path.resolve(targetFolderPath, copyFolderPath), projectFolderPath, {
			recursive: true,
		});
	}

	/**
	 * Starts the git repository of the recipe, with one commit of every copied file, and the branch of the test case.
	 *
	 * @param oproTargetFile The target file.
	 * @param projectFolderPath The folder of the project.
	 * @param testCase The test case, which gives the branch name.
	 * @returns Nothing.
	 */
	static _startGitRepository(
		oproTargetFile: OproTargetFile,
		projectFolderPath: string,
		testCase: TestCase,
	): void {
		const gitRepositoryRecipe = oproTargetFile.workspace_recipe.git_repository;
		if (gitRepositoryRecipe === null) {
			return;
		}
		const commitDate = gitRepositoryRecipe.commit_date;
		GitCommand.run(
			projectFolderPath,
			['init', '--quiet', '--initial-branch', gitRepositoryRecipe.initial_branch_name],
			commitDate,
		);
		GitCommand.run(projectFolderPath, ['add', '--all'], commitDate);
		GitCommand.run(
			projectFolderPath,
			['commit', '--quiet', '--message', gitRepositoryRecipe.first_commit_message],
			commitDate,
		);
		const branchName = testCase.branch_name;
		if (branchName !== null && branchName !== gitRepositoryRecipe.initial_branch_name) {
			GitCommand.run(projectFolderPath, ['switch', '--quiet', '--create', branchName], commitDate);
		}
	}

	/**
	 * Copies the skills of the version under test into the project, for both harnesses, and excludes them from git.
	 *
	 * @param skillsFolderPath The folder that holds one folder for each skill.
	 * @param projectFolderPath The folder of the project.
	 * @returns Nothing.
	 */
	static _installSkills(skillsFolderPath: string, projectFolderPath: string): void {
		const gitExcludeFilePath = Path.join(projectFolderPath, '.git', 'info', 'exclude');
		if (Fs.existsSync(gitExcludeFilePath) === true) {
			Fs.appendFileSync(gitExcludeFilePath, '.claude/\n.agents/\n');
		}
		for (const parentFolderName of HARNESS_SKILLS_PARENT_FOLDER_NAMES) {
			Fs.cpSync(skillsFolderPath, Path.join(projectFolderPath, parentFolderName, 'skills'), {
				recursive: true,
			});
		}
	}

	/**
	 * Applies every file change of the test case to the project.
	 *
	 * @param projectFolderPath The folder of the project.
	 * @param fileChanges The changes, applied in this order.
	 * @returns Nothing.
	 */
	static _applyFileChanges(projectFolderPath: string, fileChanges: FileChange[]): void {
		for (const fileChange of fileChanges) {
			OproWorkspaceFolder._applyFileChange(projectFolderPath, fileChange);
		}
	}

	/**
	 * Applies one change to one file of the project.
	 *
	 * @param projectFolderPath The folder of the project.
	 * @param fileChange The change.
	 * @returns Nothing.
	 */
	static _applyFileChange(projectFolderPath: string, fileChange: FileChange): void {
		const filePath = Path.join(projectFolderPath, fileChange.path);
		if (fileChange.old_text === null) {
			if (fileChange.new_text === null) {
				Fs.rmSync(filePath);
				return;
			}
			Fs.mkdirSync(Path.dirname(filePath), {
				recursive: true,
			});
			Fs.writeFileSync(filePath, fileChange.new_text);
			return;
		}
		if (fileChange.new_text === null) {
			throw new Error(`the change of ${fileChange.path} has an old_text and no new_text`);
		}
		const fileText = Fs.readFileSync(filePath, 'utf8');
		const occurrenceCount = fileText.split(fileChange.old_text).length - 1;
		if (occurrenceCount !== 1) {
			throw new Error(`the old_text of a change occurs ${occurrenceCount} times in ${fileChange.path}, not once`);
		}
		Fs.writeFileSync(filePath, fileText.replace(fileChange.old_text, () => {
			return fileChange.new_text ?? '';
		}));
	}

	/**
	 * Puts the file changes of the test case in the index of git, when the recipe asks for it.
	 *
	 * @param oproTargetFile The target file.
	 * @param projectFolderPath The folder of the project.
	 * @returns Nothing.
	 */
	static _stageFileChanges(oproTargetFile: OproTargetFile, projectFolderPath: string): void {
		const gitRepositoryRecipe = oproTargetFile.workspace_recipe.git_repository;
		if (gitRepositoryRecipe === null || gitRepositoryRecipe.stage_file_changes === false) {
			return;
		}
		GitCommand.run(projectFolderPath, ['add', '--all'], gitRepositoryRecipe.commit_date);
	}
}
