import { ExpressionKind, type ExpressionKindEnum } from "../../ast/definition/enum/expression-kind.enum.mjs";
import { TokenKind, type TokenKindEnum } from "../../lexer/definition/enum/token-kind.enum.mjs";

function unary_type_to_expression_kind(kind: TokenKindEnum): ExpressionKindEnum
{
	// eslint-disable-next-line @ts/switch-exhaustiveness-check -- Only unary expressions
	switch (kind)
	{
		case TokenKind.Not:
			return ExpressionKind.Not;
		case TokenKind.Subtract:
			return ExpressionKind.Negate;
		case TokenKind.Hash:
			return ExpressionKind.Length;
		case TokenKind.BitXOrNot:
			return ExpressionKind.BitNot;

		default:
			throw new Error();
	}
}

export { unary_type_to_expression_kind };
