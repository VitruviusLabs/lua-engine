import type { Chunk } from "../../../ast.mjs";
import type { Token } from "../../../lexer.mjs";
import type { ElseIfBlockInterface } from "./else-if-block.interface.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";

interface IfBlockInterface
{
	condition: ExpressionInterface;
	body: Chunk;
	else_if_bodies: Array<ElseIfBlockInterface>;
	else_body?: Chunk | undefined;
	token: Token;
}

export type { IfBlockInterface };
