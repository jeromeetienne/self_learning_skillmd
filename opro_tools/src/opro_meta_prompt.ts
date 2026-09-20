import type { OproRunRecordFile, OproVersionRecord } from './opro_run_record.js';
import type { SkillPartName } from './opro_skill_file.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproMetaPrompt — writes the meta-prompt of OPRO from the scored history of one run
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The maximum number of versions that the meta-prompt shows: the versions with the best scores. */
const HISTORY_MAXIMUM_VERSION_COUNT = 10;

/**
 * Writes the meta-prompt of OPRO: what the test measures, the earlier versions from the lowest score to the highest
 * score, and the failures of the best version. The meta-prompt never holds the rules of the target skill, and never
 * holds a test case of the `final_check` group.
 */
export class OproMetaPrompt {
	/**
	 * Builds the meta-prompt.
	 *
	 * @param runRecord The record of the run, with the scored versions.
	 * @param testExplanation What the test measures, from the file that `opro_target.json` names.
	 * @param repeatedVersionNumber The version that the proposer repeated word for word in an earlier attempt of the
	 * same round, or `null` for the first attempt.
	 * @returns The meta-prompt.
	 */
	static build(
		runRecord: OproRunRecordFile,
		testExplanation: string,
		repeatedVersionNumber: number | null = null,
	): string {
		const skillPartName = runRecord.skill_part_name;
		const scoredVersions = runRecord.versions
			.filter((versionRecord) => {
				return versionRecord.error_message === null && versionRecord.score_percents.length > 0;
			})
			.sort((versionA, versionB) => versionB.average_score_percent - versionA.average_score_percent)
			.slice(0, HISTORY_MAXIMUM_VERSION_COUNT)
			.reverse();
		const bestVersion = scoredVersions[scoredVersions.length - 1];

		const promptLines = [
			`You improve ${OproMetaPrompt._readPartLabel(skillPartName)} of the \`SKILL.md\` file of the skill `
				+ `\`${runRecord.target_skill_name}\`.`,
			OproMetaPrompt._readPartExplanation(skillPartName),
			'',
			'## The test',
			'',
			testExplanation.trim(),
			'',
			'## Earlier versions',
			'',
			'The earlier versions are below, with their scores, from the lowest score to the highest score. A higher'
				+ ' score is better.',
			'',
		];
		for (const versionRecord of scoredVersions) {
			promptLines.push(...OproMetaPrompt._writeVersion(versionRecord));
		}
		if (bestVersion !== undefined) {
			promptLines.push('## The failures of the best version');
			promptLines.push('');
			promptLines.push(bestVersion.feedback_text);
			promptLines.push('');
		}
		promptLines.push('## Your task');
		promptLines.push('');
		promptLines.push(`Write a new version of ${OproMetaPrompt._readPartLabel(skillPartName)} that is different `
			+ 'from every version above and that gets a higher score than every version above. Fix the failures of '
			+ 'the best version, and keep what it does well.');
		promptLines.push(OproMetaPrompt._readPartRules(skillPartName));
		if (repeatedVersionNumber !== null) {
			promptLines.push(`Your answer of the attempt before this one repeated, word for word, the version that `
				+ `scored ${OproMetaPrompt._readVersionScore(runRecord, repeatedVersionNumber)}. That version is `
				+ 'already in the history above, so its score is already known. Write a version that is different '
				+ 'from every version above.');
		}
		promptLines.push('Do not run a command, and do not read a file.');
		promptLines.push('Reply with the new version only, between a line `<new_version>` and a line `</new_version>`.');
		return promptLines.join('\n');
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Reads the score of one version of the history, for the message of a repeated answer.
	 *
	 * @param runRecord The record of the run.
	 * @param versionNumber The number of the version.
	 * @returns The score of the version, in percent, as a text.
	 */
	static _readVersionScore(runRecord: OproRunRecordFile, versionNumber: number): string {
		const versionRecord = runRecord.versions.find((candidateVersion) => {
			return candidateVersion.version_number === versionNumber;
		});
		return versionRecord === undefined ? 'the same score' : `${versionRecord.average_score_percent} percent`;
	}

	/**
	 * Writes one version of the history, with its score.
	 *
	 * @param versionRecord The version.
	 * @returns The lines of the version.
	 */
	static _writeVersion(versionRecord: OproVersionRecord): string[] {
		return [
			`<version score="${versionRecord.average_score_percent}">`,
			versionRecord.skill_part_text,
			'</version>',
			'',
		];
	}

	/**
	 * Names the part of the `SKILL.md` file that the run improves.
	 *
	 * @param skillPartName The part.
	 * @returns The name of the part, for a sentence.
	 */
	static _readPartLabel(skillPartName: SkillPartName): string {
		return skillPartName === 'description' ? 'the `description` field' : 'the body';
	}

	/**
	 * Says what the part of the `SKILL.md` file is.
	 *
	 * @param skillPartName The part.
	 * @returns One sentence about the part.
	 */
	static _readPartExplanation(skillPartName: SkillPartName): string {
		if (skillPartName === 'description') {
			return 'The `description` field is in the frontmatter. An agent reads it to decide when to load the skill.';
		}
		return 'The body is the Markdown text after the frontmatter. An agent reads it after it loads the skill.';
	}

	/**
	 * Says what the new version must look like.
	 *
	 * @param skillPartName The part.
	 * @returns The rules of the part.
	 */
	static _readPartRules(skillPartName: SkillPartName): string {
		if (skillPartName === 'description') {
			return 'Write one paragraph of at most 1024 characters, with no line break. Say what the skill does, and'
				+ ' when an agent must use it and must not use it.';
		}
		return 'Write Markdown with no frontmatter. Write rules that an agent can obey, and short examples.';
	}
}
