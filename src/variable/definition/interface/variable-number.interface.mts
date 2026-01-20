import type { BaseVariable } from "./base-variable.interface.mjs";
import type { VariableKind } from "../enum/variable-kind.enum.mjs";

interface VariableNumber extends BaseVariable
{
	data_type: VariableKind.Number;
	number: number;
}

export type { VariableNumber };
