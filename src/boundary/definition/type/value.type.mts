import type { TableType } from "./table.type.mjs";
import type { NativeFunction } from "./native-function.type.mjs";
import type { FunctionReferenceType } from "./function-reference.type.mjs";

type ValueType = (
	| undefined
	| boolean
	| number
	| string
	| TableType
	| NativeFunction
	| FunctionReferenceType
);

export type { ValueType };
