import type { Chunk } from "../../../ast.mjs";
import type { Token } from "../../../lexer.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";

interface ElseIfBlockInterface
{
	body: Chunk;
	condition: ExpressionInterface;
	token: Token;
}

export type { ElseIfBlockInterface };
