import { isEnumValue } from "@vitruvius-labs/ts-predicate";
import { ExpressionKind } from "./ast/definition/enum/expression-kind.enum.mjs";
import { StatementKind } from "./ast/definition/enum/statement-kind.enum.mjs";
import { ValueKind } from "./ast/definition/enum/value-kind.enum.mjs";
import type { ChunkInterface } from "./ast/definition/interface/chunk.interface.mjs";
import type { ElseIfBlockInterface } from "./ast/definition/interface/else-if-block.interface.mjs";
import type { ExpressionInterface } from "./ast/definition/interface/expression.interface.mjs";
import type { StatementInterface } from "./ast/definition/interface/statement.interface.mjs";
import type { ValueInterface } from "./ast/definition/interface/value.interface.mjs";
import type { TokenStream } from "./lexer.mjs";
import { TokenKind } from "./lexer/definition/enum/token-kind.enum.mjs";
import type { TokenInterface } from "./lexer/definition/interface/token.interface.mjs";
import { token_kind_to_string } from "./lexer/token-kind-to-string/token-kind-to-string.mjs";
import { consume } from "./parser/consume/consume.mjs";
import { to_error } from "./parser/error/to-error.mjs";
import { expect } from "./parser/expect/expect.mjs";
import { operation_type_to_expression_kind } from "./parser/operation-type-to-expression-kind/operation-type-to-expression-kind.mjs";
import { parse_function_params } from "./parser/parse-function-params/parse-function-params.mjs";
import { parse_local_statement } from "./parser/parse-local-statement/parse-local-statement.mjs";
import { parse } from "./parser/parse/parse.mjs";
import { unary_type_to_expression_kind } from "./parser/unary-type-to-expression-kind/unary-type-to-expression-kind.mjs";
import { getDebug } from "./lexer/utility/get-debug.mjs";
import { isUnaryOperatorToken } from "./parser/is-unary-operator/is-unary-operator.mjs";
import { get_orders } from "./parser/get-orders/get-orders.mjs";

