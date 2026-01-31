import type { Token } from "../../../lexer.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";

interface ReturnInterface
{
	values: Array<ExpressionInterface>;
	token: Token;
}

export type { ReturnInterface };
