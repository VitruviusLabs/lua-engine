import { ExpressionKind } from "../../ast/definition/enum/expression-kind.enum.mjs";
import { TokenKindEnum } from "../../lexer/definition/enum/token-kind.enum.mjs";

function unary_type_to_expression_kind(kind: TokenKindEnum): ExpressionKind
{
	switch (kind)
	{
		case TokenKindEnum.Not: return ExpressionKind.Not;
		case TokenKindEnum.Subtract: return ExpressionKind.Negate;
		case TokenKindEnum.Hash: return ExpressionKind.Length;
		case TokenKindEnum.BitXOrNot: return ExpressionKind.BitNot;

		default:
			throw new Error();
	}
}

export { unary_type_to_expression_kind };
