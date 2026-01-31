import type { TokenInterface } from "../../../lexer/definition/interface/token.interface.mjs";
import type { ChunkInterface } from "./chunk.interface.mjs";

interface LuaFunctionInterface
{
	parameters: Array<TokenInterface>;
	body: ChunkInterface;
}

export type { LuaFunctionInterface };
