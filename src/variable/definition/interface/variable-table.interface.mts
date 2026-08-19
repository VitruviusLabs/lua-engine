import type { VariableTableMapType } from "../type/variable-table-map.type.mjs";
import type { BaseVariable } from "./base-variable.interface.mjs";
import type { VariableKind } from "../enum/variable-kind.enum.mjs";

interface VariableTable extends BaseVariable
{
	data_type: typeof VariableKind.Table;
	table: VariableTableMapType;
}

export type { VariableTable };
