import type {
	RefusedPattern,
	RuleCheckDefinition,
	RuleCondition,
	RuleDefinition,
	TestCase,
} from './opro_target_file.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproRules — checks the rules of one target skill on one answer, with no code that is specific to a target skill
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The word that replaces each code span and each code block, so that code counts as one word and is never checked. */
const CODE_PLACEHOLDER = 'CODEPLACEHOLDER';

/** The answer of the judge on one rule of one test case. */
export type RuleJudgment = {
	/** `true` when the answer obeys the rule. */
	is_passed: boolean,
	/** Why the judge decided so, in one sentence. */
	reason: string,
};

/** The check of one rule on one answer. */
export type RuleCheckResult = {
	/** The rule. */
	rule_name: string,
	/** `true` when the answer obeys the rule. */
	is_passed: boolean,
	/** Why the answer does not obey the rule, or `null` when it does. */
	failure_reason: string | null,
};

/**
 * Checks the rules of `opro_target.json` on one answer. Every rule is data: a name and a list of checks, and the
 * first check whose conditions the test case obeys is the check of that test case. Nothing here knows the name of a
 * target skill.
 */
export class OproRules {
	/**
	 * Checks every rule on one answer.
	 *
	 * @param options The options of the check.
	 * @param options.answerText The answer of the harness, or `null` when the harness gave no answer.
	 * @param options.testCase The test case, whose fields the conditions and the patterns read.
	 * @param options.ruleDefinitions The rules of `opro_target.json`.
	 * @param options.judgmentByRuleName The answer of the judge for each rule of the kind `judge`.
	 * @param options.missingAnswerFailureReason Why every rule fails when the answer is missing, or `null` when a
	 * missing answer is an answer, as it is in the run mode `skill_choice`.
	 * @returns One check for each rule, in the order of the rules.
	 */
	static check({
		answerText,
		testCase,
		ruleDefinitions,
		judgmentByRuleName,
		missingAnswerFailureReason,
	}: {
		answerText: string | null,
		testCase: TestCase,
		ruleDefinitions: RuleDefinition[],
		judgmentByRuleName: Record<string, RuleJudgment | null>,
		missingAnswerFailureReason: string | null,
	}): RuleCheckResult[] {
		if (missingAnswerFailureReason !== null && (answerText === null || answerText.trim() === '')) {
			return ruleDefinitions.map((ruleDefinition) => {
				return {
					rule_name: ruleDefinition.name,
					is_passed: false,
					failure_reason: missingAnswerFailureReason,
				};
			});
		}
		return ruleDefinitions.map((ruleDefinition) => {
			const checkDefinition = OproRules._chooseCheck(ruleDefinition, testCase);
			return OproRules._runCheck({
				ruleName: ruleDefinition.name,
				checkDefinition: checkDefinition,
				answerText: answerText,
				testCase: testCase,
				judgment: judgmentByRuleName[ruleDefinition.name] ?? null,
			});
		});
	}

	/**
	 * Says whether one test case obeys every condition of a list.
	 *
	 * @param conditions The conditions.
	 * @param testCase The test case.
	 * @returns `true` when the test case obeys every condition.
	 */
	static matchesConditions(conditions: RuleCondition[], testCase: TestCase): boolean {
		return conditions.every((condition) => {
			const fieldValue = OproRules.readField(testCase, condition.field);
			if (condition.operator === 'is_null') {
				return fieldValue === null || fieldValue === undefined;
			}
			if (condition.operator === 'is_not_null') {
				return fieldValue !== null && fieldValue !== undefined;
			}
			if (condition.operator === 'equals') {
				return fieldValue === condition.value;
			}
			return fieldValue !== condition.value;
		});
	}

	/**
	 * Reads one field of a test case.
	 *
	 * @param testCase The test case.
	 * @param fieldName The name of the field.
	 * @returns The value of the field, or `undefined` when the test case has no such field.
	 */
	static readField(testCase: TestCase, fieldName: string): unknown {
		return (testCase as Record<string, unknown>)[fieldName];
	}

