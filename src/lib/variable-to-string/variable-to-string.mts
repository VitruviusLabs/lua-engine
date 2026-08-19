import type { Variable } from "../../_index.mjs";
import { VariableKind } from "../../variable/definition/enum/variable-kind.enum.mjs";

function variable_to_string(variable: Variable, tables_done: Array<Variable> = []): string
{
	switch (variable.data_type)
	{
		case VariableKind.Nil:
			return "nil";
		case VariableKind.Boolean:
			return variable.boolean ? "true" : "false";
		case VariableKind.Number:
			return variable.number.toString();
		case VariableKind.String:
			return variable.string;
		case VariableKind.Function:
			return `<Function id="${variable.function_id.toString()}">`;
		case VariableKind.NativeFunction:
			return `<Function name="${variable.native_function.name}">`;
		case VariableKind.Table:
		{
			if (tables_done.includes(variable))
			{
				return "...";
			}

			tables_done.push(variable);

			const items: Array<string> = [];

			for (const [key, value] of variable.table.entries())
			{
				const item: string = `${String(key)} = ${variable_to_string(value, tables_done)}`;

				items.push(item);
			}

			return `{ ${items.join(", ")} }`;
		}
	}
}

export { variable_to_string };
