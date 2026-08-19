/* eslint-disable no-console */
import { ValidationError, assertUnion, unary } from "@vitruvius-labs/ts-predicate";
import { make_table, make_variable } from "./runtime.mjs";
import { TokenStream } from "./lexer.mjs";
import { parse } from "./parser.mjs";
import { Compiler } from "./compiler.mjs";
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
import { OperationCode } from "./opcode/definition/enum/operation-code.enum.mjs";
import { op_code_name } from "./opcode/op-code-name/op-code-name.mjs";
import type { OperationInterface } from "./opcode/definition/interface/op.interface.mjs";
import { getTableKey } from "./engine/index/get-table-key.mjs";
import type { LuaOptionsInterface } from "./engine/interface/lua-options.interface.mjs";
import { table_size } from "./lib/table-size/table-size.mjs";
import { variable_to_string } from "./lib/variable-to-string/variable-to-string.mjs";
import { make_boolean } from "./runtime/make-boolean/make-boolean.mjs";
import { make_number } from "./runtime/make-number/make-number.mjs";
import { make_string } from "./runtime/make-string/make-string.mjs";
import { VariableUnwrapUtility } from "./variable/unwrap-variable.mjs";
import type { VariableInputType } from "./boundary/definition/type/variable-input.type.mjs";

function is_true(value: Variable | undefined): boolean
{
	if (isNil(value))
	{
		return false;
	}

	if (isVariableKind(value, VariableKind.Boolean))
	{
		return value.boolean;
	}

	return true;
}

export class Engine
{
	private readonly globals: VariableTableMapType;
	private program: Array<OperationInterface>;
	private start_ip: number = 0;

	private instruction_pointer: number = 0;
	private stack: Array<Variable> = [];
	private locals_stack: Array<Map<string, Variable>> = [];
	private locals_capture: Array<Map<string, Variable>> = [];
	private call_stack: Array<number> = [];
	private assign_height_stack: Array<number> = [];

	public constructor(script?: string, globals?: VariableTableMapType)
	{
		this.program = [];
		this.globals = globals ?? std.std_lib();
		this.reset();

		if (script !== undefined)
		{
			this.load(script);
		}
	}

	public load(chunk: string): void
	{
		const stream: TokenStream = new TokenStream();

		stream.feed(chunk);

		const ast = parse(stream);

		optimize_chunk(ast);

		const program = Compiler.Compile(ast, this.program);

		this.program = program.code;
		this.instruction_pointer = program.start;
		this.start_ip = program.start;
	}

	public bytecode(): Array<string>
	{
		const output = [];

		for (const [index, operation] of this.program.entries())
		{
			const arg = operation.arg === undefined ? "" : variable_to_string(operation.arg);

			const message: string = `${index.toString()} ${op_code_name(operation.code)} ${arg}`;

			if (index === this.instruction_pointer)
			{
				output.push(`* ${message}`);

				continue;
			}

			output.push(message);
		}

		return output;
	}

	public getGlobalValue(name: string): unknown
	{
		const variable: Variable | undefined = this.globals.get(name);

		if (variable === undefined)
		{
			return undefined;
		}

		const result: unknown = VariableUnwrapUtility.unwrap(variable);

		return result;
	}

	public getGlobal(name: string): Variable | undefined
	{
		return this.globals.get(name);
	}

	public setGlobal(name: string, variable: Variable): void
	{
		this.globals.set(name, variable);
	}

	public setGlobalValue(name: string, value: VariableInputType): void
	{
		this.globals.set(name, make_variable(value));
	}

	public setGlobalFunction(name: string, callable: NativeFunction): void
	{
		this.globals.set(name, {
			data_type: VariableKind.NativeFunction,
			native_function: callable,
		});
	}

	public setGlobalTable(name: string, table: VariableTableMapType): void
	{
		this.globals.set(name, {
			data_type: VariableKind.Table,
			table: table,
		});
	}

	public reset(): void
	{
		this.instruction_pointer = this.start_ip;
		this.stack = [];
		this.locals_stack = [];
		this.locals_capture = [];
		this.call_stack = [];
		this.assign_height_stack = [];

		this.locals_stack.push(new Map());
	}

