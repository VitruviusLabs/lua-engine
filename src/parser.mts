import { ExpressionKind } from "./ast/definition/enum/expression-kind.enum.mjs";
import { StatementKindEnum } from "./ast/definition/enum/statement-kind.enum.mjs";
import { ValueKindEnum } from "./ast/definition/enum/value-kind.enum.mjs";
import type { ChunkInterface } from "./ast/definition/interface/chunk.interface.mjs";
import type { ElseIfBlockInterface } from "./ast/definition/interface/else-if-block.interface.mjs";
import type { ExpressionInterface } from "./ast/definition/interface/expression.interface.mjs";
import type { StatementInterface } from "./ast/definition/interface/statement.interface.mjs";
import type { ValueInterface } from "./ast/definition/interface/value.interface.mjs";
import type { TokenStream } from "./lexer.mjs";
import { TokenKindEnum } from "./lexer/definition/enum/token-kind.enum.mjs";
import type { TokenInterface } from "./lexer/definition/interface/token.interface.mjs";
import { token_kind_to_string } from "./lexer/token-kind-to-string/token-kind-to-string.mjs";
import { consume } from "./parser/consume/consume.mjs";
import { expect } from "./parser/expect/expect.mjs";
import { unary_type_to_expression_kind } from "./parser/unary-type-to-expression-kind/unary-type-to-expression-kind.mjs";

const UNARY = [
	TokenKindEnum.Not,
	TokenKindEnum.Subtract,
	TokenKindEnum.Hash,
];

const ORDERS = [
	[TokenKindEnum.Or],
	[TokenKindEnum.And],
	[TokenKindEnum.LessThan, TokenKindEnum.LessThanEquals, TokenKindEnum.GreaterThan, TokenKindEnum.GreaterThanEquals, TokenKindEnum.Equals, TokenKindEnum.NotEquals],
	[TokenKindEnum.BitOr],
	[TokenKindEnum.BitAnd],
	[TokenKindEnum.BitXOrNot],
	[TokenKindEnum.BitShiftLeft, TokenKindEnum.BitShiftRight],
	[TokenKindEnum.Concat],
	[TokenKindEnum.Addition, TokenKindEnum.Subtract],
	[TokenKindEnum.Multiply, TokenKindEnum.Division, TokenKindEnum.FloorDivision, TokenKindEnum.Modulo],
	[TokenKindEnum.Exponent],
];

function parse_table_key(stream: TokenStream): ExpressionInterface | Error
{
	if (consume(stream, TokenKindEnum.OpenSquare))
	{
		const element = parse_expression(stream);

		if (element instanceof Error)
		{
			return element;
		}

		const close_square = expect(stream, TokenKindEnum.CloseSquare);

		if (close_square instanceof Error)
		{
			return close_square;
		}

		return element;
	}

	const value = parse_value(stream);

	if (value instanceof Error)
	{
		return value;
	}

	if (value.kind === ValueKindEnum.Variable)
	{
		value.kind = ValueKindEnum.StringLiteral;
		value.string = value.identifier;
		value.identifier = undefined;
	}

	return {
		kind: ExpressionKind.Value,
		token: value.token,
		value: value,
	};
}

