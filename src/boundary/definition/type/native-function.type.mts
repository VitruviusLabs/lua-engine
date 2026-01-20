import type { Awaitable } from "@vitruvius-labs/ts-predicate";
import type { Engine } from "../../../engine.mjs";
import type { Variable } from "../../../variable/definition/type/variable.type.mjs";

type NativeFunction = (engine: Engine, ...args: Array<Variable>) => Awaitable<Array<Variable>>;

export type { NativeFunction };
