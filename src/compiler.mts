import { VariableKind } from "./variable/definition/enum/variable-kind.enum.mjs";
import { nil } from "./variable/nil.mjs";
import { ValueKindEnum } from "./ast/definition/enum/value-kind.enum.mjs";
import { ExpressionKind } from "./ast/definition/enum/expression-kind.enum.mjs";
import { StatementKindEnum } from "./ast/definition/enum/statement-kind.enum.mjs";
import { OpCodeEnum } from "./opcode/definition/enum/op-code.enum.mjs";
import type { OpInterface } from "./opcode/definition/interface/op.interface.mjs";
import type { ProgramInterface } from "./opcode/definition/interface/program.interface.mjs";
import type { ValueInterface } from "./ast/definition/interface/value.interface.mjs";
import type { ExpressionInterface } from "./ast/definition/interface/expression.interface.mjs";
import type { AssignmentInterface } from "./ast/definition/interface/assignment.interface.mjs";
import type { LocalInterface } from "./ast/definition/interface/local.interface.mjs";
import type { IfBlockInterface } from "./ast/definition/interface/if-block.interface.mjs";
import type { WhileInterface } from "./ast/definition/interface/while.interface.mjs";
import type { ForInterface } from "./ast/definition/interface/for.interface.mjs";
import type { NumericForInterface } from "./ast/definition/interface/numeric-for.interface.mjs";
import type { RepeatInterface } from "./ast/definition/interface/repeat.interface.mjs";
import type { DoInterface } from "./ast/definition/interface/do.interface.mjs";
import type { ReturnInterface } from "./ast/definition/interface/return.interface.mjs";
import type { ChunkInterface } from "./ast/definition/interface/chunk.interface.mjs";
import type { TokenInterface } from "./lexer/definition/interface/token.interface.mjs";
import { make_boolean } from "./runtime/make-boolean/make-boolean.mjs";
import { make_number } from "./runtime/make-number/make-number.mjs";
import { make_string } from "./runtime/make-string/make-string.mjs";

function compile_function(chunk: ChunkInterface, token: TokenInterface, parameters: Array<TokenInterface>, functions: Array<Array<OpInterface>>): number
{
	const ops: Array<OpInterface> = [];

	ops.push({ code: OpCodeEnum.ArgumentCount, arg: make_number(parameters.length), debug: token.debug });

	for (const parameter of parameters.reverse())
	{
		ops.push({ code: OpCodeEnum.MakeLocal, arg: make_string(parameter.data), debug: parameter.debug });
		ops.push({ code: OpCodeEnum.Store, arg: make_string(parameter.data), debug: parameter.debug });
	}

	ops.push(...compile_block(chunk, functions));
	ops.push({ code: OpCodeEnum.Push, arg: nil, debug: token.debug });
	ops.push({ code: OpCodeEnum.Return, arg: make_number(0), debug: token.debug });

	functions.push(ops);

	return functions.length - 1;
}

function compile_value(value: ValueInterface | undefined, functions: Array<Array<OpInterface>>): Array<OpInterface>
{
	if (value === undefined)
	{
		throw new Error();
	}

	const debug = value.token.debug;

	switch (value.kind)
	{
		case ValueKindEnum.NilLiteral:
			return [{ code: OpCodeEnum.Push, arg: nil, debug: debug }];
		case ValueKindEnum.BooleanLiteral:
			return [{ code: OpCodeEnum.Push, arg: make_boolean(value.boolean ?? false), debug: debug }];
		case ValueKindEnum.NumberLiteral:
			return [{ code: OpCodeEnum.Push, arg: make_number(value.number ?? 0), debug: debug }];
		case ValueKindEnum.StringLiteral:
			return [{ code: OpCodeEnum.Push, arg: make_string(value.string ?? ""), debug: debug }];

		case ValueKindEnum.FunctionLike:
		{
			return [{
				code: OpCodeEnum.Push,
				arg: {
					data_type: VariableKind.Function,
					function_id: compile_function(
						value.function?.body ?? { statements: [] },
						value.token,
						value.function?.parameters ?? [],
						functions
					),
				},
				debug: debug,
			}];
		}

		case ValueKindEnum.TableLiteral:
		{
			const output: Array<OpInterface> = [];

			output.push({ code: OpCodeEnum.NewTable, debug: debug });

			for (const [key, expression] of [...value.table?.entries() ?? []].reverse())
			{
				output.push(...compile_expression(expression, functions));
				output.push(...compile_expression(key, functions));
			}

			output.push({ code: OpCodeEnum.StoreIndex, arg: make_number(value.table?.size ?? 0), debug: debug });

			return output;
		}

		case ValueKindEnum.Variable:
		{
			return [{
				code: OpCodeEnum.Load,
				arg: { data_type: VariableKind.String, string: value.identifier ?? "" },
				debug: debug,
			}];
		}
	}
}

