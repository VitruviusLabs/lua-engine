import type { TableMapKeyType } from "./table-map-key.type.mjs";
import type { TableMapType } from "./table-map.type.mjs";

type TableInputType = Array<unknown> | Record<TableMapKeyType, unknown> | TableMapType;

export type { TableInputType };
