import type { TokenStream } from "../../lexer.mjs";
import type { TokenKindEnum } from "../../lexer/definition/enum/token-kind.enum.mjs";

function consume(stream: TokenStream, kind: TokenKindEnum): boolean
{
	const token = stream.peek();

	if (token.kind !== kind)
	{
		return false;
	}

	stream.next();

	return true;
}

export { consume };
