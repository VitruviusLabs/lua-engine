import type { BaseVariable } from "./base-variable.interface.mjs";
import type { VariableKind } from "../enum/variable-kind.enum.mjs";

interface VariableString extends BaseVariable
{
	data_type: typeof VariableKind.String;
	string: string;
}

export type { VariableString };
