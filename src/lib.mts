import type { Variable } from "./variable/definition/type/variable.type.mjs";
import type { VariableValueType } from "./variable/definition/type/variable-value.type.mjs";
import { VariableKind, type VariableKindEnum } from "./variable/definition/enum/variable-kind.enum.mjs";
import { isVariableKind } from "./variable/predicate/is-variable-kind.mjs";
import { assertVariableKind } from "./variable/predicate/assert-variable-kind.mjs";
import { nil } from "./variable/nil.mjs";
import type { Engine } from "./engine.mjs";
import { make_variable } from "./runtime.mjs";
import { ValidationError, assertArray, assertInteger, assertPopulatedArray, isCallable, isInteger, unary } from "@vitruvius-labs/ts-predicate";
import type { VariableNumber } from "./variable/definition/interface/variable-number.interface.mjs";
import { assertVariable } from "./variable/predicate/assert-variable.mjs";
import { VariableUnwrapUtility } from "./variable/unwrap-variable.mjs";
import type { VariableTable } from "./variable/definition/interface/variable-table.interface.mjs";
import { isNil } from "./variable/predicate/is-nil.mjs";
import type { VariableNativeFunction } from "./variable/definition/interface/variable-native-function.interface.mjs";
import type { NativeFunction } from "./boundary/definition/type/native-function.type.mjs";
import type { VariableTableMapType } from "./variable/definition/type/variable-table-map.type.mjs";
import { RuntimeError } from "./runtime-error.mjs";
import { table_size } from "./lib/table-size/table-size.mjs";
import { variable_to_string } from "./lib/variable-to-string/variable-to-string.mjs";
import { print } from "./lib/print/print.mjs";
import { type } from "./lib/type/type.mjs";
import { make_boolean } from "./runtime/make-boolean/make-boolean.mjs";
import { make_number } from "./runtime/make-number/make-number.mjs";
import { make_string } from "./runtime/make-string/make-string.mjs";
import { to_error } from "./parser/error/to-error.mjs";

function optional_parameter<K extends VariableKindEnum>(
	expected_kind: K,
	parameter: Variable | undefined
): VariableValueType<K> | undefined
{
	if (isNil(parameter))
	{
		return undefined;
	}

	assertVariableKind(parameter, expected_kind);

	const value: unknown = VariableUnwrapUtility.unwrap(parameter);

	return value as VariableValueType<K>;
}

function inext(_: Engine, table: Variable, previous_index: Variable): Array<Variable>
{
	assertVariableKind(table, VariableKind.Table);
	assertVariableKind(previous_index, VariableKind.Number);

	const table_map = table.table;
	const next_index: number = previous_index.number + 1;

	const next_value: Variable | undefined = table_map.get(next_index);

	if (next_value === undefined)
	{
		return [nil];
	}

	return [make_number(next_index), next_value];
}

const inext_binding: VariableNativeFunction = {
	data_type: VariableKind.NativeFunction,
	native_function: inext,
};

function ipairs(_: Engine, table: Variable): Array<Variable>
{
	assertVariableKind(table, VariableKind.Table);

	return [
		inext_binding,
		table,
		make_number(0),
	];
}

function compare_keys(next_key: unknown, index: Variable): boolean
{
	if (isVariableKind(index, VariableKind.Boolean))
	{
		return next_key === index.boolean;
	}

	if (isVariableKind(index, VariableKind.Number))
	{
		return next_key === index.number;
	}

	if (isVariableKind(index, VariableKind.String))
	{
		return next_key === index.string;
	}

	if (isVariableKind(index, VariableKind.Table))
	{
		return next_key === index.table;
	}

	if (isVariableKind(index, VariableKind.Function))
	{
		return next_key === index.function_id;
	}

	if (isVariableKind(index, VariableKind.NativeFunction))
	{
		return next_key === index.native_function;
	}

	return false;
}

function next(_: Engine, variable: Variable, start_index?: Variable): Array<Variable>
{
	assertVariableKind(variable, VariableKind.Table);

	if (isNil(start_index))
	{
		const first_key: unknown = variable.table.keys().next().value;
		const first_value: Variable | undefined = variable.table.get(first_key);

		if (isNil(first_value))
		{
			return [nil];
		}

		return [make_variable(first_key), first_value];
	}

	let previous_key_found: boolean = false;

	for (const [key, value] of variable.table.entries())
	{
		// eslint-disable-next-line @ts/no-unnecessary-condition -- Bug in eslint
		if (previous_key_found)
		{
			return [key_variable(key), value];
		}

		if (compare_keys(key, start_index))
		{
			previous_key_found = true;
			break;
		}
	}

	return [nil];
}

