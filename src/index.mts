import { Engine } from './engine.mjs'
import { DataType, type Variable, type NativeFunction, nil } from './runtime.mjs'
import { make_boolean, make_number, make_string } from './runtime.mjs'
import { compile } from './compiler.mjs'
import { std_lib, variable_to_string } from './lib.mjs'
export * as lexer from './lexer.mjs'
export * as parser from './parser.mjs'
export * as ast from './ast.mjs'
export * as opcode from './opcode.mjs'
export * as runtime from './runtime.mjs'

export const Nil = DataType.Nil
export const Boolean = DataType.Boolean
export const Number = DataType.Number
export const String = DataType.String
export const Function = DataType.Function
export const NativeFunctionType = DataType.NativeFunction
export const Table = DataType.Table

export {
	std_lib as std_global,
	nil,
	make_boolean as boolean,
	make_number as number,
	make_string as string,
	variable_to_string as to_string,
	Engine,
	DataType,
	Variable,
	NativeFunction,
	compile,
}
