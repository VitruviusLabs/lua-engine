import type { StatementInterface } from "./ast/definition/interface/statement.interface.mjs";

export interface Chunk
{
	statements: Array<StatementInterface>;
}
