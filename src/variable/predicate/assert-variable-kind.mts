import { ValidationError } from "@vitruvius-labs/ts-predicate";
import type { VariableKindEnum } from "../definition/enum/variable-kind.enum.mjs";
import type { Variable } from "../definition/type/variable.type.mjs";
import { assertVariable } from "./assert-variable.mjs";

function assertVariableKind<K extends VariableKindEnum>(variable: unknown, kind: K): asserts variable is Variable & { data_type: K }
{
	assertVariable(variable);

	if (variable.data_type !== kind)
	{
		throw new ValidationError(`Expected ${kind}, got ${variable.data_type}`);
	}
}

export { assertVariableKind };
