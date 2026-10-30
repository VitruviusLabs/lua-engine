import { type Variable, VariableKind } from "../../_index.mjs";

function getTableKey(value: Variable | undefined): unknown
{
	if (value === undefined)
	{
		return undefined;
	}

	switch (value.data_type)
	{
		case VariableKind.Nil:
			return undefined;
		case VariableKind.Boolean:
			return value.boolean;
		case VariableKind.Number:
			return value.number;
		case VariableKind.String:
			return value.string;
		case VariableKind.Table:
			return value.table;
		case VariableKind.Function:
			return BigInt(value.function_id);
		case VariableKind.NativeFunction:
			return value.native_function;
	}
}

export { getTableKey };