	/**
	 * Replaces every `{{field}}` of a text with the field of the test case.
	 *
	 * @param text The text.
	 * @param testCase The test case.
	 * @param isForRegularExpression `true` when each value is escaped, because the text is a regular expression.
	 * @returns The text with its fields replaced.
	 */
	static fillTemplate(text: string, testCase: TestCase, isForRegularExpression: boolean): string {
		return text.replace(/\{\{(\w+)\}\}/g, (wholeMatch, fieldName: string) => {
			const fieldValue = OproRules.readField(testCase, fieldName);
			if (fieldValue === undefined) {
				return wholeMatch;
			}
			const valueText = fieldValue === null ? '' : String(fieldValue);
			return isForRegularExpression === true ? OproRules._escapeRegularExpression(valueText) : valueText;
		});
	}

	/**
	 * Replaces each code block and each code span with one placeholder word, because code holds names, not prose.
	 *
	 * @param text The text.
	 * @returns The text without code.
	 */
	static removeCode(text: string): string {
		return text
			.replace(/```[\s\S]*?```/g, CODE_PLACEHOLDER)
			.replace(/`[^`\n]*`/g, CODE_PLACEHOLDER);
	}

	/**
	 * Splits a text into sentences: each line is split at each period, question mark, and exclamation mark that a
	 * space follows. The marks of a list item and of a heading are removed.
	 *
	 * @param text The text.
	 * @returns The sentences, without the empty ones.
	 */
	static splitSentences(text: string): string[] {
		const sentences: string[] = [];
		for (const line of text.split('\n')) {
			const proseLine = line.replace(/^\s*(?:[-*+]|\d+[.)]|#+)\s+/, '');
			for (const sentence of proseLine.split(/(?<=[.!?])\s+/)) {
				if (sentence.trim() !== '') {
					sentences.push(sentence.trim());
				}
			}
		}
		return sentences;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Chooses the check of one rule for one test case: the first check whose conditions the test case obeys.
	 *
	 * @param ruleDefinition The rule.
	 * @param testCase The test case.
	 * @returns The check.
	 */
	static _chooseCheck(ruleDefinition: RuleDefinition, testCase: TestCase): RuleCheckDefinition {
		const checkDefinition = ruleDefinition.checks.find((candidateCheck) => {
			return OproRules.matchesConditions(candidateCheck.when, testCase);
		});
		if (checkDefinition === undefined) {
			throw new Error(`no check of the rule ${ruleDefinition.name} applies to the test case ${testCase.id}`);
		}
		return checkDefinition;
	}

	/**
	 * Runs one check on one answer.
	 *
	 * @param options The options of the check.
	 * @param options.ruleName The name of the rule.
	 * @param options.checkDefinition The check.
	 * @param options.answerText The answer of the harness.
	 * @param options.testCase The test case.
	 * @param options.judgment The answer of the judge, for the kind `judge`.
	 * @returns The check of the rule.
	 */
	static _runCheck({ ruleName, checkDefinition, answerText, testCase, judgment }: {
		ruleName: string,
		checkDefinition: RuleCheckDefinition,
		answerText: string | null,
		testCase: TestCase,
		judgment: RuleJudgment | null,
	}): RuleCheckResult {
		if (checkDefinition.kind === 'judge') {
			return OproRules._buildResult(ruleName, checkDefinition, testCase,
				judgment !== null && judgment.is_passed === true,
				judgment === null ? 'the judge gave no answer' : judgment.reason);
		}
		if (checkDefinition.kind === 'expected_answer') {
			const expectedValue = OproRules.readField(testCase, checkDefinition.expected_field ?? 'expected_answer');
			const expectedText = expectedValue === null || expectedValue === undefined ? null : String(expectedValue);
			return OproRules._buildResult(ruleName, checkDefinition, testCase, answerText === expectedText,
				`the answer is ${answerText ?? 'nothing'}, and ${expectedText ?? 'nothing'} was expected`);
		}

		const wholeText = answerText ?? '';
		const scopedText = OproRules._readScope(wholeText, checkDefinition.scope);
		const checkedText = checkDefinition.remove_code === true ? OproRules.removeCode(scopedText) : scopedText;

		if (checkDefinition.kind === 'regular_expression_must_match') {
			const regularExpression = OproRules._buildRegularExpression(checkDefinition, testCase);
			return OproRules._buildResult(ruleName, checkDefinition, testCase, regularExpression.test(checkedText),
				`the ${checkDefinition.scope === 'whole' ? 'answer' : checkDefinition.scope.replace('_', ' ')} does `
				+ `not match ${regularExpression.source}: ${OproRules._shorten(checkedText)}`);
		}
		if (checkDefinition.kind === 'regular_expression_must_not_match') {
			const regularExpression = OproRules._buildRegularExpression(checkDefinition, testCase);
			const match = regularExpression.exec(checkedText);
			return OproRules._buildResult(ruleName, checkDefinition, testCase, match === null,
				`the answer holds ${match?.[0] ?? ''}, which the rule refuses`);
		}
		if (checkDefinition.kind === 'maximum_line_length') {
			const maximum = OproRules._readMaximum(ruleName, checkDefinition);
			const longLines = checkedText.split('\n').filter((line) => line.length > maximum);
			return OproRules._buildResult(ruleName, checkDefinition, testCase, longLines.length === 0,
				`${longLines.length} lines have more than ${maximum} characters, such as: `
				+ OproRules._shorten(longLines[0] ?? ''));
		}
		if (checkDefinition.kind === 'maximum_sentence_word_count') {
			const maximum = OproRules._readMaximum(ruleName, checkDefinition);
			const longSentences = OproRules.splitSentences(checkedText).filter((sentence) => {
				return OproRules._countWords(sentence) > maximum;
			});
			return OproRules._buildResult(ruleName, checkDefinition, testCase, longSentences.length === 0,
				`${longSentences.length} sentences have more than ${maximum} words, such as: `
				+ OproRules._shorten(longSentences[0] ?? ''));
		}

		const foundTexts = OproRules._findRefusedTexts(checkDefinition, testCase, checkedText);
		return OproRules._buildResult(ruleName, checkDefinition, testCase, foundTexts.length === 0,
			`the answer holds ${foundTexts.join(', ')}, which the rule refuses`);
	}

	/**
	 * Finds every text that the kind `refused_patterns` refuses.
	 *
	 * @param checkDefinition The check.
	 * @param testCase The test case.
	 * @param checkedText The text to check.
	 * @returns The refused texts, each one time, in the order of the patterns.
	 */
	static _findRefusedTexts(
		checkDefinition: RuleCheckDefinition,
		testCase: TestCase,
		checkedText: string,
	): string[] {
		const foundTexts: string[] = [];
		for (const refusedPattern of checkDefinition.patterns) {
			const regularExpression = OproRules._buildRefusedRegularExpression(refusedPattern, testCase);
			const matches = checkedText.match(regularExpression) ?? [];
			if (refusedPattern.kind === 'regular_expression') {
				foundTexts.push(...matches);
				continue;
			}
			if (matches.length > 0) {
				foundTexts.push(refusedPattern.value);
			}
		}
		const allowedWords = checkDefinition.allowed_words;
		return [...new Set(foundTexts)].filter((foundText) => {
			return allowedWords.includes(foundText) === false;
		});
	}

	/**
	 * Builds the regular expression of one pattern of the kind `refused_patterns`.
	 *
	 * @param refusedPattern The pattern.
	 * @param testCase The test case.
	 * @returns The regular expression, which always has the flag `g`.
	 */
	static _buildRefusedRegularExpression(refusedPattern: RefusedPattern, testCase: TestCase): RegExp {
		const flags = refusedPattern.flags.includes('g') === true
			? refusedPattern.flags
			: `${refusedPattern.flags}g`;
		if (refusedPattern.kind === 'regular_expression') {
			return new RegExp(OproRules.fillTemplate(refusedPattern.value, testCase, true), flags);
		}
		const wordSource = OproRules._escapeRegularExpression(refusedPattern.value).replace(/ /g, '\\s+');
		return new RegExp(`\\b${wordSource}\\b`, flags);
	}

	/**
	 * Builds the regular expression of a check of one of the two `regular_expression_` kinds.
	 *
	 * @param checkDefinition The check.
	 * @param testCase The test case.
	 * @returns The regular expression.
	 */
	static _buildRegularExpression(checkDefinition: RuleCheckDefinition, testCase: TestCase): RegExp {
		if (checkDefinition.pattern === null) {
			throw new Error(`a check of the kind ${checkDefinition.kind} has no pattern`);
		}
		return new RegExp(
			OproRules.fillTemplate(checkDefinition.pattern, testCase, true),
			checkDefinition.flags,
		);
	}

	/**
	 * Reads the maximum of a check of one of the two `maximum_` kinds.
	 *
	 * @param ruleName The name of the rule, for the error message.
	 * @param checkDefinition The check.
	 * @returns The maximum.
	 */
	static _readMaximum(ruleName: string, checkDefinition: RuleCheckDefinition): number {
		if (checkDefinition.maximum === null) {
			throw new Error(`the check of the rule ${ruleName} has no maximum`);
		}
		return checkDefinition.maximum;
	}

	/**
	 * Reads the part of the answer that a check reads.
	 *
	 * @param wholeText The whole answer.
	 * @param scope The part to read.
	 * @returns The part of the answer.
	 */
	static _readScope(wholeText: string, scope: 'whole' | 'first_line' | 'last_line'): string {
		if (scope === 'whole') {
			return wholeText;
		}
		const lines = wholeText.split('\n');
		if (scope === 'first_line') {
			return lines[0] ?? '';
		}
		return lines[lines.length - 1] ?? '';
	}

	/**
	 * Builds the result of one check, with the message of the check when it has one.
	 *
	 * @param ruleName The name of the rule.
	 * @param checkDefinition The check.
	 * @param testCase The test case.
	 * @param isPassed `true` when the answer obeys the rule.
	 * @param failureReason The message of the engine, when the check has no message of its own.
	 * @returns The result of the check.
	 */
	static _buildResult(
		ruleName: string,
		checkDefinition: RuleCheckDefinition,
		testCase: TestCase,
		isPassed: boolean,
		failureReason: string,
	): RuleCheckResult {
		if (isPassed === true) {
			return {
				rule_name: ruleName,
				is_passed: true,
				failure_reason: null,
			};
		}
		const messageTemplate = checkDefinition.failure_message;
		return {
			rule_name: ruleName,
			is_passed: false,
			failure_reason: messageTemplate === null
				? failureReason
				: OproRules.fillTemplate(messageTemplate, testCase, false),
		};
	}

	/**
	 * Counts the words of a sentence: the pieces between spaces that hold a letter or a digit.
	 *
	 * @param sentence The sentence.
	 * @returns The number of words.
	 */
	static _countWords(sentence: string): number {
		return sentence.split(/\s+/).filter((word) => /[A-Za-z0-9]/.test(word)).length;
	}

	/**
	 * Keeps the start of a text, so that one failure stays on one line of the feedback.
	 *
	 * @param text The text.
	 * @returns The start of the text.
	 */
	static _shorten(text: string): string {
		const oneLineText = text.replace(/\s+/g, ' ').trim();
		return oneLineText.length <= 120 ? oneLineText : `${oneLineText.slice(0, 120)}...`;
	}

	/**
	 * Escapes every character that has a meaning in a regular expression.
	 *
	 * @param text The text.
	 * @returns The escaped text.
	 */
	static _escapeRegularExpression(text: string): string {
		return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	}
}