	public async call(callable: Variable, ...args: Array<Variable>): Promise<Array<Variable>>
	{
		if (isVariableKind(callable, VariableKind.NativeFunction))
		{
			return await this.call_native_function(callable.native_function, ...args);
		}

		assertUnion<VariableFunction, VariableNativeFunction>(callable, [unary(assertVariableKind, VariableKind.Function), unary(assertVariableKind, VariableKind.NativeFunction)]);

		const old_stack = this.stack;
		const old_call_stack = this.call_stack;
		const old_ip = this.instruction_pointer;
		const old_locals_stack = this.locals_stack;

		this.stack = [];
		this.call_stack = [];
		this.locals_stack = [...callable.locals ?? []];
		this.instruction_pointer = callable.function_id;

		for (const arg of args)
		{
			this.stack.push(arg);
		}

		this.stack.push(make_number(args.length));
		this.locals_stack.push(new Map());

		await this.run();
		const return_values = this.stack;

		this.stack = old_stack;
		this.call_stack = old_call_stack;
		this.locals_stack = old_locals_stack;
		this.instruction_pointer = old_ip;

		return return_values;
	}

	public async run_for_steps(steps: number, options?: LuaOptionsInterface): Promise<Variable>
	{
		if (options?.locals !== undefined)
		{
			this.locals_stack.push(options.locals);
		}

		let step_count = 0;

		while (this.instruction_pointer < this.program.length)
		{
			await this.step(options);

			++step_count;

			if (step_count >= steps)
			{
				throw new Error("Program ran for too long");
			}
		}

		return this.stack_get(0);
	}

	public async run(options?: LuaOptionsInterface): Promise<Variable>
	{
		const result: Variable = await this.run_for_steps(1000, options);

		return result;
	}

	public raise_error(message: string): never
	{
		const operation = this.program.at(this.instruction_pointer - 1);

		this.runtime_error(operation, message);
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
		const value: Variable | undefined = this.stack.pop();

		assertVariable(value);

		return value;
	}

	private stack_pop_kind<K extends VariableKindEnum>(kind: K): Variable & { data_type: K }
	{
		const value = this.stack.pop();

		assertVariableKind(value, kind);

		return value;
	}

	private async call_native_function(native_function: NativeFunction, ...args: Array<Variable>): Promise<Array<Variable>>
	{
		const results: Array<Variable> = await native_function(this, ...args);

		return results;
	}

	private operation(callable: (x: number, y: number) => number): void
	{
		const var_x = this.stack_pop_kind(VariableKind.Number);
		const var_y = this.stack_pop_kind(VariableKind.Number);

		this.stack.push(make_number(callable(var_x.number, var_y.number)));
	}

