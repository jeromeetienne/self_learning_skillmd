import { RULE_NAMES } from './simplified_technical_english_rewrite_types.js';
import type { MeaningJudgment, RuleCheck, RuleName } from './simplified_technical_english_rewrite_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SimplifiedTechnicalEnglishRewriteRules — reads the rewrite from an answer, and checks each rule on it
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The maximum number of words in one sentence: the limit of ASD-STE100 for a sentence of a procedure. */
const SENTENCE_MAXIMUM_WORD_COUNT = 20;

/** The word that replaces each code span and each code block, so that code counts as one word and is never checked. */
const CODE_PLACEHOLDER = 'CODEPLACEHOLDER';

/** A word of two or more capital letters, such as `API` or `CIs`, which is an acronym or an initialism. */
const CAPITAL_ABBREVIATION_REG_EXP = /\b[A-Z]{2,}s?\b/g;

/** An abbreviation that ends with a period, such as `e.g.` or `approx.`. */
const DOTTED_ABBREVIATION_REG_EXP = /(?<![\w.])(?:e\.g|i\.e|etc|vs|approx|a\.m|p\.m)\./gi;

/** The short forms of words that the house style refuses, such as `repo` for `repository`. */
const SHORT_FORM_WORDS = [
	'repo', 'repos', 'config', 'configs', 'info', 'doc', 'docs', 'app', 'apps', 'env', 'envs', 'var', 'vars',
	'auth', 'db', 'dbs', 'admin', 'admins', 'prod', 'dev', 'devs', 'dep', 'deps', 'dir', 'dirs', 'lib', 'libs',
	'temp', 'stats', 'spec', 'specs', 'min', 'max', 'sec', 'ops', 'stdout', 'stderr', 'stdin',
];

/** The words of capital letters that are not abbreviations. */
const ALLOWED_CAPITAL_WORDS = [
	CODE_PLACEHOLDER,
	'OK',
];

/** A contraction, such as `don't`, `you'll`, or `it's`, with a straight or a curly apostrophe. */
const CONTRACTION_REG_EXP = new RegExp([
	String.raw`\b\w+(?:n['’]t|['’]re|['’]ve|['’]ll|['’]m|['’]d)\b`,
	String.raw`\b(?:it|that|there|what|here|let|who|where)['’]s\b`,
].join('|'), 'gi');

/** A word that speaks to the reader, which the house style refuses. */
const YOU_WORD_REG_EXP = /\b(?:you|your|yours|yourself|yourselves)\b/gi;

/**
 * The words and the phrases that the house style refuses. The list comes from the words that ASD-STE100 does not
 * approve, with some words of the house style added, such as `just` and `please`.
 */
const REFUSED_WORDS = [
	'utilize', 'utilise', 'leverage', 'ensure', 'perform', 'performs', 'performed', 'via', 'whether', 'facilitate',
	'approximately', 'numerous', 'additional', 'subsequent', 'subsequently', 'prior', 'commence', 'terminate',
	'obtain', 'may', 'might', 'could', 'would', 'should', 'very', 'really', 'basically', 'simply', 'just', 'please',
	'bunch', 'in order to',
];

/**
 * Reads the rewrite from the last answer of a harness, and checks each rule on it. Four rules are checked by code.
 * The rule `meaning_kept` comes from the answer of a judge.
 */
export class SimplifiedTechnicalEnglishRewriteRules {
	/**
	 * Reads the rewrite from the last answer of a harness: the content of the first fenced code block when the answer
	 * has one, or else the whole answer.
	 *
	 * @param finalText The last answer of the harness.
	 * @returns The rewrite.
	 */
	static readRewrittenText(finalText: string): string {
		const fenceMatch = /```[^\n]*\n([\s\S]*?)\n```/.exec(finalText);
		const rewrittenText = fenceMatch === null ? finalText : (fenceMatch[1] ?? '');
		return rewrittenText.trim();
	}

