import type { TokenInterface } from "../../../lexer/definition/interface/token.interface.mjs";
import type { ChunkInterface } from "./chunk.interface.mjs";

interface DoInterface
{
	body: ChunkInterface;
	token: TokenInterface;
}

export type { DoInterface };