	private compare(callable: (x: number | string, y: number | string) => boolean): void
	{
		const var_x: Variable = this.stack_pop();
		const var_y: Variable = this.stack_pop();

		if (isVariableKind(var_x, VariableKind.Number) && isVariableKind(var_y, VariableKind.Number))
		{
			this.stack.push(make_boolean(callable(var_x.number, var_y.number)));

			return;
		}

		if (isVariableKind(var_x, VariableKind.String) && isVariableKind(var_y, VariableKind.String))
		{
			this.stack.push(make_boolean(callable(var_x.string, var_y.string)));

			return;
		}

		throw new ValidationError(`Cannot compare values of type '${var_x.data_type}' and '${var_y.data_type}'`);
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

	// eslint-disable-next-line @ts/class-methods-use-this
	private runtime_error(operation: OperationInterface | undefined, message: string): never
	{
		if (operation === undefined)
		{
			throw new RuntimeError(message);
		}

		throw new RuntimeError(message, {}, operation.debug);
	}

	private async step(options?: LuaOptionsInterface): Promise<void>
	{
		if (this.instruction_pointer >= this.program.length)
		{
			return undefined;
		}

		const operation: OperationInterface | undefined = this.program[this.instruction_pointer];

		++this.instruction_pointer;

		if (operation === undefined)
		{
			this.runtime_error(operation, "Instruction pointer out of bounds");
		}

		const trace_instructions: boolean = (options?.trace ?? false) || (options?.trace_instructions ?? false);

		if (trace_instructions)
		{
			const arg = operation.arg === undefined ? "" : variable_to_string(operation.arg);

			console.log(this.instruction_pointer - 1, op_code_name(operation.code), arg);
		}

		await this.runInstruction(operation);

		const trace_stack: boolean = (options?.trace ?? false) || (options?.trace_stack ?? false);

		if (trace_stack)
		{
			console.log(
				this.instruction_pointer - 1,
				...this.stack.map(
					(x: Variable): string =>
					{
						return variable_to_string(x);
					}
				)
			);
		}
	}

	// eslint-disable-next-line complexity, max-lines-per-function, max-statements
	private async runInstruction(operation: OperationInterface): Promise<void>
	{
		const arg: Variable | undefined = operation.arg;

		switch (operation.code)
		{
			case OperationCode.Load:
			{
				this.runInstructionLoad(arg);

				break;
			}
			case OperationCode.Store:
			{
				this.runInstructionStore(arg);

				break;
			}
			case OperationCode.Push:
			{
				this.runInstructionPush(arg);

				break;
			}
			case OperationCode.Pop:
			{
				this.runInstructionPop(arg);

				break;
			}
			case OperationCode.Dup:
			{
				this.runInstructionDup(arg);

				break;
			}
			case OperationCode.Swap:
			{
				this.runInstructionSwap();

				break;
			}
			case OperationCode.IterUpdateState:
			{
				this.runInstructionIterUpdateState();

				break;
			}
			case OperationCode.IterNext:
			{
				await this.runInstructionIterNext();

				break;
			}
			case OperationCode.IterJumpIfDone:
			{
				this.runInstructionIterJumpIfDone(arg);

				break;
			}
			case OperationCode.NewTable:
			{
				this.runInstructionNewTable();

				break;
			}
			case OperationCode.LoadIndex:
			{
				this.runInstructionLoadIndex(operation);

				break;
			}
			case OperationCode.StoreIndex:
			{
				this.runInstructionStoreIndex(operation, arg);

				break;
			}
			case OperationCode.Add:
			{
				this.runInstructionAdd();

				break;
			}
			case OperationCode.Subtract:
			{
				this.runInstructionSubtract();

				break;
			}
			case OperationCode.Multiply:
			{
				this.runInstructionMultiply();

				break;
			}
			case OperationCode.Divide:
			{
				this.runInstructionDivide();

				break;
			}
			case OperationCode.FloorDivide:
			{
				this.runInstructionFloorDivide();

				break;
			}
			case OperationCode.Modulo:
			{
				this.runInstructionModulo();

				break;
			}
			case OperationCode.Exponent:
			{
				this.runInstructionExponent();

				break;
			}
			case OperationCode.Concat:
			{
				this.runInstructionConcat();

				break;
			}
			case OperationCode.BitAnd:
			{
				this.runInstructionBitAnd();

				break;
			}
			case OperationCode.BitOr:
			{
				this.runInstructionBitOr();

				break;
			}
			case OperationCode.BitXOr:
			{
				this.runInstructionBitXOr();

				break;
			}
			case OperationCode.BitNot:
			{
				this.runInstructionBitNot();

				break;
			}
			case OperationCode.BitShiftLeft:
			{
				this.runInstructionBitShiftLeft();

				break;
			}
			case OperationCode.BitShiftRight:
			{
				this.runInstructionBitShiftRight();

				break;
			}
			case OperationCode.Equals:
			{
				this.runInstructionEquals();

				break;
			}
			case OperationCode.NotEquals:
			{
				this.runInstructionNotEquals();

				break;
			}
			case OperationCode.LessThan:
			{
				this.runInstructionLessThan();

				break;
			}
			case OperationCode.LessThanEquals:
			{
				this.runInstructionLessThanEquals();

				break;
			}
			case OperationCode.GreaterThan:
			{
				this.runInstructionGreaterThan();

				break;
			}
			case OperationCode.GreaterThanEquals:
			{
				this.runInstructionGreaterThanEquals();

				break;
			}
			case OperationCode.And:
			{
				this.runInstructionAnd();

				break;
			}
			case OperationCode.Or:
			{
				this.runInstructionOr();

				break;
			}
			case OperationCode.Not:
			{
				this.runInstructionNot();

				break;
			}
			case OperationCode.Negate:
			{
				this.runInstructionNegate();

				break;
			}
			case OperationCode.Length:
			{
				this.runInstructionLength(operation);

				break;
			}
			case OperationCode.IsNotNil:
			{
				this.runInstructionIsNotNil();

				break;
			}
			case OperationCode.StartBlock:
			{
				this.runInstructionStartBlock();

				break;
			}
			case OperationCode.EndBlock:
			{
				this.runInstructionEndBlock();

				break;
			}
			case OperationCode.MakeLocal:
			{
				this.runInstructionMakeLocal(arg);

				break;
			}
			case OperationCode.Call:
			{
				await this.runInstructionCall(operation);

				break;
			}
			case OperationCode.Return:
			{
				this.runInstructionReturn();

				break;
			}
			case OperationCode.Jump:
			{
				this.runInstructionJump(arg);

				break;
			}
			case OperationCode.JumpIfNot:
			{
				this.runInstructionJumpIfNot(arg);

				break;
			}
			case OperationCode.JumpIf:
			{
				this.runInstructionJumpIf(arg);

				break;
			}
			case OperationCode.StartStackChange:
			{
				this.runInstructionStartStackChange();

				break;
			}
			case OperationCode.EndStackChange:
			{
				this.runInstructionEndStackChange(arg);

				break;
			}
			case OperationCode.ArgumentCount:
			{
				this.runInstructionArgumentCount(arg);

				break;
			}
			case OperationCode.Break:
			{
				// Do Nothing

				break;
			}
		}
	}

	private runInstructionPop(arg: Variable | undefined): void
	{
		const count = isVariableKind(arg, VariableKind.Number) ? arg.number : 1;

		this.stack.splice(this.stack.length - count, count);
	}

	private runInstructionDup(arg: Variable | undefined): void
	{
		const count: number = isVariableKind(arg, VariableKind.Number) ? arg.number : 1;
		const items: Array<Variable> = this.stack.slice(-count);

		this.stack.push(...items);
	}

	private runInstructionSwap(): void
	{
		const x = this.stack.splice(this.stack.length - 2, 1);

		this.stack.push(...x);
	}

	private runInstructionIterUpdateState(): void
	{
		this.stack[this.stack.length - 2] = this.stack_get(-1);
	}

	private async runInstructionIterNext(): Promise<void>
	{
		const state = this.stack_get(-1);
		const control = this.stack_get(-2);
		const iter = this.stack_get(-3);

		if (isVariableKind(iter, VariableKind.NativeFunction))
		{
			const result = await this.call_native_function(iter.native_function, control, state);

			this.stack.push(...result);

			return;
		}

		this.stack.push(control, state, make_number(2));
		this.call_stack.push(this.instruction_pointer);
		this.locals_stack.push(new Map());
		this.locals_capture = iter.locals ?? [];

		if (isVariableKind(iter, VariableKind.Function))
		{
			this.instruction_pointer = iter.function_id;
		}
	}

	private runInstructionIterJumpIfDone(arg: Variable | undefined): void
	{
		if (isVariableKind(arg, VariableKind.Number) && isNil(this.stack_get(-1)))
		{
			this.instruction_pointer = this.instruction_pointer + arg.number;
		}
	}

	private runInstructionAdd(): void
	{
		this.operation(
			(x: number, y: number): number =>
			{
				return x + y;
			}
		);
	}

	private runInstructionSubtract(): void
	{
		this.operation(
			(x: number, y: number): number =>
			{
				return x - y;
			}
		);
	}

	private runInstructionMultiply(): void
	{
		this.operation(
			(x: number, y: number): number =>
			{
				return x * y;
			}
		);
	}

	private runInstructionDivide(): void
	{
		this.operation(
			(x: number, y: number): number =>
			{
				return x / y;
			}
		);
	}

	private runInstructionFloorDivide(): void
	{
		this.operation(
			(x: number, y: number): number =>
			{
				return Math.floor(x / y);
			}
		);
	}

	private runInstructionModulo(): void
	{
		this.operation(
			(x: number, y: number): number =>
			{
				return x % y;
			}
		);
	}

	private runInstructionExponent(): void
	{
		this.operation(
			(x: number, y: number): number =>
			{
				return Math.pow(x, y);
			}
		);
	}

	private runInstructionLessThan(): void
	{
		this.compare(
			(x: number | string, y: number | string): boolean =>
			{
				return x < y;
			}
		);
	}

	private runInstructionLessThanEquals(): void
	{
		this.compare(
			(x: number | string, y: number | string): boolean =>
			{
				return x <= y;
			}
		);
	}

	private runInstructionGreaterThan(): void
	{
		this.compare(
			(x: number | string, y: number | string): boolean =>
			{
				return x > y;
			}
		);
	}

	private runInstructionGreaterThanEquals(): void
	{
		this.compare(
			(x: number | string, y: number | string): boolean =>
			{
				return x >= y;
			}
		);
	}

	private runInstructionBitAnd(): void
	{
		this.operation(
			(x: number, y: number): number =>
			{
				return x & y;
			}
		);
	}

	private runInstructionBitOr(): void
	{
		this.operation(
			(x: number, y: number): number =>
			{
				return x | y;
			}
		);
	}

	private runInstructionBitXOr(): void
	{
		this.operation(
			(x: number, y: number): number =>
			{
				return x ^ y;
			}
		);
	}

	private runInstructionBitShiftLeft(): void
	{
		this.operation(
			(x: number, y: number): number =>
			{
				return x << y;
			}
		);
	}

	private runInstructionBitShiftRight(): void
	{
		this.operation(
			(x: number, y: number): number =>
			{
				return x >> y;
			}
		);
	}

	private runInstructionConcat(): void
	{
		const x = this.stack_pop();
		const y = this.stack_pop();

		const result = variable_to_string(x) + variable_to_string(y);

		this.stack.push(make_string(result));
	}

	private runInstructionEquals(): void
	{
		const x = this.stack_pop();
		const y = this.stack_pop();

		this.stack.push(make_boolean(equals(x, y)));
	}

	private runInstructionNotEquals(): void
	{
		const x = this.stack_pop();
		const y = this.stack_pop();

		this.stack.push(make_boolean(!equals(x, y)));
	}

	private runInstructionAnd(): void
	{
		const x = this.stack_pop();
		const y = this.stack_pop();

		const result = is_true(x) ? y : x;

		this.stack.push(result);
	}

	private runInstructionOr(): void
	{
		const x = this.stack_pop();
		const y = this.stack_pop();

		const result = is_true(x) ? x : y;

		this.stack.push(result);
	}

	private runInstructionNot(): void
	{
		this.stack.push(make_boolean(!is_true(this.stack_pop())));
	}

	private runInstructionBitNot(): void
	{
		this.stack.push(make_number(~this.stack_pop_kind(VariableKind.Number).number));
	}

	private runInstructionNegate(): void
	{
		this.stack.push(make_number(-this.stack_pop_kind(VariableKind.Number).number));
	}

	private runInstructionIsNotNil(): void
	{
		this.stack.push(make_boolean(!isNil(this.stack_pop())));
	}

	private runInstructionJump(arg: Variable | undefined): void
	{
		if (isVariableKind(arg, VariableKind.Number))
		{
			this.instruction_pointer = this.instruction_pointer + arg.number;
		}
	}

	private runInstructionJumpIfNot(arg: Variable | undefined): void
	{
		if (isVariableKind(arg, VariableKind.Number) && !is_true(this.stack_pop()))
		{
			this.instruction_pointer = this.instruction_pointer + arg.number;
		}
	}

	private runInstructionJumpIf(arg: Variable | undefined): void
	{
		if (isVariableKind(arg, VariableKind.Number) && is_true(this.stack_pop()))
		{
			this.instruction_pointer = this.instruction_pointer + arg.number;
		}
	}

	private runInstructionMakeLocal(arg: Variable | undefined): void
	{
		const last_locals: Map<string, Variable> | undefined = this.locals_stack.at(-1);

		if (last_locals === undefined)
		{
			return;
		}

		last_locals.set(isVariableKind(arg, VariableKind.String) ? arg.string : "", nil);
	}

	private runInstructionNewTable(): void
	{
		this.stack.push(make_table());
	}

	private runInstructionStartBlock(): void
	{
		this.locals_stack.push(new Map());
	}

	private runInstructionEndBlock(): void
	{
		this.locals_stack.pop();
	}

	private runInstructionLength(operation: OperationInterface): void
	{
		const variable = this.stack_pop_maybe();

		// eslint-disable-next-line @ts/switch-exhaustiveness-check
		switch (variable.data_type)
		{
			case VariableKind.String:
				this.stack.push(make_number(variable.string.length));
				break;

			case VariableKind.Table:
				this.stack.push(make_number(table_size(variable)));
				break;

			default:
				this.runtime_error(operation, `Attempt to get length of a ${variable.data_type} value`);
		}
	}

	private runInstructionReturn(): void
	{
		this.instruction_pointer = this.call_stack.pop() ?? this.program.length;
		this.locals_stack = this.locals_stack.slice(0, this.call_stack.pop());
		this.locals_capture = [];
	}

	private runInstructionLoadIndex(operation: OperationInterface): void
	{
		const table = this.stack_pop_maybe();

		if (isNil(table))
		{
			this.runtime_error(operation, "Attempt to index a nil value");
		}

		assertVariableKind(table, VariableKind.Table);

		const i_var = this.stack_pop_maybe();

		if (isNil(i_var))
		{
			this.runtime_error(operation, "Attempt to index with a nil value");
		}

		const i = getTableKey(i_var);

		if (i === undefined)
		{
			this.runtime_error(operation, "Invalid index, must be a number or string");
		}

		this.stack.push(table.table.get(i) ?? nil);
	}

	private runInstructionStoreIndex(operation: OperationInterface, arg: Variable | undefined): void
	{
		const count = isVariableKind(arg, VariableKind.Number) ? arg.number : 1;
		const table = this.stack_get(-1 - count * 2);

		assertVariableKind(table, VariableKind.Table);

		for (let i = 0; i < count; ++i)
		{
			const key = getTableKey(this.stack_pop_maybe());
			const value = this.stack_pop_maybe();

			if (key === undefined)
			{
				this.runtime_error(operation, "Invalid key, must be a number or string");
			}

			table.table.set(key, value);
		}
	}

	private runInstructionStore(arg: Variable | undefined): void
	{
		const name = isVariableKind(arg, VariableKind.String) ? arg.string : "";
		const value = this.stack_pop_maybe();
		const local = [...this.locals_capture, ...this.locals_stack].findLast(
			(x): boolean =>
			{
				return x.has(name);
			}
		);

		if (local === undefined)
		{
			this.globals.set(name, value);

			return;
		}

		local.set(name, value);
	}

	private runInstructionPush(arg: Variable | undefined): void
	{
		if (this.locals_stack.length > 0 && isVariableKind(arg, VariableKind.Function))
		{
			arg.locals = [...this.locals_stack];
		}

		this.stack.push(arg ?? nil);
	}

	private runInstructionLoad(arg: Variable | undefined): void
	{
		const name = isVariableKind(arg, VariableKind.String) ? arg.string : "";
		const local = [...this.locals_capture, ...this.locals_stack]
			.map(
				(x): Variable | undefined =>
				{
					return x.get(name);
				}
			)
			.findLast(
				(x): boolean =>
				{
					return !isNil(x);
				}
			);

		const global = this.globals.get(name);

		this.stack.push(local ?? global ?? nil);
	}

	private async runInstructionCall(operation: OperationInterface): Promise<void>
	{
		const x: Variable = this.stack_pop_maybe();
		const count: number = isVariableKind(x, VariableKind.Number) ? x.number : 0;
		const func_var: Variable = this.stack_pop_maybe();

		if (isVariableKind(func_var, VariableKind.NativeFunction))
		{
			const args = this.stack.splice(this.stack.length - count, count);

			const result = await this.call_native_function(func_var.native_function, ...args);

			this.stack.push(...result);

			return;
		}

		if (isVariableKind(func_var, VariableKind.Function))
		{
			this.stack.push(make_number(count));
			this.call_stack.push(this.locals_stack.length, this.instruction_pointer);
			this.locals_stack.push(new Map());
			this.locals_capture = func_var.locals ?? [];
			this.instruction_pointer = func_var.function_id;

			return;
		}

		this.runtime_error(operation, `Object of type '${func_var.data_type}' is not callable`);
	}

	private runInstructionArgumentCount(arg: Variable | undefined): void
	{
		const x = this.stack_pop_maybe();
		const got = isVariableKind(x, VariableKind.Number) ? x.number : 0;
		const expected = isVariableKind(arg, VariableKind.Number) ? arg.number : 0;

		this.force_stack_height(expected, got);
	}

	private runInstructionStartStackChange(): void
	{
		this.assign_height_stack.push(this.stack.length);
	}

	private runInstructionEndStackChange(arg: Variable | undefined): void
	{
		const got = this.stack.length - (this.assign_height_stack.pop() ?? 0);
		const expected = isVariableKind(arg, VariableKind.Number) ? arg.number : 0;

		this.force_stack_height(expected, got);
	}
}
