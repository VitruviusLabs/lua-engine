const enum StateEnum {
	Initial = "initial",
	Identifier = "identifier",
	StringLiteral = "string-literal",
	StringLiteralEscape = "string-literal-escape",
	MultiLineString = "multi-line-string",
	NumberLiteral = "number-literal",
	NumberLiteralDot = "number-literal-dot",
	NumberLiteralExpSign = "number-literal-exp-sign",
	NumberLiteralExp = "number-literal-exp",
	NumberHex = "number-hex",
	Comment = "comment",
}

export { StateEnum };
