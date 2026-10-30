import { VariableKind } from "./variable/definition/enum/variable-kind.enum.mjs";
import { nil } from "./variable/nil.mjs";
import { ValueKind } from "./ast/definition/enum/value-kind.enum.mjs";
import { ExpressionKind } from "./ast/definition/enum/expression-kind.enum.mjs";
import { StatementKind } from "./ast/definition/enum/statement-kind.enum.mjs";
import { OperationCode, type OperationCodeEnum } from "./opcode/definition/enum/operation-code.enum.mjs";
import type { OperationInterface } from "./opcode/definition/interface/op.interface.mjs";
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
import { TokenStream } from "./lexer.mjs";
import type { DebugInterface } from "./lexer/definition/interface/debug.interface.mjs";
import { make_boolean } from "./runtime/make-boolean/make-boolean.mjs";
import { make_number } from "./runtime/make-number/make-number.mjs";
import { make_string } from "./runtime/make-string/make-string.mjs";
import { getDebug } from "./lexer/utility/get-debug.mjs";
import { isVariableKind } from "./variable/predicate/is-variable-kind.mjs";

interface ChunkResult
{
	code: Array<OperationInterface>;
	has_last_expression: boolean;
}

class Compiler
{
	protected functions: Array<Array<OperationInterface>>;

	protected constructor()
	{
		this.functions = [];
	}

	public static Compile(chunk: ChunkInterface, extend?: Array<OperationInterface>): ProgramInterface
	{
		const compiler = new Compiler();

		return compiler.compile(chunk, extend);
	}

	protected compile(chunk: ChunkInterface, extend?: Array<OperationInterface>): ProgramInterface
	{
		const ops = [...(extend ?? [])];
		const { code, has_last_expression }: ChunkResult = this.compileChunk(chunk);

		for (const [function_id, function_ops] of this.functions.entries())
		{
			this.link(code, function_id, ops.length);
			ops.push(...function_ops);
		}

		const start = ops.length;

		if ((extend?.length ?? 0) > 0)
		{
			ops.push({ code: OperationCode.Pop, debug: { line: 0, column: 0 } });
		}

		ops.push(...code);

		if (!has_last_expression)
		{
			ops.push({ code: OperationCode.Push, arg: nil, debug: { line: 0, column: 0 } });
		}

		return {
			code: ops,
			start: start,
		};
	}

	protected compileFunction(chunk: ChunkInterface, token: TokenInterface | TokenStream, parameters: Array<TokenInterface>): number
	{
		const ops: Array<OperationInterface> = [];

		ops.push({ code: OperationCode.ArgumentCount, arg: make_number(parameters.length), debug: token.debug });

		for (const parameter of parameters.reverse())
		{
			ops.push({ code: OperationCode.MakeLocal, arg: make_string(parameter.data), debug: parameter.debug });
			ops.push({ code: OperationCode.Store, arg: make_string(parameter.data), debug: parameter.debug });
		}

		ops.push(...this.compileBlock(chunk));
		ops.push({ code: OperationCode.Push, arg: nil, debug: token.debug });
		ops.push({ code: OperationCode.Return, arg: make_number(0), debug: token.debug });

		this.functions.push(ops);

		return this.functions.length - 1;
	}

	protected compileValue(value: ValueInterface | undefined): Array<OperationInterface>
	{
		if (value === undefined)
		{
			throw new Error();
		}

		const debug = value.token.debug;

		switch (value.kind)
		{
			case ValueKind.NilLiteral:
				return [{ code: OperationCode.Push, arg: nil, debug: debug }];
			case ValueKind.BooleanLiteral:
				return [{ code: OperationCode.Push, arg: make_boolean(value.boolean ?? false), debug: debug }];
			case ValueKind.NumberLiteral:
				return [{ code: OperationCode.Push, arg: make_number(value.number ?? 0), debug: debug }];
			case ValueKind.StringLiteral:
				return [{ code: OperationCode.Push, arg: make_string(value.string ?? ""), debug: debug }];

			case ValueKind.FunctionLike:
			{
				return [{
					code: OperationCode.Push,
					arg: {
						data_type: VariableKind.Function,
						function_id: this.compileFunction(
							value.function?.body ?? { statements: [] },
							value.token,
							value.function?.parameters ?? []
						),
					},
					debug: debug,
				}];
			}

			case ValueKind.TableLiteral:
			{
				const output: Array<OperationInterface> = [];

				output.push({ code: OperationCode.NewTable, debug: debug });

				for (const [key, expression] of [...value.table?.entries() ?? []].reverse())
				{
					output.push(...this.compileExpression(expression));
					output.push(...this.compileExpression(key));
				}

				output.push({ code: OperationCode.StoreIndex, arg: make_number(value.table?.size ?? 0), debug: debug });

				return output;
			}

			case ValueKind.Variable:
			{
				return [{
					code: OperationCode.Load,
					arg: { data_type: VariableKind.String, string: value.identifier ?? "" },
					debug: debug,
				}];
			}
		}
	}

