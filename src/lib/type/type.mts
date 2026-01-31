import type { Variable } from "../../_index.mjs";
import type { Engine } from "../../engine.mjs";
import { make_string } from "../../runtime.mjs";

// @ts-expect-error - engine is unused for now.
function type(engine: Engine, variable: Variable): Array<Variable>
{
	return [make_string(variable.data_type)];
}

export { type };
