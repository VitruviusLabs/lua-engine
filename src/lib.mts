import type { Variable } from "./variable/definition/type/variable.type.mjs";
import type { VariableValueType } from "./variable/definition/type/variable-value.type.mjs";
import { VariableKind, type VariableKindEnum } from "./variable/definition/enum/variable-kind.enum.mjs";
import { isVariableKind } from "./variable/predicate/is-variable-kind.mjs";
import { assertVariableKind } from "./variable/predicate/assert-variable-kind.mjs";
import { nil } from "./variable/nil.mjs";
import type { Engine } from "./engine.mjs";
import { make_boolean, make_number, make_string, make_variable } from "./runtime.mjs";
import { ValidationError, assertArray, assertPopulatedArray, isCallable, isInteger, unary } from "@vitruvius-labs/ts-predicate";
import type { VariableNumber } from "./variable/definition/interface/variable-number.interface.mjs";
import { assertVariable } from "./variable/predicate/assert-variable.mjs";
import { VariableUnwrapUtility } from "./variable/unwrap-variable.mjs";
import type { VariableTable } from "./variable/definition/interface/variable-table.interface.mjs";
import { isNil } from "./variable/predicate/is-nil.mjs";
import type { VariableNativeFunction } from "./variable/definition/interface/variable-native-function.interface.mjs";
import type { NativeFunction } from "./boundary/definition/type/native-function.type.mjs";
import type { VariableTableMapType } from "./variable/definition/type/variable-table-map.type.mjs";
import { RuntimeError } from "./runtime-error.mjs";

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

export function table_size(value: VariableTable): number
{
	let size: number = 0;

	for (let i: number = 1; i < value.table.size; ++i)
	{
		if (!value.table.has(i))
		{
			return size;
		}

		++size;
	}

	return size;
}

export function variable_to_string(variable: Variable, tables_done: Array<Variable> = []): string
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
			return `<Function id="${variable.function_id?.toString() ?? "nil"}">`;
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

function print(_: Engine, ...args: Array<Variable>): Array<Variable>
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