	protected compileOperation(expression: ExpressionInterface, operation: OperationCodeEnum): Array<OperationInterface>
	{
		const { lhs, rhs } = expression;

		if (lhs === undefined || rhs === undefined)
		{
			throw new Error();
		}

		const ops: Array<OperationInterface> = [];

		ops.push(...this.compileExpression(rhs));
		ops.push(...this.compileExpression(lhs));

		ops.push({
			code: operation,
			debug: getDebug(expression.token),
		});

		return ops;
	}

	protected compileCall(callable: ExpressionInterface | undefined, args: Array<ExpressionInterface> | undefined): Array<OperationInterface>
	{
		if (callable === undefined || args === undefined)
		{
			throw new Error();
		}

		const debug: DebugInterface = getDebug(callable.token);
		const ops: Array<OperationInterface> = [];

		for (const arg of args)
		{
			ops.push(...this.compileExpression(arg));
		}

		ops.push(...this.compileExpression(callable));
		ops.push({ code: OperationCode.Push, arg: make_number(args.length), debug: debug });
		ops.push({ code: OperationCode.Call, debug: debug });

		return ops;
	}

	protected compileIndex(target: ExpressionInterface | undefined, index: ExpressionInterface | undefined): Array<OperationInterface>
	{
		if (target === undefined || index === undefined)
		{
			throw new Error();
		}

		const ops: Array<OperationInterface> = [];

		ops.push(...this.compileExpression(index));
		ops.push(...this.compileExpression(target));
		ops.push({ code: OperationCode.LoadIndex, debug: getDebug(target.token) });

		return ops;
	}

	protected compileUnaryOperation(expression: ExpressionInterface | undefined, operation: OperationCodeEnum): Array<OperationInterface>
	{
		if (expression === undefined || expression.expression === undefined)
		{
			throw new Error();
		}

		const ops: Array<OperationInterface> = [];

		ops.push(...this.compileExpression(expression.expression));
		ops.push({ code: operation, debug: getDebug(expression.token) });

		return ops;
	}

	protected compileExpression(expression: ExpressionInterface | undefined): Array<OperationInterface>
	{
		if (expression === undefined)
		{
			throw new Error();
		}

		switch (expression.kind)
		{
			case ExpressionKind.Value:
				return this.compileValue(expression.value);
			case ExpressionKind.Call:
				return this.compileCall(expression.expression, expression.arguments);
			case ExpressionKind.Index:
				return this.compileIndex(expression.expression, expression.index);

			case ExpressionKind.Addition:
				return this.compileOperation(expression, OperationCode.Add);
			case ExpressionKind.Subtract:
				return this.compileOperation(expression, OperationCode.Subtract);
			case ExpressionKind.Multiplication:
				return this.compileOperation(expression, OperationCode.Multiply);
			case ExpressionKind.Division:
				return this.compileOperation(expression, OperationCode.Divide);
			case ExpressionKind.FloorDivision:
				return this.compileOperation(expression, OperationCode.FloorDivide);
			case ExpressionKind.Modulo:
				return this.compileOperation(expression, OperationCode.Modulo);
			case ExpressionKind.Exponent:
				return this.compileOperation(expression, OperationCode.Exponent);
			case ExpressionKind.Concat:
				return this.compileOperation(expression, OperationCode.Concat);

			case ExpressionKind.BitAnd:
				return this.compileOperation(expression, OperationCode.BitAnd);
			case ExpressionKind.BitOr:
				return this.compileOperation(expression, OperationCode.BitOr);
			case ExpressionKind.BitXOr:
				return this.compileOperation(expression, OperationCode.BitXOr);
			case ExpressionKind.BitShiftLeft:
				return this.compileOperation(expression, OperationCode.BitShiftLeft);
			case ExpressionKind.BitShiftRight:
				return this.compileOperation(expression, OperationCode.BitShiftRight);

			case ExpressionKind.Equals:
				return this.compileOperation(expression, OperationCode.Equals);
			case ExpressionKind.NotEquals:
				return this.compileOperation(expression, OperationCode.NotEquals);
			case ExpressionKind.LessThan:
				return this.compileOperation(expression, OperationCode.LessThan);
			case ExpressionKind.LessThanEquals:
				return this.compileOperation(expression, OperationCode.LessThanEquals);
			case ExpressionKind.GreaterThan:
				return this.compileOperation(expression, OperationCode.GreaterThan);
			case ExpressionKind.GreaterThanEquals:
				return this.compileOperation(expression, OperationCode.GreaterThanEquals);
			case ExpressionKind.And:
				return this.compileOperation(expression, OperationCode.And);
			case ExpressionKind.Or:
				return this.compileOperation(expression, OperationCode.Or);

			case ExpressionKind.Not:
				return this.compileUnaryOperation(expression, OperationCode.Not);
			case ExpressionKind.Negate:
				return this.compileUnaryOperation(expression, OperationCode.Negate);
			case ExpressionKind.Length:
				return this.compileUnaryOperation(expression, OperationCode.Length);
			case ExpressionKind.BitNot:
				return this.compileUnaryOperation(expression, OperationCode.BitNot);
		}
	}

