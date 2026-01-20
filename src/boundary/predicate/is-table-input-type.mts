import { isArray, isInstanceOf, isRecord, isUnion, unary } from "@vitruvius-labs/ts-predicate";
import type { TableInputType } from "../definition/type/table-input.type.mjs";

function isTableInputType(input: unknown): input is TableInputType
{
	return isUnion(input, [isArray, isRecord, unary(isInstanceOf, Map)]);
}

export { isTableInputType };
