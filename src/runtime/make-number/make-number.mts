import { VariableKind, type VariableNumber } from "../../_index.mjs";

function make_number(number: number): VariableNumber
{
	return { data_type: VariableKind.Number, number: number };
}

export { make_number };
