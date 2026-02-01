import type { TokenKind } from "../../../../lexer/definition/enum/token-kind.enum.mjs";

type OrderTupleType = [
	[typeof TokenKind["Or"]],
	[typeof TokenKind["And"]],
	[typeof TokenKind["LessThan"], typeof TokenKind["LessThanEquals"], typeof TokenKind["GreaterThan"], typeof TokenKind["GreaterThanEquals"], typeof TokenKind["Equals"], typeof TokenKind["NotEquals"]],
	[typeof TokenKind["BitOr"]],
	[typeof TokenKind["BitAnd"]],
	[typeof TokenKind["BitXOrNot"]],
	[typeof TokenKind["BitShiftLeft"], typeof TokenKind["BitShiftRight"]],
	[typeof TokenKind["Concat"]],
	[typeof TokenKind["Addition"], typeof TokenKind["Subtract"]],
	[typeof TokenKind["Multiply"], typeof TokenKind["Division"], typeof TokenKind["FloorDivision"], typeof TokenKind["Modulo"]],
	[typeof TokenKind["Exponent"]],
];

export { type OrderTupleType };
