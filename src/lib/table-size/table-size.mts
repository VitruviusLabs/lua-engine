import type { VariableTable } from "../../_index.mjs";

function table_size(value: VariableTable): number
{
	let size: number = 0;

	for (let i: number = 1; i < value.table.size; ++i)
	{
		if (!value.table.has(i))
		{
			return size;
		}

		++size;
	}

	return size;
}

export { table_size };