function parse_table(stream: TokenStream): ValueInterface | Error
{
	const squigly_open = expect(stream, TokenKindEnum.SquiglyOpen);

	if (squigly_open instanceof Error)
	{
		return squigly_open;
	}

	const elements: Map<ExpressionInterface, ExpressionInterface> = new Map();
	let current_numeric_key = 1;

	while (stream.peek().kind !== TokenKindEnum.SquiglyClose)
	{
		const element = parse_table_key(stream);

		if (element instanceof Error)
		{
			return element;
		}

		if (consume(stream, TokenKindEnum.Assign))
		{
			const value = parse_expression(stream);

			if (value instanceof Error)
			{
				return value;
			}

			elements.set(element, value);
		}
		else
		{
			const key_token = {
				kind: TokenKindEnum.NumberLiteral,
				data: current_numeric_key.toString(),
				debug: element.token.debug,
			};

			const key = {
				kind: ExpressionKind.Value,
				token: key_token,
				value: {
					kind: ValueKindEnum.NumberLiteral,
					token: key_token,
					number: current_numeric_key,
				},
			};

			current_numeric_key = current_numeric_key + 1;
			elements.set(key, element);
		}

		if (!consume(stream, TokenKindEnum.Comma))
		{
			break;
		}
	}

	const close_squigly = expect(stream, TokenKindEnum.SquiglyClose);

	if (close_squigly instanceof Error)
	{
		return close_squigly;
	}

	return {
		kind: ValueKindEnum.TableLiteral,
		token: squigly_open,
		table: elements,
	};
}

function parse_value(stream: TokenStream): ValueInterface | Error
{
	const token = stream.peek();

	// eslint-disable-next-line @ts/switch-exhaustiveness-check
	switch (token.kind)
	{
		case TokenKindEnum.NumberLiteral:
			return { kind: ValueKindEnum.NumberLiteral, token: stream.next(), number: parseFloat(token.data) };
		case TokenKindEnum.BooleanLiteral:
			return { kind: ValueKindEnum.BooleanLiteral, token: stream.next(), boolean: token.data === "true" };
		case TokenKindEnum.StringLiteral:
			return { kind: ValueKindEnum.StringLiteral, token: stream.next(), string: token.data };
		case TokenKindEnum.NilLiteral:
			return { kind: ValueKindEnum.NilLiteral, token: stream.next() };
		case TokenKindEnum.Identifier:
			return { kind: ValueKindEnum.Variable, token: stream.next(), identifier: token.data };

		case TokenKindEnum.SquiglyOpen:
			return parse_table(stream);
		case TokenKindEnum.FunctionLike:
			return parse_function_value(stream.next(), stream);

		default:
			return error(token, `Expected value, got ${token_kind_to_string(token.kind)} instead`);
	}
}

function parse_unary_operator(stream: TokenStream): ExpressionInterface | Error
{
	const operator_token = stream.next();
	const operator = unary_type_to_expression_kind(operator_token.kind);

	const expression = parse_expression(stream);

	if (expression instanceof Error)
	{
		return expression;
	}

	return {
		kind: operator,
		token: operator_token,
		expression: expression,
	};
}

function parse_value_expression(stream: TokenStream): ExpressionInterface | Error
{
	if (consume(stream, TokenKindEnum.OpenBrace))
	{
		const sub_expression = parse_expression(stream);

		if (sub_expression instanceof Error)
		{
			return sub_expression;
		}

		const close_brace = expect(stream, TokenKindEnum.CloseBrace);

		if (close_brace instanceof Error)
		{
			return close_brace;
		}

		return sub_expression;
	}

	if (UNARY.includes(stream.peek().kind))
	{
		return parse_unary_operator(stream);
	}

	const value = parse_value(stream);

	if (value instanceof Error)
	{
		return value;
	}

	const expression_value = {
		kind: ExpressionKind.Value,
		token: value.token,
		value: value,
	};

	return parse_access_expression(expression_value, stream);
}

function parse_call(func: ExpressionInterface, stream: TokenStream): ExpressionInterface | Error
{
	const open_brace = stream.next();
	const args: Array<ExpressionInterface> = [];

	while (stream.peek().kind !== TokenKindEnum.CloseBrace)
	{
		const argument = parse_expression(stream);

		if (argument instanceof Error)
		{
			break;
		}

		args.push(argument);

		if (!consume(stream, TokenKindEnum.Comma))
		{
			break;
		}
	}

	const close_brace = expect(stream, TokenKindEnum.CloseBrace);

	if (close_brace instanceof Error)
	{
		return close_brace;
	}

	return parse_access_expression({
		kind: ExpressionKind.Call,
		token: open_brace,
		expression: func,
		arguments: args,
	}, stream);
}

