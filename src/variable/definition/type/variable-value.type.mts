import type { NativeFunction } from "../../../boundary/definition/type/native-function.type.mjs";
import type { TableMap } from "../../../boundary/definition/type/table-map.type.mjs";
import type { VariableKind } from "../enum/variable-kind.enum.mjs";

type VariableValueType<K extends VariableKind> = (
	K extends VariableKind.Nil ? undefined :
	K extends VariableKind.Boolean ? boolean :
	K extends VariableKind.Number ? number :
	K extends VariableKind.String ? string :
	K extends VariableKind.Table ? TableMap :
	K extends VariableKind.Function ? number :
	K extends VariableKind.NativeFunction ? NativeFunction :
	never
)

export type { VariableValueType };
