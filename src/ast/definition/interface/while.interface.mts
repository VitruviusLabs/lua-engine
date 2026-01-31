import type { Token } from "../../../lexer.mjs";
import type { ChunkInterface } from "./chunk.interface.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";

interface WhileInterface
{
	condition: ExpressionInterface;
	body: ChunkInterface;
	token: Token;
}

export type { WhileInterface };