	protected compileAssignment(assignment: AssignmentInterface | undefined): Array<OperationInterface>
	{
		if (assignment === undefined)
		{
			throw new Error();
		}

		const ops: Array<OperationInterface> = [];
		let debug: DebugInterface = assignment.token.debug;

		ops.push({ code: OperationCode.StartStackChange, debug: debug });

		for (const rhs of assignment.rhs)
		{
			ops.push(...this.compileExpression(rhs));
		}

		ops.push({ code: OperationCode.EndStackChange, arg: make_number(assignment.lhs.length), debug: debug });

		for (const lhs of assignment.lhs)
		{
			debug = getDebug(lhs.token);

			// eslint-disable-next-line @ts/switch-exhaustiveness-check
			switch (lhs.kind)
			{
				case ExpressionKind.Value:
				{
					if (lhs.value?.kind !== ValueKind.Variable)
					{
						throw new Error();
					}

					const identifier = make_string(lhs.value.identifier ?? "");

					if (assignment.local)
					{
						ops.push({ code: OperationCode.MakeLocal, arg: identifier, debug: debug });
					}

					ops.push({ code: OperationCode.Store, arg: identifier, debug: debug });
					break;
				}

				case ExpressionKind.Index:
				{
					// @TODO: FIXME Throw error here if `assignment.local` is true. I think?

					ops.push(...this.compileExpression(lhs.expression));
					ops.push({ code: OperationCode.Swap, debug: debug });
					ops.push(...this.compileExpression(lhs.index));
					ops.push({ code: OperationCode.StoreIndex, debug: debug });
					ops.push({ code: OperationCode.Pop, debug: debug });
					break;
				}

				default:
					throw new Error();
			}
		}

		return ops;
	}

	// eslint-disable-next-line @ts/class-methods-use-this
	protected compileLocal(local: LocalInterface | undefined): Array<OperationInterface>
	{
		if (local === undefined)
		{
			throw new Error();
		}

		return local.names.map(
			(name: TokenInterface | TokenStream): OperationInterface =>
			{
				const token: TokenInterface = (name instanceof TokenStream) ? name.peek() : name;

				return {
					code: OperationCode.MakeLocal,
					arg: {
						data_type: VariableKind.String,
						string: token.data,
					},
					debug: name.debug,
				};
			}
		);
	}

	protected compileInvertedConditionalJump(condition: ExpressionInterface | undefined, jump_by: number): Array<OperationInterface>
	{
		if (condition === undefined)
		{
			throw new Error();
		}

		const ops: Array<OperationInterface> = [];
		const debug: DebugInterface = getDebug(condition.token);

		// eslint-disable-next-line @ts/switch-exhaustiveness-check
		switch (condition.kind)
		{
			case ExpressionKind.And:
			{
				const rhs = this.compileInvertedConditionalJump(condition.rhs, jump_by);

				ops.push(...this.compileConditionalJump(condition.lhs, rhs.length));
				ops.push(...rhs);
				break;
			}

			case ExpressionKind.Or:
			{
				const rhs = this.compileInvertedConditionalJump(condition.rhs, jump_by);

				ops.push(...this.compileInvertedConditionalJump(condition.lhs, rhs.length + jump_by));
				ops.push(...rhs);
				break;
			}

			case ExpressionKind.Not:
			{
				ops.push(...this.compileExpression(condition.expression));
				break;
			}

			default:
			{
				ops.push(...this.compileExpression(condition));
				ops.push({ code: OperationCode.JumpIf, arg: make_number(jump_by), debug: debug });
				break;
			}
		}

		return ops;
	}