function parse_index(table: ExpressionInterface, stream: TokenStream): ExpressionInterface | Error
{
	const open_square = stream.next();
	const index = parse_expression(stream);

	if (index instanceof Error)
	{
		return index;
	}

	const close_square = expect(stream, TokenKindEnum.CloseSquare);

	if (close_square instanceof Error)
	{
		return close_square;
	}

	return parse_access_expression(
		{
			kind: ExpressionKind.Index,
			token: open_square,
			expression: table,
			index: index,
		},
		stream
	);
}

function parse_dot(table: ExpressionInterface, stream: TokenStream): ExpressionInterface | Error
{
	const dot = stream.next();
	const index = expect(stream, TokenKindEnum.Identifier);

	if (index instanceof Error)
	{
		return index;
	}

	return parse_access_expression({
		kind: ExpressionKind.Index,
		expression: table,
		token: dot,
		index: {
			kind: ExpressionKind.Value,
			token: index,
			value: {
				kind: ValueKindEnum.StringLiteral,
				token: index,
				string: index.data,
			},
		},
	}, stream);
}

function parse_single_argument_call(func: ExpressionInterface, stream: TokenStream): ExpressionInterface | Error
{
	const argument = parse_expression(stream);

	if (argument instanceof Error)
	{
		return argument;
	}

	return {
		kind: ExpressionKind.Call,
		token: func.token,
		expression: func,
		arguments: [argument],
	};
}

function parse_access_expression(expression: ExpressionInterface, stream: TokenStream): ExpressionInterface | Error
{
	// eslint-disable-next-line @ts/switch-exhaustiveness-check
	switch (stream.peek().kind)
	{
		case TokenKindEnum.OpenBrace:
			return parse_call(expression, stream);

		case TokenKindEnum.OpenSquare:
			return parse_index(expression, stream);

		case TokenKindEnum.Dot:
			return parse_dot(expression, stream);

		case TokenKindEnum.SquiglyOpen:
		case TokenKindEnum.StringLiteral:
			return parse_single_argument_call(expression, stream);
	}

	return expression;
}

function operation_type_to_expression_kind(
	operation_type: TokenKindEnum
): ExpressionKind
{
	// eslint-disable-next-line @ts/switch-exhaustiveness-check
	switch (operation_type)
	{
		case TokenKindEnum.Addition: return ExpressionKind.Addition;
		case TokenKindEnum.Subtract: return ExpressionKind.Subtract;
		case TokenKindEnum.Multiply: return ExpressionKind.Multiplication;
		case TokenKindEnum.Division: return ExpressionKind.Division;
		case TokenKindEnum.FloorDivision: return ExpressionKind.FloorDivision;
		case TokenKindEnum.Modulo: return ExpressionKind.Modulo;
		case TokenKindEnum.Exponent: return ExpressionKind.Exponent;
		case TokenKindEnum.Concat: return ExpressionKind.Concat;
		case TokenKindEnum.BitAnd: return ExpressionKind.BitAnd;
		case TokenKindEnum.BitOr: return ExpressionKind.BitOr;
		case TokenKindEnum.BitXOrNot: return ExpressionKind.BitXOr;
		case TokenKindEnum.BitShiftLeft: return ExpressionKind.BitShiftLeft;
		case TokenKindEnum.BitShiftRight: return ExpressionKind.BitShiftRight;
		case TokenKindEnum.LessThan: return ExpressionKind.LessThan;
		case TokenKindEnum.LessThanEquals: return ExpressionKind.LessThanEquals;
		case TokenKindEnum.GreaterThan: return ExpressionKind.GreaterThan;
		case TokenKindEnum.GreaterThanEquals: return ExpressionKind.GreaterThanEquals;
		case TokenKindEnum.Equals: return ExpressionKind.Equals;
		case TokenKindEnum.NotEquals: return ExpressionKind.NotEquals;
		case TokenKindEnum.And: return ExpressionKind.And;
		case TokenKindEnum.Or: return ExpressionKind.Or;

		default:
			throw new Error();
	}
}

