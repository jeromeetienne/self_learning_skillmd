import { HarnessRun } from '../../test_skills/_shared/src/harness_run.js';
import type { HarnessName } from '../../test_skills/_shared/src/harness_types.js';
import { OproSkillFile } from './opro_skill_file.js';
import type { OproTarget, OproVersion } from './opro_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproProposer — asks a harness for a new version of a skill part, from the scored history
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The maximum number of versions that the proposer sees: the versions with the best scores. */
const HISTORY_MAXIMUM_VERSION_COUNT = 10;

/** The time after which the proposer is stopped. */
const TIMEOUT_MILLISECONDS = 300_000;

/** The result of one proposal. */
export type OproProposal = {
	/** The new text of the skill part, or `null` when the proposer failed. */
	skillPartText: string | null,
	/** The reason why the proposer failed, or `null` when it did not. */
	errorMessage: string | null,
};

/**
 * Asks a harness, with its fixed model, for a new version of the improved part of a `SKILL.md` file. The message is
 * the meta-prompt of OPRO: what the test measures, the earlier versions sorted from the lowest score to the highest
 * score, and the failures of the best version.
 */
export class OproProposer {
	/**
	 * Proposes one new version.
	 *
	 * @param options The options of the proposal.
	 * @param options.harnessName The harness that proposes.
	 * @param options.proposerFolderPath The folder with no skill where the proposer runs.
	 * @param options.oproTarget The target of the OPRO loop.
	 * @param options.oproVersions The scored versions so far.
	 * @returns The new text of the skill part, or the error.
	 */
	static async propose({ harnessName, proposerFolderPath, oproTarget, oproVersions }: {
		harnessName: HarnessName,
		proposerFolderPath: string,
		oproTarget: OproTarget,
		oproVersions: OproVersion[],
	}): Promise<OproProposal> {
		const harnessRunResult = await HarnessRun.runToEnd({
			harnessName: harnessName,
			workingFolderPath: proposerFolderPath,
			userMessage: OproProposer.buildMetaPrompt(oproTarget, oproVersions),
			claudeAllowedToolNames: [],
			timeoutMilliseconds: TIMEOUT_MILLISECONDS,
		});
		if (harnessRunResult.errorMessage !== null) {
			return {
				skillPartText: null,
				errorMessage: `the proposer failed: ${harnessRunResult.errorMessage}`,
			};
		}
		if (harnessRunResult.finalText === null) {
			return {
				skillPartText: null,
				errorMessage: 'the proposer gave no answer',
			};
		}
		const skillPartText = OproSkillFile.readProposedPart(harnessRunResult.finalText, oproTarget.skillPartName);
		if (skillPartText === '') {
			return {
				skillPartText: null,
				errorMessage: `the answer of the proposer holds no ${oproTarget.skillPartName}`,
			};
		}
		return {
			skillPartText: skillPartText,
			errorMessage: null,
		};
	}

	/**
	 * Builds the meta-prompt of OPRO.
	 *
	 * @param oproTarget The target of the OPRO loop.
	 * @param oproVersions The scored versions so far.
	 * @returns The message for the proposer.
	 */
	static buildMetaPrompt(oproTarget: OproTarget, oproVersions: OproVersion[]): string {
		const partLabel = oproTarget.skillPartName === 'description' ? 'the `description` field' : 'the body';
		const partExplanation = oproTarget.skillPartName === 'description'
			? 'The `description` field is in the frontmatter. An agent reads it to decide when to load the skill.'
			: 'The body is the Markdown text after the frontmatter. An agent reads it after it loads the skill.';
		const scoredVersions = oproVersions
			.filter((oproVersion) => oproVersion.error_message === null)
			.sort((versionA, versionB) => versionB.average_score_percent - versionA.average_score_percent)
			.slice(0, HISTORY_MAXIMUM_VERSION_COUNT)
			.reverse();
		const bestVersion = scoredVersions[scoredVersions.length - 1];
		const partRules = oproTarget.skillPartName === 'description'
			? 'Write one paragraph of at most 1024 characters, with no line break. Say what the skill does, and when an'
				+ ' agent must use it and must not use it.'
			: 'Write Markdown with no frontmatter. Write rules that an agent can obey, and short examples.';

		const promptLines = [
			`You improve ${partLabel} of the \`SKILL.md\` file of the skill \`${oproTarget.targetSkillName}\`.`,
			partExplanation,
			'',
			'## The test',
			'',
			oproTarget.testExplanation,
			'',
			'## Earlier versions',
			'',
			'The earlier versions are below, with their scores, from the lowest score to the highest score. A higher'
				+ ' score is better.',
			'',
		];
		for (const oproVersion of scoredVersions) {
			promptLines.push(`<version score="${oproVersion.average_score_percent}">`);
			promptLines.push(oproVersion.skill_part_text);
			promptLines.push('</version>');
			promptLines.push('');
		}
		if (bestVersion !== undefined) {
			promptLines.push('## The failures of the best version');
			promptLines.push('');
			promptLines.push(bestVersion.feedback_text);
			promptLines.push('');
		}
		promptLines.push('## Your task');
		promptLines.push('');
		promptLines.push(`Write a new version of ${partLabel} that is different from every version above and that gets`
			+ ' a higher score than every version above. Fix the failures of the best version, and keep what it does'
			+ ' well.');
		promptLines.push(partRules);
		promptLines.push('Do not run a command, and do not read a file.');
		promptLines.push('Reply with the new version only, between a line `<new_version>` and a line `</new_version>`.');
		return promptLines.join('\n');
	}
}
