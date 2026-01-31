import type { StatementKindEnum } from "./ast/definition/enum/statement-kind.enum.mjs";
import type { AssignmentInterface } from "./ast/definition/interface/assignment.interface.mjs";
import type { ElseIfBlockInterface } from "./ast/definition/interface/else-if-block.interface.mjs";
import type { ExpressionInterface } from "./ast/definition/interface/expression.interface.mjs";
import type { LocalInterface } from "./ast/definition/interface/local.interface.mjs";
import type { Token } from "./lexer.mjs";

export interface IfBlock
{
	condition: ExpressionInterface;
	body: Chunk;
	else_if_bodies: Array<ElseIfBlockInterface>;
	else_body?: Chunk | undefined;
	token: Token;
}

export interface While
{
	condition: ExpressionInterface;
	body: Chunk;
	token: Token;
}

export interface For
{
	items: Array<Token>;
	iterator: ExpressionInterface;
	body: Chunk;
	token: Token;
}

export interface NumericFor
{
	index: Token;
	start: ExpressionInterface;
	end: ExpressionInterface;
	step: ExpressionInterface | undefined;
	body: Chunk;
}

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
	if?: IfBlock | undefined;
	while?: While | undefined;
	for?: For | undefined;
	numeric_for?: NumericFor | undefined;
	repeat?: Repeat | undefined;
	do?: Do | undefined;
	return?: Return | undefined;
}

export interface Chunk
{
	statements: Array<Statement>;
}
