///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
//	Concurrency — runs an asynchronous function on each item, with a maximum number of calls at the same time
///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

/** Runs an asynchronous function on each item of a list, with a maximum number of calls at the same time. */
export class Concurrency {
	/**
	 * Calls a function on each item, with at most `concurrency` calls at the same time, and keeps the order of the
	 * items in the results.
	 *
	 * @param items The items.
	 * @param concurrency The maximum number of calls at the same time.
	 * @param itemFn The function to call on each item.
	 * @returns The results, in the order of the items.
	 */
	static async map<Item, Result>(
		items: Item[],
		concurrency: number,
		itemFn: (item: Item) => Promise<Result>,
	): Promise<Result[]> {
		const results: Result[] = new Array(items.length);
		let nextIndex = 0;
		const workerCount = Math.max(1, Math.min(concurrency, items.length));
		const workers = Array.from({
			length: workerCount,
		}, async () => {
			while (nextIndex < items.length) {
				const index = nextIndex;
				nextIndex += 1;
				results[index] = await itemFn(items[index] as Item);
			}
		});
		await Promise.all(workers);
		return results;
	}

	/**
	 * Calls a function on each item, with at most `concurrency` calls at the same time, and stops as soon as
	 * `shouldContinueFn` refuses the results that are ready. The calls that already run are waited for, and no new
	 * call starts after the refusal, so the caller pays for nothing more than the calls that already run.
	 *
	 * @param items The items.
	 * @param concurrency The maximum number of calls at the same time.
	 * @param itemFn The function to call on each item.
	 * @param shouldContinueFn Reads the results that are ready, and returns `false` to start no other call.
	 * @returns The results of the calls that ran, in the order of the items.
	 */
	static async mapWhile<Item, Result>(
		items: Item[],
		concurrency: number,
		itemFn: (item: Item) => Promise<Result>,
		shouldContinueFn: (readyResults: Result[]) => boolean,
	): Promise<Result[]> {
		const results: (Result | undefined)[] = new Array(items.length);
		let nextIndex = 0;
		let isStopped = false;
		const readResultsInOrder = (): Result[] => {
			return results.filter((result): result is Result => result !== undefined);
		};
		const workerCount = Math.max(1, Math.min(concurrency, items.length));
		const workers = Array.from({
			length: workerCount,
		}, async () => {
			while (nextIndex < items.length && isStopped === false) {
				const index = nextIndex;
				nextIndex += 1;
				results[index] = await itemFn(items[index] as Item);
				if (shouldContinueFn(readResultsInOrder()) === false) {
					isStopped = true;
				}
			}
		});
		await Promise.all(workers);
		return readResultsInOrder();
	}
}
