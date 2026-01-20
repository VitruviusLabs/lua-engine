import { Engine } from './engine.mjs'
import { make_boolean, make_number, make_string, make_table, make_variable } from './runtime.mjs'
import { compile } from './compiler.mjs'
import { std_lib, variable_to_string } from './lib.mjs'
import { VariableKind } from "./variable/definition/enum/variable-kind.enum.mjs"
import { VariableUnwrapUtility } from "./variable/unwrap-variable.mjs"
import type { Variable } from "./variable/definition/type/variable.type.mjs"
import { nil } from "./variable/nil.mjs"
import type { NativeFunction } from "./boundary/definition/type/native-function.type.mjs"
export * as lexer from './lexer.mjs'
export * as parser from './parser.mjs'
export * as ast from './ast.mjs'
export * as opcode from './opcode.mjs'
export * as runtime from './runtime.mjs'
export * from './create-binding.mjs'

export const Nil = VariableKind.Nil
export const Boolean = VariableKind.Boolean
export const Number = VariableKind.Number
export const String = VariableKind.String
export const Function = VariableKind.Function
export const NativeFunctionType = VariableKind.NativeFunction
export const Table = VariableKind.Table

export {
	std_lib as std_global,
	nil,
	make_boolean,
	make_number,
	make_string,
	make_table,
	make_variable,
	variable_to_string as to_string,
	Engine,
	VariableKind,
	Variable,
	VariableUnwrapUtility,
	NativeFunction,
	compile,
}
