import type { TokenStream } from "../../lexer.mjs";
import { TokenKind } from "../../lexer/definition/enum/token-kind.enum.mjs";
import type { TokenInterface } from "../../lexer/definition/interface/token.interface.mjs";
import { consume } from "../consume/consume.mjs";
import { expect } from "../expect/expect.mjs";

function parse_function_params(stream: TokenStream): Array<TokenInterface>
{
	expect(stream, TokenKind.OpenBrace);

	const params: Array<TokenInterface> = [];

	while (stream.peek().kind !== TokenKind.CloseBrace)
	{
		const param = expect(stream, TokenKind.Identifier);

		params.push(param);

		if (!consume(stream, TokenKind.Comma))
		{
			break;
		}
	}

	expect(stream, TokenKind.CloseBrace);

	return params;
}

export { parse_function_params };
