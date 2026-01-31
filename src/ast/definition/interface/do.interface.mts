import type { Token } from "../../../lexer.mjs";
import type { ChunkInterface } from "./chunk.interface.mjs";

interface DoInterface
{
	body: ChunkInterface;
	token: Token;
}

export type { DoInterface };