function parse_table_key(stream: TokenStream): ExpressionInterface | Error
{
	if (consume(stream, TokenKind.OpenSquare))
	{
		const element = parse_expression(stream);

		if (element instanceof Error)
		{
			return element;
		}

		const close_square = expect(stream, TokenKind.CloseSquare);

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

	if (value.kind === ValueKind.Variable)
	{
		value.kind = ValueKind.StringLiteral;
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
	const squigly_open = expect(stream, TokenKind.SquiglyOpen);

	if (squigly_open instanceof Error)
	{
		return squigly_open;
	}

	const elements: Map<ExpressionInterface, ExpressionInterface> = new Map();
	let current_numeric_key = 1;

	while (stream.peek().kind !== TokenKind.SquiglyClose)
	{
		const element: ExpressionInterface | Error = parse_table_key(stream);

		if (element instanceof Error)
		{
			return element;
		}

		const is_assign: boolean = consume(stream, TokenKind.Assign);

		if (is_assign)
		{
			const value = parse_expression(stream);

			if (value instanceof Error)
			{
				return value;
			}

			elements.set(element, value);
		}

		if (!is_assign)
		{
			const key_token = {
				kind: TokenKind.NumberLiteral,
				data: current_numeric_key.toString(),
				debug: getDebug(stream.peek()),
			};

			const key = {
				kind: ExpressionKind.Value,
				token: key_token,
				value: {
					kind: ValueKind.NumberLiteral,
					token: key_token,
					number: current_numeric_key,
				},
			};

			current_numeric_key = current_numeric_key + 1;
			elements.set(key, element);
		}

		if (!consume(stream, TokenKind.Comma))
		{
			break;
		}
	}

	const close_squigly = expect(stream, TokenKind.SquiglyClose);

	if (close_squigly instanceof Error)
	{
		return close_squigly;
	}

	return {
		kind: ValueKind.TableLiteral,
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
		case TokenKind.NumberLiteral:
			return { kind: ValueKind.NumberLiteral, token: stream.next(), number: parseFloat(token.data) };
		case TokenKind.BooleanLiteral:
			return { kind: ValueKind.BooleanLiteral, token: stream.next(), boolean: token.data === "true" };
		case TokenKind.StringLiteral:
			return { kind: ValueKind.StringLiteral, token: stream.next(), string: token.data };
		case TokenKind.NilLiteral:
			return { kind: ValueKind.NilLiteral, token: stream.next() };
		case TokenKind.Identifier:
			return { kind: ValueKind.Variable, token: stream.next(), identifier: token.data };

		case TokenKind.SquiglyOpen:
			return parse_table(stream);
		case TokenKind.FunctionLike:
			return parse_function_value(stream.next(), stream);

		default:
			return to_error(token, `Expected value, got ${token_kind_to_string(token.kind)} instead`);
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
	if (consume(stream, TokenKind.OpenBrace))
	{
		const sub_expression = parse_expression(stream);

		if (sub_expression instanceof Error)
		{
			return sub_expression;
		}

		const close_brace = expect(stream, TokenKind.CloseBrace);

		if (close_brace instanceof Error)
		{
			return close_brace;
		}

		return sub_expression;
	}

	if (isUnaryOperatorToken(stream.peek().kind))
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

function parse_call(callable: ExpressionInterface, stream: TokenStream): ExpressionInterface | Error
{
	const open_brace: TokenInterface = stream.next();
	const args: Array<ExpressionInterface> = [];

	while (stream.peek().kind !== TokenKind.CloseBrace)
	{
		const argument = parse_expression(stream);

		if (argument instanceof Error)
		{
			break;
		}

		args.push(argument);

		if (!consume(stream, TokenKind.Comma))
		{
			break;
		}
	}

	const close_brace = expect(stream, TokenKind.CloseBrace);

	if (close_brace instanceof Error)
	{
		return close_brace;
	}

	return parse_access_expression({
		kind: ExpressionKind.Call,
		token: open_brace,
		expression: callable,
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

	const close_square = expect(stream, TokenKind.CloseSquare);

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
	const index = expect(stream, TokenKind.Identifier);

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
				kind: ValueKind.StringLiteral,
				token: index,
				string: index.data,
			},
		},
	}, stream);
}

function parse_single_argument_call(callable: ExpressionInterface, stream: TokenStream): ExpressionInterface | Error
{
	const argument = parse_expression(stream);

	if (argument instanceof Error)
	{
		return argument;
	}

	return {
		kind: ExpressionKind.Call,
		token: callable.token,
		expression: callable,
		arguments: [argument],
	};
}

function parse_access_expression(expression: ExpressionInterface, stream: TokenStream): ExpressionInterface | Error
{
	// eslint-disable-next-line @ts/switch-exhaustiveness-check
	switch (stream.peek().kind)
	{
		case TokenKind.OpenBrace:
			return parse_call(expression, stream);

		case TokenKind.OpenSquare:
			return parse_index(expression, stream);

		case TokenKind.Dot:
			return parse_dot(expression, stream);

		case TokenKind.SquiglyOpen:
		case TokenKind.StringLiteral:
			return parse_single_argument_call(expression, stream);
	}

	return expression;
}

function parse_operation(
	stream: TokenStream,
	order: number
): ExpressionInterface | Error
{
	if (order >= get_orders().length)
	{
		return parse_value_expression(stream);
	}

	let lhs = parse_operation(stream, order + 1);

	if (lhs instanceof Error)
	{
		return lhs;
	}

	const orders_order = get_orders()[order];

	if (orders_order === undefined)
	{
		throw new Error();
	}

	while (isEnumValue(stream.peek().kind, orders_order))
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
	if (stream.peek().kind === TokenKind.BitXOrNot)
	{
		return parse_unary_operator(stream);
	}

	return parse_operation(stream, 0);
}

function parse_assign_or_expression(stream: TokenStream): StatementInterface | Error
{
	const local = expect(stream, TokenKind.Local);
	const lhs: Array<ExpressionInterface> = [];

	while (lhs.length === 0 || consume(stream, TokenKind.Comma))
	{
		const lvalue = parse_expression(stream);

		if (lvalue instanceof Error)
		{
			return lvalue;
		}

		lhs.push(lvalue);
	}

	const assign = expect(stream, TokenKind.Assign);

	if (assign instanceof Error)
	{
		if (local instanceof Error)
		{
			// @TODO: Investigate as lhs[0] seems to always be undefined
			return { kind: StatementKind.Expression, expression: lhs[0] };
		}

		return parse_local_statement(local, lhs);
	}

	const rhs: Array<ExpressionInterface> = [];

	while (rhs.length === 0 || consume(stream, TokenKind.Comma))
	{
		const rvalue = parse_expression(stream);

		if (rvalue instanceof Error)
		{
			return rvalue;
		}

		rhs.push(rvalue);
	}

	return {
		kind: StatementKind.Assignment,
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
	const ret = expect(stream, TokenKind.Return);

	if (ret instanceof Error)
	{
		return ret;
	}

	const values: Array<ExpressionInterface> = [];

	while (values.length === 0 || consume(stream, TokenKind.Comma))
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
				kind: ValueKind.NilLiteral,
				token: ret,
			},
		});
	}

	return {
		kind: StatementKind.Return,
		return: {
			values: values,
			token: ret,
		},
	};
}