	/**
	 * Checks each rule on one rewrite.
	 *
	 * @param rewrittenText The rewrite, or `null` when the harness gave no answer.
	 * @param meaningJudgment The answer of the judge, or `null` when the judge did not answer.
	 * @returns One check for each rule, in the order of `RULE_NAMES`.
	 */
	static check(rewrittenText: string | null, meaningJudgment: MeaningJudgment | null): RuleCheck[] {
		if (rewrittenText === null || rewrittenText === '') {
			return SimplifiedTechnicalEnglishRewriteRules._failEveryRule('the harness gave no rewrite');
		}
		const proseText = SimplifiedTechnicalEnglishRewriteRules._removeCode(rewrittenText);

		const longSentences = SimplifiedTechnicalEnglishRewriteRules.splitSentences(proseText).filter((sentence) => {
			return SimplifiedTechnicalEnglishRewriteRules._countWords(sentence) > SENTENCE_MAXIMUM_WORD_COUNT;
		});
		const abbreviations = SimplifiedTechnicalEnglishRewriteRules.findAbbreviations(proseText);
		const youWords = proseText.match(YOU_WORD_REG_EXP) ?? [];
		const refusedWords = SimplifiedTechnicalEnglishRewriteRules.findRefusedWords(proseText);

		const ruleChecks: RuleCheck[] = [
			SimplifiedTechnicalEnglishRewriteRules._buildCheck('sentence_length', longSentences.length === 0,
				`${longSentences.length} sentences have more than ${SENTENCE_MAXIMUM_WORD_COUNT} words, such as: `
				+ (longSentences[0] ?? '')),
			SimplifiedTechnicalEnglishRewriteRules._buildCheck('no_abbreviation', abbreviations.length === 0,
				`the rewrite uses abbreviations: ${abbreviations.join(', ')}`),
			SimplifiedTechnicalEnglishRewriteRules._buildCheck('no_you', youWords.length === 0,
				`the rewrite speaks to the reader ${youWords.length} times, with: ${[...new Set(youWords)].join(', ')}`),
			SimplifiedTechnicalEnglishRewriteRules._buildCheck('refused_words', refusedWords.length === 0,
				`the rewrite uses refused words: ${refusedWords.join(', ')}`),
			SimplifiedTechnicalEnglishRewriteRules._buildCheck('meaning_kept', meaningJudgment?.is_meaning_kept === true,
				meaningJudgment === null ? 'the judge gave no answer' : meaningJudgment.reason),
		];
		return ruleChecks;
	}

	/**
	 * Splits a text into sentences: each line is split at each period, question mark, and exclamation mark that a
	 * space follows. The marks of a list item and of a heading are removed.
	 *
	 * @param text The text, without code.
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

	/**
	 * Finds each abbreviation of a text: the words of capital letters, the abbreviations that end with a period, the
	 * short forms of words, and the contractions, such as `don't`.
	 *
	 * @param text The text, without code.
	 * @returns The abbreviations, each one time, in the order of the text.
	 */
	static findAbbreviations(text: string): string[] {
		const capitalWords = (text.match(CAPITAL_ABBREVIATION_REG_EXP) ?? []).filter((word) => {
			return ALLOWED_CAPITAL_WORDS.includes(word) === false;
		});
		const dottedAbbreviations = text.match(DOTTED_ABBREVIATION_REG_EXP) ?? [];
		const shortFormWords = SHORT_FORM_WORDS.filter((word) => {
			return new RegExp(`(?<![\\w./-])${word}(?![\\w/-])`, 'i').test(text);
		});
		const contractions = text.match(CONTRACTION_REG_EXP) ?? [];
		return [...new Set([...capitalWords, ...dottedAbbreviations, ...shortFormWords, ...contractions])];
	}

	/**
	 * Finds each refused word of a text.
	 *
	 * @param text The text, without code.
	 * @returns The refused words that the text holds, in the order of `REFUSED_WORDS`.
	 */
	static findRefusedWords(text: string): string[] {
		return REFUSED_WORDS.filter((word) => {
			return new RegExp(`\\b${word.replace(/ /g, '\\s+')}\\b`, 'i').test(text);
		});
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Replaces each code block and each code span with one placeholder word, because code holds names, not prose.
	 *
	 * @param text The text.
	 * @returns The text without code.
	 */
	static _removeCode(text: string): string {
		return text
			.replace(/```[\s\S]*?```/g, CODE_PLACEHOLDER)
			.replace(/`[^`\n]*`/g, CODE_PLACEHOLDER);
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
	 * Builds the check of one rule.
	 *
	 * @param ruleName The rule.
	 * @param isPassed `true` when the rewrite obeys the rule.
	 * @param failureReason Why the rewrite does not obey the rule.
	 * @returns The check.
	 */
	static _buildCheck(ruleName: RuleName, isPassed: boolean, failureReason: string): RuleCheck {
		return {
			rule_name: ruleName,
			is_passed: isPassed,
			failure_reason: isPassed ? null : failureReason,
		};
	}

	/**
	 * Builds a failed check for each rule.
	 *
	 * @param failureReason Why every rule failed.
	 * @returns One failed check for each rule.
	 */
	static _failEveryRule(failureReason: string): RuleCheck[] {
		return RULE_NAMES.map((ruleName) => {
			return SimplifiedTechnicalEnglishRewriteRules._buildCheck(ruleName, false, failureReason);
		});
	}
}
