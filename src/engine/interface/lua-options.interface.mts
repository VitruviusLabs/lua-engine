import type { Variable } from "../../_index.mjs";

interface LuaOptionsInterface
{
	trace?: boolean;
	trace_instructions?: boolean;
	trace_stack?: boolean;
	locals?: Map<string, Variable>;
}

export type { LuaOptionsInterface };
