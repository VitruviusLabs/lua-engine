import type { BaseVariable } from "./base-variable.interface.mjs";
import type { VariableKind } from "../enum/variable-kind.enum.mjs";

interface VariableNil extends BaseVariable
{
	data_type: typeof VariableKind.Nil;
}

export type { VariableNil };
