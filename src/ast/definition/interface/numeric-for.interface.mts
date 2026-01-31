import type { Token } from "../../../lexer.mjs";
import type { ChunkInterface } from "./chunk.interface.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";

interface NumericForInterface
{
	index: Token;
	start: ExpressionInterface;
	end: ExpressionInterface;
	step: ExpressionInterface | undefined;
	body: ChunkInterface;
}

export type { NumericForInterface };
