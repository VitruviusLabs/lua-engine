const ValueKind = {
	NilLiteral: "nil-literal",
	NumberLiteral: "number-literal",
	BooleanLiteral: "boolean-literal",
	StringLiteral: "string-literal",
	TableLiteral: "table-literal",
	FunctionLike: "function-like",
	Variable: "variable",
} as const satisfies Record<string, string>;

type ValueKindEnum = typeof ValueKind[keyof typeof ValueKind];

export { ValueKind, type ValueKindEnum };
