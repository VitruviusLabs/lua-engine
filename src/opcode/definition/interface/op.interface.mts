import type { Variable } from "../../../_index.mjs";
import type { Debug } from "../../../lexer.mjs";
import type { OpCodeEnum } from "../enum/op-code.enum.mjs";

interface OpInterface {
	code: OpCodeEnum;
	arg?: Variable;
	debug: Debug;
}

export type { OpInterface };
