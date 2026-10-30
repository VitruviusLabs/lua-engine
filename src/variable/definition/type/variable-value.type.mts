import type { NativeFunction } from "../../../boundary/definition/type/native-function.type.mjs";
import type { VariableTableMapType } from "./variable-table-map.type.mjs";
import type { VariableKind, VariableKindEnum } from "../enum/variable-kind.enum.mjs";

type VariableValueType<K extends VariableKindEnum>
	= K extends typeof VariableKind.Nil ? undefined
	: K extends typeof VariableKind.Boolean ? boolean
	: K extends typeof VariableKind.Number ? number
	: K extends typeof VariableKind.String ? string
	: K extends typeof VariableKind.Table ? VariableTableMapType
	: K extends typeof VariableKind.Function ? number
	: K extends typeof VariableKind.NativeFunction ? NativeFunction
	: never;

export type { VariableValueType };
