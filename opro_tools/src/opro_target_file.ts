import Fs from 'node:fs';
import Path from 'node:path';
import { z } from 'zod';
import { SPLIT_NAMES } from './harness_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproTargetFile — reads the data files that describe one target skill: `opro_target.json` and `test_cases.json`
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Zod schema of one change to one file of the project of a workspace. */
export const FileChangeSchema = z.object({
	/** The path of the file in the project. */
	path: z.string(),
	/**
	 * The text to replace, which must occur exactly once in the file. `null` writes the whole file with `new_text`,
	 * or deletes the file when `new_text` is `null` too.
	 */
	old_text: z.string().nullable(),
	/** The new text, or `null` to delete the file. */
	new_text: z.string().nullable(),
});

/** One change to one file of the project of a workspace. */
export type FileChange = z.infer<typeof FileChangeSchema>;

/** Zod schema of one commit that the workspace recipe writes before the harness runs. */
export const WorkspaceCommitSchema = z.object({
	/** The branch of the commit. A branch that is not the current one starts from the current commit. */
	branch_name: z.string(),
	/** The message of the commit. */
	message: z.string(),
	/** The files that the commit writes, by their path in the project, or `null` to commit every file that is there. */
	files: z.record(z.string(), z.string()).nullable().default(null),
	/** The tag of the commit, or `null` when the commit has no tag. */
	tag_name: z.string().nullable().default(null),
});

/** One commit that the workspace recipe writes before the harness runs. */
export type WorkspaceCommit = z.infer<typeof WorkspaceCommitSchema>;

/** Zod schema of the git repository of the workspace recipe. */
export const GitRepositoryRecipeSchema = z.object({
	/** The branch of the first commit. */
	initial_branch_name: z.string(),
	/** The date of the first commit, as an ISO 8601 date and time, so that two workspaces are the same. */
	first_commit_date: z.string(),
	/** The number of days between two commits, so that the history has an order that a harness can read. */
	day_count_between_commits: z.number().int().min(0).default(0),
	/** The commits to write, in this order. An empty list leaves an empty git repository. */
	commits: z.array(WorkspaceCommitSchema).default([]),
	/** The file, relative to the folder of the target skill, that holds the commits, instead of `commits`. */
	commits_file_path: z.string().nullable().default(null),
	/** `true` when the file changes of the test case go into the index of git, for a test about staged changes. */
	stage_file_changes: z.boolean().default(false),
});

/** Zod schema of the recipe that builds the workspace of one test case. */
export const WorkspaceRecipeSchema = z.object({
	/** The folder to copy into the project, relative to the folder of the target skill, or `null` for no folder. */
	copy_folder_path: z.string().nullable().default(null),
	/** The git repository to start in the project, or `null` for a project with no git repository. */
	git_repository: GitRepositoryRecipeSchema.nullable().default(null),
});

/** The recipe that builds the workspace of one test case. */
export type WorkspaceRecipe = z.infer<typeof WorkspaceRecipeSchema>;

/** Zod schema of one condition on one field of a test case. */
export const RuleConditionSchema = z.object({
	/** The field of the test case to read. */
	field: z.string(),
	/** How to compare the field. */
	operator: z.enum(['is_null', 'is_not_null', 'equals', 'not_equals']),
	/** The value to compare the field with, for `equals` and `not_equals`. */
	value: z.unknown().optional(),
});

/** One condition on one field of a test case. */
export type RuleCondition = z.infer<typeof RuleConditionSchema>;

/** Zod schema of one pattern of the check kind `refused_patterns`. */
export const RefusedPatternSchema = z.object({
	/** `word` matches the value as a whole word, and `regular_expression` matches the value as written. */
	kind: z.enum(['word', 'regular_expression']),
	/** The word or the regular expression. */
	value: z.string(),
	/** The flags of the regular expression, without `g`, which the engine always adds. */
	flags: z.string().default('i'),
});

/** One pattern of the check kind `refused_patterns`. */
export type RefusedPattern = z.infer<typeof RefusedPatternSchema>;

/**
 * Zod schema of one check of one rule. `when` chooses the check, and every other field belongs to the kind of the
 * check. Every pattern and every message can hold `{{field}}`, which the engine replaces with the field of the test
 * case, escaped when it goes into a regular expression.
 */
