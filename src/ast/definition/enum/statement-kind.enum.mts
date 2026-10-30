const StatementKind = {
	Invalid: "invalid",
	Empty: "empty",
	Expression: "expression",
	Assignment: "assignment",
	Local: "local",
	// eslint-disable-next-line id-length
	If: "if",
	While: "while",
	For: "for",
	NumericFor: "numeric-for",
	Repeat: "repeat",
	// eslint-disable-next-line id-length
	Do: "do",
	Return: "return",
	Break: "break",
} as const satisfies Record<string, string>;

type StatementKindEnum = typeof StatementKind[keyof typeof StatementKind];

export { StatementKind, type StatementKindEnum };
