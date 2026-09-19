import ChildProcess from 'node:child_process';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	GitCommand — runs git in a working folder with a fixed author, a fixed date, and no configuration of the user
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The author and the committer of every commit of a working folder. */
const GIT_AUTHOR_NAME = 'Test Author';

/** The email address of the author and the committer of every commit of a working folder. */
const GIT_AUTHOR_EMAIL = 'test.author@example.com';

/**
 * Runs git in a working folder. The git configuration of the user is ignored, so that no commit signature and no
 * hook runs, and every commit has the same author.
 */
export class GitCommand {
	/**
	 * Runs one git command, and returns what git writes on its standard output.
	 *
	 * @param folderPath The folder where git runs.
	 * @param gitArguments The arguments of git.
	 * @param commitDate The date of a commit that the command writes, as an ISO 8601 date and time.
	 * @returns The standard output of git.
	 */
	static run(folderPath: string, gitArguments: string[], commitDate: string): string {
		const outputText = ChildProcess.execFileSync('git', gitArguments, {
			cwd: folderPath,
			encoding: 'utf8',
			stdio: ['ignore', 'pipe', 'pipe'],
			env: {
				...process.env,
				GIT_CONFIG_GLOBAL: '/dev/null',
				GIT_CONFIG_NOSYSTEM: '1',
				GIT_AUTHOR_NAME: GIT_AUTHOR_NAME,
				GIT_AUTHOR_EMAIL: GIT_AUTHOR_EMAIL,
				GIT_COMMITTER_NAME: GIT_AUTHOR_NAME,
				GIT_COMMITTER_EMAIL: GIT_AUTHOR_EMAIL,
				GIT_AUTHOR_DATE: commitDate,
				GIT_COMMITTER_DATE: commitDate,
			},
		});
		return outputText;
	}
}
