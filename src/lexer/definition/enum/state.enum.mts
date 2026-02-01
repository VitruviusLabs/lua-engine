const State = {
	Initial: "initial",
	Identifier: "identifier",
	StringLiteral: "string-literal",
	StringLiteralEscape: "string-literal-escape",
	MultiLineString: "multi-line-string",
	NumberLiteral: "number-literal",
	NumberLiteralDot: "number-literal-dot",
	NumberLiteralExpSign: "number-literal-exp-sign",
	NumberLiteralExp: "number-literal-exp",
	NumberHex: "number-hex",
	Comment: "comment",
} as const satisfies Record<string, string>;

type StateEnum = typeof State[keyof typeof State];

export { State, type StateEnum };
