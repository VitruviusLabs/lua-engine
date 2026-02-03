import type { Variable } from "../../../_index.mjs";
import type { DebugInterface } from "../../../lexer/definition/interface/debug.interface.mjs";
import type { OperationCodeEnum } from "../enum/operation-code.enum.mjs";

interface OperationInterface {
	code: OperationCodeEnum;
	arg?: Variable;
	debug: DebugInterface;
}

export type { OperationInterface };