function compile_operation(
	expression: ExpressionInterface,
	operation: OpCodeEnum,
	functions: Array<Array<OpInterface>>
): Array<OpInterface>
{
	const { lhs, rhs } = expression;

	if (lhs === undefined || rhs === undefined)
	{
		throw new Error();
	}

	const ops: Array<OpInterface> = [];

	ops.push(...compile_expression(rhs, functions));
	ops.push(...compile_expression(lhs, functions));
	ops.push({ code: operation, debug: expression.token.peek().debug });

	return ops;
}

function compile_call(
	func: ExpressionInterface | undefined,
	args: Array<ExpressionInterface> | undefined,
	functions: Array<Array<OpInterface>>
): Array<OpInterface>
{
	if (func === undefined || args === undefined)
	{
		throw new Error();
	}

	const debug = func.token.peek().debug;
	const ops: Array<OpInterface> = [];

	for (const arg of args)
	{
		ops.push(...compile_expression(arg, functions));
	}

	ops.push(...compile_expression(func, functions));
	ops.push({ code: OpCodeEnum.Push, arg: make_number(args.length), debug: debug });
	ops.push({ code: OpCodeEnum.Call, debug: debug });

	return ops;
}

function compile_index(
	target: ExpressionInterface | undefined,
	index: ExpressionInterface | undefined,
	functions: Array<Array<OpInterface>>
): Array<OpInterface>
{
	if (target === undefined || index === undefined)
	{
		throw new Error();
	}

	const ops: Array<OpInterface> = [];

	ops.push(...compile_expression(index, functions));
	ops.push(...compile_expression(target, functions));
	ops.push({ code: OpCodeEnum.LoadIndex, debug: target.token.peek().debug });

	return ops;
}

function compile_unary_operation(
	expression: ExpressionInterface | undefined,
	operation: OpCodeEnum,
	functions: Array<Array<OpInterface>>
): Array<OpInterface>
{
	if (expression === undefined || expression.expression === undefined)
	{
		throw new Error();
	}

	const ops: Array<OpInterface> = [];

	ops.push(...compile_expression(expression.expression, functions));
	ops.push({ code: operation, debug: expression.token.peek().debug });

	return ops;
}