function parse_operation(
	stream: TokenStream,
	order: number
): ExpressionInterface | Error
{
	if (order >= ORDERS.length)
	{
		return parse_value_expression(stream);
	}

	let lhs = parse_operation(stream, order + 1);

	if (lhs instanceof Error)
	{
		return lhs;
	}

	const orders_order = ORDERS[order];

	if (orders_order === undefined)
	{
		throw new Error();
	}

	while (orders_order.includes(stream.peek().kind))
	{
		const operation_type = stream.next();
		const rhs = parse_operation(stream, order + 1);

		if (rhs instanceof Error)
		{
			return rhs;
		}

		const expression_kind = operation_type_to_expression_kind(operation_type.kind);

		lhs = {
			kind: expression_kind,
			token: operation_type,
			lhs: lhs,
			rhs: rhs,
		};
	}

	return lhs;
}

function parse_expression(stream: TokenStream): ExpressionInterface | Error
{
	if (stream.peek().kind === TokenKindEnum.BitXOrNot)
	{
		return parse_unary_operator(stream);
	}

	return parse_operation(stream, 0);
}

function parse_local_statement(local: TokenInterface, values: Array<ExpressionInterface>): StatementInterface | Error
{
	const names: Array<TokenInterface> = [];

	for (const expression of values)
	{
		const value = expression.value;

		if (value === undefined || value.kind !== ValueKindEnum.Variable)
		{
			return error(expression.token, "Invalid local name");
		}

		names.push(value.token);
	}

	return {
		kind: StatementKindEnum.Local,
		local: {
			token: local,
			names: names,
		},
	};
}

function parse_assign_or_expression(stream: TokenStream): StatementInterface | Error
{
	const local = expect(stream, TokenKindEnum.Local);
	const lhs: Array<ExpressionInterface> = [];

	while (lhs.length === 0 || consume(stream, TokenKindEnum.Comma))
	{
		const lvalue = parse_expression(stream);

		if (lvalue instanceof Error)
		{
			return lvalue;
		}

		lhs.push(lvalue);
	}

	const assign = expect(stream, TokenKindEnum.Assign);

	if (assign instanceof Error)
	{
		if (local instanceof Error)
		{
			// @TODO: Investigate as lhs[0] seems to always be undefined
			return { kind: StatementKindEnum.Expression, expression: lhs[0] };
		}

		return parse_local_statement(local, lhs);
	}

	const rhs: Array<ExpressionInterface> = [];

	while (rhs.length === 0 || consume(stream, TokenKindEnum.Comma))
	{
		const rvalue = parse_expression(stream);

		if (rvalue instanceof Error)
		{
			return rvalue;
		}

		rhs.push(rvalue);
	}

	return {
		kind: StatementKindEnum.Assignment,
		assignment: {
			local: !(local instanceof Error),
			lhs: lhs.reverse(),
			rhs: rhs,
			token: assign,
		},
	};
}

function parse_return(stream: TokenStream): StatementInterface | Error
{
	const ret = expect(stream, TokenKindEnum.Return);

	if (ret instanceof Error)
	{
		return ret;
	}

	const values: Array<ExpressionInterface> = [];

	while (values.length === 0 || consume(stream, TokenKindEnum.Comma))
	{
		const value = parse_expression(stream);

		if (value instanceof Error)
		{
			if (values.length > 0)
			{
				return value;
			}

			break;
		}

		values.push(value);
	}

	if (values.length === 0)
	{
		values.push({
			kind: ExpressionKind.Value,
			token: ret,
			value: {
				kind: ValueKindEnum.NilLiteral,
				token: ret,
			},
		});
	}

	return {
		kind: StatementKindEnum.Return,
		return: {
			values: values,
			token: ret,
		},
	};
}

