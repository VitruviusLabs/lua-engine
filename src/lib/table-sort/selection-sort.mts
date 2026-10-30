async function selection_sort<T>(items: Array<T>, compare_callable: (a: T, z: T) => Promise<boolean>): Promise<Array<T>>
{
	const sorted_items: Array<T> = items.slice();

	const length: number = items.length;

	for (let i = 0; i < length - 1; ++i)
	{
		let min_index: number = i;

		for (let j = i + 1; j < length; ++j)
		{
			// @ts-expect-error -- It's not out of bound
			const first: T = sorted_items[j];

			// @ts-expect-error -- It's not out of bound
			const second: T = sorted_items[min_index];

			const first_before_second: boolean = await compare_callable(first, second);

			if (first_before_second)
			{
				min_index = j;
			}
		}

		// @ts-expect-error -- It's not out of bound
		const temp: T = sorted_items[i];

		// @ts-expect-error -- It's not out of bound
		sorted_items[i] = sorted_items[min_index];

		sorted_items[min_index] = temp;
	}

	return sorted_items;
}

export { selection_sort };
