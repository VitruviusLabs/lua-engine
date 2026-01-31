import type { Chunk } from "../../../ast.mjs";
import type { Token } from "../../../lexer.mjs";

interface LuaFunctionInterface
{
	parameters: Array<Token>;
	body: Chunk;
}

export type { LuaFunctionInterface };
