import type { Variable } from "./definition/type/variable.type.mjs";
import { VariableKind } from "./definition/enum/variable-kind.enum.mjs";
import { isVariableKind } from "./predicate/is-variable-kind.mjs";
import { isNullish } from "@vitruvius-labs/ts-predicate";

function equals(a: Variable | undefined, b: Variable | undefined): boolean
{
	if (a === b)
	{
		return true;
	}

	if (isNullish(a) || isNullish(b))
	{
		return false;
	}

	switch (a.data_type)
	{
		case VariableKind.Nil:
			return isVariableKind(b, VariableKind.Nil);
		case VariableKind.Boolean:
			return isVariableKind(b, VariableKind.Boolean) && a.boolean === b.boolean;
		case VariableKind.Number:
			return isVariableKind(b, VariableKind.Number) && a.number === b.number;
		case VariableKind.String:
			return isVariableKind(b, VariableKind.String) && a.string === b.string;
		case VariableKind.Table:
			return isVariableKind(b, VariableKind.Table) && a.table === b.table;
		case VariableKind.Function:
			return isVariableKind(b, VariableKind.Function) && a.function_id === b.function_id;
		case VariableKind.NativeFunction:
			return isVariableKind(b, VariableKind.NativeFunction) && a.native_function === b.native_function;
	}
}

export { equals };
