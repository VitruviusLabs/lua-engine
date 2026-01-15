import { Engine } from './engine.mjs'

export enum DataType {
	Nil,
	Boolean,
	Number,
	String,
	Function,
	NativeFunction,
	Table,
}

export type NativeFunction = (engine: Engine, ...args: Array<Variable>) => Array<Variable> | Error

export interface Variable {
	data_type: DataType,
	boolean?: boolean,
	number?: number,
	string?: string,
	native_function?: NativeFunction,
	table?: Map<number | string, Variable>,

	function_id?: number,
	locals?: Map<string, Variable>[],
}

export const nil: Variable = { data_type: DataType.Nil }

export function make_boolean(boolean: boolean): Variable
{
	return { data_type: DataType.Boolean, boolean: boolean }
}

export function make_number(number: number): Variable
{
	return { data_type: DataType.Number, number: number }
}

export function make_string(string: string): Variable
{
	return { data_type: DataType.String, string: string }
}
