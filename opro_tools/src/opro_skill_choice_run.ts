import ChildProcess from 'node:child_process';
import Readline from 'node:readline';
import { z } from 'zod';
import { HarnessCommand } from './harness_command.js';
import type { HarnessName } from './harness_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproSkillChoiceRun — runs one harness on one user message and reads which skill of the skills folder it loads
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The choice of skill of one run. */
export type OproSkillChoice = {
	/** The skill that the harness loaded, or `null` when it loaded no skill of the skills folder. */
	chosenSkillName: string | null,
	/** The commands and the tool calls of the harness, one on each line. */
	evidence: string,
	/** The reason why the harness failed or ran out of time, or `null` when it did not. */
	errorMessage: string | null,
};

/** The number of tool calls without a skill after which the harness is stopped, and no skill is recorded. */
const TOOL_CALL_COUNT_BEFORE_NO_SKILL = 3;

/** One event of a harness that matters for the choice of skill. */
type HarnessObservation = {
	/** `tool_call` for a command or a tool call, `end` when the harness ends its turn, `failure` for an error. */
	kind: 'tool_call' | 'end' | 'failure',
	/** For a `tool_call`, the skill that the call loads, or `null` when the call loads no skill. */
	skillName: string | null,
	/** The text of the event. */
	evidence: string,
};

/** Zod schema of the Codex event that starts a shell command. */
const CodexCommandStartedEventSchema = z.object({
	/** The type of the event. */
	type: z.literal('item.started'),
	/** The item that starts. */
	item: z.object({
		/** The type of the item. */
		type: z.literal('command_execution'),
		/** The shell command. */
		command: z.string(),
	}),
});

/** Zod schema of a Claude Code event that holds one message of the assistant. */
const ClaudeAssistantEventSchema = z.object({
	/** The type of the event. */
	type: z.literal('assistant'),
	/** The message of the assistant. */
	message: z.object({
		/** The blocks of the message: text, thinking, or tool calls. */
		content: z.array(z.unknown()),
	}),
});

/** Zod schema of one tool call in a message of the Claude Code assistant. */
const ClaudeToolUseSchema = z.object({
	/** The type of the block. */
	type: z.literal('tool_use'),
	/** The name of the tool. */
	name: z.string(),
	/** The input of the tool. */
	input: z.record(z.string(), z.unknown()),
});

/** Zod schema of the last event of a Claude Code run. */
const ClaudeResultEventSchema = z.object({
	/** The type of the event. */
	type: z.literal('result'),
	/** `true` when the run failed. */
	is_error: z.boolean().optional(),
});

/**
 * Runs `claude` or `codex` on one user message in a working folder, and stops the harness as soon as the choice of
 * skill is known. The choice is known at the first tool call that names a path of a skill of the skills folder under a `skills/`
 * folder, at any depth. A skill that is not a skill of the skills folder, such as a skill of the user, is not a choice. After
 * `TOOL_CALL_COUNT_BEFORE_NO_SKILL` tool calls with no skill of the skills folder, or when the harness ends its turn, the choice is
 * no skill.
 */
