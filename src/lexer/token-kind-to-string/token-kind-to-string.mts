import { TokenKindEnum } from "../definition/enum/token-kind.enum.mjs";

// eslint-disable-next-line complexity
function token_kind_to_string(kind: TokenKindEnum): string
{
	switch (kind)
	{
		case TokenKindEnum.EOF: return "EOF";
		case TokenKindEnum.NotFinished: return "NotFinished";
		case TokenKindEnum.Identifier: return "Identifier";
		case TokenKindEnum.StringLiteral: return "StringLiteral";
		case TokenKindEnum.BooleanLiteral: return "BooleanLiteral";
		case TokenKindEnum.NumberLiteral: return "NumberLiteral";
		case TokenKindEnum.NilLiteral: return "nil";
		case TokenKindEnum.OpenBrace: return "(";
		case TokenKindEnum.CloseBrace: return ")";
		case TokenKindEnum.OpenSquare: return "[";
		case TokenKindEnum.CloseSquare: return "]";
		case TokenKindEnum.SquiglyOpen: return "{";
		case TokenKindEnum.SquiglyClose: return "}";
		case TokenKindEnum.Addition: return "+";
		case TokenKindEnum.Subtract: return "-";
		case TokenKindEnum.Multiply: return "*";
		case TokenKindEnum.Division: return "/";
		case TokenKindEnum.FloorDivision: return "//";
		case TokenKindEnum.Modulo: return "%";
		case TokenKindEnum.Exponent: return "^";
		case TokenKindEnum.BitAnd: return "&";
		case TokenKindEnum.BitOr: return "|";
		case TokenKindEnum.BitXOrNot: return "~";
		case TokenKindEnum.BitShiftLeft: return "<<";
		case TokenKindEnum.BitShiftRight: return ">>";
		case TokenKindEnum.LessThan: return "<";
		case TokenKindEnum.GreaterThan: return ">";
		case TokenKindEnum.And: return "and";
		case TokenKindEnum.Or: return "or";
		case TokenKindEnum.Not: return "not";
		case TokenKindEnum.Assign: return "=";
		case TokenKindEnum.Semicolon: return ";";
		case TokenKindEnum.Comma: return ",";
		case TokenKindEnum.Dot: return ".";
		case TokenKindEnum.FunctionLike: return "function";
		case TokenKindEnum.If: return "if";
		case TokenKindEnum.While: return "while";
		case TokenKindEnum.For: return "for";
		case TokenKindEnum.Repeat: return "repeat";
		case TokenKindEnum.In: return "in";
		case TokenKindEnum.Do: return "do";
		case TokenKindEnum.Then: return "then";
		case TokenKindEnum.ElseIf: return "elseif";
		case TokenKindEnum.Else: return "else";
		case TokenKindEnum.Until: return "until";
		case TokenKindEnum.End: return "end";
		case TokenKindEnum.Return: return "return";
		case TokenKindEnum.Break: return "break";
		case TokenKindEnum.Local: return "local";

		default:
			return "unknown token";
	}
}

export { token_kind_to_string };
