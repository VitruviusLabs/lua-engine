import type { VariableNil } from "./definition/interface/variable-nil.interface.mjs";
import { VariableKind } from "./definition/enum/variable-kind.enum.mjs";

const nil: VariableNil = Object.freeze({ data_type: VariableKind.Nil });

export { nil };
