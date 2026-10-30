import type { TokenInterface } from "../../../lexer/definition/interface/token.interface.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";

interface AssignmentInterface
{
	local: boolean;
	lhs: Array<ExpressionInterface>;
	rhs: Array<ExpressionInterface>;
	token: TokenInterface;
}

export type { AssignmentInterface };