	protected compileConditionalJump(condition: ExpressionInterface | undefined, jump_by: number): Array<OperationInterface>
	{
		if (condition === undefined)
		{
			throw new Error();
		}

		const ops: Array<OperationInterface> = [];
		const debug: DebugInterface = getDebug(condition.token);

		// eslint-disable-next-line @ts/switch-exhaustiveness-check
		switch (condition.kind)
		{
			case ExpressionKind.And:
			{
				const rhs = this.compileConditionalJump(condition.rhs, jump_by);

				ops.push(...this.compileConditionalJump(condition.lhs, rhs.length + jump_by));
				ops.push(...rhs);
				break;
			}

			case ExpressionKind.Or:
			{
				const rhs = this.compileConditionalJump(condition.rhs, jump_by);

				ops.push(...this.compileInvertedConditionalJump(condition.lhs, rhs.length));
				ops.push(...rhs);
				break;
			}

			case ExpressionKind.Not:
			{
				ops.push(...this.compileInvertedConditionalJump(condition.expression, jump_by));
				break;
			}

			default:
			{
				ops.push(...this.compileExpression(condition));
				ops.push({ code: OperationCode.JumpIfNot, arg: make_number(jump_by), debug: debug });
				break;
			}
		}

		return ops;
	}

	protected compileIf(if_block: IfBlockInterface | undefined): Array<OperationInterface>
	{
		if (if_block === undefined)
		{
			throw new Error();
		}

		const else_chunk: Array<OperationInterface> = [];

		if (if_block.else_body !== undefined)
		{
			else_chunk.push(...this.compileBlock(if_block.else_body));
		}

		const if_else_chunks: Array<Array<OperationInterface>> = [];

		for (const else_if_block of if_block.else_if_bodies.toReversed())
		{
			const scoped_ops: Array<OperationInterface> = [];
			const else_if_body = this.compileBlock(else_if_block.body);

			scoped_ops.push(...this.compileConditionalJump(else_if_block.condition, else_if_body.length + 1));
			scoped_ops.push(...else_if_body);

			const else_if_offset: number = else_chunk.length + if_else_chunks.reduce(
				(acc: number, chunk: Array<OperationInterface>): number =>
				{
					return chunk.length + acc;
				},
				0
			);

			scoped_ops.push({
				code: OperationCode.Jump,
				arg: make_number(else_if_offset),
				debug: else_if_block.token.debug,
			});

			if_else_chunks.push(scoped_ops);
		}

		const debug = if_block.token.debug;
		const ops: Array<OperationInterface> = [];
		const body = this.compileBlock(if_block.body);

		ops.push({ code: OperationCode.StartBlock, debug: debug });
		ops.push(...this.compileConditionalJump(if_block.condition, body.length + 1));
		ops.push(...body);

		const offset = if_else_chunks.reduce(
			(acc: number, chunk): number =>
			{
				return chunk.length + acc;
			},
			0
		) + else_chunk.length;

		ops.push({ code: OperationCode.Jump, arg: make_number(offset), debug: debug });

		for (const if_else_chunk of if_else_chunks)
		{
			ops.push(...if_else_chunk);
		}

		ops.push(...else_chunk);
		ops.push({ code: OperationCode.EndBlock, debug: debug });

		return ops;
	}

	// eslint-disable-next-line @ts/class-methods-use-this
	protected replace_breaks(code: Array<OperationInterface>, offset_from_end: number): void
	{
		for (const [index, operation] of code.entries())
		{
			if (operation.code === OperationCode.Break)
			{
				const offset = code.length - index - 1 + offset_from_end;

				operation.code = OperationCode.Jump;
				operation.arg = make_number(offset);
			}
		}
	}

