import { assertUnion, unary } from "@vitruvius-labs/ts-predicate";

import { make_string, make_table } from "./runtime.mjs";
import { TokenStream } from "./lexer.mjs";
import { parse } from "./parser.mjs";
import { compile } from "./compiler.mjs";
import { optimize_chunk } from "./optimizer.mjs";
import * as std from "./lib.mjs";
import { VariableKind, type VariableKindEnum } from "./variable/definition/enum/variable-kind.enum.mjs";
import type { Variable } from "./variable/definition/type/variable.type.mjs";
import { RuntimeError } from "./runtime-error.mjs";
import { assertVariableKind } from "./variable/predicate/assert-variable-kind.mjs";
import { isNil } from "./variable/predicate/is-nil.mjs";
import { nil } from "./variable/nil.mjs";
import { isVariableKind } from "./variable/predicate/is-variable-kind.mjs";
import type { VariableTableMapType } from "./variable/definition/type/variable-table-map.type.mjs";
import type { NativeFunction } from "./boundary/definition/type/native-function.type.mjs";
import type { VariableFunction } from "./variable/definition/interface/variable-function.interface.mjs";
import type { VariableNativeFunction } from "./variable/definition/interface/variable-native-function.interface.mjs";
import { equals } from "./variable/equals.mjs";
import { assertVariable } from "./variable/predicate/assert-variable.mjs";
import { OpCodeEnum } from "./opcode/definition/enum/op-code.enum.mjs";
import { op_code_name } from "./opcode/op-code-name/op-code-name.mjs";
import type { OpInterface } from "./opcode/definition/interface/op.interface.mjs";
import { index } from "./engine/index/index.mjs";
import type { LuaOptionsInterface } from "./engine/interface/lua-options.interface.mjs";
import { table_size } from "./lib/table-size/table-size.mjs";
import { variable_to_string } from "./lib/variable-to-string/variable-to-string.mjs";
import { make_boolean } from "./runtime/make-boolean/make-boolean.mjs";
import { make_number } from "./runtime/make-number/make-number.mjs";

function is_true(val: Variable | undefined): boolean
{
	if (isNil(val))
	{
		return false;
	}

	if (isVariableKind(val, VariableKind.Boolean))
	{
		return val.boolean;
	}

	return true;
}

export class Engine
{
	private program: Array<OpInterface>;
	private readonly globals: VariableTableMapType;
	private start_ip: number = 0;

	private ip: number = 0;
	private stack: Array<Variable> = [];
	private locals_stack: Array<Map<string, Variable>> = [];
	private locals_capture: Array<Map<string, Variable>> = [];
	private call_stack: Array<number> = [];
	private assign_height_stack: Array<number> = [];

	private error: Error | undefined;

	public constructor(
		script?: string,
		globals?: VariableTableMapType
	)
	{
		this.program = [];
		this.globals = globals ?? std.std_lib();
		this.error = undefined;
		this.reset();

		if (script !== undefined)
		{
			const result = this.load(script);

			if (result !== undefined)
			{
				this.error = result;
			}
		}
	}

	load(chunk: string): undefined | Error
	{
		const stream = new TokenStream();

		stream.feed(chunk);

		const ast = parse(stream);

		if (ast instanceof Error)
		{
			return ast;
		}

		optimize_chunk(ast);
		const program = compile(ast, this.program);

		this.program = program.code;
		this.ip = program.start;
		this.start_ip = program.start;

		return undefined;
	}

	bytecode(): Array<string>
	{
		if (this.error !== undefined)
		{
			return [this.error.message];
		}

		const output = [];

		for (const [i, op] of this.program.entries())
		{
			const arg = op.arg !== undefined ? variable_to_string(op.arg) : "";

			if (i === this.ip)
			{
				output.push(`* ${i} ${op_code_name(op.code)} ${arg}`);
			}
			else
			{
				output.push(`${i} ${op_code_name(op.code)} ${arg}`);
			}
		}

		return output;
	}

	global(name: string): Variable | undefined
	{
		return this.globals.get(name);
	}

	set(name: string, variable: Variable): void
	{
		this.globals.set(name, variable);
	}

	define(name: string, func: NativeFunction): void
	{
		this.globals.set(name, {
			data_type: VariableKind.NativeFunction,
			native_function: func,
		});
	}

