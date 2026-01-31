import type { TokenStream } from "../../../lexer.mjs";
import type { ExpressionKind } from "../enum/expression-kind.enum.mjs";
import type { ValueInterface } from "./value.interface.mjs";

interface ExpressionInterface
{
	kind: ExpressionKind;
	token: TokenStream;
	lhs?: ExpressionInterface;
	rhs?: ExpressionInterface;
	value?: ValueInterface;
	expression?: ExpressionInterface;
	index?: ExpressionInterface;
	arguments?: Array<ExpressionInterface>;
}

export type { ExpressionInterface };
