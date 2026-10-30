import type { TokenStream } from "../../../lexer.mjs";
import type { TokenInterface } from "../../../lexer/definition/interface/token.interface.mjs";

interface LocalInterface
{
	names: Array<TokenInterface | TokenStream>;
	token: TokenInterface;
}

export type { LocalInterface };