	define_table(name: string, table: VariableTableMapType): void
	{
		this.globals.set(name, {
			data_type: VariableKind.Table,
			table: table,
		});
	}

	reset(): void
	{
		this.ip = this.start_ip;
		this.stack = [];
		this.locals_stack = [];
		this.locals_capture = [];
		this.call_stack = [];
		this.assign_height_stack = [];

		this.locals_stack.push(new Map());
	}

	async call(func: Variable, ...args: Array<Variable>): Promise<Array<Variable> | Error>
	{
		if (isVariableKind(func, VariableKind.NativeFunction))
		{
			return await this.call_native_function(func.native_function, ...args);
		}

		assertUnion<VariableFunction, VariableNativeFunction>(func, [unary(assertVariableKind, VariableKind.Function), unary(assertVariableKind, VariableKind.NativeFunction)]);

		const old_stack = this.stack;
		const old_call_stack = this.call_stack;
		const old_ip = this.ip;
		const old_locals_stack = this.locals_stack;

		this.stack = [];
		this.call_stack = [];
		this.locals_stack = [...func.locals ?? []];
		this.ip = func.function_id ?? this.ip;

		for (const arg of args)
		{
			this.stack.push(arg);
		}

		this.stack.push(make_number(args.length));
		this.locals_stack.push(new Map());

		const result = await this.run();
		const return_values = this.stack;

		this.stack = old_stack;
		this.call_stack = old_call_stack;
		this.locals_stack = old_locals_stack;
		this.ip = old_ip;

		if (result instanceof Error)
		{
			return result;
		}

		return return_values;
	}

	async run_for_steps(steps: number, options?: LuaOptionsInterface): Promise<Variable | Error | undefined>
	{
		if (this.error !== undefined)
		{
			return this.error;
		}

		if (options?.locals !== undefined)
		{
			this.locals_stack.push(options.locals);
		}

		let step_count = 0;

		while (this.ip < this.program.length)
		{
			const result = await this.step(options);

			if (result !== undefined)
			{
				return result;
			}

			step_count = step_count + 1;

			if (step_count >= steps)
			{
				return undefined;
			}
		}

		return this.stack_get(0);
	}

	async run(options?: LuaOptionsInterface): Promise<Variable | Error>
	{
		const result = await this.run_for_steps(1000, options);

		if (result === undefined)
		{
			return new Error("Program ran for too long");
		}

		return result;
	}

	raise_error(message: string): void
	{
		const op = this.program.at(this.ip - 1);

		this.error = this.runtime_error(op, message);
	}

	private stack_get(index: number): Variable
	{
		if (index < 0)
		{
			return this.stack[this.stack.length + index] ?? nil;
		}

		return this.stack[index] ?? nil;
	}

	private stack_pop_maybe(): Variable
	{
		return this.stack.pop() ?? nil;
	}

	private stack_pop(): Variable
	{
		const value = this.stack.pop();

		assertVariable(value);

		return value;
	}

	private stack_pop_kind<K extends VariableKindEnum>(kind: K): Variable & { data_type: K }
	{
		const value = this.stack.pop();

		assertVariableKind(value, kind);

		return value;
	}

	private async call_native_function(native_function: NativeFunction, ...args: Array<Variable>): Promise<Array<Variable> | Error>
	{
		const results = await native_function(this, ...args);

		if (this.error !== undefined)
		{
			const error = this.error;

			this.error = undefined;

			return error;
		}

		return results;
	}

	private operation(op: (x: number, y: number) => number): void
	{
		const x = this.stack_pop_kind(VariableKind.Number);
		const y = this.stack_pop_kind(VariableKind.Number);

		this.stack.push(make_number(op(x.number, y.number)));
	}

	private compare(op: (x: number, y: number) => boolean): void
	{
		const x = this.stack_pop_kind(VariableKind.Number);
		const y = this.stack_pop_kind(VariableKind.Number);

		this.stack.push(make_boolean(op(x.number, y.number)));
	}

	private force_stack_height(expected: number, got: number): void
	{
		for (let i = got; i < expected; ++i)
		{
			this.stack.push(nil);
		}

		for (let i = expected; i < got; ++i)
		{
			this.stack.pop();
		}
	}

