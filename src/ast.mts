import type { StatementKindEnum } from "./ast/definition/enum/statement-kind.enum.mjs";
import type { LuaFunctionInterface } from "./ast/definition/interface/lua-function.interface.mjs";
import type { Token } from "./lexer.mjs";

export interface Value
{
	kind: ValueKind;
	token: Token;

	number?: number | undefined;
	boolean?: boolean | undefined;
	string?: string | undefined;
	table?: Map<Expression, Expression> | undefined;
	function?: LuaFunctionInterface | undefined;
	identifier?: string | undefined;
}

export interface Expression
{
	kind: ExpressionKind;
	token: Token;

	lhs?: Expression;
	rhs?: Expression;
	value?: Value;
	expression?: Expression;
	index?: Expression;
	arguments?: Array<Expression>;
}

export interface Assignment
{
	local: boolean;
	lhs: Array<Expression>;
	rhs: Array<Expression>;
	token: Token;
}

export interface Local
{
	names: Array<Token>;
	token: Token;
}

export interface ElseIfBlock
{
	body: Chunk;
	condition: Expression;
	token: Token;
}

export interface IfBlock
{
	condition: Expression;
	body: Chunk;
	else_if_bodies: Array<ElseIfBlock>;
	else_body?: Chunk | undefined;
	token: Token;
}

export interface While
{
	condition: Expression;
	body: Chunk;
	token: Token;
}

export interface For
{
	items: Array<Token>;
	iterator: Expression;
	body: Chunk;
	token: Token;
}

export interface NumericFor
{
	index: Token;
	start: Expression;
	end: Expression;
	step: Expression | undefined;
	body: Chunk;
}

export interface Repeat
{
	body: Chunk;
	condition: Expression;
	token: Token;
}

export interface Do
{
	body: Chunk;
	token: Token;
}

export interface Return
{
	values: Array<Expression>;
	token: Token;
}

export interface Statement
{
	kind: StatementKindEnum;
	expression?: Expression | undefined;
	assignment?: Assignment | undefined;
	local?: Local | undefined;
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
