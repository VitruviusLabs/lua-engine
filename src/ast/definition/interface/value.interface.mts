import type { TokenInterface } from "../../../lexer/definition/interface/token.interface.mjs";
import type { ValueKindEnum } from "../enum/value-kind.enum.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";
import type { LuaFunctionInterface } from "./lua-function.interface.mjs";

interface ValueInterface
{
	kind: ValueKindEnum;
	token: TokenInterface;
	number?: number | undefined;
	boolean?: boolean | undefined;
	string?: string | undefined;
	table?: Map<ExpressionInterface, ExpressionInterface> | undefined;
	function?: LuaFunctionInterface | undefined;
	identifier?: string | undefined;
}

export type { ValueInterface };
