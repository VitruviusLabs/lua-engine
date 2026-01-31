import type { Chunk } from "../../../ast.mjs";
import type { Token } from "../../../lexer.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";

interface WhileInterface
{
	condition: ExpressionInterface;
	body: Chunk;
	token: Token;
}

export type { WhileInterface };