function parse_break(stream: TokenStream): StatementInterface | Error
{
	const break_token = expect(stream, TokenKindEnum.Break);

	if (break_token instanceof Error)
	{
		return break_token;
	}

	return {
		kind: StatementKindEnum.Break,
	};
}

function parse_if(stream: TokenStream): StatementInterface | Error
{
	const if_token = expect(stream, TokenKindEnum.If);

	if (if_token instanceof Error)
	{
		return if_token;
	}

	const condition = parse_expression(stream);

	if (condition instanceof Error)
	{
		return condition;
	}

	const then = expect(stream, TokenKindEnum.Then);

	if (then instanceof Error)
	{
		return then;
	}

	const body = parse(stream, TokenKindEnum.Else, TokenKindEnum.ElseIf, TokenKindEnum.End);

	if (body instanceof Error)
	{
		return body;
	}

	const else_if_bodies: Array<ElseIfBlockInterface> = [];
	let else_body: ChunkInterface | undefined = undefined;

	while (consume(stream, TokenKindEnum.ElseIf))
	{
		const condition = parse_expression(stream);

		if (condition instanceof Error)
		{
			return condition;
		}

		const then = expect(stream, TokenKindEnum.Then);

		if (then instanceof Error)
		{
			return then;
		}

		const chunk = parse(stream, TokenKindEnum.End, TokenKindEnum.ElseIf, TokenKindEnum.Else);

		if (chunk instanceof Error)
		{
			return chunk;
		}

		else_if_bodies.push({
			body: chunk,
			condition: condition,
			token: then,
		});
	}

	if (consume(stream, TokenKindEnum.Else))
	{
		const chunk = parse(stream, TokenKindEnum.End);

		if (chunk instanceof Error)
		{
			return chunk;
		}

		else_body = chunk;
	}

	const end = expect(stream, TokenKindEnum.End);

	if (end instanceof Error)
	{
		return end;
	}

	return {
		kind: StatementKindEnum.If,
		if: {
			condition: condition,
			body: body,
			else_if_bodies: else_if_bodies,
			else_body: else_body,
			token: if_token,
		},
	};
}

function parse_while(stream: TokenStream): StatementInterface | Error
{
	const while_token = expect(stream, TokenKindEnum.While);

	if (while_token instanceof Error)
	{
		return while_token;
	}

	const condition = parse_expression(stream);

	if (condition instanceof Error)
	{
		return condition;
	}

	const do_token = expect(stream, TokenKindEnum.Do);

	if (do_token instanceof Error)
	{
		return do_token;
	}

	const body = parse(stream, TokenKindEnum.End);

	if (body instanceof Error)
	{
		return body;
	}

	consume(stream, TokenKindEnum.End);

	return {
		kind: StatementKindEnum.While,
		while: {
			condition: condition,
			body: body,
			token: while_token,
		},
	};
}

function parse_numeric_for(index: TokenInterface, stream: TokenStream): StatementInterface | Error
{
	const start = parse_expression(stream);

	if (start instanceof Error)
	{
		return start;
	}

	const comma = expect(stream, TokenKindEnum.Comma);

	if (comma instanceof Error)
	{
		return comma;
	}

	const end = parse_expression(stream);

	if (end instanceof Error)
	{
		return end;
	}

	let step: ExpressionInterface | undefined = undefined;

	if (consume(stream, TokenKindEnum.Comma))
	{
		const expression = parse_expression(stream);

		if (expression instanceof Error)
		{
			return expression;
		}

		step = expression;
	}

	const do_token = expect(stream, TokenKindEnum.Do);

	if (do_token instanceof Error)
	{
		return do_token;
	}

	const body = parse(stream, TokenKindEnum.End);

	if (body instanceof Error)
	{
		return body;
	}

	consume(stream, TokenKindEnum.End);

	return {
		kind: StatementKindEnum.NumericFor,
		numeric_for: {
			index: index,
			start: start,
			end: end,
			step: step,
			body: body,
		},
	};
}

