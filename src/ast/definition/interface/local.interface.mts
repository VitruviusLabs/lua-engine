import type { Token } from "../../../lexer.mjs";

interface LocalInterface
{
	names: Array<Token>;
	token: Token;
}

export type { LocalInterface };
