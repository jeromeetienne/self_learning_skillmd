import Fs from 'node:fs';
import Path from 'node:path';
import { HARNESS_MODEL_NAMES } from './harness_types.js';
import type { HarnessName } from './harness_types.js';
import type { SkillPartName } from './opro_skill_file.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproRunRecord — keeps the scored history of one OPRO run in `opro_run.json`, and chooses the best version
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The name of the file that holds the scored history of one run. */
const RUN_RECORD_FILE_NAME = 'opro_run.json';

/** One version of the target skill in the history of one run. */
export type OproVersionRecord = {
	/** The number of the version: 0 for the first version, then 1, 2, and so on. */
	version_number: number,
	/** The round that proposed the version: 0 for the first version. */
	round_number: number,
	/** The improved part of the `SKILL.md` file. */
	skill_part_text: string,
	/** The folder that holds one folder for each skill, with this version of the target skill. */
	skills_folder_path: string,
	/** The score of each run of the test on the `optimization` group. */
	score_percents: number[],
	/** The average of `score_percents`, which sorts the history. */
	average_score_percent: number,
	/** The failures of the version on the test cases, from its last run. */
	feedback_text: string,
	/** The score of the version on the `final_check` group, or `null` when it did not run. */
	final_check_percent: number | null,
	/** The number of harness runs that the version cost, so that the cost of a run can be read after it. */
	harness_run_count: number,
	/** The reason why the version was not scored, or `null` when it was. */
	error_message: string | null,
};

/** The record of one run of the OPRO loop, as written in `opro_run.json`. */
export type OproRunRecordFile = {
	/** The folder of the target skill that was improved. */
	target_folder_path: string,
	/** The skill that was improved. */
	target_skill_name: string,
	/** The part of the `SKILL.md` file that was improved. */
	skill_part_name: SkillPartName,
	/** The harness that proposed and scored the versions. */
	harness_name: HarnessName,
	/** The model that the harness ran. */
	model_name: string,
	/** When the run started, as an ISO 8601 date and time. */
	started_at: string,
	/** Every version, in the order in which they were proposed. */
	versions: OproVersionRecord[],
	/** The version with the best average score on the `optimization` group, or `null` before the first score. */
	best_version_number: number | null,
};

/** Reads and writes the scored history of one OPRO run. */
export class OproRunRecord {
	/**
	 * Reads `opro_run.json`, or builds an empty record when the run folder holds none.
	 *
	 * @param runFolderPath The folder of the run.
	 * @param newRecord The record to start with when the run folder holds no `opro_run.json`.
	 * @returns The record of the run.
	 */
	static read(runFolderPath: string, newRecord: Omit<OproRunRecordFile, 'versions' | 'best_version_number'>):
		OproRunRecordFile {
		const filePath = Path.join(runFolderPath, RUN_RECORD_FILE_NAME);
		if (Fs.existsSync(filePath) === false) {
			return {
				...newRecord,
				versions: [],
				best_version_number: null,
			};
		}
		return JSON.parse(Fs.readFileSync(filePath, 'utf8')) as OproRunRecordFile;
	}

	/**
	 * Adds one version to the record, or replaces the version that has the same number, chooses the best version,
	 * and writes `opro_run.json`, so that a run that stops early keeps every version scored so far.
	 *
	 * @param runFolderPath The folder of the run.
	 * @param runRecord The record of the run.
	 * @param versionRecord The version.
	 * @returns The record of the run.
	 */
	static addVersion(
		runFolderPath: string,
		runRecord: OproRunRecordFile,
		versionRecord: OproVersionRecord,
	): OproRunRecordFile {
		const versionIndex = runRecord.versions.findIndex((candidateVersion) => {
			return candidateVersion.version_number === versionRecord.version_number;
		});
		if (versionIndex === -1) {
			runRecord.versions.push(versionRecord);
		} else {
			runRecord.versions[versionIndex] = versionRecord;
		}
		runRecord.versions.sort((versionA, versionB) => versionA.version_number - versionB.version_number);
		runRecord.best_version_number = OproRunRecord.findBestVersionNumber(runRecord);
		OproRunRecord.write(runFolderPath, runRecord);
		return runRecord;
	}

	/**
	 * Finds the version with the best average score on the `optimization` group. On a tie, the earlier version wins.
	 *
	 * @param runRecord The record of the run.
	 * @returns The number of the best version, or `null` when no version was scored.
	 */
	static findBestVersionNumber(runRecord: OproRunRecordFile): number | null {
		let bestVersion: OproVersionRecord | null = null;
		for (const candidateVersion of runRecord.versions) {
			if (candidateVersion.error_message !== null || candidateVersion.score_percents.length === 0) {
				continue;
			}
			if (bestVersion === null || candidateVersion.average_score_percent > bestVersion.average_score_percent) {
				bestVersion = candidateVersion;
			}
		}
		return bestVersion === null ? null : bestVersion.version_number;
	}

	/**
	 * Writes `opro_run.json`.
	 *
	 * @param runFolderPath The folder of the run.
	 * @param runRecord The record of the run.
	 * @returns Nothing.
	 */
	static write(runFolderPath: string, runRecord: OproRunRecordFile): void {
		Fs.mkdirSync(runFolderPath, {
			recursive: true,
		});
		Fs.writeFileSync(
			Path.join(runFolderPath, RUN_RECORD_FILE_NAME),
			JSON.stringify(runRecord, null, '\t') + '\n',
		);
	}

	/**
	 * Builds the values of a new record of a run.
	 *
	 * @param options The values of the run.
	 * @param options.targetFolderPath The folder of the target skill.
	 * @param options.targetSkillName The skill that the run improves.
	 * @param options.skillPartName The part of the `SKILL.md` file that the run improves.
	 * @param options.harnessName The harness that proposes and scores.
	 * @returns The values of a new record.
	 */
	static buildNewRecord({ targetFolderPath, targetSkillName, skillPartName, harnessName }: {
		targetFolderPath: string,
		targetSkillName: string,
		skillPartName: SkillPartName,
		harnessName: HarnessName,
	}): Omit<OproRunRecordFile, 'versions' | 'best_version_number'> {
		return {
			target_folder_path: targetFolderPath,
			target_skill_name: targetSkillName,
			skill_part_name: skillPartName,
			harness_name: harnessName,
			model_name: HARNESS_MODEL_NAMES[harnessName],
			started_at: new Date().toISOString(),
		};
	}
}