function parse_if(stream: TokenStream): StatementInterface | Error
{
	const if_token = expect(stream, TokenKind.If);

	if (if_token instanceof Error)
	{
		return if_token;
	}

	const condition = parse_expression(stream);

	if (condition instanceof Error)
	{
		return condition;
	}

	const then = expect(stream, TokenKind.Then);

	if (then instanceof Error)
	{
		return then;
	}

	const body = parse(stream, TokenKind.Else, TokenKind.ElseIf, TokenKind.End);

	if (body instanceof Error)
	{
		return body;
	}

	const else_if_bodies: Array<ElseIfBlockInterface> = [];
	let else_body: ChunkInterface | undefined = undefined;

	while (consume(stream, TokenKind.ElseIf))
	{
		const condition = parse_expression(stream);

		if (condition instanceof Error)
		{
			return condition;
		}

		const then = expect(stream, TokenKind.Then);

		if (then instanceof Error)
		{
			return then;
		}

		const chunk = parse(stream, TokenKind.End, TokenKind.ElseIf, TokenKind.Else);

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

	if (consume(stream, TokenKind.Else))
	{
		const chunk = parse(stream, TokenKind.End);

		if (chunk instanceof Error)
		{
			return chunk;
		}

		else_body = chunk;
	}

	const end = expect(stream, TokenKind.End);

	if (end instanceof Error)
	{
		return end;
	}

	return {
		kind: StatementKind.If,
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
	const while_token = expect(stream, TokenKind.While);

	if (while_token instanceof Error)
	{
		return while_token;
	}

	const condition = parse_expression(stream);

	if (condition instanceof Error)
	{
		return condition;
	}

	const do_token = expect(stream, TokenKind.Do);

	if (do_token instanceof Error)
	{
		return do_token;
	}

	const body = parse(stream, TokenKind.End);

	if (body instanceof Error)
	{
		return body;
	}

	consume(stream, TokenKind.End);

	return {
		kind: StatementKind.While,
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

	const comma = expect(stream, TokenKind.Comma);

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

	if (consume(stream, TokenKind.Comma))
	{
		const expression = parse_expression(stream);

		if (expression instanceof Error)
		{
			return expression;
		}

		step = expression;
	}

	const do_token = expect(stream, TokenKind.Do);

	if (do_token instanceof Error)
	{
		return do_token;
	}

	const body = parse(stream, TokenKind.End);

	if (body instanceof Error)
	{
		return body;
	}

	consume(stream, TokenKind.End);

	return {
		kind: StatementKind.NumericFor,
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
	const for_token = expect(stream, TokenKind.For);

	if (for_token instanceof Error)
	{
		return for_token;
	}

	const items: Array<TokenInterface> = [];

	while (items.length === 0 || consume(stream, TokenKind.Comma))
	{
		const item = expect(stream, TokenKind.Identifier);

		if (item instanceof Error)
		{
			return item;
		}

		items.push(item);
	}

	if (consume(stream, TokenKind.Assign))
	{
		const token = items[0];

		if (token === undefined)
		{
			throw new Error();
		}

		return parse_numeric_for(token, stream);
	}

	const in_token = expect(stream, TokenKind.In);

	if (in_token instanceof Error)
	{
		return in_token;
	}

	const iterator = parse_expression(stream);

	if (iterator instanceof Error)
	{
		return iterator;
	}

	const do_token = expect(stream, TokenKind.Do);

	if (do_token instanceof Error)
	{
		return do_token;
	}

	const body = parse(stream, TokenKind.End);

	if (body instanceof Error)
	{
		return body;
	}

	consume(stream, TokenKind.End);

	return {
		kind: StatementKind.For,
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
	const repeat_token = expect(stream, TokenKind.Repeat);

	if (repeat_token instanceof Error)
	{
		return repeat_token;
	}

	const body = parse(stream, TokenKind.Until);

	if (body instanceof Error)
	{
		return body;
	}

	const until_token = expect(stream, TokenKind.Until);

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
		kind: StatementKind.Repeat,
		repeat: {
			body: body,
			condition: condition,
			token: repeat_token,
		},
	};
}

function parse_do(stream: TokenStream): StatementInterface | Error
{
	const do_token = expect(stream, TokenKind.Do);

	if (do_token instanceof Error)
	{
		return do_token;
	}

	const body = parse(stream, TokenKind.End);

	if (body instanceof Error)
	{
		return body;
	}

	const end_token = expect(stream, TokenKind.End);

	if (end_token instanceof Error)
	{
		return end_token;
	}

	return {
		kind: StatementKind.Do,
		do: {
			body: body,
			token: do_token,
		},
	};
}

function parse_function_value(function_token: TokenInterface, stream: TokenStream): ValueInterface | Error
{
	const params = parse_function_params(stream);

	if (params instanceof Error)
	{
		return params;
	}

	const body = parse(stream, TokenKind.End);

	if (body instanceof Error)
	{
		return body;
	}

	consume(stream, TokenKind.End);

	return {
		kind: ValueKind.FunctionLike,
		token: function_token,
		function: {
			parameters: params,
			body: body,
		},
	};
}

function parse_local_function(table_name: TokenInterface, stream: TokenStream): StatementInterface | Error
{
	const local_name = expect(stream, TokenKind.Identifier);

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
		kind: StatementKind.Assignment,
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
						kind: ValueKind.Variable,
						token: table_name,
						identifier: table_name.data,
					},
				},
				index: {
					kind: ExpressionKind.Value,
					token: local_name,
					value: {
						kind: ValueKind.StringLiteral,
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
	const function_token = expect(stream, TokenKind.FunctionLike);

	if (function_token instanceof Error)
	{
		return function_token;
	}

	const name = expect(stream, TokenKind.Identifier);

	if (name instanceof Error)
	{
		return name;
	}

	if (consume(stream, TokenKind.Dot))
	{
		return parse_local_function(name, stream);
	}

	const function_value = parse_function_value(name, stream);

	if (function_value instanceof Error)
	{
		return function_value;
	}

	return {
		kind: StatementKind.Assignment,
		assignment: {
			token: name,
			local: false,
			lhs: [{
				kind: ExpressionKind.Value,
				token: name,
				value: {
					kind: ValueKind.Variable,
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

export {
	parse,
	parse_assign_or_expression,
	parse_return,
	parse_if,
	parse_while,
	parse_for,
	parse_repeat,
	parse_do,
	parse_function,
};
