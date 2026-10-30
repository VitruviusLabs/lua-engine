import type { Variable } from "../definition/type/variable.type.mjs";
import type { VariableNil } from "../definition/interface/variable-nil.interface.mjs";
import { isVariableKind } from "./is-variable-kind.mjs";
import { VariableKind } from "../definition/enum/variable-kind.enum.mjs";
import { isNullish } from "@vitruvius-labs/ts-predicate";

function isNil(parameter: Variable | undefined): parameter is undefined | VariableNil
{
	return isNullish(parameter) || isVariableKind(parameter, VariableKind.Nil);
}

export { isNil };
