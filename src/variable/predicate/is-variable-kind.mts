import type { VariableKind } from "../definition/enum/variable-kind.enum.mjs";
import type { Variable } from "../definition/type/variable.type.mjs";
import { isVariable } from "./is-variable.mjs";

function isVariableKind<K extends VariableKind>(variable: unknown, kind: K): variable is Variable & { data_type: K }
{
	return isVariable(variable) && variable.data_type === kind;
}

export { isVariableKind };
