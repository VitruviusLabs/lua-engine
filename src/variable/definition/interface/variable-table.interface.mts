import type { TableMap } from "../../../boundary/definition/type/table-map.type.mjs";
import type { BaseVariable } from "./base-variable.interface.mjs";
import type { VariableKind } from "../enum/variable-kind.enum.mjs";

interface VariableTable extends BaseVariable
{
	data_type: VariableKind.Table;
	table: TableMap;
}

export type { VariableTable };
