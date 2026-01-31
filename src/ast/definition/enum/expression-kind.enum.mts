enum ExpressionKind
{
	Value = 0,
	Call = 1,
	Index = 2,

	Addition = 3,
	Subtract = 4,
	Multiplication = 5,
	Division = 6,
	FloorDivision = 7,
	Modulo = 8,
	Exponent = 9,
	Concat = 10,

	BitAnd = 11,
	BitOr = 12,
	BitXOr = 13,
	BitNot = 14,
	BitShiftLeft = 15,
	BitShiftRight = 16,

	Equals = 17,
	NotEquals = 18,
	LessThan = 19,
	LessThanEquals = 20,
	GreaterThan = 21,
	GreaterThanEquals = 22,
	And = 23,
	Or = 24,

	Not = 25,
	Negate = 26,
	Length = 27,
}

export { ExpressionKind };
