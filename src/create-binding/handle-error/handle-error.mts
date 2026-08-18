import { type Callable, ValidationError, isInstanceOf } from "@vitruvius-labs/ts-predicate";
import { RuntimeError } from "../../runtime-error.mjs";

function handle_error(error: unknown, callable: Callable): never
{
	if (isInstanceOf(error, RuntimeError) || isInstanceOf(error, ValidationError))
	{
		throw error;
	}

	if (callable.name === "")
	{
		throw new RuntimeError("An error occurred during native anonymous function execution.", { cause: error });
	}

	throw new RuntimeError(`An error occurred during native function ${callable.name} execution.`, { cause: error });
}

export { handle_error };
