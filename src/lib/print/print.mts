import { type Variable, nil } from "../../_index.mjs";
import type { Engine } from "../../engine.mjs";
import { variable_to_string } from "../variable-to-string/variable-to-string.mjs";

// @ts-expect-error - engine is unused for now.
function print(engine: Engine, ...args: Array<Variable>): Array<Variable>
{
	// eslint-disable-next-line no-console
	console.log(...args.map(
		(arg): string =>
		{
			return variable_to_string(arg);
		}
	));

	return [nil];
}

export { print };
