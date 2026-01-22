import type { Variable } from "./definition/type/variable.type.mjs";
import type { VariableBoolean } from "./definition/interface/variable-boolean.interface.mjs";
import type { VariableFunction } from "./definition/interface/variable-function.interface.mjs";
import type { VariableNativeFunction } from "./definition/interface/variable-native-function.interface.mjs";
import type { VariableNil } from "./definition/interface/variable-nil.interface.mjs";
import type { VariableNumber } from "./definition/interface/variable-number.interface.mjs";
import type { VariableString } from "./definition/interface/variable-string.interface.mjs";
import type { VariableTable } from "./definition/interface/variable-table.interface.mjs";
import type { NativeFunction } from "../_index.mjs";
import type { TableType } from "../boundary/definition/type/table.type.mjs";
import type { TableMapType } from "../boundary/definition/type/table-map.type.mjs";
import type { FunctionReferenceType } from "../boundary/definition/type/function-reference.type.mjs";
import type { ValueType } from "../boundary/definition/type/value.type.mjs";
import { VariableKind } from "./definition/enum/variable-kind.enum.mjs";
import { isTableMapKeyType } from "../boundary/predicate/is-table-map-key-type.mjs";

class VariableUnwrapUtility
{
	public static unwrap(this: void, input: VariableNil): undefined;
	public static unwrap(this: void, input: VariableBoolean): boolean;
	public static unwrap(this: void, input: VariableNumber): number;
	public static unwrap(this: void, input: VariableString): string;
	public static unwrap(this: void, input: VariableTable): TableType;
	public static unwrap(this: void, input: VariableFunction): FunctionReferenceType;
	public static unwrap(this: void, input: VariableNativeFunction): NativeFunction;
	public static unwrap(this: void, input: Variable): ValueType;

	public static unwrap(this: void, input: Variable): ValueType
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

	public static unwrapTable(this: void, input: VariableTable): TableType
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

	protected static unwrapTableGeneric(this: void, input: VariableTable): TableMapType
	{
		const output: TableMapType = new Map();

		for (const [key, value] of input.table.entries())
		{
			if (!isTableMapKeyType(key))
			{
				continue;
			}

			output.set(key, VariableUnwrapUtility.unwrap(value));
		}

		return output;
	}
}

export { VariableUnwrapUtility };
