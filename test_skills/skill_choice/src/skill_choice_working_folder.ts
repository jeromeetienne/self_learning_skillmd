import Fs from 'node:fs';
import Os from 'node:os';
import Path from 'node:path';
import { GitCommand } from '../../_shared/src/git_command.js';

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	SkillChoiceWorkingFolder — creates the folder where a harness runs: the skills and a small git repository
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** One commit of the small project of the working folder. */
type ProjectCommit = {
	/** The branch of the commit. A new branch starts from the current commit. */
	branchName: string,
	/** The commit message. */
	message: string,
	/** The files that the commit writes, by their path in the project. */
	files: Record<string, string>,
	/** The tag of the commit, or `null` when the commit has no tag. */
	tagName: string | null,
};

/** The `package.json` file of the project at version 1.0.0. */
const PACKAGE_JSON_TEXT_1_0_0 = `{
	"name": "todo-cli",
	"version": "1.0.0",
	"type": "module"
}
`;

/** The `package.json` file of the project at version 1.1.0. */
const PACKAGE_JSON_TEXT_1_1_0 = `{
	"name": "todo-cli",
	"version": "1.1.0",
	"type": "module"
}
`;

/** The `CHANGELOG.md` file of the project at version 1.0.0. */
const CHANGELOG_TEXT_1_0_0 = `# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

## [1.0.0] - 2026-06-01

### Added

- Add, list, and delete tasks.
`;

/** The `CHANGELOG.md` file of the project at version 1.1.0. */
const CHANGELOG_TEXT_1_1_0 = `# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

## [1.1.0] - 2026-06-10

### Added

- A due date for each task.

### Fixed

- The order of the tasks stays the same after a delete.

## [1.0.0] - 2026-06-01

### Added

- Add, list, and delete tasks.
`;

/**
 * The history of the small project `todo-cli`: tags `v1.0.0` and `v1.1.0` on `main`, one more commit on `main`,
 * and the current branch `add-task-priority` with two commits, so that a message about a release, a changelog, or a
 * branch finds what it needs in the working folder.
 */
const PROJECT_COMMITS: ProjectCommit[] = [
	{
		branchName: 'main',
		message: 'chore: create todo-cli with the add, list, and delete commands',
		files: {
			'README.md': '# todo-cli\n\nA command line tool that keeps a list of tasks.\n',
			'package.json': PACKAGE_JSON_TEXT_1_0_0,
			'CHANGELOG.md': CHANGELOG_TEXT_1_0_0,
			'src/index.ts': [
				'export type Task = { title: string };',
				'const tasks: Task[] = [];',
				'export function addTask(title: string): void { tasks.push({ title }); }',
				'export function listTasks(): Task[] { return tasks; }',
				'export function deleteTask(index: number): void { tasks.splice(index, 1); }',
				'',
			].join('\n'),
		},
		tagName: 'v1.0.0',
	},
	{
		branchName: 'main',
		message: 'feat: add a due date to each task',
		files: {
			'src/index.ts': [
				'export type Task = { title: string, dueDate: string | null };',
				'const tasks: Task[] = [];',
				'export function addTask(title: string, dueDate: string | null): void { tasks.push({ title, dueDate }); }',
				'export function listTasks(): Task[] { return tasks; }',
				'export function deleteTask(index: number): void { tasks.splice(index, 1); }',
				'',
			].join('\n'),
		},
		tagName: null,
	},
	{
		branchName: 'main',
		message: 'fix: keep the order of the tasks after a delete',
		files: {
			'src/index.ts': [
				'export type Task = { title: string, dueDate: string | null };',
				'let tasks: Task[] = [];',
				'export function addTask(title: string, dueDate: string | null): void { tasks.push({ title, dueDate }); }',
				'export function listTasks(): Task[] { return [...tasks]; }',
				'export function deleteTask(index: number): void { tasks = tasks.filter((_, i) => i !== index); }',
				'',
			].join('\n'),
		},
		tagName: null,
	},
	{
		branchName: 'main',
		message: 'chore: release 1.1.0',
		files: {
			'package.json': PACKAGE_JSON_TEXT_1_1_0,
			'CHANGELOG.md': CHANGELOG_TEXT_1_1_0,
		},
		tagName: 'v1.1.0',
	},
	{
		branchName: 'main',
		message: 'feat: add the --json option to the list command',
		files: {
			'src/cli.ts': [
				'import { listTasks } from \'./index.js\';',
				'const isJson = process.argv.includes(\'--json\');',
				'const tasks = listTasks();',
				'console.log(isJson ? JSON.stringify(tasks) : tasks.map((task) => task.title).join(\'\\n\'));',
				'',
			].join('\n'),
		},
		tagName: null,
	},
	{
		branchName: 'add-task-priority',
		message: 'feat: add a priority to each task, and sort the list by priority',
		files: {
			'src/index.ts': [
				'export type Task = { title: string, dueDate: string | null, priority: number };',
				'let tasks: Task[] = [];',
				'export function addTask(title: string, dueDate: string | null, priority = 0): void {',
				'\ttasks.push({ title, dueDate, priority });',
				'}',
				'export function listTasks(): Task[] { return [...tasks].sort((a, b) => b.priority - a.priority); }',
				'export function deleteTask(index: number): void { tasks = tasks.filter((_, i) => i !== index); }',
				'',
			].join('\n'),
		},
		tagName: null,
	},
	{
		branchName: 'add-task-priority',
		message: 'test: check the sort by priority',
		files: {
			'src/index.test.ts': [
				'import assert from \'node:assert\';',
				'import { addTask, listTasks } from \'./index.js\';',
				'addTask(\'low\', null, 1);',
				'addTask(\'high\', null, 5);',
				'assert.deepStrictEqual(listTasks().map((task) => task.title), [\'high\', \'low\']);',
				'',
			].join('\n'),
		},
		tagName: null,
	},
];

