import type { TokenStream } from "../../lexer.mjs";
import type { TokenKindEnum } from "../../lexer/definition/enum/token-kind.enum.mjs";
import type { TokenInterface } from "../../lexer/definition/interface/token.interface.mjs";
import { token_kind_to_string } from "../../lexer/token-kind-to-string/token-kind-to-string.mjs";
import { to_error } from "../error/to-error.mjs";

function expect(stream: TokenStream, kind: TokenKindEnum): TokenInterface | Error
{
	const token = stream.peek();

	if (token.kind !== kind)
	{
		return to_error(
			token,
			`expected '${token_kind_to_string(kind)}', got '${token_kind_to_string(token.kind)}' instead`
		);
	}

	return stream.next();
}

export { expect };
