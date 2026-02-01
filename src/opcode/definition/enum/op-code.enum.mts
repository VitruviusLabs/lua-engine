const OpCode = {
	Load: "load",
	Store: "store",
	Push: "push",
	Pop: "pop",
	Dup: "dup",
	Swap: "swap",

	IterUpdateState: "iter-update-state",
	IterNext: "iter-next",
	IterJumpIfDone: "iter-jump-if-done",

	NewTable: "new-table",
	LoadIndex: "load-index",
	StoreIndex: "store-index",

	Add: "add",
	Subtract: "subtract",
	Multiply: "multiply",
	Divide: "divide",
	FloorDivide: "floor-divide",
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
	Or: "or",
	Not: "not",

	Negate: "negate",
	Length: "length",
	IsNotNil: "is-not-nil",

	StartBlock: "start-block",
	EndBlock: "end-block",
	MakeLocal: "make-local",
	Call: "call",
	Return: "return",
	Jump: "jump",
	JumpIfNot: "jump-if-not",
	JumpIf: "jump-if",

	StartStackChange: "start-stack-change",
	EndStackChange: "end-stack-change",
	ArgumentCount: "argument-count",
	Break: "break",
} as const satisfies Record<string, string>;

type OpCodeEnum = typeof OpCode[keyof typeof OpCode];

export { OpCode, type OpCodeEnum };