	private runtime_error(op: OpInterface | undefined, message: string): never
	{
		if (op === undefined)
		{
			throw new RuntimeError(message);
		}

		throw new RuntimeError(message, {}, op.debug);
	}

	private async run_instruction(op: OpInterface): Promise<Error | undefined>
	{
		const { code, arg } = op;

		switch (code)
		{
			case OpCodeEnum.Pop:
			{
				const count = isVariableKind(arg, VariableKind.Number) ? arg.number : 1;

				this.stack.splice(this.stack.length - count, count);
				break;
			}

			case OpCodeEnum.Dup:
			{
				const count = isVariableKind(arg, VariableKind.Number) ? arg.number : 1;
				const items = this.stack.splice(this.stack.length - count, count);

				this.stack.push(...items, ...items);
				break;
			}

			case OpCodeEnum.Swap:
			{
				const x = this.stack.splice(this.stack.length - 2, 1);

				this.stack.push(...x);
				break;
			}

			case OpCodeEnum.IterUpdateState:
			{
				this.stack[this.stack.length - 2] = this.stack_get(-1);
				break;
			}

			case OpCodeEnum.IterNext:
			{
				const state = this.stack_get(-1);
				const control = this.stack_get(-2);
				const iter = this.stack_get(-3);

				if (isVariableKind(iter, VariableKind.NativeFunction))
				{
					const result = await this.call_native_function(iter.native_function, control, state);

					if (result instanceof Error)
					{
						return result;
					}

					this.stack.push(...result);
					break;
				}

				this.stack.push(control, state, make_number(2));
				this.call_stack.push(this.ip);
				this.locals_stack.push(new Map());
				this.locals_capture = iter.locals ?? [];

				if (isVariableKind(iter, VariableKind.Function) && iter.function_id !== undefined)
				{
					this.ip = iter.function_id;
				}

				break;
			}

			case OpCodeEnum.IterJumpIfDone:
			{
				if (isVariableKind(arg, VariableKind.Number) && isNil(this.stack_get(-1)))
				{
					this.ip = this.ip + arg.number;
				}

				break;
			}

			case OpCodeEnum.Add:
				this.operation(
					(x, y) =>
					{
						return x + y;
					}
				);

				break;
			case OpCodeEnum.Subtract:
				this.operation(
					(x, y) =>
					{
						return x - y;
					}
				);

				break;
			case OpCodeEnum.Multiply:
				this.operation(
					(x, y) =>
					{
						return x * y;
					}
				);

				break;
			case OpCodeEnum.Divide:
				this.operation(
					(x, y) =>
					{
						return x / y;
					}
				);

				break;
			case OpCodeEnum.FloorDivide:
				this.operation(
					(x, y) =>
					{
						return Math.floor(x / y);
					}
				);

				break;
			case OpCodeEnum.Modulo:
				this.operation(
					(x, y) =>
					{
						return x % y;
					}
				);

				break;
			case OpCodeEnum.Exponent:
				this.operation(
					(x, y) =>
					{
						return Math.pow(x, y);
					}
				);

				break;

			case OpCodeEnum.LessThan:
				this.compare(
					(x, y) =>
					{
						return x < y;
					}
				);

				break;
			case OpCodeEnum.LessThanEquals:
				this.compare(
					(x, y) =>
					{
						return x <= y;
					}
				);

				break;
			case OpCodeEnum.GreaterThan:
				this.compare(
					(x, y) =>
					{
						return x > y;
					}
				);

				break;
			case OpCodeEnum.GreaterThanEquals:
				this.compare(
					(x, y) =>
					{
						return x >= y;
					}
				);

				break;

			case OpCodeEnum.BitAnd:
				this.operation(
					(x, y) =>
					{
						return x & y;
					}
				);

				break;
			case OpCodeEnum.BitOr:
				this.operation(
					(x, y) =>
					{
						return x | y;
					}
				);

				break;
			case OpCodeEnum.BitXOr:
				this.operation(
					(x, y) =>
					{
						return x ^ y;
					}
				);

				break;
			case OpCodeEnum.BitShiftLeft:
				this.operation(
					(x, y) =>
					{
						return x << y;
					}
				);

				break;
			case OpCodeEnum.BitShiftRight:
				this.operation(
					(x, y) =>
					{
						return x >> y;
					}
				);

				break;

			case OpCodeEnum.Concat:
			{
				const x = this.stack_pop();
				const y = this.stack_pop();

				const result = variable_to_string(x) + variable_to_string(y);

				this.stack.push(make_string(result));
				break;
			}

			case OpCodeEnum.Equals:
			{
				const x = this.stack_pop();
				const y = this.stack_pop();

				this.stack.push(make_boolean(equals(x, y)));
				break;
			}

			case OpCodeEnum.NotEquals:
			{
				const x = this.stack_pop();
				const y = this.stack_pop();

				this.stack.push(make_boolean(!equals(x, y)));
				break;
			}

			case OpCodeEnum.And:
			{
				const x = this.stack_pop();
				const y = this.stack_pop();

				const result = is_true(x) ? y : x;

				this.stack.push(result);
				break;
			}

			case OpCodeEnum.Or:
			{
				const x = this.stack_pop();
				const y = this.stack_pop();

				const result = is_true(x) ? x : y;

				this.stack.push(result);
				break;
			}

			case OpCodeEnum.Not:
				this.stack.push(make_boolean(!is_true(this.stack_pop())));
				break;

			case OpCodeEnum.BitNot:
				this.stack.push(make_number(~this.stack_pop_kind(VariableKind.Number).number));
				break;

			case OpCodeEnum.Negate:
				this.stack.push(make_number(-this.stack_pop_kind(VariableKind.Number).number));
				break;

			case OpCodeEnum.IsNotNil:
				this.stack.push(make_boolean(!isNil(this.stack_pop())));
				break;

			case OpCodeEnum.Jump:
				if (isVariableKind(arg, VariableKind.Number))
				{
					this.ip = this.ip + arg.number;
				}

				break;

			case OpCodeEnum.JumpIfNot:
				if (isVariableKind(arg, VariableKind.Number) && !is_true(this.stack_pop()))
				{
					this.ip = this.ip + arg.number;
				}

				break;

			case OpCodeEnum.JumpIf:
				if (isVariableKind(arg, VariableKind.Number) && is_true(this.stack_pop()))
				{
					this.ip = this.ip + arg.number;
				}

				break;

			case OpCodeEnum.MakeLocal:
				const last_locals = this.locals_stack.at(-1);

				if (last_locals)
				{
					last_locals.set(isVariableKind(arg, VariableKind.String) ? arg.string : "", nil);
				}

				break;

			case OpCodeEnum.NewTable:
				this.stack.push(make_table());
				break;

			case OpCodeEnum.StartBlock:
				this.locals_stack.push(new Map());
				break;

			case OpCodeEnum.EndBlock:
				this.locals_stack.pop();
				break;

			case OpCodeEnum.Length:
			{
				const variable = this.stack_pop_maybe();

				switch (variable.data_type)
				{
					case VariableKind.String:
						this.stack.push(make_number(variable.string.length));
						break;
					case VariableKind.Table:
						this.stack.push(make_number(table_size(variable)));
						break;

					default:
						this.runtime_error(op, `Attempt to get length of a ${variable.data_type} value`);
				}

				break;
			}

			case OpCodeEnum.Return:
			{
				this.ip = this.call_stack.pop() ?? this.program.length;
				this.locals_stack = this.locals_stack.slice(0, this.call_stack.pop());
				this.locals_capture = [];
				break;
			}

			case OpCodeEnum.LoadIndex:
			{
				const table = this.stack_pop_maybe();

				if (isNil(table))
				{
					this.runtime_error(op, "Attempt to index a nil value");
				}

				assertVariableKind(table, VariableKind.Table);

				const i_var = this.stack_pop_maybe();

				if (isNil(i_var))
				{
					this.runtime_error(op, "Attempt to index with a nil value");
				}

				const i = index(i_var);

				if (i === undefined)
				{
					this.runtime_error(op, "Invalid index, must be a number or string");
				}

				this.stack.push(table.table.get(i) ?? nil);
				break;
			}

			case OpCodeEnum.StoreIndex:
			{
				const count = isVariableKind(arg, VariableKind.Number) ? arg.number : 1;
				const table = this.stack_get(-1 - count * 2);

				assertVariableKind(table, VariableKind.Table);

				for (let i = 0; i < count; ++i)
				{
					const key = index(this.stack_pop_maybe());
					const value = this.stack_pop_maybe();

					if (key === undefined)
					{
						return this.runtime_error(op, "Invalid key, must be a number or string");
					}

					table.table.set(key, value);
				}

				break;
			}

			case OpCodeEnum.Store:
			{
				const name = isVariableKind(arg, VariableKind.String) ? arg.string : "";
				const value = this.stack_pop_maybe();
				const local = [...this.locals_capture, ...this.locals_stack].findLast(
					(x) =>
					{
						return x.has(name);
					}
				);

				if (local !== undefined)
				{
					local.set(name, value);
				}
				else
				{
					this.globals.set(name, value);
				}

				break;
			}

			case OpCodeEnum.Push:
			{
				if (this.locals_stack.length > 0 && isVariableKind(arg, VariableKind.Function))
				{
					arg.locals = [...this.locals_stack];
				}

				this.stack.push(arg ?? nil);
				break;
			}

			case OpCodeEnum.Load:
			{
				const name = isVariableKind(arg, VariableKind.String) ? arg.string : "";
				const local = [...this.locals_capture, ...this.locals_stack]
					.map(
						(x) =>
						{
							return x.get(name);
						}
					)
					.findLast(
						(x) =>
						{
							return !isNil(x);
						}
					);

				const global = this.globals.get(name);

				this.stack.push(local ?? global ?? nil);
				break;
			}

			case OpCodeEnum.Call:
			{
				const x = this.stack_pop_maybe();
				const count = isVariableKind(x, VariableKind.Number) ? x.number : 0;
				const func_var = this.stack_pop_maybe();

				switch (func_var.data_type)
				{
					case VariableKind.NativeFunction:
					{
						const args = this.stack.splice(this.stack.length - count, count);

						if (func_var.native_function !== undefined)
						{
							const result = await this.call_native_function(func_var.native_function, ...args);

							if (result instanceof Error)
							{
								return result;
							}

							this.stack.push(...result);
						}

						if (this.error !== undefined)
						{
							const error = this.error;

							this.error = undefined;

							return error;
						}

						break;
					}

					case VariableKind.Function:
					{
						this.stack.push(make_number(count));
						this.call_stack.push(this.locals_stack.length, this.ip);
						this.locals_stack.push(new Map());
						this.locals_capture = func_var.locals ?? [];
						this.ip = func_var.function_id ?? this.ip;
						break;
					}

					default:
					{
						return this.runtime_error(op, `Object of type '${func_var.data_type}' is not callable`);
					}
				}

				break;
			}

			case OpCodeEnum.ArgumentCount:
			{
				const x = this.stack_pop_maybe();
				const got = isVariableKind(x, VariableKind.Number) ? x.number : 0;
				const expected = isVariableKind(arg, VariableKind.Number) ? arg.number : 0;

				this.force_stack_height(expected, got);
				break;
			}

			case OpCodeEnum.StartStackChange:
			{
				this.assign_height_stack.push(this.stack.length);
				break;
			}

			case OpCodeEnum.EndStackChange:
			{
				const got = this.stack.length - (this.assign_height_stack.pop() ?? 0);
				const expected = isVariableKind(arg, VariableKind.Number) ? arg.number : 0;

				this.force_stack_height(expected, got);
				break;
			}
		}

		return undefined;
	}

	async step(options?: LuaOptionsInterface): Promise<Error | undefined>
	{
		if (this.error !== undefined)
		{
			return this.error;
		}

		if (this.ip >= this.program.length)
		{
			return undefined;
		}

		const op = this.program[this.ip];

		++this.ip;

		if (op === undefined)
		{
			this.runtime_error(op, "Instruction pointer out of bounds");
		}

		if (options?.trace || options?.trace_instructions)
		{
			const arg = op.arg !== undefined ? variable_to_string(op.arg) : "";

			console.log(this.ip - 1, op_code_name(op.code), arg);
		}

		const result = await this.run_instruction(op);

		if (result !== undefined)
		{
			return result;
		}

		if (options?.trace || options?.trace_stack)
		{
			console.log(
				this.ip - 1,
				...this.stack.map(
					(x) =>
					{
						return variable_to_string(x);
					}
				)
			);
		}

		return undefined;
	}
}