function pairs(_: Engine, table: Variable): Array<Variable>
{
	const next_func: VariableNativeFunction = {
		data_type: VariableKind.NativeFunction,
		native_function: next,
	};

	return [next_func, table, nil];
}

function range(_: Engine, count: Variable): Array<Variable>
{
	assertVariableKind(count, VariableKind.Number);

	let index = 0;

	return [{
		data_type: VariableKind.NativeFunction,
		native_function: (): Array<Variable> =>
		{
			index = index + 1;

			if (index >= count.number)
			{
				return [nil];
			}

			return [{ data_type: VariableKind.Number, number: index }];
		},
	}];
}

function is_empty(_: Engine, table: Variable): Array<Variable>
{
	assertVariableKind(table, VariableKind.Table);
	const empty: boolean = table.table.size === 0;

	return [make_boolean(empty)];
}

function key_variable(key: unknown): Variable
{
	if (isCallable(key))
	{
		return {
			data_type: VariableKind.NativeFunction,
			native_function: key,
		};
	}

	return make_variable(key);
}

// @ts-expect-error: unimplemented
function table_sort(engine: Engine, table: Variable, sort_callable: Variable): Array<Variable>
{
	assertVariableKind(table, VariableKind.Table);

	throw new RuntimeError("Unimplemented: table.sort");

	/*

	const entries: Array<[unknown, Variable]> = [...table.table.entries()]

	entries.sort(
		([_, a], [__, b]) =>
		{
			const result = engine.call(sort_callable, a, b)

			const comparison = result.at(0)
			assertVariableKind(comparison, VariableKind.Number);
			return comparison.number
		}
	)

	const numbered_entries = entries.map(([key, _], i) => [i + 1, key_variable(key)] as const)
	return [{ data_type: VariableKind.Table, table: new Map(numbered_entries) }]

	*/
}

async function find(engine: Engine, table: Variable, matches: Variable): Promise<Array<Variable>>
{
	assertVariableKind(table, VariableKind.Table);
	const entries: Array<[unknown, Variable]> = [...table.table.entries()];

	for (const [key, value] of entries)
	{
		const result: Array<Variable> = await engine.call(matches, value);

		const matching: Variable | undefined = result.at(0);

		assertVariableKind(matching, VariableKind.Boolean);

		if (matching.boolean)
		{
			return [make_variable(key)];
		}
	}

	return [nil];
}

function first(_: Engine, table: Variable): Array<Variable>
{
	assertVariableKind(table, VariableKind.Table);
	const key = table.table.keys().next().value;

	if (typeof key === "string")
	{
		return [make_string(key)];
	}

	if (typeof key === "number")
	{
		return [make_number(key)];
	}

	return [nil];
}

function keys(_: Engine, table: Variable): Array<Variable>
{
	assertVariableKind(table, VariableKind.Table);
	const table_keys = [...table.table.keys()];

	const elements: VariableTableMapType = new Map();

	for (const key of table_keys)
	{
		elements.set(elements.size + 1, key_variable(key));
	}

	return [{ data_type: VariableKind.Table, table: elements }];
}

function values(_: Engine, table: Variable): Array<Variable>
{
	assertVariableKind(table, VariableKind.Table);

	const elements: VariableTableMapType = new Map();

	for (const value of table.table.values())
	{
		elements.set(elements.size + 1, value);
	}

	return [{ data_type: VariableKind.Table, table: elements }];
}

function to_number(_: Engine, arg: Variable): Array<Variable>
{
	// eslint-disable-next-line @ts/switch-exhaustiveness-check
	switch (arg.data_type)
	{
		case VariableKind.Number:
			return [arg];
		case VariableKind.String:
		{
			const text: string = arg.string.trim();

			if (!/^-?\d+(?:\.\d+)?$/.test(text))
			{
				return [nil];
			}

			return [make_number(parseFloat(text))];
		}

		default:
			return [nil];
	}
}

function to_string(_: Engine, arg: Variable): Array<Variable>
{
	return [make_string(variable_to_string(arg))];
}

