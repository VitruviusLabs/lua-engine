import { isStructuredData } from "@vitruvius-labs/ts-predicate";
import type { Variable } from "../definition/type/variable.type.mjs";
import { isVariableKindEnum } from "./is-variable-kind-enum.mjs";

function isVariable(value: unknown): value is Variable
{
	return isStructuredData(
		value,
		{
			data_type: isVariableKindEnum,
		},
		{
			allowExtraneousProperties: true,
		}
	);
}

export { isVariable };
