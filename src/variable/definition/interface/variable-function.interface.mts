import type { BaseVariable } from "./base-variable.interface.mjs";
import type { VariableKind } from "../enum/variable-kind.enum.mjs";

interface VariableFunction extends BaseVariable
{
	data_type: typeof VariableKind.Function;
	function_id: number;
}

export type { VariableFunction };
