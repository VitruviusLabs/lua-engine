import type { OpInterface } from "./op.interface.mjs";

interface ProgramInterface {
	code: Array<OpInterface>;
	start: number;
}

export type { ProgramInterface };
