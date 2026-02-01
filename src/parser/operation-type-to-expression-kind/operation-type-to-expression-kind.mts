import { ExpressionKind, type ExpressionKindEnum } from "../../ast/definition/enum/expression-kind.enum.mjs";
import { TokenKind, type TokenKindEnum } from "../../lexer/definition/enum/token-kind.enum.mjs";

function operation_type_to_expression_kind(
	operation_type: TokenKindEnum
): ExpressionKindEnum
{
	// eslint-disable-next-line @ts/switch-exhaustiveness-check -- Not all operations are expressions
	switch (operation_type)
	{
		case TokenKind.Addition:
			return ExpressionKind.Addition;
		case TokenKind.Subtract:
			return ExpressionKind.Subtract;
		case TokenKind.Multiply:
			return ExpressionKind.Multiplication;
		case TokenKind.Division:
			return ExpressionKind.Division;
		case TokenKind.FloorDivision:
			return ExpressionKind.FloorDivision;
		case TokenKind.Modulo:
			return ExpressionKind.Modulo;
		case TokenKind.Exponent:
			return ExpressionKind.Exponent;
		case TokenKind.Concat:
			return ExpressionKind.Concat;
		case TokenKind.BitAnd:
			return ExpressionKind.BitAnd;
		case TokenKind.BitOr:
			return ExpressionKind.BitOr;
		case TokenKind.BitXOrNot:
			return ExpressionKind.BitXOr;
		case TokenKind.BitShiftLeft:
			return ExpressionKind.BitShiftLeft;
		case TokenKind.BitShiftRight:
			return ExpressionKind.BitShiftRight;
		case TokenKind.LessThan:
			return ExpressionKind.LessThan;
		case TokenKind.LessThanEquals:
			return ExpressionKind.LessThanEquals;
		case TokenKind.GreaterThan:
			return ExpressionKind.GreaterThan;
		case TokenKind.GreaterThanEquals:
			return ExpressionKind.GreaterThanEquals;
		case TokenKind.Equals:
			return ExpressionKind.Equals;
		case TokenKind.NotEquals:
			return ExpressionKind.NotEquals;
		case TokenKind.And:
			return ExpressionKind.And;
		case TokenKind.Or:
			return ExpressionKind.Or;

		default:
			throw new Error(`"${operation_type}" is not an expression operation.`);
	}
}

export { operation_type_to_expression_kind };
