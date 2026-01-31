import type { Variable } from "./variable/definition/type/variable.type.mjs";
import type { Debug } from "./lexer.mjs";

export enum OpCode {
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

export function op_code_name(op_code: OpCode): string
{
	switch (op_code)
	{
		case OpCode.Load: return "Load";
		case OpCode.Store: return "Store";
		case OpCode.Push: return "Push";
		case OpCode.Pop: return "Pop";
		case OpCode.Dup: return "Dup";
		case OpCode.Swap: return "Swap";
		case OpCode.IterUpdateState: return "IterUpdateState";
		case OpCode.IterNext: return "IterNext";
		case OpCode.IterJumpIfDone: return "IterJumpIfDone";
		case OpCode.NewTable: return "NewTable";
		case OpCode.LoadIndex: return "LoadIndex";
		case OpCode.StoreIndex: return "StoreIndex";
		case OpCode.Add: return "Add";
		case OpCode.Subtract: return "Subtract";
		case OpCode.Multiply: return "Multiply";
		case OpCode.Divide: return "Divide";
		case OpCode.FloorDivide: return "FloorDivide";
		case OpCode.Modulo: return "Modulo";
		case OpCode.Exponent: return "Exponent";
		case OpCode.Concat: return "Concat";
		case OpCode.BitAnd: return "BitAnd";
		case OpCode.BitOr: return "BitOr";
		case OpCode.BitXOr: return "BitXOr";
		case OpCode.BitNot: return "BitNot";
		case OpCode.BitShiftLeft: return "BitShiftLeft";
		case OpCode.BitShiftRight: return "BitShiftRight";
		case OpCode.Equals: return "Equals";
		case OpCode.NotEquals: return "NotEquals";
		case OpCode.LessThan: return "LessThan";
		case OpCode.LessThanEquals: return "LessThanEquals";
		case OpCode.GreaterThan: return "GreaterThan";
		case OpCode.GreaterThanEquals: return "GreaterThanEquals";
		case OpCode.And: return "And";
		case OpCode.Or: return "Or";
		case OpCode.Not: return "Not";
		case OpCode.Negate: return "Negate";
		case OpCode.Length: return "Length";
		case OpCode.IsNotNil: return "IsNotNil";
		case OpCode.StartBlock: return "StartBlock";
		case OpCode.EndBlock: return "EndBlock";
		case OpCode.MakeLocal: return "MakeLocal";
		case OpCode.Call: return "Call";
		case OpCode.Return: return "Return";
		case OpCode.Jump: return "Jump";
		case OpCode.JumpIfNot: return "JumpIfNot";
		case OpCode.JumpIf: return "JumpIf";
		case OpCode.StartStackChange: return "StartStackChange";
		case OpCode.EndStackChange: return "EndStackChange";
		case OpCode.ArgumentCount: return "ArgumentCount";
		case OpCode.Break: return "Break[Debug]";
	}
}

export interface Op {
	code: OpCode;
	arg?: Variable;
	debug: Debug;
}

export interface Program {
	code: Array<Op>;
	start: number;
}