function assert(engine: Engine, condition: Variable, message?: Variable): Array<Variable>
{
	if (isVariableKind(condition, VariableKind.Nil) || isVariableKind(condition, VariableKind.Boolean) && !condition.boolean)
	{
		engine.raise_error(isVariableKind(message, VariableKind.String) ? message.string : "assertion failed!");
	}

	return [nil];
}

function error(engine: Engine, message: Variable): Array<Variable>
{
	assertVariableKind(message, VariableKind.String);

	engine.raise_error(message.string);
}

let warnings_on: boolean = true;

function warn(_: Engine, ...messages: Array<Variable>): Array<Variable>
{
	const message = messages[0];

	if (isVariableKind(message, VariableKind.String))
	{
		switch (message.string)
		{
			case "@on":
				warnings_on = true;
				break;

			case "@off":
				warnings_on = false;
				break;
		}
	}

	if (warnings_on)
	{
		console.error(
			"WARNING",
			messages.map(
				(x: Variable): string =>
				{
					return variable_to_string(x);
				}
			)
		);
	}

	return [nil];
}

function select(_: Engine, index: Variable, ...args: Array<Variable>): Array<Variable>
{
	if (isVariableKind(index, VariableKind.Number))
	{
		if (index.number > 0)
		{
			return args.slice(index.number - 1);
		}

		return args.slice(args.length + index.number - 1);
	}

	if (isVariableKind(index, VariableKind.String) && index.string === "#")
	{
		return [make_number(args.length)];
	}

	return [nil];
}

// eslint-disable-next-line @ts/max-params
function string_byte(_: Engine, value: Variable, start_index?: Variable, end_index?: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.String);

	let start: number = 1;

	if (!isNil(start_index))
	{
		assertVariableKind(start_index, VariableKind.Number);
		start = start_index.number;
	}

	let end: number = start;

	if (!isNil(end_index))
	{
		assertVariableKind(end_index, VariableKind.Number);
		end = end_index.number;
	}

	const bytes: Array<Variable> = [];

	for (let index = start - 1; index <= end - 1; index++)
	{
		bytes.push(make_number(value.string.charCodeAt(index)));
	}

	return bytes;
}

function string_char(_: Engine, ...chars: Array<Variable>): Array<Variable>
{
	assertArray<VariableNumber>(chars, unary(assertVariableKind, VariableKind.Number));

	const result: string = String.fromCharCode(...chars.map(
		(code): number =>
		{
			return code.number;
		}
	));

	return [make_string(result)];
}

function string_format_helper(char: string, args_iterator: IterableIterator<Variable>): string
{
	switch (char)
	{
		case "d":
		{
			const arg = args_iterator.next().value;

			assertVariableKind(arg, VariableKind.Number);

			return Math.floor(arg.number).toString();
		}
		case "f":
		{
			const arg = args_iterator.next().value;

			assertVariableKind(arg, VariableKind.Number);

			return arg.number.toString();
		}
		case "s":
		{
			const arg = args_iterator.next().value;

			assertVariable(arg);

			return variable_to_string(arg);
		}
		case "%":
			return "%";

		default:
			throw new Error(`Invalid format specifier: %${char}`);
	}
}

function string_format(_: Engine, format: Variable, ...args: Array<Variable>): Array<Variable>
{
	assertVariableKind(format, VariableKind.String);

	const args_iterator = args[Symbol.iterator]();

	let result = "";
	let is_format = false;

	for (const char of format.string)
	{
		if (is_format)
		{
			result = result + string_format_helper(char, args_iterator);
			is_format = false;

			continue;
		}

		if (char === "%")
		{
			is_format = true;

			continue;
		}

		result = result + char;
	}

	if (is_format)
	{
		throw new Error("Invalid format specifier: %");
	}

	return [make_string(result)];
}

// eslint-disable-next-line @ts/max-params
function string_find(_: Engine, value: Variable, pattern: Variable, init?: Variable, plain?: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.String);
	assertVariableKind(pattern, VariableKind.String);

	const offset: number = optional_parameter(VariableKind.Number, init) ?? 1;
	const str = value.string.slice(offset - 1);

	const plain_param = optional_parameter(VariableKind.Boolean, plain) ?? false;

	if (plain_param)
	{
		return [make_number(str.indexOf(pattern.string) + 1)];
	}

	const results = RegExp(pattern.string).exec(str);

	if (results === null || results.length === 0)
	{
		return [nil];
	}

	const index = value.string.indexOf(results[0]);

	return [make_number(index + 1)];
}

function string_len(_: Engine, value: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.String);

	return [make_number(value.string.length)];
}

