import type { TokenInterface } from "../../../lexer/definition/interface/token.interface.mjs";

interface LocalInterface
{
	names: Array<TokenInterface>;
	token: TokenInterface;
}

export type { LocalInterface };