	protected compileWhile(while_block: WhileInterface | undefined): Array<OperationInterface>
	{
		if (while_block === undefined)
		{
			throw new Error();
		}

		const debug = while_block.token.debug;
		const ops: Array<OperationInterface> = [];
		const body = this.compileBlock(while_block.body);

		this.replace_breaks(body, 1);

		ops.push({ code: OperationCode.StartBlock, debug: debug });
		ops.push(...this.compileConditionalJump(while_block.condition, body.length + 1));
		ops.push(...body);
		ops.push({ code: OperationCode.Jump, arg: make_number(-ops.length - 1), debug: debug });
		ops.push({ code: OperationCode.EndBlock, debug: debug });

		return ops;
	}

	protected compileFor(for_block: ForInterface | undefined): Array<OperationInterface>
	{
		if (for_block === undefined)
		{
			throw new Error();
		}

		const ops: Array<OperationInterface> = [];
		const body = this.compileBlock(for_block.body);

		this.replace_breaks(body, 1);

		const debug = for_block.token.debug;

		ops.push({ code: OperationCode.StartBlock, debug: debug });
		ops.push({ code: OperationCode.StartStackChange, debug: debug });
		ops.push(...this.compileExpression(for_block.iterator));
		ops.push({ code: OperationCode.EndStackChange, arg: make_number(3), debug: debug });

		const after_creating_iterator = ops.length;

		ops.push({ code: OperationCode.StartStackChange, debug: debug });
		ops.push({ code: OperationCode.IterNext, debug: debug });
		ops.push({ code: OperationCode.IterJumpIfDone, arg: make_number(body.length + for_block.items.length + 3), debug: debug });

		ops.push({ code: OperationCode.EndStackChange, arg: make_number(for_block.items.length), debug: debug });

		for (const [i, item] of [...for_block.items].reverse().entries())
		{
			if (i === for_block.items.length - 1)
			{
				ops.push({ code: OperationCode.IterUpdateState, debug: debug });
			}

			ops.push({ code: OperationCode.Store, arg: make_string(item.data), debug: item.debug });
		}

		ops.push(...body);
		ops.push({ code: OperationCode.Jump, arg: make_number(-ops.length + after_creating_iterator - 1), debug: debug });

		ops.push({ code: OperationCode.EndStackChange, arg: make_number(0), debug: debug });
		ops.push({ code: OperationCode.Pop, arg: make_number(3), debug: debug });
		ops.push({ code: OperationCode.EndBlock, debug: debug });

		return ops;
	}

	protected compileStep(step: ExpressionInterface | undefined): Array<OperationInterface>
	{
		if (step === undefined)
		{
			return [{ code: OperationCode.Push, arg: make_number(1), debug: { line: 0, column: 0 } }];
		}

		return this.compileExpression(step);
	}

	protected compileNumericFor(numeric_for_block: NumericForInterface | undefined): Array<OperationInterface>
	{
		if (numeric_for_block === undefined)
		{
			throw new Error();
		}

		// @TODO: The step expression should only be evaluated once, not every iteration

		const ops: Array<OperationInterface> = [];
		const body = this.compileBlock(numeric_for_block.body);
		const start = this.compileExpression(numeric_for_block.start);
		const end = this.compileExpression(numeric_for_block.end);
		const step = this.compileStep(numeric_for_block.step);
		const index = numeric_for_block.index.data;
		const debug = numeric_for_block.index.debug;

		this.replace_breaks(body, step.length + 4);

		ops.push({ code: OperationCode.StartBlock, debug: debug });
		ops.push(...start);

		const after_creating_iterator: number = ops.length;

		ops.push({ code: OperationCode.Dup, debug: debug });
		ops.push(...end);
		ops.push(...step);
		ops.push({ code: OperationCode.Add, debug: debug });
		ops.push({ code: OperationCode.NotEquals, debug: debug });
		ops.push({ code: OperationCode.JumpIfNot, arg: make_number(body.length + step.length + 4), debug: debug });

		ops.push({ code: OperationCode.Store, arg: make_string(index), debug: debug });
		ops.push(...body);
		ops.push({ code: OperationCode.Load, arg: make_string(index), debug: debug });
		ops.push(...step);
		ops.push({ code: OperationCode.Add, debug: debug });
		ops.push({ code: OperationCode.Jump, arg: make_number(-ops.length + after_creating_iterator - 1), debug: debug });

		ops.push({ code: OperationCode.Pop, debug: debug });
		ops.push({ code: OperationCode.EndBlock, debug: debug });

		return ops;
	}

