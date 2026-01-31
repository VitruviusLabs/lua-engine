import type { Token } from "../../../lexer.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";

interface AssignmentInterface
{
	local: boolean;
	lhs: Array<ExpressionInterface>;
	rhs: Array<ExpressionInterface>;
	token: Token;
}

export type { AssignmentInterface };

