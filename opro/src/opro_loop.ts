import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import { GitCommand } from '../../test_skills/_shared/src/git_command.js';
import { HARNESS_MODEL_NAMES } from '../../test_skills/_shared/src/harness_types.js';
import type { HarnessName } from '../../test_skills/_shared/src/harness_types.js';
import { OproProposer } from './opro_proposer.js';
import { OproSkillFile } from './opro_skill_file.js';
import type { OproRunRecord, OproTarget, OproVersion } from './opro_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproLoop — improves one part of a SKILL.md file with OPRO: propose, score, add to the history, repeat
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The date of the git command that creates the folder of the proposer. No commit is written. */
const GIT_DATE = '2026-06-10T10:00:00.000Z';

/**
 * Runs the OPRO loop on one test skill: scores the first version of the target skill, then, in each round, asks the
 * proposer for new versions, scores each one on the `optimization` split, and adds it to the history. At the end,
 * scores the first version and the best version on the `final_check` split, which the proposer never sees. Every
 * version is written into the run folder. The skills of the repository never change.
 */
export class OproLoop {
	/**
	 * Runs the OPRO loop.
	 *
	 * @param options The options of the loop.
	 * @param options.oproTarget The test skill to improve.
	 * @param options.harnessName The harness that proposes and scores the versions.
	 * @param options.roundCount The number of rounds.
	 * @param options.versionCountPerRound The number of versions that each round proposes.
	 * @param options.scoreRunCount The number of runs of the test for each version, whose scores are averaged.
	 * @param options.concurrency The number of harnesses that run at the same time in one score.
	 * @param options.runFolderPath The folder where the run record and every version are written.
	 * @param options.onMessage Called with each line of progress.
	 * @returns The run record.
	 */
	static async run({
		oproTarget,
		harnessName,
		roundCount,
		versionCountPerRound,
		scoreRunCount,
		concurrency,
		runFolderPath,
		onMessage,
	}: {
		oproTarget: OproTarget,
		harnessName: HarnessName,
		roundCount: number,
		versionCountPerRound: number,
		scoreRunCount: number,
		concurrency: number,
		runFolderPath: string,
		onMessage: (message: string) => void,
	}): Promise<OproRunRecord> {
		const firstSkillText = Fs.readFileSync(
			Path.join(oproTarget.skillsFolderPath, oproTarget.targetSkillName, 'SKILL.md'),
			'utf8',
		);
		const runRecord: OproRunRecord = {
			test_skill_name: oproTarget.testSkillName,
			harness_name: harnessName,
			model_name: HARNESS_MODEL_NAMES[harnessName],
			target_skill_name: oproTarget.targetSkillName,
			skill_part_name: oproTarget.skillPartName,
			round_count: roundCount,
			version_count_per_round: versionCountPerRound,
			score_run_count: scoreRunCount,
			started_at: new Date().toISOString(),
			versions: [],
			best_version_number: null,
			first_version_final_check_percent: null,
			best_version_final_check_percent: null,
		};
		Fs.mkdirSync(runFolderPath, {
			recursive: true,
		});

		const proposerFolderPath = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'opro_proposer_'));
		GitCommand.run(proposerFolderPath, ['init', '--quiet', '--initial-branch', 'main'], GIT_DATE);
		try {
			onMessage('version 0: the first version');
			const firstVersion = await OproLoop._scoreVersion({
				oproTarget: oproTarget,
				harnessName: harnessName,
				firstSkillText: firstSkillText,
				skillPartText: OproSkillFile.readPart(firstSkillText, oproTarget.skillPartName),
				versionNumber: 0,
				roundNumber: 0,
				scoreRunCount: scoreRunCount,
				concurrency: concurrency,
				runFolderPath: runFolderPath,
				onMessage: onMessage,
			});
			OproLoop._addVersion(runRecord, firstVersion, runFolderPath);

			for (let roundNumber = 1; roundNumber <= roundCount; roundNumber++) {
				for (let versionIndex = 0; versionIndex < versionCountPerRound; versionIndex++) {
					const versionNumber = runRecord.versions.length;
					onMessage(`version ${versionNumber}: round ${roundNumber} of ${roundCount}, proposing`);
					const oproProposal = await OproProposer.propose({
						harnessName: harnessName,
						proposerFolderPath: proposerFolderPath,
						oproTarget: oproTarget,
						oproVersions: runRecord.versions,
					});
					if (oproProposal.skillPartText === null) {
						onMessage(`version ${versionNumber}: ${oproProposal.errorMessage}`);
						OproLoop._addVersion(runRecord, {
							version_number: versionNumber,
							round_number: roundNumber,
							skill_part_text: '',
							skills_folder_path: '',
							score_percents: [],
							average_score_percent: 0,
							feedback_text: '',
							error_message: oproProposal.errorMessage,
						}, runFolderPath);
						continue;
					}
					const oproVersion = await OproLoop._scoreVersion({
						oproTarget: oproTarget,
						harnessName: harnessName,
						firstSkillText: firstSkillText,
						skillPartText: oproProposal.skillPartText,
						versionNumber: versionNumber,
						roundNumber: roundNumber,
						scoreRunCount: scoreRunCount,
						concurrency: concurrency,
						runFolderPath: runFolderPath,
						onMessage: onMessage,
					});
					OproLoop._addVersion(runRecord, oproVersion, runFolderPath);
				}
			}
		} finally {
			Fs.rmSync(proposerFolderPath, {
				recursive: true,
				force: true,
			});
		}

		const bestVersion = runRecord.versions.find((oproVersion) => {
			return oproVersion.version_number === runRecord.best_version_number;
		});
		const firstVersion = runRecord.versions[0];
		if (bestVersion === undefined || firstVersion === undefined) {
			return runRecord;
		}
		Fs.copyFileSync(
			Path.join(bestVersion.skills_folder_path, oproTarget.targetSkillName, 'SKILL.md'),
			Path.join(runFolderPath, 'best_SKILL.md'),
		);
		onMessage('final check: version 0, the first version');
		runRecord.first_version_final_check_percent = await OproLoop._scoreFinalCheck(
			oproTarget, harnessName, firstVersion, concurrency);
		onMessage(`final check: version ${bestVersion.version_number}, the best version`);
		runRecord.best_version_final_check_percent = bestVersion.version_number === 0
			? runRecord.first_version_final_check_percent
			: await OproLoop._scoreFinalCheck(oproTarget, harnessName, bestVersion, concurrency);
		OproLoop._writeRunRecord(runRecord, runFolderPath);
		return runRecord;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Writes one version into its own skills folder, and scores it `scoreRunCount` times on the `optimization` split.
	 *
	 * @param options The options of the score.
	 * @param options.oproTarget The test skill.
	 * @param options.harnessName The harness that scores.
	 * @param options.firstSkillText The first `SKILL.md` file, whose frontmatter and other part are kept.
	 * @param options.skillPartText The text of the improved part of this version.
	 * @param options.versionNumber The number of the version.
	 * @param options.roundNumber The round that proposed the version.
	 * @param options.scoreRunCount The number of runs of the test.
	 * @param options.concurrency The number of harnesses that run at the same time.
	 * @param options.runFolderPath The folder of the run.
	 * @param options.onMessage Called with each line of progress.
	 * @returns The scored version.
	 */
	static async _scoreVersion({
		oproTarget,
		harnessName,
		firstSkillText,
		skillPartText,
		versionNumber,
		roundNumber,
		scoreRunCount,
		concurrency,
		runFolderPath,
		onMessage,
	}: {
		oproTarget: OproTarget,
		harnessName: HarnessName,
		firstSkillText: string,
		skillPartText: string,
		versionNumber: number,
		roundNumber: number,
		scoreRunCount: number,
		concurrency: number,
		runFolderPath: string,
		onMessage: (message: string) => void,
	}): Promise<OproVersion> {
		const versionFolderPath = Path.join(runFolderPath, `version_${String(versionNumber).padStart(3, '0')}`);
		const skillsFolderPath = Path.join(versionFolderPath, 'skills');
		Fs.cpSync(oproTarget.skillsFolderPath, skillsFolderPath, {
			recursive: true,
		});
		Fs.writeFileSync(
			Path.join(skillsFolderPath, oproTarget.targetSkillName, 'SKILL.md'),
			OproSkillFile.replacePart(firstSkillText, oproTarget.skillPartName, skillPartText),
		);

		const scorePercents: number[] = [];
		let feedbackText = '';
		for (let scoreRunIndex = 0; scoreRunIndex < scoreRunCount; scoreRunIndex++) {
			const targetScore = await oproTarget.scoreFn({
				harnessName: harnessName,
				skillsFolderPath: skillsFolderPath,
				splitNames: ['optimization'],
				concurrency: concurrency,
			});
			process.stdout.write('\n');
			Fs.writeFileSync(
				Path.join(versionFolderPath, `optimization_score_${scoreRunIndex + 1}.json`),
				JSON.stringify(targetScore.scoreRecord, null, '\t') + '\n',
			);
			scorePercents.push(targetScore.scorePercent);
			feedbackText = targetScore.feedbackText;
			onMessage(`version ${versionNumber}: score run ${scoreRunIndex + 1} of ${scoreRunCount}: `
				+ `${targetScore.scorePercent} percent`);
		}
		const averageScorePercent = Math.round(scorePercents.reduce((total, scorePercent) => {
			return total + scorePercent;
		}, 0) / scorePercents.length * 10) / 10;
		return {
			version_number: versionNumber,
			round_number: roundNumber,
			skill_part_text: skillPartText,
			skills_folder_path: skillsFolderPath,
			score_percents: scorePercents,
			average_score_percent: averageScorePercent,
			feedback_text: feedbackText,
			error_message: null,
		};
	}

	/**
	 * Scores one version on the `final_check` split, one time.
	 *
	 * @param oproTarget The test skill.
	 * @param harnessName The harness that scores.
	 * @param oproVersion The version.
	 * @param concurrency The number of harnesses that run at the same time.
	 * @returns The score on the `final_check` split.
	 */
	static async _scoreFinalCheck(
		oproTarget: OproTarget,
		harnessName: HarnessName,
		oproVersion: OproVersion,
		concurrency: number,
	): Promise<number> {
		const targetScore = await oproTarget.scoreFn({
			harnessName: harnessName,
			skillsFolderPath: oproVersion.skills_folder_path,
			splitNames: ['final_check'],
			concurrency: concurrency,
		});
		process.stdout.write('\n');
		const versionFolderPath = Path.dirname(oproVersion.skills_folder_path);
		Fs.writeFileSync(
			Path.join(versionFolderPath, 'final_check_score.json'),
			JSON.stringify(targetScore.scoreRecord, null, '\t') + '\n',
		);
		return targetScore.scorePercent;
	}

	/**
	 * Adds one version to the run record, updates the best version, and writes the run record, so that a run that
	 * stops early keeps every version scored so far.
	 *
	 * @param runRecord The run record.
	 * @param oproVersion The version.
	 * @param runFolderPath The folder of the run.
	 * @returns Nothing.
	 */
	static _addVersion(runRecord: OproRunRecord, oproVersion: OproVersion, runFolderPath: string): void {
		runRecord.versions.push(oproVersion);
		let bestVersion: OproVersion | null = null;
		for (const candidateVersion of runRecord.versions) {
			if (candidateVersion.error_message !== null) {
				continue;
			}
			if (bestVersion === null || candidateVersion.average_score_percent > bestVersion.average_score_percent) {
				bestVersion = candidateVersion;
			}
		}
		runRecord.best_version_number = bestVersion === null ? null : bestVersion.version_number;
		OproLoop._writeRunRecord(runRecord, runFolderPath);
	}

	/**
	 * Writes the run record into `opro_run.json`.
	 *
	 * @param runRecord The run record.
	 * @param runFolderPath The folder of the run.
	 * @returns Nothing.
	 */
	static _writeRunRecord(runRecord: OproRunRecord, runFolderPath: string): void {
		Fs.writeFileSync(Path.join(runFolderPath, 'opro_run.json'), JSON.stringify(runRecord, null, '\t') + '\n');
	}
}
