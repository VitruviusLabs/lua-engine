import type { Variable } from "../../_index.mjs";
import type { Engine } from "../../engine.mjs";
import { make_string } from "../../runtime/make-string/make-string.mjs";
import { VariableKind } from "../../variable/definition/enum/variable-kind.enum.mjs";

// @ts-expect-error - engine is unused for now.
function type(engine: Engine, variable: Variable): Array<Variable>
{
	if (variable.data_type === VariableKind.NativeFunction)
	{
		return [make_string(VariableKind.Function)];
	}

	return [make_string(variable.data_type)];
}

export { type };
