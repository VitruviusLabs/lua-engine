import type { Token } from "../../../lexer.mjs";
import type { ChunkInterface } from "./chunk.interface.mjs";

interface LuaFunctionInterface
{
	parameters: Array<Token>;
	body: ChunkInterface;
}

export type { LuaFunctionInterface };