export const RuleCheckDefinitionSchema = z.object({
	/** The conditions that the test case must obey for this check to apply. An empty list always applies. */
	when: z.array(RuleConditionSchema).default([]),
	/** The kind of the check. */
	kind: z.enum([
		'regular_expression_must_match',
		'regular_expression_must_not_match',
		'maximum_line_length',
		'maximum_sentence_word_count',
		'refused_patterns',
		'expected_answer',
		'judge',
	]),
	/** The part of the answer to check: the whole answer, its first line, or its last line. */
	scope: z.enum(['whole', 'first_line', 'last_line']).default('whole'),
	/** `true` when every code block and every code span is replaced by one word before the check. */
	remove_code: z.boolean().default(false),
	/** The regular expression of the two `regular_expression_` kinds. */
	pattern: z.string().nullable().default(null),
	/** The flags of `pattern`, without `g`. */
	flags: z.string().default(''),
	/** The maximum of the two `maximum_` kinds: characters of a line, or words of a sentence. */
	maximum: z.number().int().positive().nullable().default(null),
	/** The patterns of the kind `refused_patterns`. */
	patterns: z.array(RefusedPatternSchema).default([]),
	/** The words that the kind `refused_patterns` never refuses, such as `OK`. */
	allowed_words: z.array(z.string()).default([]),
	/** The field of the test case that holds the expected answer, for the kind `expected_answer`. */
	expected_field: z.string().nullable().default(null),
	/** What to write when the check fails, instead of the message of the engine. */
	failure_message: z.string().nullable().default(null),
});

/** One check of one rule. */
export type RuleCheckDefinition = z.infer<typeof RuleCheckDefinitionSchema>;

/** Zod schema of one rule of a target skill. */
export const RuleDefinitionSchema = z.object({
	/** The name of the rule, which the feedback of the OPRO loop shows. */
	name: z.string(),
	/** The checks of the rule. The first one whose `when` the test case obeys is the check of that test case. */
	checks: z.array(RuleCheckDefinitionSchema).min(1),
});

/** One rule of a target skill. */
export type RuleDefinition = z.infer<typeof RuleDefinitionSchema>;

/** Zod schema of the judge of a target skill, which checks what no regular expression can check. */
export const JudgeDefinitionSchema = z.object({
	/** The file, relative to the folder of the target skill, that holds the question of the judge. */
	rubric_file_path: z.string(),
	/** The time after which the judge is stopped. */
	timeout_milliseconds: z.number().int().positive().default(300000),
});

/** Zod schema of the whole `opro_target.json` file. */
export const OproTargetFileSchema = z.object({
	/** The skill that the OPRO loop improves. */
	target_skill_name: z.string(),
	/** The part of the `SKILL.md` file that the OPRO loop improves. */
	skill_part_name: z.enum(['description', 'body']),
	/** The folder of the first version of the skills, relative to the folder of the target skill. */
	skills_folder_path: z.string(),
	/** The file, relative to the folder of the target skill, that says what the test measures, for the proposer. */
	test_explanation_file_path: z.string(),
	/**
	 * `answer` runs the harness until the end of its turn and checks its last answer. `skill_choice` stops the
	 * harness as soon as it names a skill of the skills folder, and the answer is the name of that skill.
	 */
	run_mode: z.enum(['answer', 'skill_choice']).default('answer'),
	/** The message that the user sends to the harness. It can hold `{{field}}` of the test case. */
	user_message_template: z.string(),
	/** How to read the answer from the last answer of the harness. */
	answer_extraction: z.enum(['first_code_block_or_whole_answer', 'whole_answer']).default('whole_answer'),
	/** `true` when the spaces at the end of each line of the answer are removed. */
	trim_line_ends: z.boolean().default(false),
	/** The tools that Claude Code may call without a question when it runs the target skill. */
	claude_allowed_tool_names: z.array(z.string()).default([]),
	/** The time after which the harness that runs the target skill is stopped. */
	timeout_milliseconds: z.number().int().positive().default(300000),
	/** The recipe that builds the workspace of one test case. */
	workspace_recipe: WorkspaceRecipeSchema,
	/** The rules that every answer must obey. The score is the percentage of rule checks that pass. */
	rules: z.array(RuleDefinitionSchema).min(1),
	/** The judge, or `null` when no rule has the kind `judge`. */
	judge: JudgeDefinitionSchema.nullable().default(null),
	/**
	 * How much the score of the same version moves between two runs of the whole `optimization` group, in percent,
	 * measured one time with the tool `measure-score-noise`, or `null` when nobody measured it yet. Two versions
	 * whose scores differ by less than this number are not separated by one run each.
	 */
	score_noise_percent: z.number().min(0).max(100).nullable().default(null),
});