function compile_expression(expression: ExpressionInterface | undefined, functions: Array<Array<OpInterface>>): Array<OpInterface>
{
	if (expression === undefined)
	{
		throw new Error();
	}

	switch (expression.kind)
	{
		case ExpressionKind.Value:
			return compile_value(expression.value, functions);
		case ExpressionKind.Call:
			return compile_call(expression.expression, expression.arguments, functions);
		case ExpressionKind.Index:
			return compile_index(expression.expression, expression.index, functions);

		case ExpressionKind.Addition:
			return compile_operation(expression, OpCodeEnum.Add, functions);
		case ExpressionKind.Subtract:
			return compile_operation(expression, OpCodeEnum.Subtract, functions);
		case ExpressionKind.Multiplication:
			return compile_operation(expression, OpCodeEnum.Multiply, functions);
		case ExpressionKind.Division:
			return compile_operation(expression, OpCodeEnum.Divide, functions);
		case ExpressionKind.FloorDivision:
			return compile_operation(expression, OpCodeEnum.FloorDivide, functions);
		case ExpressionKind.Modulo:
			return compile_operation(expression, OpCodeEnum.Modulo, functions);
		case ExpressionKind.Exponent:
			return compile_operation(expression, OpCodeEnum.Exponent, functions);
		case ExpressionKind.Concat:
			return compile_operation(expression, OpCodeEnum.Concat, functions);

		case ExpressionKind.BitAnd:
			return compile_operation(expression, OpCodeEnum.BitAnd, functions);
		case ExpressionKind.BitOr:
			return compile_operation(expression, OpCodeEnum.BitOr, functions);
		case ExpressionKind.BitXOr:
			return compile_operation(expression, OpCodeEnum.BitXOr, functions);
		case ExpressionKind.BitShiftLeft:
			return compile_operation(expression, OpCodeEnum.BitShiftLeft, functions);
		case ExpressionKind.BitShiftRight:
			return compile_operation(expression, OpCodeEnum.BitShiftRight, functions);

		case ExpressionKind.Equals:
			return compile_operation(expression, OpCodeEnum.Equals, functions);
		case ExpressionKind.NotEquals:
			return compile_operation(expression, OpCodeEnum.NotEquals, functions);
		case ExpressionKind.LessThan:
			return compile_operation(expression, OpCodeEnum.LessThan, functions);
		case ExpressionKind.LessThanEquals:
			return compile_operation(expression, OpCodeEnum.LessThanEquals, functions);
		case ExpressionKind.GreaterThan:
			return compile_operation(expression, OpCodeEnum.GreaterThan, functions);
		case ExpressionKind.GreaterThanEquals:
			return compile_operation(expression, OpCodeEnum.GreaterThanEquals, functions);
		case ExpressionKind.And:
			return compile_operation(expression, OpCodeEnum.And, functions);
		case ExpressionKind.Or:
			return compile_operation(expression, OpCodeEnum.Or, functions);

		case ExpressionKind.Not:
			return compile_unary_operation(expression, OpCodeEnum.Not, functions);
		case ExpressionKind.Negate:
			return compile_unary_operation(expression, OpCodeEnum.Negate, functions);
		case ExpressionKind.Length:
			return compile_unary_operation(expression, OpCodeEnum.Length, functions);
		case ExpressionKind.BitNot:
			return compile_unary_operation(expression, OpCodeEnum.BitNot, functions);
	}
}

function compile_assignment(assignment: AssignmentInterface | undefined, functions: Array<Array<OpInterface>>): Array<OpInterface>
{
	if (assignment === undefined)
	{
		throw new Error();
	}

	const ops: Array<OpInterface> = [];
	const debug = assignment.token.debug;

	ops.push({ code: OpCodeEnum.StartStackChange, debug: debug });

	for (const rhs of assignment.rhs)
	{
		ops.push(...compile_expression(rhs, functions));
	}

	ops.push({ code: OpCodeEnum.EndStackChange, arg: make_number(assignment.lhs.length), debug: debug });

	for (const lhs of assignment.lhs)
	{
		const debug = lhs.token.peek().debug;

		switch (lhs.kind)
		{
			case ExpressionKind.Value:
			{
				if (lhs.value?.kind !== ValueKindEnum.Variable)
				{
					throw new Error();
				}

				const identifier = make_string(lhs.value?.identifier ?? "");

				if (assignment.local)
				{
					ops.push({ code: OpCodeEnum.MakeLocal, arg: identifier, debug: debug });
				}

				ops.push({ code: OpCodeEnum.Store, arg: identifier, debug: debug });
				break;
			}

			case ExpressionKind.Index:
			{
				// FIXME: Throw error here if `assignment.local` is true. I think?

				ops.push(...compile_expression(lhs.expression, functions));
				ops.push({ code: OpCodeEnum.Swap, debug: debug });
				ops.push(...compile_expression(lhs.index, functions));
				ops.push({ code: OpCodeEnum.StoreIndex, debug: debug });
				ops.push({ code: OpCodeEnum.Pop, debug: debug });
				break;
			}

			default:
				throw new Error();
		}
	}

	return ops;
}

