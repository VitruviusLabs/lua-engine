import type { Token } from "../../../lexer.mjs";
import type { ChunkInterface } from "./chunk.interface.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";

interface ElseIfBlockInterface
{
	body: ChunkInterface;
	condition: ExpressionInterface;
	token: Token;
}

export type { ElseIfBlockInterface };
