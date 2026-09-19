import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import { GitCommand } from '../../_shared/src/git_command.js';
import type { FileChange } from './commit_message_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	CommitMessageWorkingFolder — creates the folder where a harness writes one commit message
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The date of the one commit of the base project. */
const BASE_COMMIT_DATE = '2026-06-10T10:00:00.000Z';

/** The message of the one commit of the base project. It has no style that a harness could copy. */
const BASE_COMMIT_MESSAGE = 'Create todo-cli with the add, done, delete, and list commands';

/**
 * Creates the folder where a harness writes one commit message, outside the repository: a git repository of the base
 * project with one commit, the changes of one test case in the index of git, and a copy of the skills in
 * `.claude/skills` for Claude Code and in `.agents/skills` for Codex. The skills are not in the repository and are
 * not staged.
 */
export class CommitMessageWorkingFolder {
	/**
	 * Creates the working folder of one test case.
	 *
	 * @param options The options of the working folder.
	 * @param options.baseProjectFolderPath The folder of the base project.
	 * @param options.skillsFolderPath The folder that holds one folder for each skill.
	 * @param options.fileChanges The changes that the test case stages.
	 * @returns The path of the working folder.
	 */
	static create({ baseProjectFolderPath, skillsFolderPath, fileChanges }: {
		baseProjectFolderPath: string,
		skillsFolderPath: string,
		fileChanges: FileChange[],
	}): string {
		const workingFolderPath = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'commit_message_'));
		Fs.cpSync(baseProjectFolderPath, workingFolderPath, {
			recursive: true,
		});
		GitCommand.run(workingFolderPath, ['init', '--quiet', '--initial-branch', 'main'], BASE_COMMIT_DATE);
		GitCommand.run(workingFolderPath, ['add', '--all'], BASE_COMMIT_DATE);
		GitCommand.run(workingFolderPath, ['commit', '--quiet', '--message', BASE_COMMIT_MESSAGE], BASE_COMMIT_DATE);

		Fs.appendFileSync(Path.join(workingFolderPath, '.git', 'info', 'exclude'), '.claude/\n.agents/\n');
		for (const harnessFolderName of ['.claude', '.agents']) {
			Fs.cpSync(skillsFolderPath, Path.join(workingFolderPath, harnessFolderName, 'skills'), {
				recursive: true,
			});
		}

		for (const fileChange of fileChanges) {
			CommitMessageWorkingFolder._applyFileChange(workingFolderPath, fileChange);
		}
		GitCommand.run(workingFolderPath, ['add', '--all'], BASE_COMMIT_DATE);
		return workingFolderPath;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Applies one change to one file of the working folder.
	 *
	 * @param workingFolderPath The working folder.
	 * @param fileChange The change.
	 * @returns Nothing.
	 */
	static _applyFileChange(workingFolderPath: string, fileChange: FileChange): void {
		const filePath = Path.join(workingFolderPath, fileChange.path);
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
}
