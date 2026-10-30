import { TokenKind, type TokenKindEnum } from "../../lexer/definition/enum/token-kind.enum.mjs";

/**
 * From lowest to highest priority
*/
const operators_grouped_by_priority: Array<Array<TokenKindEnum>> = [
	[TokenKind.Or],
	[TokenKind.And],
	[TokenKind.LessThan, TokenKind.LessThanEquals, TokenKind.GreaterThan, TokenKind.GreaterThanEquals, TokenKind.Equals, TokenKind.NotEquals],
	[TokenKind.BitOr],
	[TokenKind.BitAnd],
	[TokenKind.BitXOrNot],
	[TokenKind.BitShiftLeft, TokenKind.BitShiftRight],
	[TokenKind.Concat],
	[TokenKind.Addition, TokenKind.Subtract],
	[TokenKind.Multiply, TokenKind.Division, TokenKind.FloorDivision, TokenKind.Modulo],
	[TokenKind.Exponent],
];

export { operators_grouped_by_priority };
