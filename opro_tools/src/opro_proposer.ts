import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import { GitCommand } from './git_command.js';
import { HarnessRun } from './harness_run.js';
import type { HarnessName } from './harness_types.js';
import { OproMetaPrompt } from './opro_meta_prompt.js';
import { OproRunFolder } from './opro_run_folder.js';
import { OproSkillFile } from './opro_skill_file.js';
import { OproTargetFileReader } from './opro_target_file.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproProposer — asks a separate harness run for a new version of the improved part, from the scored history
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** The date of the git command that creates the folder of the proposer. No commit is written. */
const GIT_DATE = '2026-06-10T10:00:00.000Z';

/** The time after which the proposer is stopped. */
const TIMEOUT_MILLISECONDS = 300_000;

/** The result of one proposal. */
export type OproProposal = {
	/** The number of the new version. */
	versionNumber: number,
	/** The folder of the skills of the new version, or `null` when the proposer failed. */
	skillsFolderPath: string | null,
	/** The new text of the improved part, or `null` when the proposer failed. */
	skillPartText: string | null,
	/** The number of the earlier version that holds the same text, or `null` when the text is new. */
	sameAsVersionNumber: number | null,
	/** The file that holds the meta-prompt that the proposer read. */
	metaPromptFilePath: string,
	/** The reason why the proposer failed, or `null` when it did not. */
	errorMessage: string | null,
};

/**
 * Asks a separate run of the same harness, with the same fixed model, for a new version of the improved part of the
 * `SKILL.md` file. The proposer reads the meta-prompt and nothing else: it runs in an empty git repository with no
 * skill, so that the target skill never influences the proposal, and it never sees `opro_target.json`, so that it
 * must discover the rules from the failures of the test cases.
 */
export class OproProposer {
	/**
	 * Proposes one new version, and writes its folder when the proposer answered.
	 *
	 * @param options The options of the proposal.
	 * @param options.runFolderPath The folder of the run, which holds the scored history.
	 * @param options.harnessName The harness that proposes.
	 * @returns The proposal.
	 */
	static async propose({ runFolderPath, harnessName }: {
		runFolderPath: string,
		harnessName: HarnessName,
	}): Promise<OproProposal> {
		const runRecord = OproRunFolder.readRecord(runFolderPath);
		const oproTargetFile = OproTargetFileReader.readTargetFile(runRecord.target_folder_path);
		const testExplanation = Fs.readFileSync(
			Path.resolve(runRecord.target_folder_path, oproTargetFile.test_explanation_file_path),
			'utf8',
		);
		const metaPrompt = OproMetaPrompt.build(runRecord, testExplanation);
		const metaPromptFilePath = Path.join(runFolderPath, 'meta_prompt.md');
		Fs.writeFileSync(metaPromptFilePath, metaPrompt + '\n');

		const versionNumber = runRecord.versions.reduce((highestNumber, versionRecord) => {
			return Math.max(highestNumber, versionRecord.version_number);
		}, 0) + 1;
		const proposerFolderPath = OproProposer._createProposerFolder();
		let harnessRunResult;
		try {
			harnessRunResult = await HarnessRun.runToEnd({
				harnessName: harnessName,
				workingFolderPath: proposerFolderPath,
				userMessage: metaPrompt,
				claudeAllowedToolNames: [],
				timeoutMilliseconds: TIMEOUT_MILLISECONDS,
			});
		} finally {
			Fs.rmSync(proposerFolderPath, {
				recursive: true,
				force: true,
			});
		}

		if (harnessRunResult.errorMessage !== null) {
			return OproProposer._buildFailure(versionNumber, metaPromptFilePath,
				`the proposer failed: ${harnessRunResult.errorMessage}`);
		}
		if (harnessRunResult.finalText === null) {
			return OproProposer._buildFailure(versionNumber, metaPromptFilePath, 'the proposer gave no answer');
		}
		const skillPartText = OproSkillFile.readProposedPart(
			harnessRunResult.finalText, oproTargetFile.skill_part_name);
		if (skillPartText === '') {
			return OproProposer._buildFailure(versionNumber, metaPromptFilePath,
				`the answer of the proposer holds no ${oproTargetFile.skill_part_name}`);
		}

		const sameVersion = runRecord.versions.find((versionRecord) => {
			return versionRecord.skill_part_text.trim() === skillPartText.trim();
		});
		return {
			versionNumber: versionNumber,
			skillsFolderPath: OproRunFolder.writeVersion({
				runFolderPath: runFolderPath,
				versionNumber: versionNumber,
				oproTargetFile: oproTargetFile,
				skillPartText: skillPartText,
			}),
			skillPartText: skillPartText,
			sameAsVersionNumber: sameVersion === undefined ? null : sameVersion.version_number,
			metaPromptFilePath: metaPromptFilePath,
			errorMessage: null,
		};
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Creates the empty git repository with no skill where the proposer runs.
	 *
	 * @returns The path of the folder.
	 */
	static _createProposerFolder(): string {
		const proposerFolderPath = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'opro_proposer_'));
		GitCommand.run(proposerFolderPath, ['init', '--quiet', '--initial-branch', 'main'], GIT_DATE);
		return proposerFolderPath;
	}

	/**
	 * Builds the proposal of a proposer that failed.
	 *
	 * @param versionNumber The number of the version that the proposer did not write.
	 * @param metaPromptFilePath The file that holds the meta-prompt.
	 * @param errorMessage Why the proposer failed.
	 * @returns The proposal.
	 */
	static _buildFailure(versionNumber: number, metaPromptFilePath: string, errorMessage: string): OproProposal {
		return {
			versionNumber: versionNumber,
			skillsFolderPath: null,
			skillPartText: null,
			sameAsVersionNumber: null,
			metaPromptFilePath: metaPromptFilePath,
			errorMessage: errorMessage,
		};
	}
}
