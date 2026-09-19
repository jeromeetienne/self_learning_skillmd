export type Task = {
	title: string,
	dueDate: string | null,
	isDone: boolean,
};

let tasks: Task[] = [];

export function addTask(title: string, dueDate: string | null): void {
	tasks.push({
		title,
		dueDate,
		isDone: false,
	});
}

export function listTasks(): Task[] {
	return [...tasks];
}

export function deleteTask(index: number): void {
	tasks = tasks.filter((_, taskIndex) => taskIndex !== index);
}

export function completeTask(index: number): void {
	const task = tasks[index];
	task.isDone = true;
}