function parse_for(stream: TokenStream): StatementInterface | Error
{
	const for_token = expect(stream, TokenKindEnum.For);

	if (for_token instanceof Error)
	{
		return for_token;
	}

	const items: Array<TokenInterface> = [];

	while (items.length === 0 || consume(stream, TokenKindEnum.Comma))
	{
		const item = expect(stream, TokenKindEnum.Identifier);

		if (item instanceof Error)
		{
			return item;
		}

		items.push(item);
	}

	if (consume(stream, TokenKindEnum.Assign))
	{
		const token = items[0];

		if (token === undefined)
		{
			throw new Error();
		}

		return parse_numeric_for(token, stream);
	}

	const in_token = expect(stream, TokenKindEnum.In);

	if (in_token instanceof Error)
	{
		return in_token;
	}

	const iterator = parse_expression(stream);

	if (iterator instanceof Error)
	{
		return iterator;
	}

	const do_token = expect(stream, TokenKindEnum.Do);

	if (do_token instanceof Error)
	{
		return do_token;
	}

	const body = parse(stream, TokenKindEnum.End);

	if (body instanceof Error)
	{
		return body;
	}

	consume(stream, TokenKindEnum.End);

	return {
		kind: StatementKindEnum.For,
		for: {
			items: items,
			iterator: iterator,
			body: body,
			token: for_token,
		},
	};
}

function parse_repeat(stream: TokenStream): StatementInterface | Error
{
	const repeat_token = expect(stream, TokenKindEnum.Repeat);

	if (repeat_token instanceof Error)
	{
		return repeat_token;
	}

	const body = parse(stream, TokenKindEnum.Until);

	if (body instanceof Error)
	{
		return body;
	}

	const until_token = expect(stream, TokenKindEnum.Until);

	if (until_token instanceof Error)
	{
		return until_token;
	}

	const condition = parse_expression(stream);

	if (condition instanceof Error)
	{
		return condition;
	}

	return {
		kind: StatementKindEnum.Repeat,
		repeat: {
			body: body,
			condition: condition,
			token: repeat_token,
		},
	};
}

function parse_do(stream: TokenStream): StatementInterface | Error
{
	const do_token = expect(stream, TokenKindEnum.Do);

	if (do_token instanceof Error)
	{
		return do_token;
	}

	const body = parse(stream, TokenKindEnum.End);

	if (body instanceof Error)
	{
		return body;
	}

	const end_token = expect(stream, TokenKindEnum.End);

	if (end_token instanceof Error)
	{
		return end_token;
	}

	return {
		kind: StatementKindEnum.Do,
		do: {
			body: body,
			token: do_token,
		},
	};
}

function parse_function_params(stream: TokenStream): Array<TokenInterface> | Error
{
	const open_brace = expect(stream, TokenKindEnum.OpenBrace);

	if (open_brace instanceof Error)
	{
		return open_brace;
	}

	const params: Array<TokenInterface> = [];

	while (stream.peek().kind !== TokenKindEnum.CloseBrace)
	{
		const param = expect(stream, TokenKindEnum.Identifier);

		if (param instanceof Error)
		{
			break;
		}

		params.push(param);

		if (!consume(stream, TokenKindEnum.Comma))
		{
			break;
		}
	}

	const close_brace = expect(stream, TokenKindEnum.CloseBrace);

	if (close_brace instanceof Error)
	{
		return close_brace;
	}

	return params;
}

function parse_function_value(function_token: TokenInterface, stream: TokenStream): ValueInterface | Error
{
	const params = parse_function_params(stream);

	if (params instanceof Error)
	{
		return params;
	}

	const body = parse(stream, TokenKindEnum.End);

	if (body instanceof Error)
	{
		return body;
	}

	consume(stream, TokenKindEnum.End);

	return {
		kind: ValueKindEnum.FunctionLike,
		token: function_token,
		function: {
			parameters: params,
			body: body,
		},
	};
}

