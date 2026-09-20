import Fs from 'node:fs';
import Path from 'node:path';
import type { HarnessName } from './harness_types.js';
import { OproRunRecord } from './opro_run_record.js';
import type { OproRunRecordFile } from './opro_run_record.js';
import { OproSkillFile } from './opro_skill_file.js';
import { OproTargetFileReader } from './opro_target_file.js';
import type { OproTargetFile } from './opro_target_file.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproRunFolder — starts the run folder of one OPRO run, and finishes it with the best SKILL.md file
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** What `init-run` says about the target skill, which never holds the rules of the target skill. */
export type OproRunStart = {
	/** The folder of the run. */
	runFolderPath: string,
	/** The skill that the run improves. */
	targetSkillName: string,
	/** The part of the `SKILL.md` file that the run improves. */
	skillPartName: string,
	/** The folder of the skills of the first version. */
	firstVersionSkillsFolderPath: string,
	/** The number of test cases of each group. */
	testCaseCountBySplit: Record<string, number>,
	/** The names of the rules, which the feedback of each score also names. */
	ruleNames: string[],
	/** `true` when a rule of the target skill needs a judge. */
	hasJudge: boolean,
	/** The measured noise of the score of the target skill, in percent, or `null` when nobody measured it yet. */
	scoreNoisePercent: number | null,
};

/**
 * Starts and finishes the run folder of one OPRO run. The folder of one version holds the skills of that version, so
 * that the skills of the person never change: `version_<number>/skills/<skill name>/SKILL.md`.
 */
export class OproRunFolder {
	/**
	 * Starts one run: writes the folder of the first version with the skills of the target folder, and writes
	 * `opro_run.json` with no version yet.
	 *
	 * @param options The options of the run.
	 * @param options.runFolderPath The folder of the run, which must not hold a run already.
	 * @param options.targetFolderPath The folder of the target skill.
	 * @param options.harnessName The harness that proposes and scores.
	 * @returns What the agent needs to run the loop.
	 */
	static start({ runFolderPath, targetFolderPath, harnessName }: {
		runFolderPath: string,
		targetFolderPath: string,
		harnessName: HarnessName,
	}): OproRunStart {
		const oproTargetFile = OproTargetFileReader.readTargetFile(targetFolderPath);
		if (Fs.existsSync(Path.join(runFolderPath, 'opro_run.json')) === true) {
			throw new Error(`${runFolderPath} holds a run already. Choose another run folder.`);
		}
		const firstVersionSkillsFolderPath = OproRunFolder.buildVersionSkillsFolderPath(runFolderPath, 0);
		Fs.mkdirSync(Path.dirname(firstVersionSkillsFolderPath), {
			recursive: true,
		});
		Fs.cpSync(
			Path.resolve(targetFolderPath, oproTargetFile.skills_folder_path),
			firstVersionSkillsFolderPath,
			{
				recursive: true,
			},
		);
		OproRunRecord.write(runFolderPath, {
			...OproRunRecord.buildNewRecord({
				targetFolderPath: targetFolderPath,
				targetSkillName: oproTargetFile.target_skill_name,
				skillPartName: oproTargetFile.skill_part_name,
				harnessName: harnessName,
			}),
			versions: [],
			best_version_number: null,
		});
		return {
			runFolderPath: runFolderPath,
			targetSkillName: oproTargetFile.target_skill_name,
			skillPartName: oproTargetFile.skill_part_name,
			firstVersionSkillsFolderPath: firstVersionSkillsFolderPath,
			testCaseCountBySplit: OproRunFolder._countTestCases(targetFolderPath),
			ruleNames: oproTargetFile.rules.map((ruleDefinition) => ruleDefinition.name),
			hasJudge: oproTargetFile.judge !== null,
			scoreNoisePercent: oproTargetFile.score_noise_percent,
		};
	}

	/**
	 * Finishes one run: copies the `SKILL.md` file of the best version to `best_SKILL.md`.
	 *
	 * @param runFolderPath The folder of the run.
	 * @returns The record of the run, and the path of `best_SKILL.md`.
	 */
	static finish(runFolderPath: string): {
		runRecord: OproRunRecordFile,
		bestSkillFilePath: string | null,
	} {
		const runRecord = OproRunFolder.readRecord(runFolderPath);
		const bestVersion = runRecord.versions.find((versionRecord) => {
			return versionRecord.version_number === runRecord.best_version_number;
		});
		if (bestVersion === undefined) {
			return {
				runRecord: runRecord,
				bestSkillFilePath: null,
			};
		}
		const bestSkillFilePath = Path.join(runFolderPath, 'best_SKILL.md');
		Fs.copyFileSync(
			Path.join(bestVersion.skills_folder_path, runRecord.target_skill_name, 'SKILL.md'),
			bestSkillFilePath,
		);
		return {
			runRecord: runRecord,
			bestSkillFilePath: bestSkillFilePath,
		};
	}

