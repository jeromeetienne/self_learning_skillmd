import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import { GitCommand } from '../../_shared/src/git_command.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SimplifiedTechnicalEnglishRewriteWorkingFolder — creates the folders where the harness rewrites and judges
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The date of the git commands of a working folder. No commit is written. */
const GIT_DATE = '2026-06-10T10:00:00.000Z';

/**
 * Creates the two temporary folders of one score, outside the repository, each an empty git repository: the rewrite
 * folder holds a copy of the skills in `.claude/skills` for Claude Code and in `.agents/skills` for Codex, and the
 * judge folder holds no skill.
 */
export class SimplifiedTechnicalEnglishRewriteWorkingFolder {
	/**
	 * Creates the folder where the harness rewrites each paragraph.
	 *
	 * @param skillsFolderPath The folder that holds one folder for each skill.
	 * @returns The path of the rewrite folder.
	 */
	static createRewriteFolder(skillsFolderPath: string): string {
		const rewriteFolderPath = SimplifiedTechnicalEnglishRewriteWorkingFolder._createGitFolder('rewrite_');
		for (const harnessFolderName of ['.claude', '.agents']) {
			Fs.cpSync(skillsFolderPath, Path.join(rewriteFolderPath, harnessFolderName, 'skills'), {
				recursive: true,
			});
		}
		return rewriteFolderPath;
	}

	/**
	 * Creates the folder where the harness judges each rewrite. It holds no skill.
	 *
	 * @returns The path of the judge folder.
	 */
	static createJudgeFolder(): string {
		return SimplifiedTechnicalEnglishRewriteWorkingFolder._createGitFolder('judge_');
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Creates an empty git repository in a new temporary folder. Without a git repository, Codex spends its first
	 * commands looking for one.
	 *
	 * @param folderNamePrefix The start of the name of the folder.
	 * @returns The path of the folder.
	 */
	static _createGitFolder(folderNamePrefix: string): string {
		const folderPath = Fs.mkdtempSync(Path.join(Os.tmpdir(), `simplified_technical_english_${folderNamePrefix}`));
		GitCommand.run(folderPath, ['init', '--quiet', '--initial-branch', 'main'], GIT_DATE);
		return folderPath;
	}
}