function type(_: Engine, variable: Variable): Array<Variable>
{
	return [make_string(variable.data_type)];
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
		native_function: () =>
		{
			index = index + 1;

			if (index >= (count.number ?? 0))
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
function table_sort(engine: Engine, table: Variable, by: Variable): Array<Variable>
{
	assertVariableKind(table, VariableKind.Table);

	throw new RuntimeError("Unimplemented: table.sort");

	/*

	const entries: Array<[unknown, Variable]> = [...table.table.entries()]

	entries.sort(
		([_, a], [__, b]) =>
		{
			const result = engine.call(by, a, b)
			if (result instanceof Error)
				return 0

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
		const result = await engine.call(matches, value);

		if (result instanceof Error)
		{
			throw result;
		}

		const matching: Variable | undefined = result.at(0);

		assertVariableKind(matching, VariableKind.Boolean);

		return [make_variable(key)];
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
	const keys = [...table.table.keys()];
	const entries = keys.map(
		(key, i) =>
		{
			return [i + 1, key_variable(key)] as const;
		}
	);

	return [{ data_type: VariableKind.Table, table: new Map(entries) }];
}

function values(_: Engine, table: Variable): Array<Variable>
{
	assertVariableKind(table, VariableKind.Table);
	const values = [...table.table.values()];
	const entries = values.map(
		(value, i) =>
		{
			return [i + 1, value] as const;
		}
	);

	return [{ data_type: VariableKind.Table, table: new Map(entries) }];
}

function to_number(_: Engine, arg: Variable): Array<Variable>
{
	switch (arg.data_type)
	{
		case VariableKind.Number:
			return [arg];
		case VariableKind.String:
			const text: string = arg.string.trim();

			if (!/^-?\d+(\.\d+)?$/.test(text))
			{
				return [nil];
			}

			return [make_number(parseFloat(text))];

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
		error(engine, message ?? make_string("assertion failed!"));
	}

	return [nil];
}

function error(engine: Engine, message: Variable): Array<Variable>
{
	assertVariableKind(message, VariableKind.String);
	engine.raise_error(message.string);

	return [nil];
}

let warnings_on = true;

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
				(x) =>
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

function string_byte(_: Engine, s: Variable, i?: Variable, j?: Variable): Array<Variable>
{
	assertVariableKind(s, VariableKind.String);

	let start: number = 1;

	if (!isNil(i))
	{
		assertVariableKind(i, VariableKind.Number);
		start = i.number;
	}

	let end: number = start;

	if (!isNil(j))
	{
		assertVariableKind(j, VariableKind.Number);
		end = j.number;
	}

	const bytes: Array<Variable> = [];

	for (let index = start - 1; index <= end - 1; index++)
	{
		bytes.push(make_number(s.string.charCodeAt(index)));
	}

	return bytes;
}

function string_char(_: Engine, ...chars: Array<Variable>): Array<Variable>
{
	assertArray<VariableNumber>(chars, unary(assertVariableKind, VariableKind.Number));

	const s = String.fromCharCode(...chars.map(
		(c) =>
		{
			return c.number;
		}
	));

	return [make_string(s)];
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

function string_find(_: Engine, s: Variable, pattern: Variable, init?: Variable, plain?: Variable): Array<Variable>
{
	assertVariableKind(s, VariableKind.String);
	assertVariableKind(pattern, VariableKind.String);

	const offset: number = optional_parameter(VariableKind.Number, init) ?? 1;
	const str = s.string.slice(offset - 1);

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

	const index = s.string.indexOf(results[0]);

	return [make_number(index + 1)];
}

function string_len(_: Engine, s: Variable): Array<Variable>
{
	assertVariableKind(s, VariableKind.String);

	return [make_number(s.string.length)];
}

function string_lower(_: Engine, s: Variable): Array<Variable>
{
	assertVariableKind(s, VariableKind.String);

	return [make_string(s.string.toLowerCase())];
}

function string_rep(_: Engine, s: Variable, n: Variable, sep?: Variable): Array<Variable>
{
	assertVariableKind(s, VariableKind.String);
	assertVariableKind(n, VariableKind.Number);

	const separator: string = optional_parameter(VariableKind.String, sep) ?? "";

	return [make_string(new Array(n.number).fill(s.string).join(separator))];
}

function string_sub(_: Engine, s: Variable, i: Variable, j?: Variable): Array<Variable>
{
	assertVariableKind(s, VariableKind.String);
	assertVariableKind(i, VariableKind.Number);

	const end: number | undefined = optional_parameter(VariableKind.Number, j);

	const start = i.number ?? 1;

	return [make_string(s.string.slice(start - 1, end))];
}

function string_upper(_: Engine, s: Variable): Array<Variable>
{
	assertVariableKind(s, VariableKind.String);

	return [make_string(s.string.toUpperCase())];
}

function string_reverse(_: Engine, s: Variable): Array<Variable>
{
	assertVariableKind(s, VariableKind.String);

	return [make_string(s.string.split("").reverse().join(""))];
}

function table_concat(_: Engine, list: Variable, sep?: Variable, i?: Variable, j?: Variable): Array<Variable>
{
	assertVariableKind(list, VariableKind.Table);

	const separator = optional_parameter(VariableKind.String, sep) ?? "";
	const start = optional_parameter(VariableKind.Number, i) ?? 1;
	const end = optional_parameter(VariableKind.Number, j);

	const result = [...list.table.values()]
		.slice(start - 1, end)
		.map((item) =>
{
return variable_to_string(item);
})
		.join(separator);

	return [make_string(result)];
}

function table_insert(_: Engine, list: Variable, index?: Variable, value?: Variable): Array<Variable>
{
	assertVariableKind(list, VariableKind.Table);

	const size = table_size(list);

	if (isNil(value))
	{
		return table_insert(_, list, make_number(size + 1), index);
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

function table_move(_: Engine, a1: Variable, f: Variable, e: Variable, t: Variable, a2?: Variable): Array<Variable>
{
	if (isNil(a2))
	{
		return table_move(_, a1, f, e, t, a1);
	}

	assertVariableKind(a1, VariableKind.Table);
	assertVariableKind(f, VariableKind.Number);
	assertVariableKind(e, VariableKind.Number);
	assertVariableKind(t, VariableKind.Number);
	assertVariableKind(a2, VariableKind.Table);

	const src_start = f.number;
	const src_end = e.number;
	const dest_start = t.number;
	const count = src_end - src_start;

	for (let index = 0; index <= count; index++)
	{
		a2.table.set(dest_start + index, a1.table.get(src_start + index) ?? nil);
	}

	return [a2];
}

function table_pack(_: Engine, ...args: Array<Variable>): Array<Variable>
{
	const elements = args.map(
		(item, i) =>
		{
			return [i + 1, item] as [number | string, Variable];
		}
	);

	return [{
		data_type: VariableKind.Table,
		table: new Map([...elements, ["n", make_number(args.length)]]),
	}];
}

function table_remove(_: Engine, list: Variable, pos?: Variable): Array<Variable>
{
	assertVariableKind(list, VariableKind.Table);

	const size = table_size(list);
	const remove_index = optional_parameter(VariableKind.Number, pos) ?? (size + 1);
	const deleted_value = list.table.get(remove_index) ?? nil;

	for (let index = remove_index; index < size; ++index)
	{
		list.table.set(index, list.table.get(index + 1) ?? nil);
	}

	list.table.delete(size);

	return [deleted_value];
}

function table_unpack(_: Engine, list: Variable, i?: Variable, j?: Variable): Array<Variable>
{
	assertVariableKind(list, VariableKind.Table);

	const size = table_size(list) ?? 0;
	const start = optional_parameter(VariableKind.Number, i) ?? 1;
	const end = optional_parameter(VariableKind.Number, j) ?? size;

	return [...list.table.values()].splice(start - 1, end);
}

function math_abs(_: Engine, x: Variable): Array<Variable>
{
	assertVariableKind(x, VariableKind.Number);

	return [make_number(Math.abs(x.number))];
}

function math_acos(_: Engine, x: Variable): Array<Variable>
{
	assertVariableKind(x, VariableKind.Number);

	return [make_number(Math.acos(x.number))];
}

function math_asin(_: Engine, x: Variable): Array<Variable>
{
	assertVariableKind(x, VariableKind.Number);

	return [make_number(Math.asin(x.number))];
}

function math_atan(_: Engine, x: Variable): Array<Variable>
{
	assertVariableKind(x, VariableKind.Number);

	return [make_number(Math.atan(x.number))];
}

function math_ceil(_: Engine, x: Variable): Array<Variable>
{
	assertVariableKind(x, VariableKind.Number);

	return [make_number(Math.ceil(x.number))];
}

function math_cos(_: Engine, x: Variable): Array<Variable>
{
	assertVariableKind(x, VariableKind.Number);

	return [make_number(Math.cos(x.number))];
}

function math_deg(_: Engine, x: Variable): Array<Variable>
{
	assertVariableKind(x, VariableKind.Number);

	return [make_number(x.number * (180 / Math.PI))];
}

function math_exp(_: Engine, x: Variable): Array<Variable>
{
	assertVariableKind(x, VariableKind.Number);

	return [make_number(Math.exp(x.number))];
}

function math_floor(_: Engine, x: Variable): Array<Variable>
{
	assertVariableKind(x, VariableKind.Number);

	return [make_number(Math.floor(x.number))];
}

function math_fmod(_: Engine, x: Variable, y: Variable): Array<Variable>
{
	assertVariableKind(x, VariableKind.Number);
	assertVariableKind(y, VariableKind.Number);

	return [make_number(x.number % y.number)];
}

function math_log(_: Engine, x: Variable, base: Variable): Array<Variable>
{
	assertVariableKind(x, VariableKind.Number);
	assertVariableKind(base, VariableKind.Number);

	return [make_number(Math.log(x.number) / Math.log(base.number))];
}

function math_max(_: Engine, ...args: Array<Variable>): Array<Variable>
{
	assertPopulatedArray<VariableNumber>(args, unary(assertVariableKind, VariableKind.Number));

	const max = args.reduce(
		(acc, x) =>
		{
			return Math.max(acc, x.number);
		},
		Number.NEGATIVE_INFINITY
	);

	return [make_number(max)];
}

function math_min(_: Engine, ...args: Array<Variable>): Array<Variable>
{
	assertPopulatedArray<VariableNumber>(args, unary(assertVariableKind, VariableKind.Number));
	const min = args.reduce(
		(acc, x) =>
		{
			return Math.min(acc, x.number);
		},
		Number.POSITIVE_INFINITY
	);

	return [make_number(min)];
}

function math_modf(_: Engine, x: Variable): Array<Variable>
{
	assertVariableKind(x, VariableKind.Number);
	const n = x.number;
	const integral = Math.trunc(n);

	return [make_number(integral), make_number(n - integral)];
}

function math_rad(_: Engine, x: Variable): Array<Variable>
{
	assertVariableKind(x, VariableKind.Number);

	return [make_number(x.number * Math.PI / 180)];
}

/**
 * no args: [0;1)
 * 1 arg : [1; m]
 * 2 args: [m; n]
*/
function math_random(_: Engine, m?: Variable, n?: Variable): Array<Variable>
{
	if (isNil(m))
	{
		return [make_number(Math.random())];
	}

	if (isNil(n))
	{
		return math_random(_, make_number(1), m);
	}

	assertVariableKind(m, VariableKind.Number);
	assertVariableKind(n, VariableKind.Number);

	const min = m.number;
	const max = n.number;

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
	assertVariable(x);

	switch (x.data_type)
	{
		case VariableKind.Number:
			return [x];
		case VariableKind.String:
			const text: string = x.string.trim();

			if (!/^-?\d+$/.test(text))
			{
				return [nil];
			}

			return [make_number(parseInt(text))];

		default:
			return [nil];
	}
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

function math_ult(_: Engine, m: Variable, n: Variable): Array<Variable>
{
	assertVariableKind(m, VariableKind.Number);
	assertVariableKind(n, VariableKind.Number);

	const buffer = Buffer.from(new ArrayBuffer(8));

	buffer.writeInt32LE(m.number);
	buffer.writeInt32LE(n.number, 4);

	const m_unsigned = buffer.readUInt32LE();
	const n_unsigned = buffer.readUInt32LE(4);

	return [make_boolean(m_unsigned < n_unsigned)];
}

function fwrap(fn: NativeFunction): VariableNativeFunction
{
	return {
		data_type: VariableKind.NativeFunction,
		native_function: fn,
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
		["concat", { data_type: VariableKind.NativeFunction, native_function: table_concat }],
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
