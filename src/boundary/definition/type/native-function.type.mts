import type { Engine } from "../../../engine.mjs";
import type { Variable } from "../../../variable/definition/type/variable.type.mjs";

type NativeFunction = (engine: Engine, ...args: Array<Variable>) => Array<Variable>

export type { NativeFunction };
