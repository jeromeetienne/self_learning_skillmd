import { HarnessRun } from '../../_shared/src/harness_run.js';
import type { HarnessName } from '../../_shared/src/harness_types.js';
import { MeaningJudgmentSchema } from './simplified_technical_english_rewrite_types.js';
import type { MeaningJudgment } from './simplified_technical_english_rewrite_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SimplifiedTechnicalEnglishRewriteMeaningJudge — asks a second harness run whether a rewrite keeps the meaning
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The result of one judgment. */
export type MeaningJudgeResult = {
	/** The answer of the judge, or `null` when the judge gave no answer that can be read. */
	meaningJudgment: MeaningJudgment | null,
	/** The reason why the judge failed, ran out of time, or gave an answer that cannot be read, or `null`. */
	errorMessage: string | null,
};

/**
 * Asks a second run of the same harness, with the same fixed model, whether a rewrite keeps every fact and every
 * instruction of its source. The judge runs in a folder with no skill, so that it never loads the skill that it judges.
 */
export class SimplifiedTechnicalEnglishRewriteMeaningJudge {
	/**
	 * Judges one rewrite.
	 *
	 * @param options The options of the judgment.
	 * @param options.harnessName The harness that judges.
	 * @param options.judgeFolderPath The folder with no skill where the judge runs.
	 * @param options.sourceText The paragraph before the rewrite.
	 * @param options.rewrittenText The rewrite.
	 * @param options.timeoutMilliseconds The time after which the judge is stopped and an error is recorded.
	 * @returns The judgment, or the error.
	 */
	static async judge({ harnessName, judgeFolderPath, sourceText, rewrittenText, timeoutMilliseconds }: {
		harnessName: HarnessName,
		judgeFolderPath: string,
		sourceText: string,
		rewrittenText: string,
		timeoutMilliseconds: number,
	}): Promise<MeaningJudgeResult> {
		const judgeMessage = [
			'Compare the SOURCE text and the REWRITE below.',
			'The meaning is kept when the REWRITE keeps every fact, number, condition, and instruction of the SOURCE,'
				+ ' and adds no fact.',
			'Other words, a different order of the sentences, or a full name in place of an abbreviation do not change'
				+ ' the meaning.',
			'Do not run a command, and do not read a file.',
			'Reply with one JSON object only, with no other text:'
				+ ' {"is_meaning_kept": true or false, "reason": "one sentence"}',
			'',
			'SOURCE:',
			sourceText,
			'',
			'REWRITE:',
			rewrittenText,
		].join('\n');
		const harnessRunResult = await HarnessRun.runToEnd({
			harnessName: harnessName,
			workingFolderPath: judgeFolderPath,
			userMessage: judgeMessage,
			claudeAllowedToolNames: [],
			timeoutMilliseconds: timeoutMilliseconds,
		});
		if (harnessRunResult.errorMessage !== null) {
			return {
				meaningJudgment: null,
				errorMessage: `the judge failed: ${harnessRunResult.errorMessage}`,
			};
		}
		const meaningJudgment = SimplifiedTechnicalEnglishRewriteMeaningJudge._readJudgment(harnessRunResult.finalText);
		if (meaningJudgment === null) {
			return {
				meaningJudgment: null,
				errorMessage: `the answer of the judge is not a judgment: ${harnessRunResult.finalText}`,
			};
		}
		return {
			meaningJudgment: meaningJudgment,
			errorMessage: null,
		};
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Reads the judgment from the answer of the judge: the first JSON object of the answer.
	 *
	 * @param finalText The answer of the judge, or `null` when the judge gave no answer.
	 * @returns The judgment, or `null` when the answer holds no judgment.
	 */
	static _readJudgment(finalText: string | null): MeaningJudgment | null {
		if (finalText === null) {
			return null;
		}
		const objectMatch = /\{[\s\S]*\}/.exec(finalText);
		if (objectMatch === null) {
			return null;
		}
		try {
			const parseResult = MeaningJudgmentSchema.safeParse(JSON.parse(objectMatch[0]));
			return parseResult.success === true ? parseResult.data : null;
		} catch {
			return null;
		}
	}
}
