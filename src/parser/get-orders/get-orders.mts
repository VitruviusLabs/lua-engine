import { TokenKind } from "../../lexer/definition/enum/token-kind.enum.mjs";
import type { OrderTupleType } from "./definition/type/order-tuple.type.mjs";

function get_orders(): OrderTupleType
{
	return [
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
}

export { get_orders };
