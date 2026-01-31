import type { Chunk } from "../../../ast.mjs";
import type { Token } from "../../../lexer.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";

interface NumericForInterface
{
	index: Token;
	start: ExpressionInterface;
	end: ExpressionInterface;
	step: ExpressionInterface | undefined;
	body: Chunk;
}

export type { NumericForInterface };
