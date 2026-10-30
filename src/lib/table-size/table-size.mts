import type { VariableTable } from "../../_index.mjs";
import { isNil } from "../../variable/predicate/is-nil.mjs";

function table_size(value: VariableTable): number
{
	let size: number = 0;

	for (let i: number = 1; i <= value.table.size; ++i)
	{
		if (isNil(value.table.get(i)))
		{
			return size;
		}

		++size;
	}

	return size;
}

export { table_size };