function string_lower(_: Engine, value: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.String);

	return [make_string(value.string.toLowerCase())];
}

function string_rep(_: Engine, value: Variable, start_index: Variable, separator?: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.String);
	assertVariableKind(start_index, VariableKind.Number);

	const sep: string = optional_parameter(VariableKind.String, separator) ?? "";

	return [make_string(new Array(start_index.number).fill(value.string).join(sep))];
}

// eslint-disable-next-line @ts/max-params
function string_sub(_: Engine, value: Variable, start_index?: Variable, end_index?: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.String);
	assertVariableKind(start_index, VariableKind.Number);

	const start: number = optional_parameter(VariableKind.Number, start_index) ?? 1;
	const end: number | undefined = optional_parameter(VariableKind.Number, end_index);

	return [make_string(value.string.slice(start - 1, end))];
}

function string_upper(_: Engine, value: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.String);

	return [make_string(value.string.toUpperCase())];
}

function string_reverse(_: Engine, value: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.String);

	return [make_string(value.string.split("").reverse().join(""))];
}

function table_concat(_: Engine, list: Variable, sep?: Variable, i?: Variable, j?: Variable): Array<Variable>
{
	assertVariableKind(list, VariableKind.Table);

	const separator = optional_parameter(VariableKind.String, sep) ?? "";
	const start = optional_parameter(VariableKind.Number, i) ?? 1;
	const end = optional_parameter(VariableKind.Number, j);

	const result = [...list.table.values()]
		.slice(start - 1, end)
		.map(
			(item) =>
			{
				return variable_to_string(item);
			}
		)
		.join(separator);

	return [make_string(result)];
}

function table_insert(_: Engine, list: Variable, index: Variable, value?: Variable): Array<Variable>
{
	assertVariableKind(list, VariableKind.Table);

	const size: number = table_size(list);

	if (isNil(value))
	{
		list.table.set(size + 1, index);

		return [nil];
	}

	assertVariableKind(index, VariableKind.Number);

	const position: number = index.number;

	for (let i = size + 1; i > position; --i)
	{
		list.table.set(i, list.table.get(i - 1) ?? nil);
	}

	list.table.set(position, value);

	return [nil];
}

// eslint-disable-next-line @ts/max-params -- Part of the standard library
function table_move(_: Engine, source_table: Variable, start_index: Variable, end_index: Variable, to_index: Variable, target_table?: Variable): Array<Variable>
{
	if (isNil(target_table))
	{
		return table_move(_, source_table, start_index, end_index, to_index, source_table);
	}

	assertVariableKind(source_table, VariableKind.Table);
	assertVariableKind(start_index, VariableKind.Number);
	assertVariableKind(end_index, VariableKind.Number);
	assertVariableKind(to_index, VariableKind.Number);
	assertVariableKind(target_table, VariableKind.Table);

	const src_start = start_index.number;
	const src_end = end_index.number;
	const dest_start = to_index.number;
	const count = src_end - src_start;

	for (let index = 0; index <= count; ++index)
	{
		target_table.table.set(dest_start + index, source_table.table.get(src_start + index) ?? nil);
	}

	return [target_table];
}

function table_pack(_: Engine, ...args: Array<Variable>): Array<Variable>
{
	const elements: VariableTableMapType = new Map();

	for (const arg of args)
	{
		elements.set(elements.size + 1, arg);
	}

	elements.set("n", make_number(args.length));

	return [{
		data_type: VariableKind.Table,
		table: elements,
	}];
}

function table_remove(_: Engine, list: Variable, position?: Variable): Array<Variable>
{
	assertVariableKind(list, VariableKind.Table);

	const size = table_size(list);
	const remove_index = optional_parameter(VariableKind.Number, position) ?? (size + 1);
	const deleted_value = list.table.get(remove_index) ?? nil;

	for (let index = remove_index; index < size; ++index)
	{
		list.table.set(index, list.table.get(index + 1) ?? nil);
	}

	list.table.delete(size);

	return [deleted_value];
}

function table_unpack(_: Engine, list: Variable, start_index?: Variable, end_index?: Variable): Array<Variable>
{
	assertVariableKind(list, VariableKind.Table);

	const size = table_size(list);

	const start = optional_parameter(VariableKind.Number, start_index) ?? 1;
	const end = optional_parameter(VariableKind.Number, end_index) ?? size;

	return [...list.table.values()].splice(start - 1, end);
}

