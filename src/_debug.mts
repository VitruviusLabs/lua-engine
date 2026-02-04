import { NoValue } from "@vitruvius-labs/ts-predicate";
import { Engine, VariableUnwrapUtility } from "./_index.mjs";

const engine = new Engine(
	`
		a = {}

		for i = 1, 5 do
			table.insert(a, i)
		end
	`
);

await engine.run();

for (const identifier of ["a", "b"] as const)
{
	const variable = engine.getGlobal(identifier);

	console.log(variable);

	const value = variable === undefined ? NoValue : VariableUnwrapUtility.unwrap(variable);

	console.debug(`Variable ${identifier}:`, value);
}
