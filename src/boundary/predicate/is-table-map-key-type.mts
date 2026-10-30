import { isNumber, isString, isUnion } from "@vitruvius-labs/ts-predicate";
import type { TableMapKeyType } from "../definition/type/table-map-key.type.mjs";

function isTableMapKeyType(value: unknown): value is TableMapKeyType
{
	return isUnion(value, [isNumber, isString]);
}

export { isTableMapKeyType };
