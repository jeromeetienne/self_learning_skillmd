import Fs from 'node:fs';
import Path from 'node:path';
import { z } from 'zod';
import { SPLIT_NAMES } from './harness_types.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	OproTargetFile — reads the data files that describe one target skill: `opro_target.json` and `test_cases.json`
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Zod schema of one change to one file of the copied folder of the workspace recipe. */
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

/** One change to one file of the copied folder of the workspace recipe. */
export type FileChange = z.infer<typeof FileChangeSchema>;

/** Zod schema of the git repository of the workspace recipe. */
export const GitRepositoryRecipeSchema = z.object({
	/** The branch of the first commit. */
	initial_branch_name: z.string(),
	/** The message of the first commit, which holds every copied file. */
	first_commit_message: z.string(),
	/** The date of every commit, as an ISO 8601 date and time, so that two workspaces are the same. */
	commit_date: z.string(),
	/** `true` when the file changes of the test case go into the index of git. */
	stage_file_changes: z.boolean(),
});

/** Zod schema of the recipe that builds the workspace of one test case. */
export const WorkspaceRecipeSchema = z.object({
	/** The folder to copy into the project, relative to the folder of the target skill, or `null` for no folder. */
	copy_folder_path: z.string().nullable(),
	/** The git repository to start in the project, or `null` for a project with no git repository. */
	git_repository: GitRepositoryRecipeSchema.nullable(),
});

/** Zod schema of the whole `opro_target.json` file. */
export const OproTargetFileSchema = z.object({
	/** The skill that the OPRO loop improves. */
	target_skill_name: z.string(),
	/** The part of the `SKILL.md` file that the OPRO loop improves. */
	skill_part_name: z.enum(['description', 'body']),
	/** The folder of the first version of the skills, relative to the folder of the target skill. */
	skills_folder_path: z.string(),
	/** The request that starts the user message of every test case. The `user_message` of the test case comes after. */
	user_message_prefix: z.string(),
	/** The tools that Claude Code may call without a question when it runs the target skill. */
	claude_allowed_tool_names: z.array(z.string()),
	/** The time after which the harness that runs the target skill is stopped. */
	timeout_milliseconds: z.number().int().positive(),
	/** The recipe that builds the workspace of one test case. */
	workspace_recipe: WorkspaceRecipeSchema,
});

/** The whole `opro_target.json` file. */
export type OproTargetFile = z.infer<typeof OproTargetFileSchema>;

/** Zod schema of one test case of `test_cases.json`. Every other field of a test case is kept. */
export const TestCaseSchema = z.looseObject({
	/** The unique name of the test case. */
	id: z.string(),
	/** The group of the test case. */
	split: z.enum(SPLIT_NAMES),
	/** What the test case adds to `user_message_prefix`. It can be empty. */
	user_message: z.string().default(''),
	/** The branch of the workspace, or `null` for the branch of the first commit. */
	branch_name: z.string().nullable().default(null),
	/** The changes that the test case applies to the copied folder. */
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

/** Reads `opro_target.json` and `test_cases.json` from the folder of one target skill. */
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
	 * Reads one test case of `test_cases.json`.
	 *
	 * @param targetFolderPath The folder of the target skill.
	 * @param testCaseId The name of the test case.
	 * @returns The test case.
	 */
	static readTestCase(targetFolderPath: string, testCaseId: string): TestCase {
		const filePath = Path.join(targetFolderPath, 'test_cases.json');
		const testCaseFile = TestCaseFileSchema.parse(JSON.parse(Fs.readFileSync(filePath, 'utf8')));
		const testCase = testCaseFile.test_cases.find((candidateTestCase) => {
			return candidateTestCase.id === testCaseId;
		});
		if (testCase === undefined) {
			throw new Error(`no test case is named ${testCaseId} in ${filePath}`);
		}
		return testCase;
	}
}
