import type { Variable } from "../type/variable.type.mjs";

interface BaseVariable
{
	locals?: Array<Map<string, Variable>>;
}

export type { BaseVariable };