	/**
	 * Writes the folder of one new version: a copy of the skills of the first version, with the new part of the
	 * `SKILL.md` file of the target skill.
	 *
	 * @param options The options of the version.
	 * @param options.runFolderPath The folder of the run.
	 * @param options.versionNumber The number of the new version.
	 * @param options.oproTargetFile The target file.
	 * @param options.skillPartText The new text of the improved part.
	 * @returns The folder of the skills of the new version.
	 */
	static writeVersion({ runFolderPath, versionNumber, oproTargetFile, skillPartText }: {
		runFolderPath: string,
		versionNumber: number,
		oproTargetFile: OproTargetFile,
		skillPartText: string,
	}): string {
		const skillsFolderPath = OproRunFolder.buildVersionSkillsFolderPath(runFolderPath, versionNumber);
		Fs.rmSync(skillsFolderPath, {
			recursive: true,
			force: true,
		});
		Fs.mkdirSync(Path.dirname(skillsFolderPath), {
			recursive: true,
		});
		Fs.cpSync(OproRunFolder.buildVersionSkillsFolderPath(runFolderPath, 0), skillsFolderPath, {
			recursive: true,
		});
		const skillFilePath = Path.join(skillsFolderPath, oproTargetFile.target_skill_name, 'SKILL.md');
		Fs.writeFileSync(
			skillFilePath,
			OproSkillFile.replacePart(
				Fs.readFileSync(skillFilePath, 'utf8'),
				oproTargetFile.skill_part_name,
				skillPartText,
			),
		);
		return skillsFolderPath;
	}

	/**
	 * Writes what one proposal cost, in `version_<number>/proposal.json`, so that `record-version` counts the
	 * attempts of the proposer without the agent of the loop counting anything.
	 *
	 * @param runFolderPath The folder of the run.
	 * @param versionNumber The number of the proposed version.
	 * @param harnessRunCount The number of attempts that the proposer ran.
	 * @returns Nothing.
	 */
	static writeProposal(runFolderPath: string, versionNumber: number, harnessRunCount: number): void {
		const versionFolderPath = Path.dirname(OproRunFolder.buildVersionSkillsFolderPath(runFolderPath,
			versionNumber));
		Fs.mkdirSync(versionFolderPath, {
			recursive: true,
		});
		Fs.writeFileSync(Path.join(versionFolderPath, 'proposal.json'), JSON.stringify({
			version_number: versionNumber,
			harness_run_count: harnessRunCount,
		}, null, '\t') + '\n');
	}

	/**
	 * Reads how many harness runs the proposer of one version cost.
	 *
	 * @param runFolderPath The folder of the run.
	 * @param versionNumber The number of the version.
	 * @returns The number of attempts of the proposer, or 0 for the first version, which no proposer wrote.
	 */
	static readProposalHarnessRunCount(runFolderPath: string, versionNumber: number): number {
		if (versionNumber === 0) {
			return 0;
		}
		const proposalFilePath = Path.join(
			Path.dirname(OproRunFolder.buildVersionSkillsFolderPath(runFolderPath, versionNumber)),
			'proposal.json',
		);
		if (Fs.existsSync(proposalFilePath) === false) {
			return 1;
		}
		return (JSON.parse(Fs.readFileSync(proposalFilePath, 'utf8')) as {
			harness_run_count: number,
		}).harness_run_count;
	}

	/**
	 * Reads the record of one run, and refuses a run folder that holds none.
	 *
	 * @param runFolderPath The folder of the run.
	 * @returns The record of the run.
	 */
	static readRecord(runFolderPath: string): OproRunRecordFile {
		if (Fs.existsSync(Path.join(runFolderPath, 'opro_run.json')) === false) {
			throw new Error(`${runFolderPath} holds no opro_run.json. Run init-run first.`);
		}
		return OproRunRecord.read(runFolderPath, OproRunRecord.buildNewRecord({
			targetFolderPath: '',
			targetSkillName: '',
			skillPartName: 'body',
			harnessName: 'claude',
		}));
	}

	/**
	 * Builds the path of the folder of the skills of one version.
	 *
	 * @param runFolderPath The folder of the run.
	 * @param versionNumber The number of the version.
	 * @returns The path of the folder of the skills.
	 */
	static buildVersionSkillsFolderPath(runFolderPath: string, versionNumber: number): string {
		return Path.join(runFolderPath, `version_${String(versionNumber).padStart(3, '0')}`, 'skills');
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Counts the test cases of each group.
	 *
	 * @param targetFolderPath The folder of the target skill.
	 * @returns The number of test cases of each group.
	 */
	static _countTestCases(targetFolderPath: string): Record<string, number> {
		const testCaseCountBySplit: Record<string, number> = {};
		for (const testCase of OproTargetFileReader.readTestCases(targetFolderPath, null)) {
			testCaseCountBySplit[testCase.split] = (testCaseCountBySplit[testCase.split] ?? 0) + 1;
		}
		return testCaseCountBySplit;
	}
}
