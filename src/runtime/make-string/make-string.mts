import { VariableKind, type VariableString } from "../../_index.mjs";

function make_string(string: string): VariableString
{
	return { data_type: VariableKind.String, string: string };
}

export { make_string };
