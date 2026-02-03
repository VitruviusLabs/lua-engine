import { StatementKind } from "../../ast/definition/enum/statement-kind.enum.mjs";
import type { StatementInterface } from "../../ast/definition/interface/statement.interface.mjs";
import type { TokenStream } from "../../lexer.mjs";
import { TokenKind, type TokenKindEnum } from "../../lexer/definition/enum/token-kind.enum.mjs";
import { token_kind_to_string } from "../../lexer/token-kind-to-string/token-kind-to-string.mjs";
import { parse_assign_or_expression, parse_do, parse_for, parse_function, parse_if, parse_repeat, parse_return, parse_while } from "../../parser.mjs";
import { to_error } from "../error/to-error.mjs";
import { parse_break } from "../parse_break/parse-break.mjs";

function parse_statement(stream: TokenStream, end_tokens: Array<TokenKindEnum>): StatementInterface | undefined
{
	const token = stream.peek();

	// eslint-disable-next-line @ts/switch-exhaustiveness-check
	switch (token.kind)
	{
		case TokenKind.Identifier:
		case TokenKind.NilLiteral:
		case TokenKind.StringLiteral:
		case TokenKind.NumberLiteral:
		case TokenKind.BooleanLiteral:
		case TokenKind.SquiglyOpen:
		case TokenKind.Local:
			return parse_assign_or_expression(stream);
		case TokenKind.Return:
			return parse_return(stream);
		case TokenKind.Break:
			return parse_break(stream);
		case TokenKind.If:
			return parse_if(stream);
		case TokenKind.While:
			return parse_while(stream);
		case TokenKind.For:
			return parse_for(stream);
		case TokenKind.Repeat:
			return parse_repeat(stream);
		case TokenKind.Do:
			return parse_do(stream);
		case TokenKind.FunctionLike:
			return parse_function(stream);
		case TokenKind.Semicolon:
			stream.next();

			return { kind: StatementKind.Empty };

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

			return to_error(
				token,
				`Missing '${token_kind_to_string(first_end_token)}', got '${token_kind_to_string(token.kind)}' instead`
			);
		}
	}
}

export { parse_statement };
