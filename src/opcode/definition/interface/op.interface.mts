import type { Variable } from "../../../_index.mjs";
import type { DebugInterface } from "../../../lexer/definition/interface/debug.interface.mjs";
import type { OpCodeEnum } from "../enum/op-code.enum.mjs";

interface OpInterface {
	code: OpCodeEnum;
	arg?: Variable;
	debug: DebugInterface;
}

export type { OpInterface };
