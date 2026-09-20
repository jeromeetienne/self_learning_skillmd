import Fs from 'node:fs';
import { HarnessRun } from './harness_run.js';
import type { HarnessName } from './harness_types.js';
import { OproAnswer } from './opro_answer.js';
import { OproJudge } from './opro_judge.js';
import { OproRules } from './opro_rules.js';
import type { RuleCheckResult, RuleJudgment } from './opro_rules.js';
import type { OproTargetFile, TestCase } from './opro_target_file.js';
import { OproSkillChoiceRun } from './opro_skill_choice_run.js';
import { OproWorkspaceFolder } from './opro_workspace_folder.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproTestCaseRun — runs one test case of one version: the workspace, the harness, the judge, and the rules
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/**
 * Why every rule fails when the harness gives no answer in the run mode `answer`. In the run mode `skill_choice`, no
 * answer is an answer, because a harness can load no skill, and every rule fails only when the harness failed.
 */
const MISSING_ANSWER_FAILURE_REASON = 'the harness gave no answer';

/** The result of one test case of one version. */
export type OproTestCaseResult = {
	/** The name of the test case. */
	test_case_id: string,
	/** The group of the test case. */
	split: string,
	/** The whole message that the user sent to the harness. */
	user_message: string,
	/** The last answer of the harness, or `null` in the run mode `skill_choice` and when there was no answer. */
	final_text: string | null,
	/** The answer that the rules check: the last answer of the harness, or the skill that it loaded. */
	answer_text: string | null,
	/** `true` when the commands and the tool calls of the harness name the target skill. */
	is_skill_loaded: boolean,
	/** The check of each rule, in the order of the rules. */
	rule_checks: RuleCheckResult[],
	/** The number of rules that the answer obeys. */
	passed_rule_count: number,
	/** The commands and the tool calls of the harness, one on each line. */
	evidence: string,
	/** The reason why the harness or the judge failed, or `null` when they did not. */
	error_message: string | null,
	/** How long the test case took, in milliseconds. */
	duration_milliseconds: number,
};

/**
 * Runs one test case of one version of the target skill: builds the workspace, runs the harness in it, asks the
 * judge when a rule needs one, and checks every rule on the answer. Nothing here knows the name of a target skill.
 */
export class OproTestCaseRun {
	/**
	 * Runs one test case.
	 *
	 * @param options The options of the run.
	 * @param options.harnessName The harness that runs the target skill and the judge.
	 * @param options.targetFolderPath The folder of the target skill.
	 * @param options.oproTargetFile The target file, already read.
	 * @param options.skillsFolderPath The folder of the skills of the version under test.
	 * @param options.testCase The test case.
	 * @param options.rubricText The question of the judge, or `null` when no rule has the kind `judge`.
	 * @param options.keepWorkspace `true` when the workspace folder stays on the disk after the run.
	 * @returns The result of the test case.
	 */
	static async run({
		harnessName,
		targetFolderPath,
		oproTargetFile,
		skillsFolderPath,
		testCase,
		rubricText,
		keepWorkspace,
	}: {
		harnessName: HarnessName,
		targetFolderPath: string,
		oproTargetFile: OproTargetFile,
		skillsFolderPath: string,
		testCase: TestCase,
		rubricText: string | null,
		keepWorkspace: boolean,
	}): Promise<OproTestCaseResult> {
		const startTime = Date.now();
		const { workspaceFolderPath, workspaceRecord } = OproWorkspaceFolder.make({
			targetFolderPath: targetFolderPath,
			skillsFolderPath: skillsFolderPath,
			testCase: testCase,
			workspaceParentFolderPath: null,
		});

		let finalText: string | null = null;
		let answerText: string | null = null;
		let evidence = '';
		let errorMessage: string | null = null;
		try {
			if (oproTargetFile.run_mode === 'skill_choice') {
				const skillChoice = await OproSkillChoiceRun.chooseSkill({
					harnessName: harnessName,
					workingFolderPath: workspaceRecord.project_folder_path,
					userMessage: workspaceRecord.user_message,
					skillNames: workspaceRecord.skill_names,
					timeoutMilliseconds: workspaceRecord.timeout_milliseconds,
				});
				answerText = skillChoice.chosenSkillName;
				evidence = skillChoice.evidence;
				errorMessage = skillChoice.errorMessage;
			} else {
				const harnessRunResult = await HarnessRun.runToEnd({
					harnessName: harnessName,
					workingFolderPath: workspaceRecord.project_folder_path,
					userMessage: workspaceRecord.user_message,
					claudeAllowedToolNames: workspaceRecord.claude_allowed_tool_names,
					timeoutMilliseconds: workspaceRecord.timeout_milliseconds,
				});
				finalText = harnessRunResult.finalText;
				answerText = OproAnswer.read(
					harnessRunResult.finalText,
					oproTargetFile.answer_extraction,
					oproTargetFile.trim_line_ends,
				);
				evidence = harnessRunResult.evidence;
				errorMessage = harnessRunResult.errorMessage;
			}
		} finally {
			if (keepWorkspace === false) {
				Fs.rmSync(workspaceFolderPath, {
					recursive: true,
					force: true,
				});
			}
		}

		const judgeRuleName = OproTestCaseRun.findJudgeRuleName(oproTargetFile, testCase);
		const judgmentByRuleName: Record<string, RuleJudgment | null> = {};
		if (judgeRuleName !== null && rubricText !== null && answerText !== null && answerText !== '') {
			const judgeResult = await OproJudge.judge({
				harnessName: harnessName,
				rubricText: rubricText,
				testCase: testCase,
				answerText: answerText,
				timeoutMilliseconds: oproTargetFile.judge?.timeout_milliseconds ?? 300000,
			});
			judgmentByRuleName[judgeRuleName] = judgeResult.judgment;
			if (judgeResult.errorMessage !== null) {
				errorMessage = errorMessage === null
					? judgeResult.errorMessage
					: `${errorMessage}; ${judgeResult.errorMessage}`;
			}
		}

		const ruleChecks = OproRules.check({
			answerText: answerText,
			testCase: testCase,
			ruleDefinitions: oproTargetFile.rules,
			judgmentByRuleName: judgmentByRuleName,
			missingAnswerFailureReason: oproTargetFile.run_mode === 'skill_choice'
				? errorMessage
				: MISSING_ANSWER_FAILURE_REASON,
		});
		return {
			test_case_id: testCase.id,
			split: testCase.split,
			user_message: workspaceRecord.user_message,
			final_text: finalText,
			answer_text: answerText,
			is_skill_loaded: evidence.includes(oproTargetFile.target_skill_name),
			rule_checks: ruleChecks,
			passed_rule_count: ruleChecks.filter((ruleCheck) => ruleCheck.is_passed === true).length,
			evidence: evidence,
			error_message: errorMessage,
			duration_milliseconds: Date.now() - startTime,
		};
	}

	/**
	 * Finds the rule of the kind `judge` that applies to one test case.
	 *
	 * @param oproTargetFile The target file.
	 * @param testCase The test case.
	 * @returns The name of the rule, or `null` when no rule of the kind `judge` applies.
	 */
	static findJudgeRuleName(oproTargetFile: OproTargetFile, testCase: TestCase): string | null {
		for (const ruleDefinition of oproTargetFile.rules) {
			const checkDefinition = ruleDefinition.checks.find((candidateCheck) => {
				return OproRules.matchesConditions(candidateCheck.when, testCase);
			});
			if (checkDefinition?.kind === 'judge') {
				return ruleDefinition.name;
			}
		}
		return null;
	}
}
