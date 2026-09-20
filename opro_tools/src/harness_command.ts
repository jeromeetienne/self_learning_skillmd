import { HARNESS_MODEL_NAMES } from './harness_types.js';
import type { HarnessName } from './harness_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	HarnessCommand — builds the command line of one harness, with its fixed model
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The program and the arguments that start one harness. */
export type HarnessCommandLine = {
	/** The program to start. */
	command: string,
	/** The arguments of the program. */
	commandArguments: string[],
};

/**
 * Builds the command line of `claude` or `codex`. The model is fixed for each harness, and no option changes it.
 * Both harnesses write JSON Lines, ignore the settings of the user, and cannot change a file.
 */
export class HarnessCommand {
	/**
	 * Builds the command line of one harness.
	 *
	 * @param options The options of the command line.
	 * @param options.harnessName The harness to run.
	 * @param options.userMessage The message that the user sends to the harness.
	 * @param options.claudeAllowedToolNames The tools that Claude Code may call without a question, such as
	 * `Bash(git diff:*)`. Claude Code in `--print` mode refuses every other tool that needs a permission. Codex
	 * ignores this list, because its read-only sandbox already lets it run every command that reads.
	 * @returns The program and its arguments.
	 */
	static build({ harnessName, userMessage, claudeAllowedToolNames }: {
		harnessName: HarnessName,
		userMessage: string,
		claudeAllowedToolNames: string[],
	}): HarnessCommandLine {
		if (harnessName === 'claude') {
			const allowedToolArguments = claudeAllowedToolNames.length > 0
				? ['--allowedTools', claudeAllowedToolNames.join(',')]
				: [];
			return {
				command: 'claude',
				commandArguments: [
					'--print',
					'--model', HARNESS_MODEL_NAMES.claude,
					'--output-format', 'stream-json',
					'--verbose',
					'--no-session-persistence',
					...allowedToolArguments,
					'--setting-sources', 'project,local',
					userMessage,
				],
			};
		}
		return {
			command: 'codex',
			commandArguments: [
				'exec',
				'--json',
				'--ephemeral',
				'--skip-git-repo-check',
				'--ignore-user-config',
				'--sandbox', 'read-only',
				'--model', HARNESS_MODEL_NAMES.codex,
				userMessage,
			],
		};
	}
}
