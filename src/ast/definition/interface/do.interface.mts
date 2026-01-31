import type { Chunk } from "../../../ast.mjs";
import type { Token } from "../../../lexer.mjs";

interface DoInterface
{
	body: Chunk;
	token: Token;
}

export type { DoInterface };
