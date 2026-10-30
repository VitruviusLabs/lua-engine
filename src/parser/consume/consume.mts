import type { TokenStream } from "../../lexer.mjs";
import type { TokenKindEnum } from "../../lexer/definition/enum/token-kind.enum.mjs";
import type { TokenInterface } from "../../lexer/definition/interface/token.interface.mjs";

function consume(stream: TokenStream, kind: TokenKindEnum): boolean
{
	const token: TokenInterface = stream.peek();

	if (token.kind !== kind)
	{
		return false;
	}

	stream.next();

	return true;
}

export { consume };