/** The whole `opro_target.json` file. */
export type OproTargetFile = z.infer<typeof OproTargetFileSchema>;

/** Zod schema of one test case of `test_cases.json`. Every other field of a test case is kept. */
export const TestCaseSchema = z.looseObject({
	/** The unique name of the test case. */
	id: z.string(),
	/** The group of the test case. */
	split: z.enum(SPLIT_NAMES),
	/** The branch of the workspace, or `null` for the branch of the last commit of the recipe. */
	branch_name: z.string().nullable().default(null),
	/** The changes that the test case applies to the project of the workspace. */
	file_changes: z.array(FileChangeSchema).default([]),
});

/** One test case of `test_cases.json`. */
export type TestCase = z.infer<typeof TestCaseSchema>;

/** Zod schema of the whole `test_cases.json` file. */
export const TestCaseFileSchema = z.object({
	/** The skill that the OPRO loop improves, which must be the one of `opro_target.json`. */
	target_skill_name: z.string(),
	/** Every test case of the target skill. */
	test_cases: z.array(TestCaseSchema).min(1),
});

/** Reads the data files of one target skill. */
export class OproTargetFileReader {
	/**
	 * Reads `opro_target.json`.
	 *
	 * @param targetFolderPath The folder of the target skill.
	 * @returns The target file.
	 */
	static readTargetFile(targetFolderPath: string): OproTargetFile {
		const filePath = Path.join(targetFolderPath, 'opro_target.json');
		return OproTargetFileSchema.parse(JSON.parse(Fs.readFileSync(filePath, 'utf8')));
	}

	/**
	 * Reads the test cases of `test_cases.json`, and keeps the ones of the selected groups.
	 *
	 * @param targetFolderPath The folder of the target skill.
	 * @param splitNames The groups to keep, or `null` for every test case.
	 * @returns The test cases.
	 */
	static readTestCases(targetFolderPath: string, splitNames: string[] | null): TestCase[] {
		const filePath = Path.join(targetFolderPath, 'test_cases.json');
		const testCaseFile = TestCaseFileSchema.parse(JSON.parse(Fs.readFileSync(filePath, 'utf8')));
		if (splitNames === null) {
			return testCaseFile.test_cases;
		}
		const testCases = testCaseFile.test_cases.filter((testCase) => {
			return splitNames.includes(testCase.split);
		});
		if (testCases.length === 0) {
			throw new Error(`no test case of ${filePath} is in the groups ${splitNames.join(', ')}`);
		}
		return testCases;
	}

	/**
	 * Reads one test case of `test_cases.json`.
	 *
	 * @param targetFolderPath The folder of the target skill.
	 * @param testCaseId The name of the test case.
	 * @returns The test case.
	 */
	static readTestCase(targetFolderPath: string, testCaseId: string): TestCase {
		const testCase = OproTargetFileReader.readTestCases(targetFolderPath, null).find((candidateTestCase) => {
			return candidateTestCase.id === testCaseId;
		});
		if (testCase === undefined) {
			throw new Error(`no test case is named ${testCaseId} in ${targetFolderPath}`);
		}
		return testCase;
	}

	/**
	 * Reads the commits of the workspace recipe, from the recipe itself or from the file that it names.
	 *
	 * @param targetFolderPath The folder of the target skill.
	 * @param workspaceRecipe The recipe.
	 * @returns The commits, in the order in which they are written.
	 */
	static readWorkspaceCommits(targetFolderPath: string, workspaceRecipe: WorkspaceRecipe): WorkspaceCommit[] {
		const gitRepositoryRecipe = workspaceRecipe.git_repository;
		if (gitRepositoryRecipe === null) {
			return [];
		}
		if (gitRepositoryRecipe.commits_file_path === null) {
			return gitRepositoryRecipe.commits;
		}
		const filePath = Path.resolve(targetFolderPath, gitRepositoryRecipe.commits_file_path);
		const commitFile = z.object({
			/** The commits of the workspace. */
			commits: z.array(WorkspaceCommitSchema),
		}).parse(JSON.parse(Fs.readFileSync(filePath, 'utf8')));
		return commitFile.commits;
	}
}
