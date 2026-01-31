import type { TokenStream } from "../../lexer.mjs";
import { TokenKindEnum } from "../../lexer/definition/enum/token-kind.enum.mjs";
import type { TokenInterface } from "../../lexer/definition/interface/token.interface.mjs";
import { consume } from "../consume/consume.mjs";
import { expect } from "../expect/expect.mjs";

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

export { parse_function_params };
