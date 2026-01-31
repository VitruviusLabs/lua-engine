import { OpCodeEnum } from "../definition/enum/op-code.enum.mjs";

// eslint-disable-next-line complexity
function op_code_name(op_code: OpCodeEnum): string
{
	switch (op_code)
	{
		case OpCodeEnum.Load: return "Load";
		case OpCodeEnum.Store: return "Store";
		case OpCodeEnum.Push: return "Push";
		case OpCodeEnum.Pop: return "Pop";
		case OpCodeEnum.Dup: return "Dup";
		case OpCodeEnum.Swap: return "Swap";
		case OpCodeEnum.IterUpdateState: return "IterUpdateState";
		case OpCodeEnum.IterNext: return "IterNext";
		case OpCodeEnum.IterJumpIfDone: return "IterJumpIfDone";
		case OpCodeEnum.NewTable: return "NewTable";
		case OpCodeEnum.LoadIndex: return "LoadIndex";
		case OpCodeEnum.StoreIndex: return "StoreIndex";
		case OpCodeEnum.Add: return "Add";
		case OpCodeEnum.Subtract: return "Subtract";
		case OpCodeEnum.Multiply: return "Multiply";
		case OpCodeEnum.Divide: return "Divide";
		case OpCodeEnum.FloorDivide: return "FloorDivide";
		case OpCodeEnum.Modulo: return "Modulo";
		case OpCodeEnum.Exponent: return "Exponent";
		case OpCodeEnum.Concat: return "Concat";
		case OpCodeEnum.BitAnd: return "BitAnd";
		case OpCodeEnum.BitOr: return "BitOr";
		case OpCodeEnum.BitXOr: return "BitXOr";
		case OpCodeEnum.BitNot: return "BitNot";
		case OpCodeEnum.BitShiftLeft: return "BitShiftLeft";
		case OpCodeEnum.BitShiftRight: return "BitShiftRight";
		case OpCodeEnum.Equals: return "Equals";
		case OpCodeEnum.NotEquals: return "NotEquals";
		case OpCodeEnum.LessThan: return "LessThan";
		case OpCodeEnum.LessThanEquals: return "LessThanEquals";
		case OpCodeEnum.GreaterThan: return "GreaterThan";
		case OpCodeEnum.GreaterThanEquals: return "GreaterThanEquals";
		case OpCodeEnum.And: return "And";
		case OpCodeEnum.Or: return "Or";
		case OpCodeEnum.Not: return "Not";
		case OpCodeEnum.Negate: return "Negate";
		case OpCodeEnum.Length: return "Length";
		case OpCodeEnum.IsNotNil: return "IsNotNil";
		case OpCodeEnum.StartBlock: return "StartBlock";
		case OpCodeEnum.EndBlock: return "EndBlock";
		case OpCodeEnum.MakeLocal: return "MakeLocal";
		case OpCodeEnum.Call: return "Call";
		case OpCodeEnum.Return: return "Return";
		case OpCodeEnum.Jump: return "Jump";
		case OpCodeEnum.JumpIfNot: return "JumpIfNot";
		case OpCodeEnum.JumpIf: return "JumpIf";
		case OpCodeEnum.StartStackChange: return "StartStackChange";
		case OpCodeEnum.EndStackChange: return "EndStackChange";
		case OpCodeEnum.ArgumentCount: return "ArgumentCount";
		case OpCodeEnum.Break: return "Break[Debug]";
	}
}

export { op_code_name };
