import { TokenKind, type TokenKindEnum } from "../definition/enum/token-kind.enum.mjs";

function get_double_token(double: string): TokenKindEnum | undefined
{
	switch (double)
	{
		case "==":
			return TokenKind.Equals;
		case "<=":
			return TokenKind.LessThanEquals;
		case ">=":
			return TokenKind.GreaterThanEquals;
		case "~=":
			return TokenKind.NotEquals;
		case "..":
			return TokenKind.Concat;
		case "//":
			return TokenKind.FloorDivision;
		case "<<":
			return TokenKind.BitShiftLeft;
		case ">>":
			return TokenKind.BitShiftRight;
	}

	return undefined;
}

export { get_double_token };
