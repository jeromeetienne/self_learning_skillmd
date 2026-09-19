import { RULE_NAMES } from './commit_message_types.js';
import type { CommitMessageTestCase, RuleCheck, RuleName } from './commit_message_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	CommitMessageRules — reads the commit message from an answer, and checks each rule on it
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The maximum number of characters of the first line. */
const FIRST_LINE_MAXIMUM_LENGTH = 50;

/** The start of the third line, which says why the change was made. */
const WHY_LINE_PREFIX = 'Why: ';

/** A first line that starts with a Conventional Commits type, an optional scope, and a colon. */
const CONVENTIONAL_TYPE_REG_EXP = /^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([^)]+\))?!?: \S/;

/** A word that makes GitHub close an issue, followed by an issue number. */
const CLOSING_KEYWORD_REG_EXP = /\b(close[sd]?|fix(e[sd])?|resolve[sd]?)\s*:?\s+#\d+/i;

/** A line that says who or what wrote the commit, instead of what the commit changes. */
const ATTRIBUTION_REG_EXP = /co-authored-by|generated with|\bclaude\b|\bcodex\b|anthropic|openai/i;

/**
 * Reads the commit message from the last answer of a harness, and checks each rule of `RULE_NAMES` on it. The rules
 * are the target that OPRO must discover: the weak `SKILL.md` names none of them.
 */
export class CommitMessageRules {
	/**
	 * Reads the commit message from the last answer of a harness: the content of the first fenced code block when
	 * the answer has one, or else the whole answer. Spaces at the end of each line are removed.
	 *
	 * @param finalText The last answer of the harness.
	 * @returns The commit message.
	 */
	static readCommitMessage(finalText: string): string {
		const fenceMatch = /```[^\n]*\n([\s\S]*?)\n```/.exec(finalText);
		const messageText = fenceMatch === null ? finalText : (fenceMatch[1] ?? '');
		const commitMessage = messageText
			.split('\n')
			.map((line) => line.trimEnd())
			.join('\n')
			.trim();
		return commitMessage;
	}

	/**
	 * Checks each rule on one commit message.
	 *
	 * @param commitMessage The commit message, or `null` when the harness gave no answer.
	 * @param testCase The test case, which gives the issue number and whether the change is a fix.
	 * @returns One check for each rule, in the order of `RULE_NAMES`.
	 */
	static check(commitMessage: string | null, testCase: CommitMessageTestCase): RuleCheck[] {
		if (commitMessage === null || commitMessage === '') {
			return CommitMessageRules._failEveryRule('the harness gave no commit message');
		}
		const lines = commitMessage.split('\n');
		const firstLine = lines[0] ?? '';
		const ruleChecks: RuleCheck[] = [
			CommitMessageRules._buildCheck('conventional_type', CONVENTIONAL_TYPE_REG_EXP.test(firstLine),
				`the first line does not start with a type such as "feat: " or "fix: ": ${firstLine}`),
			CommitMessageRules._buildCheck('first_line_length', firstLine.length <= FIRST_LINE_MAXIMUM_LENGTH,
				`the first line has ${firstLine.length} characters, more than ${FIRST_LINE_MAXIMUM_LENGTH}`),
			CommitMessageRules._checkIssueSuffix(commitMessage, firstLine, testCase),
			CommitMessageRules._buildCheck('why_line', lines[1] === '' && (lines[2] ?? '').startsWith(WHY_LINE_PREFIX),
				`the second line is not blank, or the third line does not start with "${WHY_LINE_PREFIX}"`),
			CommitMessageRules._checkFixesLastLine(commitMessage, lines, testCase),
			CommitMessageRules._buildCheck('no_attribution', ATTRIBUTION_REG_EXP.test(commitMessage) === false,
				`the commit message names its author or its tool: ${ATTRIBUTION_REG_EXP.exec(commitMessage)?.[0]}`),
		];
		return ruleChecks;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Checks that the first line ends with `, #N` when the change has the issue `N`, and that the commit message names
	 * no issue when the change has none.
	 *
	 * @param commitMessage The commit message.
	 * @param firstLine The first line of the commit message.
	 * @param testCase The test case.
	 * @returns The check of the rule `issue_suffix`.
	 */
	static _checkIssueSuffix(commitMessage: string, firstLine: string, testCase: CommitMessageTestCase): RuleCheck {
		if (testCase.issue_number === null) {
			return CommitMessageRules._buildCheck('issue_suffix', /#\d+/.test(commitMessage) === false,
				'the change has no issue, but the commit message names one');
		}
		const issueSuffix = `, #${testCase.issue_number}`;
		return CommitMessageRules._buildCheck('issue_suffix', firstLine.endsWith(issueSuffix),
			`the first line does not end with "${issueSuffix}": ${firstLine}`);
	}

	/**
	 * Checks that the last line is exactly `fixes #N` when the change fixes the issue `N`, and that the commit message
	 * has no word that closes an issue in every other case, so that GitHub never closes an issue that is still open.
	 *
	 * @param commitMessage The commit message.
	 * @param lines The lines of the commit message.
	 * @param testCase The test case.
	 * @returns The check of the rule `fixes_last_line`.
	 */
	static _checkFixesLastLine(commitMessage: string, lines: string[], testCase: CommitMessageTestCase): RuleCheck {
		if (testCase.is_fix === true && testCase.issue_number !== null) {
			const fixesLine = `fixes #${testCase.issue_number}`;
			const lastLine = lines[lines.length - 1] ?? '';
			return CommitMessageRules._buildCheck('fixes_last_line', lines.length > 1 && lastLine === fixesLine,
				`the change fixes the issue #${testCase.issue_number}, but the last line is not "${fixesLine}": `
				+ lastLine);
		}
		const closingMatch = CLOSING_KEYWORD_REG_EXP.exec(commitMessage);
		return CommitMessageRules._buildCheck('fixes_last_line', closingMatch === null,
			`the change closes no issue, but the commit message says "${closingMatch?.[0]}"`);
	}

	/**
	 * Builds the check of one rule.
	 *
	 * @param ruleName The rule.
	 * @param isPassed `true` when the commit message obeys the rule.
	 * @param failureReason Why the commit message does not obey the rule.
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
			return CommitMessageRules._buildCheck(ruleName, false, failureReason);
		});
	}
}
