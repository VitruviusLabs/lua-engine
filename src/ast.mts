import type { StatementKindEnum } from "./ast/definition/enum/statement-kind.enum.mjs";
import type { AssignmentInterface } from "./ast/definition/interface/assignment.interface.mjs";
import type { ExpressionInterface } from "./ast/definition/interface/expression.interface.mjs";
import type { ForInterface } from "./ast/definition/interface/for.interface.mjs";
import type { IfBlockInterface } from "./ast/definition/interface/if-block.interface.mjs";
import type { LocalInterface } from "./ast/definition/interface/local.interface.mjs";
import type { NumericForInterface } from "./ast/definition/interface/numeric-for.interface.mjs";
import type { WhileInterface } from "./ast/definition/interface/while.interface.mjs";
import type { Token } from "./lexer.mjs";

export interface Repeat
{
	body: Chunk;
	condition: ExpressionInterface;
	token: Token;
}

export interface Do
{
	body: Chunk;
	token: Token;
}

export interface Return
{
	values: Array<ExpressionInterface>;
	token: Token;
}

export interface Statement
{
	kind: StatementKindEnum;
	expression?: ExpressionInterface | undefined;
	assignment?: AssignmentInterface | undefined;
	local?: LocalInterface | undefined;
	if?: IfBlockInterface | undefined;
	while?: WhileInterface | undefined;
	for?: ForInterface | undefined;
	numeric_for?: NumericForInterface | undefined;
	repeat?: Repeat | undefined;
	do?: Do | undefined;
	return?: Return | undefined;
}

export interface Chunk
{
	statements: Array<Statement>;
}
