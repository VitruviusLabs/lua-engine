import { Engine } from "./engine.mjs";
import { make_table, make_variable } from "./runtime.mjs";
import { make_boolean } from "./runtime/make-boolean/make-boolean.mjs";
import { make_number } from "./runtime/make-number/make-number.mjs";
import { make_string } from "./runtime/make-string/make-string.mjs";
import { Compiler } from "./compiler.mjs";
import { std_lib } from "./lib.mjs";
import { variable_to_string } from "./lib/variable-to-string/variable-to-string.mjs";

export * as lexer from "./lexer.mjs";
export * as parser from "./parser.mjs";
export * as ast from "./ast/_index.mjs";
export * as opcode from "./opcode/_index.mjs";
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
	Compiler,
	std_lib as std_global,
	make_boolean,
	make_number,
	make_string,
	make_table,
	make_variable,
	variable_to_string as to_string,
};
