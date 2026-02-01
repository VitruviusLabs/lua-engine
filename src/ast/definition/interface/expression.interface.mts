import type { TokenStream } from "../../../lexer.mjs";
import type { TokenInterface } from "../../../lexer/definition/interface/token.interface.mjs";
import type { ExpressionKindEnum } from "../enum/expression-kind.enum.mjs";
import type { ValueInterface } from "./value.interface.mjs";

interface ExpressionInterface
{
	// @TODO: Remove 'data' field
	data?: never;
	kind: ExpressionKindEnum;
	token: TokenInterface | TokenStream;
	lhs?: ExpressionInterface;
	rhs?: ExpressionInterface;
	value?: ValueInterface;
	expression?: ExpressionInterface;
	index?: ExpressionInterface;
	arguments?: Array<ExpressionInterface>;
}

export type { ExpressionInterface };
