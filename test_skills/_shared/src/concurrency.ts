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
}
