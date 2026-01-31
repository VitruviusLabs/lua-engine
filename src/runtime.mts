import {
	isArray,
	isBoolean,
	isCallable,
	isInstanceOf,
	isNullish,
	isNumber,
	isString,
} from "@vitruvius-labs/ts-predicate";

import type { Variable } from "./variable/definition/type/variable.type.mjs";
import type { VariableString } from "./variable/definition/interface/variable-string.interface.mjs";
import type { VariableTable } from "./variable/definition/interface/variable-table.interface.mjs";
import type { TableInputType } from "./boundary/definition/type/table-input.type.mjs";
import type { VariableTableMapType } from "./variable/definition/type/variable-table-map.type.mjs";
import { VariableKind } from "./variable/definition/enum/variable-kind.enum.mjs";
import { isVariable } from "./variable/predicate/is-variable.mjs";
import { nil } from "./variable/nil.mjs";
import { isTableInputType } from "./boundary/predicate/is-table-input-type.mjs";
import { isTableMapKeyType } from "./boundary/predicate/is-table-map-key-type.mjs";
import { make_boolean } from "./runtime/make-boolean/make-boolean.mjs";
import { make_number } from "./runtime/make-number/make-number.mjs";

export function make_string(string: string): VariableString
{
	return { data_type: VariableKind.String, string: string };
}

export function make_table(input?: TableInputType): VariableTable
{
	const table_content: VariableTableMapType = new Map();

	const table_variable: Variable = {
		data_type: VariableKind.Table,
		table: table_content,
	};

	if (input === undefined)
	{
		return table_variable;
	}

	if (isArray(input))
	{
		for (let i = 0; i < input.length; ++i)
		{
			table_content.set(i + 1, make_variable(input.at(i)));
		}

		return table_variable;
	}

	if (isInstanceOf(input, Map))
	{
		for (const [key, value] of input.entries())
		{
			if (isTableMapKeyType(key))
			{
				table_content.set(key, make_variable(value));
			}
		}

		return table_variable;
	}

	for (const [key, value] of Object.entries(input))
	{
		const variable: Variable = make_variable(value);
		const numeric_key: number = Number(key);

		if (isNumber(numeric_key))
		{
			table_content.set(numeric_key, variable);

			continue;
		}

		table_content.set(key, variable);
	}

	return table_variable;
}

export function make_variable(input: unknown): Variable
{
	if (isVariable(input))
	{
		return input;
	}

	if (isNullish(input))
	{
		return nil;
	}

	if (isBoolean(input))
	{
		return make_boolean(input);
	}

	if (isNumber(input))
	{
		return make_number(input);
	}

	if (isString(input))
	{
		return make_string(input);
	}

	if (isTableInputType(input))
	{
		return make_table(input);
	}

	if (isCallable(input))
	{
		throw new Error("Functions cannot be converted into a variable automatically, please use make_function instead");
	}

	throw new Error("Cannot be converted into a variable");
}
