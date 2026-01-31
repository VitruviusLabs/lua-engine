import type { TokenInterface } from "../../../lexer/definition/interface/token.interface.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";

interface ReturnInterface
{
	values: Array<ExpressionInterface>;
	token: TokenInterface;
}

export type { ReturnInterface };
