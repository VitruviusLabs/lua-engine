import { ExpressionKind } from "../../ast/definition/enum/expression-kind.enum.mjs";
import { TokenKindEnum } from "../../lexer/definition/enum/token-kind.enum.mjs";

function operation_type_to_expression_kind(
	operation_type: TokenKindEnum
): ExpressionKind
{
	// eslint-disable-next-line @ts/switch-exhaustiveness-check
	switch (operation_type)
	{
		case TokenKindEnum.Addition: return ExpressionKind.Addition;
		case TokenKindEnum.Subtract: return ExpressionKind.Subtract;
		case TokenKindEnum.Multiply: return ExpressionKind.Multiplication;
		case TokenKindEnum.Division: return ExpressionKind.Division;
		case TokenKindEnum.FloorDivision: return ExpressionKind.FloorDivision;
		case TokenKindEnum.Modulo: return ExpressionKind.Modulo;
		case TokenKindEnum.Exponent: return ExpressionKind.Exponent;
		case TokenKindEnum.Concat: return ExpressionKind.Concat;
		case TokenKindEnum.BitAnd: return ExpressionKind.BitAnd;
		case TokenKindEnum.BitOr: return ExpressionKind.BitOr;
		case TokenKindEnum.BitXOrNot: return ExpressionKind.BitXOr;
		case TokenKindEnum.BitShiftLeft: return ExpressionKind.BitShiftLeft;
		case TokenKindEnum.BitShiftRight: return ExpressionKind.BitShiftRight;
		case TokenKindEnum.LessThan: return ExpressionKind.LessThan;
		case TokenKindEnum.LessThanEquals: return ExpressionKind.LessThanEquals;
		case TokenKindEnum.GreaterThan: return ExpressionKind.GreaterThan;
		case TokenKindEnum.GreaterThanEquals: return ExpressionKind.GreaterThanEquals;
		case TokenKindEnum.Equals: return ExpressionKind.Equals;
		case TokenKindEnum.NotEquals: return ExpressionKind.NotEquals;
		case TokenKindEnum.And: return ExpressionKind.And;
		case TokenKindEnum.Or: return ExpressionKind.Or;

		default:
			throw new Error();
	}
}

export { operation_type_to_expression_kind };
