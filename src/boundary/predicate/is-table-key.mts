import { isNumber, isString, isUnion } from "@vitruvius-labs/ts-predicate";

function isTableKey(value: unknown): value is string | number
{
	return isUnion(value, [isNumber, isString]);
}

export { isTableKey };
