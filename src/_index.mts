import { Engine } from "./engine.mjs";
import { make_boolean, make_number, make_string, make_table, make_variable } from "./runtime.mjs";
import { compile } from "./compiler.mjs";
import { std_lib, variable_to_string } from "./lib.mjs";

export * as lexer from "./lexer.mjs";
export * as parser from "./parser.mjs";
export * as ast from "./ast.mjs";
export * as opcode from "./opcode.mjs";
export * as runtime from "./runtime.mjs";

export type * from "./boundary/definition/_index.mjs";
export * from "./create-binding.mjs";

export type * from "./variable/definition/interface/_index.mjs";
export type * from "./variable/definition/type/_index.mjs";
export * from "./variable/definition/enum/variable-kind.enum.mjs";
export * from "./variable/nil.mjs";
export * from "./variable/unwrap-variable.mjs";

export {
	Engine,
	compile,
	std_lib as std_global,
	make_boolean,
	make_number,
	make_string,
	make_table,
	make_variable,
	variable_to_string as to_string,
};
