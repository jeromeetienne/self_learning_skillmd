import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import { z } from 'zod';
import { GitCommand } from './git_command.js';
import { HarnessRun } from './harness_run.js';
import type { HarnessName } from './harness_types.js';
import { OproRules } from './opro_rules.js';
import type { RuleJudgment } from './opro_rules.js';
import type { TestCase } from './opro_target_file.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproJudge — asks a second run of the same harness the question that no regular expression can answer
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The date of the git command that creates the folder of the judge. No commit is written. */
const GIT_DATE = '2026-06-10T10:00:00.000Z';

/** Zod schema of the answer of the judge. */
const JudgmentSchema = z.object({
	/** `true` when the answer obeys the rule. */
	is_passed: z.boolean(),
	/** Why the judge decided so, in one sentence. */
	reason: z.string(),
});

/** The result of one judgment. */
export type OproJudgeResult = {
	/** The answer of the judge, or `null` when the judge gave no answer that can be read. */
	judgment: RuleJudgment | null,
	/** The whole message that the judge read. */
	judgeMessage: string,
	/** The reason why the judge failed, or gave an answer that cannot be read, or `null` when it did not. */
	errorMessage: string | null,
};

/**
 * Asks a second run of the same harness, with the same fixed model, the question of the rubric file of the target
 * skill. The judge runs in an empty git repository with no skill, so that it never loads the skill that it judges,
 * and so that the harness never looks for a git repository.
 */
export class OproJudge {
	/**
	 * Judges one answer.
	 *
	 * @param options The options of the judgment.
	 * @param options.harnessName The harness that judges.
	 * @param options.rubricText The question of the judge, which can hold `{{field}}` of the test case and
	 * `{{answer}}`.
	 * @param options.testCase The test case.
	 * @param options.answerText The answer of the target skill.
	 * @param options.timeoutMilliseconds The time after which the judge is stopped.
	 * @returns The judgment, or the error.
	 */
	static async judge({ harnessName, rubricText, testCase, answerText, timeoutMilliseconds }: {
		harnessName: HarnessName,
		rubricText: string,
		testCase: TestCase,
		answerText: string,
		timeoutMilliseconds: number,
	}): Promise<OproJudgeResult> {
		const judgeMessage = OproRules.fillTemplate(rubricText, testCase, false)
			.replace(/\{\{answer\}\}/g, answerText);
		const judgeFolderPath = OproJudge._createJudgeFolder();
		try {
			const harnessRunResult = await HarnessRun.runToEnd({
				harnessName: harnessName,
				workingFolderPath: judgeFolderPath,
				userMessage: judgeMessage,
				claudeAllowedToolNames: [],
				timeoutMilliseconds: timeoutMilliseconds,
			});
			if (harnessRunResult.errorMessage !== null) {
				return {
					judgment: null,
					judgeMessage: judgeMessage,
					errorMessage: `the judge failed: ${harnessRunResult.errorMessage}`,
				};
			}
			const judgment = OproJudge._readJudgment(harnessRunResult.finalText);
			if (judgment === null) {
				return {
					judgment: null,
					judgeMessage: judgeMessage,
					errorMessage: `the answer of the judge is not a judgment: ${harnessRunResult.finalText}`,
				};
			}
			return {
				judgment: judgment,
				judgeMessage: judgeMessage,
				errorMessage: null,
			};
		} finally {
			Fs.rmSync(judgeFolderPath, {
				recursive: true,
				force: true,
			});
		}
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Creates the empty git repository with no skill where the judge runs.
	 *
	 * @returns The path of the folder.
	 */
	static _createJudgeFolder(): string {
		const judgeFolderPath = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'opro_judge_'));
		GitCommand.run(judgeFolderPath, ['init', '--quiet', '--initial-branch', 'main'], GIT_DATE);
		return judgeFolderPath;
	}

	/**
	 * Reads the judgment from the answer of the judge: the first JSON object of the answer.
	 *
	 * @param finalText The answer of the judge, or `null` when the judge gave no answer.
	 * @returns The judgment, or `null` when the answer holds no judgment.
	 */
	static _readJudgment(finalText: string | null): RuleJudgment | null {
		if (finalText === null) {
			return null;
		}
		const objectMatch = /\{[\s\S]*\}/.exec(finalText);
		if (objectMatch === null) {
			return null;
		}
		try {
			const parseResult = JudgmentSchema.safeParse(JSON.parse(objectMatch[0]));
			return parseResult.success === true ? parseResult.data : null;
		} catch {
			return null;
		}
	}
}
