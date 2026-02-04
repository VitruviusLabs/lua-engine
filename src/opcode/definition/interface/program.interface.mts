import type { OperationInterface } from "./op.interface.mjs";

interface ProgramInterface
{
	code: Array<OperationInterface>;
	start: number;
}

export type { ProgramInterface };