function math_abs(_: Engine, value: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.Number);

	return [make_number(Math.abs(value.number))];
}

function math_acos(_: Engine, value: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.Number);

	return [make_number(Math.acos(value.number))];
}

function math_asin(_: Engine, value: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.Number);

	return [make_number(Math.asin(value.number))];
}

function math_atan(_: Engine, value: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.Number);

	return [make_number(Math.atan(value.number))];
}

function math_ceil(_: Engine, value: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.Number);

	return [make_number(Math.ceil(value.number))];
}

function math_cos(_: Engine, value: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.Number);

	return [make_number(Math.cos(value.number))];
}

function math_deg(_: Engine, value: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.Number);

	return [make_number(value.number * (180 / Math.PI))];
}

function math_exp(_: Engine, value: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.Number);

	return [make_number(Math.exp(value.number))];
}

function math_floor(_: Engine, value: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.Number);

	return [make_number(Math.floor(value.number))];
}

function math_fmod(_: Engine, value: Variable, mod_value: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.Number);
	assertVariableKind(mod_value, VariableKind.Number);

	return [make_number(value.number % mod_value.number)];
}

function math_log(_: Engine, value: Variable, base: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.Number);
	assertVariableKind(base, VariableKind.Number);

	return [make_number(Math.log(value.number) / Math.log(base.number))];
}

function math_max(_: Engine, ...args: Array<Variable>): Array<Variable>
{
	assertPopulatedArray<VariableNumber>(args, unary(assertVariableKind, VariableKind.Number));

	const maximum = args.reduce(
		(current_maximum, arg): number =>
		{
			return Math.max(current_maximum, arg.number);
		},
		Number.NEGATIVE_INFINITY
	);

	return [make_number(maximum)];
}

function math_min(_: Engine, ...args: Array<Variable>): Array<Variable>
{
	assertPopulatedArray<VariableNumber>(args, unary(assertVariableKind, VariableKind.Number));

	const mininimum = args.reduce(
		(current_minimum, arg): number =>
		{
			return Math.min(current_minimum, arg.number);
		},
		Number.POSITIVE_INFINITY
	);

	return [make_number(mininimum)];
}

function math_modf(_: Engine, value: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.Number);
	const integral = Math.trunc(value.number);

	return [make_number(integral), make_number(value.number - integral)];
}

function math_rad(_: Engine, value: Variable): Array<Variable>
{
	assertVariableKind(value, VariableKind.Number);

	return [make_number(value.number * Math.PI / 180)];
}

/**
 * no args: [0;1)
 * 1 arg : [1; max]
 * 2 args: [max; min]
*/
function math_random(_: Engine, min_or_max_value?: Variable, max_value?: Variable): Array<Variable>
{
	if (isNil(min_or_max_value))
	{
		return [make_number(Math.random())];
	}

	if (isNil(max_value))
	{
		return math_random(_, make_number(1), min_or_max_value);
	}

	assertVariableKind(min_or_max_value, VariableKind.Number);
	assertVariableKind(max_value, VariableKind.Number);

	const min: number = min_or_max_value.number;
	const max: number = max_value.number;

	if (max === 0)
	{
		throw new ValidationError("math.random: upper bound must be greater than 0.");
	}

	if (min > max)
	{
		throw new ValidationError("math.random: upper bound must be greater than or equal to lower bound.");
	}

	const result: number = Math.floor(Math.random() * (max + 1 - min) + min);

	return [make_number(result)];
}

function math_sin(_: Engine, x: Variable): Array<Variable>
{
	assertVariableKind(x, VariableKind.Number);

	return [make_number(Math.sin(x.number))];
}

function math_sqrt(_: Engine, x: Variable): Array<Variable>
{
	assertVariableKind(x, VariableKind.Number);

	return [make_number(Math.sqrt(x.number))];
}

function math_tan(_: Engine, x: Variable): Array<Variable>
{
	assertVariableKind(x, VariableKind.Number);

	return [make_number(Math.tan(x.number))];
}

function math_tointeger(_: Engine, x: Variable): Array<Variable>
{
	if (isVariableKind(x, VariableKind.Number))
	{
		if (isInteger(x.number))
		{
			return [x];
		}

		return [nil];
	}

	if (isVariableKind(x, VariableKind.String))
	{
		const text: string = x.string.trim();

		if (!/^-?\d+$/.test(text))
		{
			return [nil];
		}

		return [make_number(parseInt(text, 10))];
	}

	return [nil];
}