function parse_local_function(table_name: TokenInterface, stream: TokenStream): StatementInterface | Error
{
	const local_name = expect(stream, TokenKindEnum.Identifier);

	if (local_name instanceof Error)
	{
		return local_name;
	}

	const function_value = parse_function_value(local_name, stream);

	if (function_value instanceof Error)
	{
		return function_value;
	}

	return {
		kind: StatementKindEnum.Assignment,
		assignment: {
			token: table_name,
			local: false,
			lhs: [{
				kind: ExpressionKind.Index,
				token: table_name,
				expression: {
					kind: ExpressionKind.Value,
					token: table_name,
					value: {
						kind: ValueKindEnum.Variable,
						token: table_name,
						identifier: table_name.data,
					},
				},
				index: {
					kind: ExpressionKind.Value,
					token: local_name,
					value: {
						kind: ValueKindEnum.StringLiteral,
						token: local_name,
						string: local_name.data,
					},
				},
			}],
			rhs: [{
				kind: ExpressionKind.Value,
				token: local_name,
				value: function_value,
			}],
		},
	};
}

function parse_function(stream: TokenStream): StatementInterface | Error
{
	const function_token = expect(stream, TokenKindEnum.FunctionLike);

	if (function_token instanceof Error)
	{
		return function_token;
	}

	const name = expect(stream, TokenKindEnum.Identifier);

	if (name instanceof Error)
	{
		return name;
	}

	if (consume(stream, TokenKindEnum.Dot))
	{
		return parse_local_function(name, stream);
	}

	const function_value = parse_function_value(name, stream);

	if (function_value instanceof Error)
	{
		return function_value;
	}

	return {
		kind: StatementKindEnum.Assignment,
		assignment: {
			token: name,
			local: false,
			lhs: [{
				kind: ExpressionKind.Value,
				token: name,
				value: {
					kind: ValueKindEnum.Variable,
					token: name,
					identifier: name.data,
				},
			}],
			rhs: [{
				kind: ExpressionKind.Value,
				token: name,
				value: function_value,
			}],
		},
	};
}

export function parse_statement(stream: TokenStream, end_tokens: Array<TokenKindEnum>): StatementInterface | Error | undefined
{
	const token = stream.peek();

	// eslint-disable-next-line @ts/switch-exhaustiveness-check
	switch (token.kind)
	{
		case TokenKindEnum.Identifier:
		case TokenKindEnum.NilLiteral:
		case TokenKindEnum.StringLiteral:
		case TokenKindEnum.NumberLiteral:
		case TokenKindEnum.BooleanLiteral:
		case TokenKindEnum.SquiglyOpen:
		case TokenKindEnum.Local:
			return parse_assign_or_expression(stream);
		case TokenKindEnum.Return:
			return parse_return(stream);
		case TokenKindEnum.Break:
			return parse_break(stream);
		case TokenKindEnum.If:
			return parse_if(stream);
		case TokenKindEnum.While:
			return parse_while(stream);
		case TokenKindEnum.For:
			return parse_for(stream);
		case TokenKindEnum.Repeat:
			return parse_repeat(stream);
		case TokenKindEnum.Do:
			return parse_do(stream);
		case TokenKindEnum.FunctionLike:
			return parse_function(stream);
		case TokenKindEnum.Semicolon:
			stream.next();

			return { kind: StatementKindEnum.Empty };

		default:
		{
			if (end_tokens.includes(token.kind))
			{
				return undefined;
			}

			const first_end_token = end_tokens[0];

			if (first_end_token === undefined)
			{
				throw new Error();
			}

			return error(token, `Missing '${token_kind_to_string(first_end_token)}', `
								+ `got '${token_kind_to_string(token.kind)}' instead`);
		}
	}
}
