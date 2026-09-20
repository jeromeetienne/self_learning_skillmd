import ChildProcess from 'node:child_process';
import Readline from 'node:readline';
import { z } from 'zod';
import { HarnessCommand } from './harness_command.js';
import type { HarnessName } from './harness_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	HarnessRun — runs one harness on one user message until the end of its turn, and reads its last answer
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The result of one harness run until the end of its turn. */
export type HarnessRunResult = {
	/** The last answer of the harness to the user, or `null` when the harness gave no answer. */
	finalText: string | null,
	/** The commands and the tool calls of the harness, one on each line. */
	evidence: string,
	/** The reason why the harness failed or ran out of time, or `null` when it did not. */
	errorMessage: string | null,
};

/** Zod schema of the Codex event that starts or completes one item: a shell command or an answer. */
const CodexItemEventSchema = z.object({
	/** The type of the event. */
	type: z.enum(['item.started', 'item.completed']),
	/** The item. */
	item: z.object({
		/** The type of the item, such as `command_execution` or `agent_message`. */
		type: z.string(),
		/** The shell command of a `command_execution` item. */
		command: z.string().optional(),
		/** The text of an `agent_message` item. */
		text: z.string().optional(),
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
	/** The last answer of the assistant. */
	result: z.string().optional(),
});

/**
 * Runs `claude` or `codex` on one user message in a working folder until the harness ends its turn, and returns the
 * last answer of the harness with the commands and the tool calls that led to it.
 */
export class HarnessRun {
	/**
	 * Runs one harness on one user message until the end of its turn.
	 *
	 * @param options The options of the run.
	 * @param options.harnessName The harness to run.
	 * @param options.workingFolderPath The folder where the harness runs.
	 * @param options.userMessage The message that the user sends to the harness.
	 * @param options.claudeAllowedToolNames The tools that Claude Code may call without a question.
	 * @param options.timeoutMilliseconds The time after which the harness is stopped and an error is recorded.
	 * @returns The last answer, the evidence, and the error.
	 */
	static async runToEnd({ harnessName, workingFolderPath, userMessage, claudeAllowedToolNames, timeoutMilliseconds }: {
		harnessName: HarnessName,
		workingFolderPath: string,
		userMessage: string,
		claudeAllowedToolNames: string[],
		timeoutMilliseconds: number,
	}): Promise<HarnessRunResult> {
		const { command, commandArguments } = HarnessCommand.build({
			harnessName: harnessName,
			userMessage: userMessage,
			claudeAllowedToolNames: claudeAllowedToolNames,
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
		let finalText: string | null = null;

		const runPromise = new Promise<HarnessRunResult>((resolve) => {
			const timeout = setTimeout(() => {
				resolve({
					finalText: finalText,
					evidence: evidenceLines.join('\n'),
					errorMessage: `the harness ran for more than ${timeoutMilliseconds} milliseconds`,
				});
			}, timeoutMilliseconds);

			const lineReader = Readline.createInterface({
				input: childProcess.stdout,
			});
			lineReader.on('line', (line) => {
				let event: unknown;
				try {
					event = JSON.parse(line);
				} catch {
					return;
				}
				const eventReading = harnessName === 'claude'
					? HarnessRun._readClaudeEvent(event)
					: HarnessRun._readCodexEvent(event);
				evidenceLines.push(...eventReading.evidenceLines);
				if (eventReading.answerText !== null) {
					finalText = eventReading.answerText;
				}
				if (eventReading.failureText !== null) {
					clearTimeout(timeout);
					resolve({
						finalText: finalText,
						evidence: evidenceLines.join('\n'),
						errorMessage: eventReading.failureText,
					});
					return;
				}
				if (eventReading.isEnd === true) {
					clearTimeout(timeout);
					resolve({
						finalText: finalText,
						evidence: evidenceLines.join('\n'),
						errorMessage: null,
					});
				}
			});

			childProcess.on('close', (exitCode) => {
				clearTimeout(timeout);
				resolve({
					finalText: finalText,
					evidence: evidenceLines.join('\n'),
					errorMessage: `the harness stopped with the exit code ${exitCode} before the end of its turn: `
						+ stderrText.trim(),
				});
			});
			childProcess.on('error', (error) => {
				clearTimeout(timeout);
				resolve({
					finalText: null,
					evidence: evidenceLines.join('\n'),
					errorMessage: `the harness did not start: ${error.message}`,
				});
			});
		});

		const harnessRunResult = await runPromise;
		if (childProcess.exitCode === null) {
			childProcess.kill('SIGTERM');
		}
		return harnessRunResult;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Reads one event of `codex exec --json`.
	 *
	 * @param event One parsed line of the output.
	 * @returns What the event holds.
	 */
	static _readCodexEvent(event: unknown): HarnessEventReading {
		const eventReading: HarnessEventReading = {
			evidenceLines: [],
			answerText: null,
			isEnd: false,
			failureText: null,
		};
		const itemEvent = CodexItemEventSchema.safeParse(event);
		if (itemEvent.success === true) {
			const item = itemEvent.data.item;
			if (itemEvent.data.type === 'item.started' && item.command !== undefined) {
				eventReading.evidenceLines.push(`command: ${item.command}`);
			}
			if (itemEvent.data.type === 'item.completed' && item.type === 'agent_message' && item.text !== undefined) {
				eventReading.answerText = item.text;
			}
			return eventReading;
		}

		const eventType = z.object({
			type: z.string(),
		}).safeParse(event);
		if (eventType.success === false) {
			return eventReading;
		}
		if (eventType.data.type === 'turn.completed') {
			eventReading.isEnd = true;
		}
		if (eventType.data.type === 'turn.failed' || eventType.data.type === 'error') {
			eventReading.failureText = JSON.stringify(event);
		}
		return eventReading;
	}

	/**
	 * Reads one event of `claude --print --output-format stream-json`.
	 *
	 * @param event One parsed line of the output.
	 * @returns What the event holds.
	 */
	static _readClaudeEvent(event: unknown): HarnessEventReading {
		const eventReading: HarnessEventReading = {
			evidenceLines: [],
			answerText: null,
			isEnd: false,
			failureText: null,
		};
		const assistantEvent = ClaudeAssistantEventSchema.safeParse(event);
		if (assistantEvent.success === true) {
			for (const block of assistantEvent.data.message.content) {
				const toolUse = ClaudeToolUseSchema.safeParse(block);
				if (toolUse.success === true) {
					eventReading.evidenceLines.push(`tool ${toolUse.data.name}: ${JSON.stringify(toolUse.data.input)}`);
				}
			}
			return eventReading;
		}

		const resultEvent = ClaudeResultEventSchema.safeParse(event);
		if (resultEvent.success === true) {
			if (resultEvent.data.is_error === true) {
				eventReading.failureText = JSON.stringify(event);
				return eventReading;
			}
			eventReading.answerText = resultEvent.data.result ?? null;
			eventReading.isEnd = true;
		}
		return eventReading;
	}
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Types
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** What one event of a harness holds. */
type HarnessEventReading = {
	/** The commands and the tool calls that the event starts. */
	evidenceLines: string[],
	/** The answer that the event holds, or `null` when it holds no answer. */
	answerText: string | null,
	/** `true` when the event ends the turn of the harness. */
	isEnd: boolean,
	/** The text of the failure, or `null` when the event is not a failure. */
	failureText: string | null,
};
