import { isEnumValue } from "@vitruvius-labs/ts-predicate";
import { VariableKind, type VariableKindEnum } from "../definition/enum/variable-kind.enum.mjs";

function isVariableKindEnum(value: unknown): value is VariableKindEnum
{
	return isEnumValue(value, [
		VariableKind.Nil,
		VariableKind.Boolean,
		VariableKind.Number,
		VariableKind.String,
		VariableKind.Table,
		VariableKind.Function,
		VariableKind.NativeFunction,
	]);
}

export { isVariableKindEnum };
