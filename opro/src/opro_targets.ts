import Path from 'node:path';
import { CommitMessageScore } from '../../test_skills/commit_message/src/commit_message_score.js';
import type { CommitMessageScoreRecord } from '../../test_skills/commit_message/src/commit_message_types.js';
import {
	SimplifiedTechnicalEnglishRewriteScore,
} from '../../test_skills/simplified_technical_english_rewrite/src/simplified_technical_english_rewrite_score.js';
import type {
	SimplifiedTechnicalEnglishRewriteScoreRecord,
} from '../../test_skills/simplified_technical_english_rewrite/src/simplified_technical_english_rewrite_types.js';
import { SkillChoiceScore } from '../../test_skills/skill_choice/src/skill_choice_score.js';
import type { SkillChoiceScoreRecord } from '../../test_skills/skill_choice/src/skill_choice_types.js';
import type { OproTarget, TestSkillName } from './opro_types.js';

const __filename = import.meta.filename;
const __dirname = import.meta.dirname;

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproTargets — describes each test skill for the OPRO loop: what to improve, and how to score a version
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The folder that holds one folder for each test skill. */
const TEST_SKILLS_FOLDER_PATH = Path.join(__dirname, '..', '..', 'test_skills');

/** The maximum number of failures that the feedback shows to the proposer. */
const FEEDBACK_MAXIMUM_LINE_COUNT = 25;

