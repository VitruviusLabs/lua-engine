import type { BaseVariable } from "./base-variable.interface.mjs";
import type { VariableKind } from "../enum/variable-kind.enum.mjs";

interface VariableBoolean extends BaseVariable
{
	data_type: VariableKind.Boolean;
	boolean: boolean;
}

export type { VariableBoolean };