export class OproSkillChoiceRun {
	/**
	 * Runs one harness on one user message, and returns the skill that the harness loads.
	 *
	 * @param options The options of the run.
	 * @param options.harnessName The harness to run.
	 * @param options.workingFolderPath The folder that holds `.claude/skills` and `.agents/skills`, where the
	 * harness runs.
	 * @param options.userMessage The message that the user sends to the harness.
	 * @param options.skillNames The names of the skills of the skills folder, the only skills that count as a choice.
	 * @param options.timeoutMilliseconds The time after which the harness is stopped and an error is recorded.
	 * @returns The choice of skill.
	 */
	static async chooseSkill({ harnessName, workingFolderPath, userMessage, skillNames, timeoutMilliseconds }: {
		harnessName: HarnessName,
		workingFolderPath: string,
		userMessage: string,
		skillNames: string[],
		timeoutMilliseconds: number,
	}): Promise<OproSkillChoice> {
		const { command, commandArguments } = HarnessCommand.build({
			harnessName: harnessName,
			userMessage: userMessage,
			claudeAllowedToolNames: [],
		});
		const childProcess = ChildProcess.spawn(command, commandArguments, {
			cwd: workingFolderPath,
			stdio: ['ignore', 'pipe', 'pipe'],
		});

		let stderrText = '';
		childProcess.stderr.on('data', (chunk: Buffer) => {
			stderrText = (stderrText + chunk.toString()).slice(-2000);
		});

		const evidenceLines: string[] = [];
		let toolCallCount = 0;

		const choicePromise = new Promise<OproSkillChoice>((resolve) => {
			const timeout = setTimeout(() => {
				resolve({
					chosenSkillName: null,
					evidence: evidenceLines.join('\n'),
					errorMessage: `the harness ran for more than ${timeoutMilliseconds} milliseconds`,
				});
			}, timeoutMilliseconds);

			const lineReader = Readline.createInterface({
				input: childProcess.stdout,
			});
			lineReader.on('line', (line) => {
				const observations = OproSkillChoiceRun._readLine(harnessName, line, skillNames);
				for (const observation of observations) {
					evidenceLines.push(observation.evidence);
					if (observation.kind === 'failure') {
						clearTimeout(timeout);
						resolve({
							chosenSkillName: null,
							evidence: evidenceLines.join('\n'),
							errorMessage: observation.evidence,
						});
						return;
					}
					if (observation.kind === 'end') {
						clearTimeout(timeout);
						resolve({
							chosenSkillName: null,
							evidence: evidenceLines.join('\n'),
							errorMessage: null,
						});
						return;
					}
					if (observation.skillName !== null) {
						clearTimeout(timeout);
						resolve({
							chosenSkillName: observation.skillName,
							evidence: evidenceLines.join('\n'),
							errorMessage: null,
						});
						return;
					}
					toolCallCount += 1;
					if (toolCallCount >= TOOL_CALL_COUNT_BEFORE_NO_SKILL) {
						clearTimeout(timeout);
						resolve({
							chosenSkillName: null,
							evidence: evidenceLines.join('\n'),
							errorMessage: null,
						});
						return;
					}
				}
			});

			childProcess.on('close', (exitCode) => {
				clearTimeout(timeout);
				resolve({
					chosenSkillName: null,
					evidence: evidenceLines.join('\n'),
					errorMessage: `the harness stopped with the exit code ${exitCode} before a choice: ${stderrText.trim()}`,
				});
			});
			childProcess.on('error', (error) => {
				clearTimeout(timeout);
				resolve({
					chosenSkillName: null,
					evidence: evidenceLines.join('\n'),
					errorMessage: `the harness did not start: ${error.message}`,
				});
			});
		});

		const skillChoice = await choicePromise;
		if (childProcess.exitCode === null) {
			childProcess.kill('SIGTERM');
		}
		return skillChoice;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Reads one line of the JSON Lines output of a harness.
	 *
	 * @param harnessName The harness that wrote the line.
	 * @param line One line of the output.
	 * @param skillNames The names of the skills of the skills folder.
	 * @returns The observations of the line, empty when the line does not matter for the choice.
	 */
	static _readLine(harnessName: HarnessName, line: string, skillNames: string[]): HarnessObservation[] {
		let event: unknown;
		try {
			event = JSON.parse(line);
		} catch {
			return [];
		}
		if (harnessName === 'claude') {
			return OproSkillChoiceRun._readClaudeEvent(event, skillNames);
		}
		return OproSkillChoiceRun._readCodexEvent(event, skillNames);
	}

	/**
	 * Reads one event of `codex exec --json`. Codex has no skill tool: it loads a skill with a shell command that
	 * reads the `SKILL.md` file.
	 *
	 * @param event One parsed line of the output.
	 * @param skillNames The names of the skills of the skills folder.
	 * @returns The observations of the event.
	 */
	static _readCodexEvent(event: unknown, skillNames: string[]): HarnessObservation[] {
		const commandStarted = CodexCommandStartedEventSchema.safeParse(event);
		if (commandStarted.success === true) {
			const command = commandStarted.data.item.command;
			return [
				{
					kind: 'tool_call',
					skillName: OproSkillChoiceRun._findSkillName(command, skillNames),
					evidence: `command: ${command}`,
				},
			];
		}

		const eventType = z.object({
			type: z.string(),
		}).safeParse(event);
		if (eventType.success === false) {
			return [];
		}
		if (eventType.data.type === 'turn.completed') {
			return [
				{
					kind: 'end',
					skillName: null,
					evidence: 'the turn ended',
				},
			];
		}
		if (eventType.data.type === 'turn.failed' || eventType.data.type === 'error') {
			return [
				{
					kind: 'failure',
					skillName: null,
					evidence: JSON.stringify(event),
				},
			];
		}
		return [];
	}

	/**
	 * Reads one event of `claude --print --output-format stream-json`. Claude Code loads a skill with its `Skill`
	 * tool, or reads the `SKILL.md` file with another tool.
	 *
	 * @param event One parsed line of the output.
	 * @param skillNames The names of the skills of the skills folder.
	 * @returns The observations of the event.
	 */
	static _readClaudeEvent(event: unknown, skillNames: string[]): HarnessObservation[] {
		const assistantEvent = ClaudeAssistantEventSchema.safeParse(event);
		if (assistantEvent.success === true) {
			const observations: HarnessObservation[] = [];
			for (const block of assistantEvent.data.message.content) {
				const toolUse = ClaudeToolUseSchema.safeParse(block);
				if (toolUse.success === false) {
					continue;
				}
				const inputText = JSON.stringify(toolUse.data.input);
				let skillName = OproSkillChoiceRun._findSkillName(inputText, skillNames);
				const skillInput = toolUse.data.input.skill;
				if (toolUse.data.name === 'Skill' && typeof skillInput === 'string') {
					const skillToolName = skillInput.split(':').pop() ?? skillInput;
					skillName = skillNames.includes(skillToolName) ? skillToolName : null;
				}
				observations.push({
					kind: 'tool_call',
					skillName: skillName,
					evidence: `tool ${toolUse.data.name}: ${inputText}`,
				});
			}
			return observations;
		}

		const resultEvent = ClaudeResultEventSchema.safeParse(event);
		if (resultEvent.success === true) {
			if (resultEvent.data.is_error === true) {
				return [
					{
						kind: 'failure',
						skillName: null,
						evidence: JSON.stringify(event),
					},
				];
			}
			return [
				{
					kind: 'end',
					skillName: null,
					evidence: 'the turn ended',
				},
			];
		}
		return [];
	}

	/**
	 * Finds the first skill of the skills folder that a command or a tool input names in a path under a `skills/` folder, at any
	 * depth, such as `.agents/skills/release-notes/SKILL.md` or `~/.codex/skills/r2/release-notes`.
	 *
	 * @param text The command or the tool input.
	 * @param skillNames The names of the skills of the skills folder.
	 * @returns The skill name that comes first in the text, or `null` when the text names no skill of the skills folder.
	 */
	static _findSkillName(text: string, skillNames: string[]): string | null {
		let firstSkillName: string | null = null;
		let firstIndex = Number.POSITIVE_INFINITY;
		for (const skillName of skillNames) {
			const skillPathRegExp = new RegExp(`skills/(?:[^\\s'"]*/)?${skillName}(?=[/\\s'"\\\\]|$)`);
			const match = skillPathRegExp.exec(text);
			if (match !== null && match.index < firstIndex) {
				firstIndex = match.index;
				firstSkillName = skillName;
			}
		}
		return firstSkillName;
	}
}