function compile_local(local: LocalInterface | undefined): Array<OpInterface>
{
	if (local === undefined)
	{
		throw new Error();
	}

	return local.names.map(
		(name): OpInterface =>
		{
			return {
				code: OpCodeEnum.MakeLocal,
				arg: {
					data_type: VariableKind.String,
					string: name.data,
				},
				debug: name.debug,
			};
		}
	);
}

function compile_inverted_conditional_jump(condition: ExpressionInterface | undefined, jump_by: number, functions: Array<Array<OpInterface>>): Array<OpInterface>
{
	if (condition === undefined)
	{
		throw new Error();
	}

	const ops: Array<OpInterface> = [];
	const debug = condition.token.peek().debug;

	switch (condition.kind)
	{
		case ExpressionKind.And:
		{
			const rhs = compile_inverted_conditional_jump(condition.rhs, jump_by, functions);

			ops.push(...compile_conditional_jump(condition.lhs, rhs.length, functions));
			ops.push(...rhs);
			break;
		}

		case ExpressionKind.Or:
		{
			const rhs = compile_inverted_conditional_jump(condition.rhs, jump_by, functions);

			ops.push(...compile_inverted_conditional_jump(condition.lhs, rhs.length + jump_by, functions));
			ops.push(...rhs);
			break;
		}

		case ExpressionKind.Not:
		{
			ops.push(...compile_expression(condition.expression, functions));
			break;
		}

		default:
		{
			ops.push(...compile_expression(condition, functions));
			ops.push({ code: OpCodeEnum.JumpIf, arg: make_number(jump_by), debug: debug });
			break;
		}
	}

	return ops;
}

function compile_conditional_jump(condition: ExpressionInterface | undefined, jump_by: number, functions: Array<Array<OpInterface>>): Array<OpInterface>
{
	if (condition === undefined)
	{
		throw new Error();
	}

	const ops: Array<OpInterface> = [];
	const debug = condition.token.peek().debug;

	switch (condition.kind)
	{
		case ExpressionKind.And:
		{
			const rhs = compile_conditional_jump(condition.rhs, jump_by, functions);

			ops.push(...compile_conditional_jump(condition.lhs, rhs.length + jump_by, functions));
			ops.push(...rhs);
			break;
		}

		case ExpressionKind.Or:
		{
			const rhs = compile_conditional_jump(condition.rhs, jump_by, functions);

			ops.push(...compile_inverted_conditional_jump(condition.lhs, rhs.length, functions));
			ops.push(...rhs);
			break;
		}

		case ExpressionKind.Not:
		{
			ops.push(...compile_inverted_conditional_jump(condition.expression, jump_by, functions));
			break;
		}

		default:
		{
			ops.push(...compile_expression(condition, functions));
			ops.push({ code: OpCodeEnum.JumpIfNot, arg: make_number(jump_by), debug: debug });
			break;
		}
	}

	return ops;
}

