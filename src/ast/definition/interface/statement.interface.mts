import type { StatementKindEnum } from "../enum/statement-kind.enum.mjs";
import type { AssignmentInterface } from "./assignment.interface.mjs";
import type { DoInterface } from "./do.interface.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";
import type { ForInterface } from "./for.interface.mjs";
import type { IfBlockInterface } from "./if-block.interface.mjs";
import type { LocalInterface } from "./local.interface.mjs";
import type { NumericForInterface } from "./numeric-for.interface.mjs";
import type { RepeatInterface } from "./repeat.interface.mjs";
import type { ReturnInterface } from "./return.interface.mjs";
import type { WhileInterface } from "./while.interface.mjs";

interface StatementInterface
{
	kind: StatementKindEnum;
	expression?: ExpressionInterface | undefined;
	assignment?: AssignmentInterface | undefined;
	local?: LocalInterface | undefined;
	if?: IfBlockInterface | undefined;
	while?: WhileInterface | undefined;
	for?: ForInterface | undefined;
	numeric_for?: NumericForInterface | undefined;
	repeat?: RepeatInterface | undefined;
	do?: DoInterface | undefined;
	return?: ReturnInterface | undefined;
}

export type { StatementInterface };
