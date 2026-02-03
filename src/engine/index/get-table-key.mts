import { type Variable, VariableKind } from "../../_index.mjs";

function getTableKey(value: Variable | undefined): string | number | undefined
{
	if (value === undefined)
	{
		return undefined;
	}

	if (value.data_type === VariableKind.String)
	{
		return value.string;
	}

	if (value.data_type === VariableKind.Number)
	{
		return value.number;
	}

	return undefined;
}

export { getTableKey };