function compile_if(if_block: IfBlockInterface | undefined, functions: Array<Array<OpInterface>>): Array<OpInterface>
{
	if (if_block === undefined)
	{
		throw new Error();
	}

	const else_chunk: Array<OpInterface> = [];

	if (if_block.else_body !== undefined)
	{
		else_chunk.push(...compile_block(if_block.else_body, functions));
	}

	const if_else_chunks: Array<Array<OpInterface>> = [];

	for (const { body, condition, token } of if_block.else_if_bodies.reverse())
	{
		const ops: Array<OpInterface> = [];
		const if_else_body = compile_block(body, functions);

		ops.push(...compile_conditional_jump(condition, if_else_body.length + 1, functions));
		ops.push(...if_else_body);

		const offset = if_else_chunks.reduce(
			(acc, chunk) =>
			{
				return chunk.length + acc;
			},
			0
		) + else_chunk.length;

		ops.push({ code: OpCodeEnum.Jump, arg: make_number(offset), debug: token.debug });
		if_else_chunks.push(ops);
	}

	const debug = if_block.token.debug;
	const ops: Array<OpInterface> = [];
	const body = compile_block(if_block.body, functions);

	ops.push({ code: OpCodeEnum.StartBlock, debug: debug });
	ops.push(...compile_conditional_jump(if_block.condition, body.length + 1, functions));
	ops.push(...body);

	const offset = if_else_chunks.reduce(
		(acc, chunk) =>
		{
			return chunk.length + acc;
		},
		0
	) + else_chunk.length;

	ops.push({ code: OpCodeEnum.Jump, arg: make_number(offset), debug: debug });

	for (const if_else_chunk of if_else_chunks)
	{
		ops.push(...if_else_chunk);
	}

	ops.push(...else_chunk);
	ops.push({ code: OpCodeEnum.EndBlock, debug: debug });

	return ops;
}

function replace_breaks(code: Array<OpInterface>, offset_from_end: number): void
{
	for (const [i, op] of code.entries())
	{
		if (op.code === OpCodeEnum.Break)
		{
			const offset = code.length - i - 1 + offset_from_end;

			op.code = OpCodeEnum.Jump;
			op.arg = make_number(offset);
		}
	}
}

function compile_while(while_block: WhileInterface | undefined, functions: Array<Array<OpInterface>>): Array<OpInterface>
{
	if (while_block === undefined)
	{
		throw new Error();
	}

	const debug = while_block.token.debug;
	const ops: Array<OpInterface> = [];
	const body = compile_block(while_block.body, functions);

	replace_breaks(body, 1);

	ops.push({ code: OpCodeEnum.StartBlock, debug: debug });
	ops.push(...compile_conditional_jump(while_block.condition, body.length + 1, functions));
	ops.push(...body);
	ops.push({ code: OpCodeEnum.Jump, arg: make_number(-ops.length - 1), debug: debug });
	ops.push({ code: OpCodeEnum.EndBlock, debug: debug });

	return ops;
}

function compile_for(for_block: ForInterface | undefined, functions: Array<Array<OpInterface>>): Array<OpInterface>
{
	if (for_block === undefined)
	{
		throw new Error();
	}

	const ops: Array<OpInterface> = [];
	const body = compile_block(for_block.body, functions);

	replace_breaks(body, 1);

	const debug = for_block.token.debug;

	ops.push({ code: OpCodeEnum.StartBlock, debug: debug });
	ops.push({ code: OpCodeEnum.StartStackChange, debug: debug });
	ops.push(...compile_expression(for_block.iterator, functions));
	ops.push({ code: OpCodeEnum.EndStackChange, arg: make_number(3), debug: debug });

	const after_creating_itorator = ops.length;

	ops.push({ code: OpCodeEnum.StartStackChange, debug: debug });
	ops.push({ code: OpCodeEnum.IterNext, debug: debug });
	ops.push({ code: OpCodeEnum.IterJumpIfDone, arg: make_number(body.length + for_block.items.length + 3), debug: debug });

	ops.push({ code: OpCodeEnum.EndStackChange, arg: make_number(for_block.items.length), debug: debug });

	for (const [i, item] of [...for_block.items].reverse().entries())
	{
		if (i === for_block.items.length - 1)
		{
			ops.push({ code: OpCodeEnum.IterUpdateState, debug: debug });
		}

		ops.push({ code: OpCodeEnum.Store, arg: make_string(item.data), debug: item.debug });
	}

	ops.push(...body);
	ops.push({ code: OpCodeEnum.Jump, arg: make_number(-ops.length + after_creating_itorator - 1), debug: debug });

	ops.push({ code: OpCodeEnum.EndStackChange, arg: make_number(0), debug: debug });
	ops.push({ code: OpCodeEnum.Pop, arg: make_number(3), debug: debug });
	ops.push({ code: OpCodeEnum.EndBlock, debug: debug });

	return ops;
}

