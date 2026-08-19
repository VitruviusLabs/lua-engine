import { ValidationError } from "@vitruvius-labs/ts-predicate";
import type { Variable } from "../definition/type/variable.type.mjs";
import { isVariable } from "./is-variable.mjs";

function assertVariable(variable: unknown): asserts variable is Variable
{
	if (!isVariable(variable))
	{
		throw new ValidationError("Expected Variable");
	}
}

export { assertVariable };
