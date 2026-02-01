import { TokenKind, type TokenKindEnum } from "../definition/enum/token-kind.enum.mjs";

function get_single_token(token: string): TokenKindEnum | undefined
{
	switch (token)
	{
		 case "(":
			return TokenKind.OpenBrace;
		 case ")":
			return TokenKind.CloseBrace;
		 case "[":
			return TokenKind.OpenSquare;
		 case "]":
			return TokenKind.CloseSquare;
		 case "{":
			return TokenKind.SquiglyOpen;
		 case "}":
			return TokenKind.SquiglyClose;
		 case "+":
			return TokenKind.Addition;
		 case "-":
			return TokenKind.Subtract;
		 case "*":
			return TokenKind.Multiply;
		 case "/":
			return TokenKind.Division;
		 case "%":
			return TokenKind.Modulo;
		 case "^":
			return TokenKind.Exponent;
		 case "&":
			return TokenKind.BitAnd;
		 case "|":
			return TokenKind.BitOr;
		 case "~":
			return TokenKind.BitXOrNot;
		 case "<":
			return TokenKind.LessThan;
		 case ">":
			return TokenKind.GreaterThan;
		 case "=":
			return TokenKind.Assign;
		 case ";":
			return TokenKind.Semicolon;
		 case ",":
			return TokenKind.Comma;
		 case ".":
			return TokenKind.Dot;
		 case "#":
			return TokenKind.Hash;
	}

	return undefined;
}

export { get_single_token };
