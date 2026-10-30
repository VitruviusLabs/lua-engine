import { TokenKind, type TokenKindEnum } from "../definition/enum/token-kind.enum.mjs";

function get_keyword(keyword: string): TokenKindEnum | undefined
{
	switch (keyword)
	{
		case "function":
			return TokenKind.FunctionLike;
		case "if":
			return TokenKind.If;
		case "while":
			return TokenKind.While;
		case "for":
			return TokenKind.For;
		case "repeat":
			return TokenKind.Repeat;
		case "in":
			return TokenKind.In;
		case "do":
			return TokenKind.Do;
		case "then":
			return TokenKind.Then;
		case "elseif":
			return TokenKind.ElseIf;
		case "else":
			return TokenKind.Else;
		case "until":
			return TokenKind.Until;
		case "end":
			return TokenKind.End;
		case "return":
			return TokenKind.Return;
		case "break":
			return TokenKind.Break;
		case "and":
			return TokenKind.And;
		case "or":
			return TokenKind.Or;
		case "not":
			return TokenKind.Not;
		case "true":
			return TokenKind.BooleanLiteral;
		case "false":
			return TokenKind.BooleanLiteral;
		case "nil":
			return TokenKind.NilLiteral;
		case "local":
			return TokenKind.Local;
	}

	return undefined;
}

export { get_keyword };
