import type { TokenInterface } from "../../../lexer/definition/interface/token.interface.mjs";
import type { ChunkInterface } from "./chunk.interface.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";

interface NumericForInterface
{
	index: TokenInterface;
	start: ExpressionInterface;
	end: ExpressionInterface;
	step: ExpressionInterface | undefined;
	body: ChunkInterface;
}

export type { NumericForInterface };
