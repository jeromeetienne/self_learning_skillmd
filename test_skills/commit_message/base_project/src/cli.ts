import { addTask, completeTask, deleteTask, listTasks } from './index.js';

const [commandName, ...commandArguments] = process.argv.slice(2);

if (commandName === 'add') {
	addTask(commandArguments[0], commandArguments[1] ?? null);
} else if (commandName === 'done') {
	completeTask(Number(commandArguments[0]));
} else if (commandName === 'delete') {
	deleteTask(Number(commandArguments[0]));
} else if (commandName === 'list') {
	const isJson = commandArguments.includes('--json');
	const tasks = listTasks();
	if (isJson) {
		console.log(JSON.stringify(tasks));
	} else {
		for (const task of tasks) {
			console.log(`${task.isDone ? '[x]' : '[ ]'} ${task.title}`);
		}
	}
} else {
	console.log('usage: todo <add|done|delete|list>');
}