function compile_step(step: ExpressionInterface | undefined, functions: Array<Array<OpInterface>>): Array<OpInterface>
{
	if (step === undefined)
	{
		return [{ code: OpCodeEnum.Push, arg: make_number(1), debug: { line: 0, column: 0 } }];
	}

	return compile_expression(step, functions);
}

function compile_numeric_for(numeric_for_block: NumericForInterface | undefined, functions: Array<Array<OpInterface>>): Array<OpInterface>
{
	if (numeric_for_block === undefined)
	{
		throw new Error();
	}

	const ops: Array<OpInterface> = [];
	const body = compile_block(numeric_for_block.body, functions);
	const step = compile_step(numeric_for_block.step, functions);
	const index = numeric_for_block.index.data;
	const debug = numeric_for_block.index.debug;

	replace_breaks(body, step.length + 4);

	ops.push({ code: OpCodeEnum.StartBlock, debug: debug });
	ops.push(...compile_expression(numeric_for_block.start, functions));

	const after_creating_itorator = ops.length;

	ops.push({ code: OpCodeEnum.Dup, debug: debug });
	ops.push(...compile_expression(numeric_for_block.end, functions));
	ops.push({ code: OpCodeEnum.NotEquals, debug: debug });
	ops.push({ code: OpCodeEnum.JumpIfNot, arg: make_number(body.length + step.length + 4), debug: debug });

	ops.push({ code: OpCodeEnum.Store, arg: make_string(index), debug: debug });
	ops.push(...body);
	ops.push({ code: OpCodeEnum.Load, arg: make_string(index), debug: debug });
	ops.push(...step);
	ops.push({ code: OpCodeEnum.Add, debug: debug });
	ops.push({ code: OpCodeEnum.Jump, arg: make_number(-ops.length + after_creating_itorator - 1), debug: debug });

	ops.push({ code: OpCodeEnum.Pop, debug: debug });
	ops.push({ code: OpCodeEnum.EndBlock, debug: debug });

	return ops;
}

function compile_repeat(repeat: RepeatInterface | undefined, functions: Array<Array<OpInterface>>): Array<OpInterface>
{
	if (repeat === undefined)
	{
		throw new Error();
	}

	const ops: Array<OpInterface> = [];
	const debug = repeat.token.debug;

	ops.push({ code: OpCodeEnum.StartBlock, debug: debug });

	ops.push(...compile_block(repeat.body, functions));
	ops.push(...compile_inverted_conditional_jump(repeat.condition, 1, functions));
	ops.push({ code: OpCodeEnum.Jump, arg: make_number(-ops.length), debug: debug });

	ops.push({ code: OpCodeEnum.EndBlock, debug: debug });

	return ops;
}

function compile_do(do_block: DoInterface | undefined, functions: Array<Array<OpInterface>>): Array<OpInterface>
{
	if (do_block === undefined)
	{
		throw new Error();
	}

	const ops: Array<OpInterface> = [];
	const debug = do_block.token.debug;

	ops.push({ code: OpCodeEnum.StartBlock, debug: debug });
	ops.push(...compile_block(do_block.body, functions));
	ops.push({ code: OpCodeEnum.EndBlock, debug: debug });

	return ops;
}

