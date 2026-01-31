import type { Token } from "../../../lexer.mjs";
import type { ChunkInterface } from "./chunk.interface.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";

interface ForInterface
{
	items: Array<Token>;
	iterator: ExpressionInterface;
	body: ChunkInterface;
	token: Token;
}

export type { ForInterface };