function math_type(_: Engine, x: Variable): Array<Variable>
{
	assertVariable(x);

	if (!isVariableKind(x, VariableKind.Number))
	{
		return [nil];
	}

	if (isInteger(x.number))
	{
		return [make_string("integer")];
	}

	return [make_string("float")];
}

function math_ult(_: Engine, first_value: Variable, second_value: Variable): Array<Variable>
{
	assertVariableKind(first_value, VariableKind.Number);
	assertVariableKind(second_value, VariableKind.Number);

	assertInteger(first_value.number);
	assertInteger(second_value.number);

	if ((first_value.number < 0) !== (second_value.number < 0))
	{
		return [make_boolean(second_value.number < 0)];
	}

	return [make_boolean(first_value.number < second_value.number)];
}

function fwrap(callable: NativeFunction): VariableNativeFunction
{
	return {
		data_type: VariableKind.NativeFunction,
		native_function: callable,
	};
}

function twrap(content: Array<[unknown, Variable]>): VariableTable
{
	return {
		data_type: VariableKind.Table,
		table: new Map(content),
	};
}

export function std_lib(): VariableTableMapType
{
	const string_mapping: VariableTable = twrap([
		["byte", fwrap(string_byte)],
		["char", fwrap(string_char)],
		// dump
		["format", fwrap(string_format)],
		["find", fwrap(string_find)],
		// gfind
		// gsub
		["len", fwrap(string_len)],
		["lower", fwrap(string_lower)],
		["rep", fwrap(string_rep)],
		["reverse", fwrap(string_reverse)],
		["sub", fwrap(string_sub)],
		["upper", fwrap(string_upper)],
	]);

	const table_mapping: VariableTable = twrap([
		["concat", fwrap(table_concat)],
		// foreach
		// foreachi
		// getn
		["insert", fwrap(table_insert)],
		["move", fwrap(table_move)],
		["pack", fwrap(table_pack)],
		["remove", fwrap(table_remove)],
		// setn
		["sort", fwrap(table_sort)],
		["unpack", fwrap(table_unpack)],
	]);

	const math_mapping: VariableTable = twrap([
		["abs", fwrap(math_abs)],
		["acos", fwrap(math_acos)],
		["asin", fwrap(math_asin)],
		["atan", fwrap(math_atan)],
		// atan2
		["ceil", fwrap(math_ceil)],
		["cos", fwrap(math_cos)],
		["deg", fwrap(math_deg)],
		["exp", fwrap(math_exp)],
		["floor", fwrap(math_floor)],
		["fmod", fwrap(math_fmod)],
		["log", fwrap(math_log)],
		// log10
		["max", fwrap(math_max)],
		["min", fwrap(math_min)],
		// mod
		["modf", fwrap(math_modf)],
		// pow
		["rad", fwrap(math_rad)],
		["random", fwrap(math_random)],
		["sin", fwrap(math_sin)],
		["sqrt", fwrap(math_sqrt)],
		["tan", fwrap(math_tan)],
		// frexp
		// ldexp
		["tointeger", fwrap(math_tointeger)],
		["type", fwrap(math_type)],
		["ult", fwrap(math_ult)],
		// Constants
		["pi", make_number(Math.PI)],
		["maxinteger", make_number(Number.MAX_SAFE_INTEGER)],
		["mininteger", make_number(Number.MIN_SAFE_INTEGER)],
		["huge", make_number(Number.POSITIVE_INFINITY)],
	]);

	const global: VariableTable = twrap([
		["assert", fwrap(assert)],
		["error", fwrap(error)],
		["find", fwrap(find)],
		["first", fwrap(first)],
		// getmetatable
		["ipairs", fwrap(ipairs)],
		["isempty", fwrap(is_empty)],
		["keys", fwrap(keys)],
		["math", math_mapping],
		["next", fwrap(next)],
		["pairs", fwrap(pairs)],
		// pcall
		["print", fwrap(print)],
		["range", fwrap(range)],
		// rawequal
		// rawget
		// rawset
		["select", fwrap(select)],
		// setmetatable
		["string", string_mapping],
		["table", table_mapping],
		["tonumber", fwrap(to_number)],
		["tostring", fwrap(to_string)],
		["type", fwrap(type)],
		["values", fwrap(values)],
		["warn", fwrap(warn)],
		// xpcall
	]);

	global.table.set("_G", global);

	return global.table;
}
