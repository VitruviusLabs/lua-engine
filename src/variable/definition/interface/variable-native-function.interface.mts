import type { NativeFunction } from "../../../boundary/definition/type/native-function.type.mjs";
import type { BaseVariable } from "./base-variable.interface.mjs";
import type { VariableKind } from "../enum/variable-kind.enum.mjs";

interface VariableNativeFunction extends BaseVariable
{
	data_type: typeof VariableKind.NativeFunction;
	native_function: NativeFunction;
}

export type { VariableNativeFunction };
