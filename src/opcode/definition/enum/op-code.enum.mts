const enum OpCodeEnum {
	Load = "load",
	Store = "store",
	Push = "push",
	Pop = "pop",
	Dup = "dup",
	Swap = "swap",

	IterUpdateState = "iter_update_state",
	IterNext = "iter_next",
	IterJumpIfDone = "iter_jump_if_done",

	NewTable = "new_table",
	LoadIndex = "load_index",
	StoreIndex = "store_index",

	Add = "add",
	Subtract = "subtract",
	Multiply = "multiply",
	Divide = "divide",
	FloorDivide = "floor_divide",
	Modulo = "modulo",
	Exponent = "exponent",
	Concat = "concat",

	BitAnd = "bit_and",
	BitOr = "bit_or",
	BitXOr = "bit_xor",
	BitNot = "bit_not",
	BitShiftLeft = "bit_shift_left",
	BitShiftRight = "bit_shift_right",

	Equals = "equals",
	NotEquals = "not_equals",
	LessThan = "less_than",
	LessThanEquals = "less_than_equals",
	GreaterThan = "greater_than",
	GreaterThanEquals = "greater_than_equals",

	And = "and",
	Or = "or",
	Not = "not",

	Negate = "negate",
	Length = "length",
	IsNotNil = "is_not_nil",

	StartBlock = "start_block",
	EndBlock = "end_block",
	MakeLocal = "make_local",
	Call = "call",
	Return = "return",
	Jump = "jump",
	JumpIfNot = "jump_if_not",
	JumpIf = "jump_if",

	StartStackChange = "start_stack_change",
	EndStackChange = "end_stack_change",
	ArgumentCount = "argument_count",
	Break = "break",
}

export { OpCodeEnum };