function compile_return(return_block: ReturnInterface | undefined, functions: Array<Array<OpInterface>>): Array<OpInterface>
{
	if (return_block === undefined)
	{
		throw new Error();
	}

	const ops: Array<OpInterface> = [];

	for (const value of return_block.values)
	{
		ops.push(...compile_expression(value, functions));
	}

	const debug = return_block.token.debug;
	const return_count = return_block.values.length;

	ops.push({ code: OpCodeEnum.Return, arg: make_number(return_count), debug: debug });

	return ops;
}

interface ChunkResult
{
	code: Array<OpInterface>;
	has_last_expression: boolean;
}

function compile_block(chunk: ChunkInterface, functions: Array<Array<OpInterface>>): Array<OpInterface>
{
	const { code, has_last_expression } = compile_chunk(chunk, functions);

	if (has_last_expression)
	{
		code.push({ code: OpCodeEnum.Pop, debug: { line: 0, column: 0 } });
	}

	return code;
}

function compile_chunk(chunk: ChunkInterface, functions: Array<Array<OpInterface>>): ChunkResult
{
	const ops = [];
	let has_last_expression = false;

	for (const [index, statement] of chunk.statements.entries())
	{
		const is_last_statement = index === chunk.statements.length - 1;

		switch (statement.kind)
		{
			case StatementKindEnum.Empty:
				break;
			case StatementKindEnum.Expression:
				ops.push(...compile_expression(statement.expression, functions));

				if (statement.expression === undefined)
				{
					break;
				}

				if (is_last_statement)
				{
					has_last_expression = true;
				}
				else
				{
					ops.push({ code: OpCodeEnum.Pop, debug: statement.expression.token.peek().debug });
				}

				break;
			case StatementKindEnum.Assignment:
				ops.push(...compile_assignment(statement.assignment, functions));
				break;
			case StatementKindEnum.Local:
				ops.push(...compile_local(statement.local));
				break;
			case StatementKindEnum.If:
				ops.push(...compile_if(statement.if, functions));
				break;
			case StatementKindEnum.While:
				ops.push(...compile_while(statement.while, functions));
				break;
			case StatementKindEnum.For:
				ops.push(...compile_for(statement.for, functions));
				break;
			case StatementKindEnum.NumericFor:
				ops.push(...compile_numeric_for(statement.numeric_for, functions));
				break;
			case StatementKindEnum.Repeat:
				ops.push(...compile_repeat(statement.repeat, functions));
				break;
			case StatementKindEnum.Do:
				ops.push(...compile_do(statement.do, functions));
				break;
			case StatementKindEnum.Return:
				ops.push(...compile_return(statement.return, functions));
				break;
			case StatementKindEnum.Break:
				ops.push({ code: OpCodeEnum.Break, debug: { line: 0, column: 0 } });
				break;
		}
	}

	return {
		code: ops,
		has_last_expression: has_last_expression,
	};
}

function link(code: Array<OpInterface>, function_id: number, location: number): void
{
	for (const op of code)
	{
		if (op.arg?.data_type === VariableKind.Function
			&& op.arg?.function_id === function_id)
		{
			op.arg.function_id = location;
		}
	}
}

export function compile(chunk: ChunkInterface, extend?: Array<OpInterface>): ProgramInterface
{
	const ops = [...(extend ?? [])];
	const functions: Array<Array<OpInterface>> = [];
	const { code, has_last_expression } = compile_chunk(chunk, functions);

	const function_locations: Array<number> = [];

	for (const func of functions)
	{
		function_locations.push(ops.length);
		ops.push(...func);
	}

	for (const [id, location] of function_locations.entries())
	{
		link(code, id, location);
	}

	const start = ops.length;

	if (extend?.length ?? 0 > 0)
	{
		ops.push({ code: OpCodeEnum.Pop, debug: { line: 0, column: 0 } });
	}

	ops.push(...code);

	if (!has_last_expression)
	{
		ops.push({ code: OpCodeEnum.Push, arg: nil, debug: { line: 0, column: 0 } });
	}

	return {
		code: ops,
		start: start,
	};
}
