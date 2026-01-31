const enum StatementKindEnum
{
	Invalid = 0,
	Empty = 1,
	Expression = 2,
	Assignment = 3,
	Local = 4,
	If = 5,
	While = 6,
	For = 7,
	NumericFor = 8,
	Repeat = 9,
	Do = 10,
	Return = 11,
	Break = 12,
}

export { StatementKindEnum };