/** Describes each test skill for the OPRO loop. */
export class OproTargets {
	/**
	 * Returns the target of one test skill.
	 *
	 * @param testSkillName The test skill.
	 * @returns The target.
	 */
	static get(testSkillName: TestSkillName): OproTarget {
		if (testSkillName === 'skill_choice') {
			return OproTargets._buildSkillChoiceTarget();
		}
		if (testSkillName === 'commit_message') {
			return OproTargets._buildCommitMessageTarget();
		}
		return OproTargets._buildSimplifiedTechnicalEnglishRewriteTarget();
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Builds the target of the skill choice test: the `description` field of `release-notes`.
	 *
	 * @returns The target.
	 */
	static _buildSkillChoiceTarget(): OproTarget {
		const testSkillFolderPath = Path.join(TEST_SKILLS_FOLDER_PATH, 'skill_choice');
		return {
			testSkillName: 'skill_choice',
			skillsFolderPath: Path.join(testSkillFolderPath, 'dotagents_folder', 'skills'),
			targetSkillName: 'release-notes',
			skillPartName: 'description',
			testExplanation: [
				'An AI coding agent sees the name and the description of each skill, and chooses the skill to load for'
					+ ' each user message, or no skill.',
				'The skill `release-notes` writes release notes for the people who use a product, from the commits'
					+ ' between two versions.',
				'Four other skills compete with it, and their descriptions do not change:',
				'- `changelog-entry`: adds an entry to the CHANGELOG.md file, under the Unreleased section.',
				'- `pull-request-description`: writes the title and the description of a pull request.',
				'- `announcement-post`: writes a short public social media post that announces a launch.',
				'- `migration-guide`: writes an upgrade guide for a breaking change.',
				'The score is the percentage of user messages for which the agent chooses the expected skill: '
					+ '`release-notes` for its messages, and never `release-notes` for the other messages.',
			].join('\n'),
			scoreFn: async ({ harnessName, skillsFolderPath, splitNames, concurrency }) => {
				const scoreRecord = await SkillChoiceScore.score({
					harnessName: harnessName,
					skillsFolderPath: skillsFolderPath,
					testCasesFilePath: Path.join(testSkillFolderPath, 'test_cases.json'),
					splitNames: splitNames,
					testCaseIds: null,
					concurrency: concurrency,
					onTestCaseResult: () => {
						process.stdout.write('.');
					},
				});
				return {
					scorePercent: scoreRecord.score_percent,
					feedbackText: OproTargets._buildSkillChoiceFeedback(scoreRecord),
					scoreRecord: scoreRecord,
				};
			},
		};
	}

	/**
	 * Builds the target of the commit message test: the body of `commit-message`.
	 *
	 * @returns The target.
	 */
	static _buildCommitMessageTarget(): OproTarget {
		const testSkillFolderPath = Path.join(TEST_SKILLS_FOLDER_PATH, 'commit_message');
		return {
			testSkillName: 'commit_message',
			skillsFolderPath: Path.join(testSkillFolderPath, 'dotagents_folder', 'skills'),
			targetSkillName: 'commit-message',
			skillPartName: 'body',
			testExplanation: [
				'An AI coding agent loads the skill `commit-message`, reads the staged changes of a git repository, and'
					+ ' replies with a commit message.',
				'The user message sometimes gives the GitHub issue of the change and whether the change fixes it. The'
					+ ' branch name sometimes holds the issue number, such as `fix/15-delete-invalid-index`.',
				'Code checks several house rules on each commit message. The failures below name the rules.',
				'The score is the percentage of rule checks that pass.',
			].join('\n'),
			scoreFn: async ({ harnessName, skillsFolderPath, splitNames, concurrency }) => {
				const scoreRecord = await CommitMessageScore.score({
					harnessName: harnessName,
					skillsFolderPath: skillsFolderPath,
					baseProjectFolderPath: Path.join(testSkillFolderPath, 'base_project'),
					testCasesFilePath: Path.join(testSkillFolderPath, 'test_cases.json'),
					splitNames: splitNames,
					testCaseIds: null,
					concurrency: concurrency,
					onTestCaseResult: () => {
						process.stdout.write('.');
					},
				});
				return {
					scorePercent: scoreRecord.score_percent,
					feedbackText: OproTargets._buildCommitMessageFeedback(scoreRecord),
					scoreRecord: scoreRecord,
				};
			},
		};
	}

	/**
	 * Builds the target of the Simplified Technical English rewrite test: the body of
	 * `simplified-technical-english-rewrite`.
	 *
	 * @returns The target.
	 */
	static _buildSimplifiedTechnicalEnglishRewriteTarget(): OproTarget {
		const testSkillFolderPath = Path.join(TEST_SKILLS_FOLDER_PATH, 'simplified_technical_english_rewrite');
		return {
			testSkillName: 'simplified_technical_english_rewrite',
			skillsFolderPath: Path.join(testSkillFolderPath, 'dotagents_folder', 'skills'),
			targetSkillName: 'simplified-technical-english-rewrite',
			skillPartName: 'body',
			testExplanation: [
				'An AI coding agent loads the skill `simplified-technical-english-rewrite`, and rewrites a paragraph of'
					+ ' technical text in a house style based on ASD-STE100 Simplified Technical English.',
				'Code checks several house rules on each rewrite, and a judge checks that the rewrite keeps every fact,'
					+ ' number, condition, and instruction, and adds no fact. The failures below name the rules.',
				'The score is the percentage of rule checks that pass.',
			].join('\n'),
			scoreFn: async ({ harnessName, skillsFolderPath, splitNames, concurrency }) => {
				const scoreRecord = await SimplifiedTechnicalEnglishRewriteScore.score({
					harnessName: harnessName,
					skillsFolderPath: skillsFolderPath,
					testCasesFilePath: Path.join(testSkillFolderPath, 'test_cases.json'),
					splitNames: splitNames,
					testCaseIds: null,
					concurrency: concurrency,
					onTestCaseResult: () => {
						process.stdout.write('.');
					},
				});
				return {
					scorePercent: scoreRecord.score_percent,
					feedbackText: OproTargets._buildSimplifiedTechnicalEnglishRewriteFeedback(scoreRecord),
					scoreRecord: scoreRecord,
				};
			},
		};
	}

	/**
	 * Writes the failures of the skill choice test: each user message whose chosen skill is not the expected skill.
	 *
	 * @param scoreRecord The score record of the test.
	 * @returns The failures, one on each line.
	 */
	static _buildSkillChoiceFeedback(scoreRecord: SkillChoiceScoreRecord): string {
		const feedbackLines = scoreRecord.test_case_results
			.filter((testCaseResult) => testCaseResult.is_correct === false)
			.map((testCaseResult) => {
				return `- user message "${testCaseResult.user_message}": expected `
					+ `${testCaseResult.expected_skill_name ?? 'no skill'}, chosen `
					+ `${testCaseResult.chosen_skill_name ?? 'no skill'}`;
			});
		return OproTargets._joinFeedbackLines(feedbackLines);
	}

	/**
	 * Writes the failures of the commit message test: each failed rule, with the first line of the commit message.
	 *
	 * @param scoreRecord The score record of the test.
	 * @returns The failures, one on each line.
	 */
	static _buildCommitMessageFeedback(scoreRecord: CommitMessageScoreRecord): string {
		const feedbackLines: string[] = [];
		for (const testCaseResult of scoreRecord.test_case_results) {
			const firstLine = (testCaseResult.commit_message ?? '').split('\n')[0] ?? '';
			for (const ruleCheck of testCaseResult.rule_checks) {
				if (ruleCheck.failure_reason !== null) {
					feedbackLines.push(`- ${testCaseResult.test_case_id}, first line "${firstLine}": `
						+ `${ruleCheck.rule_name}: ${ruleCheck.failure_reason}`);
				}
			}
		}
		return OproTargets._joinFeedbackLines(feedbackLines);
	}

	/**
	 * Writes the failures of the Simplified Technical English rewrite test: each failed rule of each paragraph.
	 *
	 * @param scoreRecord The score record of the test.
	 * @returns The failures, one on each line.
	 */
	static _buildSimplifiedTechnicalEnglishRewriteFeedback(
		scoreRecord: SimplifiedTechnicalEnglishRewriteScoreRecord,
	): string {
		const feedbackLines: string[] = [];
		for (const testCaseResult of scoreRecord.test_case_results) {
			for (const ruleCheck of testCaseResult.rule_checks) {
				if (ruleCheck.failure_reason !== null) {
					feedbackLines.push(`- ${testCaseResult.test_case_id}: ${ruleCheck.rule_name}: `
						+ ruleCheck.failure_reason);
				}
			}
		}
		return OproTargets._joinFeedbackLines(feedbackLines);
	}

	/**
	 * Joins the lines of a feedback, and keeps at most `FEEDBACK_MAXIMUM_LINE_COUNT` of them.
	 *
	 * @param feedbackLines The lines of the feedback.
	 * @returns The feedback.
	 */
	static _joinFeedbackLines(feedbackLines: string[]): string {
		if (feedbackLines.length === 0) {
			return 'No failure.';
		}
		const keptLines = feedbackLines.slice(0, FEEDBACK_MAXIMUM_LINE_COUNT);
		if (feedbackLines.length > keptLines.length) {
			keptLines.push(`- and ${feedbackLines.length - keptLines.length} more failures`);
		}
		return keptLines.join('\n');
	}
}
