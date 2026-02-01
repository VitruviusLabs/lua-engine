import type { TokenStream } from "../../lexer.mjs";
import { TokenKind } from "../../lexer/definition/enum/token-kind.enum.mjs";
import type { TokenInterface } from "../../lexer/definition/interface/token.interface.mjs";
import { consume } from "../consume/consume.mjs";
import { expect } from "../expect/expect.mjs";

function parse_function_params(stream: TokenStream): Array<TokenInterface> | Error
{
	const open_brace = expect(stream, TokenKind.OpenBrace);

	if (open_brace instanceof Error)
	{
		return open_brace;
	}

	const params: Array<TokenInterface> = [];

	while (stream.peek().kind !== TokenKind.CloseBrace)
	{
		const param = expect(stream, TokenKind.Identifier);

		if (param instanceof Error)
		{
			break;
		}

		params.push(param);

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

	return params;
}

export { parse_function_params };
