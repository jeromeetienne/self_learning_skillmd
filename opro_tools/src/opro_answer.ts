///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproAnswer — reads the answer of a target skill from the last answer of a harness
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Reads the answer that the rules check, from the last answer of a harness. */
export class OproAnswer {
	/**
	 * Reads the answer of one test case.
	 *
	 * @param finalText The last answer of the harness, or `null` when the harness gave no answer.
	 * @param answerExtraction `first_code_block_or_whole_answer` keeps the content of the first fenced code block
	 * when the answer has one, and `whole_answer` keeps the whole answer.
	 * @param trimLineEnds `true` when the spaces at the end of each line are removed.
	 * @returns The answer, or `null` when the harness gave no answer.
	 */
	static read(
		finalText: string | null,
		answerExtraction: 'first_code_block_or_whole_answer' | 'whole_answer',
		trimLineEnds: boolean,
	): string | null {
		if (finalText === null) {
			return null;
		}
		let answerText = finalText;
		if (answerExtraction === 'first_code_block_or_whole_answer') {
			const fenceMatch = /```[^\n]*\n([\s\S]*?)\n```/.exec(finalText);
			answerText = fenceMatch === null ? finalText : (fenceMatch[1] ?? '');
		}
		if (trimLineEnds === true) {
			answerText = answerText
				.split('\n')
				.map((line) => line.trimEnd())
				.join('\n');
		}
		return answerText.trim();
	}
}