	protected compileRepeat(repeat: RepeatInterface | undefined): Array<OperationInterface>
	{
		if (repeat === undefined)
		{
			throw new Error();
		}

		const ops: Array<OperationInterface> = [];
		const debug = repeat.token.debug;

		ops.push({ code: OperationCode.StartBlock, debug: debug });

		ops.push(...this.compileBlock(repeat.body));
		ops.push(...this.compileInvertedConditionalJump(repeat.condition, 1));
		ops.push({ code: OperationCode.Jump, arg: make_number(-ops.length), debug: debug });

		ops.push({ code: OperationCode.EndBlock, debug: debug });

		return ops;
	}

	protected compileDo(do_block: DoInterface | undefined): Array<OperationInterface>
	{
		if (do_block === undefined)
		{
			throw new Error();
		}

		const ops: Array<OperationInterface> = [];
		const debug = do_block.token.debug;

		ops.push({ code: OperationCode.StartBlock, debug: debug });
		ops.push(...this.compileBlock(do_block.body));
		ops.push({ code: OperationCode.EndBlock, debug: debug });

		return ops;
	}

	protected compileReturn(return_block: ReturnInterface | undefined): Array<OperationInterface>
	{
		if (return_block === undefined)
		{
			throw new Error();
		}

		const ops: Array<OperationInterface> = [];

		for (const value of return_block.values)
		{
			ops.push(...this.compileExpression(value));
		}

		const debug = return_block.token.debug;
		const return_count = return_block.values.length;

		ops.push({ code: OperationCode.Return, arg: make_number(return_count), debug: debug });

		return ops;
	}

	protected compileBlock(chunk: ChunkInterface): Array<OperationInterface>
	{
		const { code, has_last_expression }: ChunkResult = this.compileChunk(chunk);

		if (has_last_expression)
		{
			code.push({
				code: OperationCode.Pop,
				debug: {
					line: 0,
					column: 0,
				},
			});
		}

		return code;
	}

	protected compileChunk(chunk: ChunkInterface): ChunkResult
	{
		const ops = [];
		let has_last_expression = false;

		for (const [index, statement] of chunk.statements.entries())
		{
			// eslint-disable-next-line @ts/switch-exhaustiveness-check
			switch (statement.kind)
			{
				case StatementKind.Empty:
					break;
				case StatementKind.Expression:
				{
					ops.push(...this.compileExpression(statement.expression));

					if (statement.expression === undefined)
					{
						break;
					}

					const is_last_statement: boolean = index === chunk.statements.length - 1;

					if (is_last_statement)
					{
						has_last_expression = true;
						break;
					}

					ops.push({
						code: OperationCode.Pop,
						debug: getDebug(statement.expression.token),
					});

					break;
				}
				case StatementKind.Assignment:
					ops.push(...this.compileAssignment(statement.assignment));
					break;
				case StatementKind.Local:
					ops.push(...this.compileLocal(statement.local));
					break;
				case StatementKind.If:
					ops.push(...this.compileIf(statement.if));
					break;
				case StatementKind.While:
					ops.push(...this.compileWhile(statement.while));
					break;
				case StatementKind.For:
					ops.push(...this.compileFor(statement.for));
					break;
				case StatementKind.NumericFor:
					ops.push(...this.compileNumericFor(statement.numeric_for));
					break;
				case StatementKind.Repeat:
					ops.push(...this.compileRepeat(statement.repeat));
					break;
				case StatementKind.Do:
					ops.push(...this.compileDo(statement.do));
					break;
				case StatementKind.Return:
					ops.push(...this.compileReturn(statement.return));
					break;
				case StatementKind.Break:
					ops.push({
						code: OperationCode.Break,
						debug: { line: 0, column: 0 },
					});

					break;
			}
		}

		return {
			code: ops,
			has_last_expression: has_last_expression,
		};
	}

	// @TODO: Clarify what this does
	// eslint-disable-next-line @ts/class-methods-use-this
	protected link(code: Array<OperationInterface>, function_id: number, location: number): void
	{
		for (const operation of code)
		{
			if (isVariableKind(operation.arg, VariableKind.Function) && operation.arg.function_id === function_id)
			{
				operation.arg.function_id = location;
			}
		}
	}
}

export { Compiler };
