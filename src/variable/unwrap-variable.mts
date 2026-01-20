import type { Variable } from "./definition/type/variable.type.mjs";
import type { VariableBoolean } from "./definition/interface/variable-boolean.interface.mjs";
import type { VariableFunction } from "./definition/interface/variable-function.interface.mjs";
import type { VariableNativeFunction } from "./definition/interface/variable-native-function.interface.mjs";
import type { VariableNil } from "./definition/interface/variable-nil.interface.mjs";
import type { VariableNumber } from "./definition/interface/variable-number.interface.mjs";
import type { VariableString } from "./definition/interface/variable-string.interface.mjs";
import type { VariableTable } from "./definition/interface/variable-table.interface.mjs";
import { VariableKind } from "./definition/enum/variable-kind.enum.mjs";
import { isCallable } from "@vitruvius-labs/ts-predicate";

class VariableUnwrapUtility
{
	public static unwrap(this: void, input: VariableNil): undefined;
	public static unwrap(this: void, input: VariableBoolean): boolean;
	public static unwrap(this: void, input: VariableNumber): number;
	public static unwrap(this: void, input: VariableString): string;
	public static unwrap(this: void, input: VariableTable): Array<unknown> | Map<unknown, unknown>;
	public static unwrap(this: void, input: VariableFunction): { function_id: number };
	public static unwrap(this: void, input: VariableNativeFunction): Function;
	public static unwrap(this: void, input: Variable): unknown;

	public static unwrap(this: void, input: Variable): unknown
	{
		switch (input.data_type)
		{
			case VariableKind.Nil:
				return undefined;
			case VariableKind.Boolean:
				return input.boolean;
			case VariableKind.Number:
				return input.number;
			case VariableKind.String:
				return input.string;
			case VariableKind.Table:
				return VariableUnwrapUtility.unwrapTable(input);
			case VariableKind.Function:
				return { function_id: input.function_id };
			case VariableKind.NativeFunction:
				return input.native_function;
		}
	}

	public static unwrapTable(this: void, input: VariableTable): Array<unknown> | Map<unknown, unknown>
	{
		const output: Array<unknown> = [];

		for (let i = 1; i <= input.table.size; ++i)
		{
			const item: Variable | undefined = input.table.get(i);

			if (item === undefined)
			{
				// Not a table that can be unwrapped as an array
				return VariableUnwrapUtility.unwrapTableGeneric(input);
			}

			output.push(VariableUnwrapUtility.unwrap(item));
		}

		return output;
	}

	protected static unwrapTableGeneric(this: void, input: VariableTable): Map<unknown, unknown>
	{
		const output: Map<unknown, unknown> = new Map();

		for (const [key, value] of input.table.entries())
		{
			if (isCallable(key))
			{
				continue;
			}

			output.set(key, VariableUnwrapUtility.unwrap(value));
		}

		return output;
	}
}

export { VariableUnwrapUtility };
