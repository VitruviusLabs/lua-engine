import { type VariableBoolean, VariableKind } from "../../_index.mjs";

function make_boolean(boolean: boolean): VariableBoolean
{
	return { data_type: VariableKind.Boolean, boolean: boolean };
}

export { make_boolean };
