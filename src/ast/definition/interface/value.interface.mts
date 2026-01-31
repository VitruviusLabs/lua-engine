import type { Expression } from "../../../ast.mjs";
import type { Token } from "../../../lexer.mjs";
import type { ValueKindEnum } from "../enum/value-kind.enum.mjs";
import type { LuaFunctionInterface } from "./lua-function.interface.mjs";

interface ValueInterface
{
	kind: ValueKindEnum;
	token: Token;

	number?: number | undefined;
	boolean?: boolean | undefined;
	string?: string | undefined;
	table?: Map<Expression, Expression> | undefined;
	function?: LuaFunctionInterface | undefined;
	identifier?: string | undefined;
}

export type { ValueInterface };
