const VariableKind = {
	Nil: "nil",
	Boolean: "boolean",
	Number: "number",
	String: "string",
	Table: "table",
	Function: "function",
	NativeFunction: "native-function",
} as const satisfies Record<string, string>;

type VariableKindEnum = typeof VariableKind[keyof typeof VariableKind];

export { VariableKind, type VariableKindEnum };
