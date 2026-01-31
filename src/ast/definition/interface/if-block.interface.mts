import type { Token } from "../../../lexer.mjs";
import type { ChunkInterface } from "./chunk.interface.mjs";
import type { ElseIfBlockInterface } from "./else-if-block.interface.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";

interface IfBlockInterface
{
	condition: ExpressionInterface;
	body: ChunkInterface;
	else_if_bodies: Array<ElseIfBlockInterface>;
	else_body?: ChunkInterface | undefined;
	token: Token;
}

export type { IfBlockInterface };
