import type { VariableBoolean } from "../interface/variable-boolean.interface.mjs";
import type { VariableFunction } from "../interface/variable-function.interface.mjs";
import type { VariableNativeFunction } from "../interface/variable-native-function.interface.mjs";
import type { VariableNil } from "../interface/variable-nil.interface.mjs";
import type { VariableNumber } from "../interface/variable-number.interface.mjs";
import type { VariableString } from "../interface/variable-string.interface.mjs";
import type { VariableTable } from "../interface/variable-table.interface.mjs";

type Variable = (
	| VariableNil
	| VariableBoolean
	| VariableNumber
	| VariableString
	| VariableTable
	| VariableFunction
	| VariableNativeFunction
);

export type {
	Variable,
	VariableBoolean,
	VariableFunction,
	VariableNativeFunction,
	VariableNil,
	VariableNumber,
	VariableString,
	VariableTable,
};
