const ExpressionKind = {
	Value: "value",
	Call: "call",
	Index: "index",

	Negate: "negate",
	Addition: "addition",
	Subtract: "subtract",
	Multiplication: "multiplication",
	Division: "division",
	FloorDivision: "floor-division",
	Modulo: "modulo",
	Exponent: "exponent",
	Concat: "concat",

	BitAnd: "bit-and",
	BitOr: "bit-or",
	BitXOr: "bit-xor",
	BitNot: "bit-not",
	BitShiftLeft: "bit-shift-left",
	BitShiftRight: "bit-shift-right",

	Equals: "equals",
	NotEquals: "not-equals",
	LessThan: "less-than",
	LessThanEquals: "less-than-equals",
	GreaterThan: "greater-than",
	GreaterThanEquals: "greater-than-equals",

	And: "and",
	// eslint-disable-next-line id-length
	Or: "or",
	Not: "not",

	Length: "length",
} as const satisfies Record<string, string>;

type ExpressionKindEnum = typeof ExpressionKind[keyof typeof ExpressionKind];

export { ExpressionKind, type ExpressionKindEnum };