/**
 * Creates the folder where a harness runs, outside the repository: a copy of the skills in `.claude/skills` for
 * Claude Code and in `.agents/skills` for Codex, inside a small git repository. Without a git repository, a harness
 * spends its first commands looking for one, and loads no skill.
 */
export class SkillChoiceWorkingFolder {
	/**
	 * Creates the working folder.
	 *
	 * @param skillsFolderPath The folder that holds one folder for each skill.
	 * @returns The path of the working folder.
	 */
	static create(skillsFolderPath: string): string {
		const workingFolderPath = Fs.mkdtempSync(Path.join(Os.tmpdir(), 'skill_choice_'));
		for (const harnessFolderName of ['.claude', '.agents']) {
			Fs.cpSync(skillsFolderPath, Path.join(workingFolderPath, harnessFolderName, 'skills'), {
				recursive: true,
			});
		}
		SkillChoiceWorkingFolder._createGitRepository(workingFolderPath);
		return workingFolderPath;
	}

	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////
	//	Helpers
	///////////////////////////////////////////////////////////////////////////////
	///////////////////////////////////////////////////////////////////////////////

	/**
	 * Writes the commits of `PROJECT_COMMITS` into a new git repository. The git configuration of the user is
	 * ignored, so that no commit signature and no hook runs.
	 *
	 * @param workingFolderPath The working folder.
	 * @returns Nothing.
	 */
	static _createGitRepository(workingFolderPath: string): void {
		SkillChoiceWorkingFolder._runGit(workingFolderPath, ['init', '--quiet', '--initial-branch', 'main'], 0);
		let currentBranchName = 'main';
		PROJECT_COMMITS.forEach((projectCommit, commitIndex) => {
			if (projectCommit.branchName !== currentBranchName) {
				SkillChoiceWorkingFolder._runGit(
					workingFolderPath,
					['switch', '--quiet', '--create', projectCommit.branchName],
					commitIndex,
				);
				currentBranchName = projectCommit.branchName;
			}
			for (const [filePath, fileText] of Object.entries(projectCommit.files)) {
				const absoluteFilePath = Path.join(workingFolderPath, filePath);
				Fs.mkdirSync(Path.dirname(absoluteFilePath), {
					recursive: true,
				});
				Fs.writeFileSync(absoluteFilePath, fileText);
			}
			SkillChoiceWorkingFolder._runGit(workingFolderPath, ['add', '--all'], commitIndex);
			SkillChoiceWorkingFolder._runGit(
				workingFolderPath,
				['commit', '--quiet', '--message', projectCommit.message],
				commitIndex,
			);
			if (projectCommit.tagName !== null) {
				SkillChoiceWorkingFolder._runGit(workingFolderPath, ['tag', projectCommit.tagName], commitIndex);
			}
		});
	}

	/**
	 * Runs one git command in the working folder, with a fixed date for each commit.
	 *
	 * @param workingFolderPath The working folder.
	 * @param gitArguments The arguments of git.
	 * @param commitIndex The index of the commit in `PROJECT_COMMITS`, which sets the date of the commit.
	 * @returns Nothing.
	 */
	static _runGit(workingFolderPath: string, gitArguments: string[], commitIndex: number): void {
		const commitDate = new Date(Date.UTC(2026, 5, 1 + commitIndex * 3, 10, 0, 0)).toISOString();
		GitCommand.run(workingFolderPath, gitArguments, commitDate);
	}
}
