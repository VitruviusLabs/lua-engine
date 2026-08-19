import type { TokenInterface } from "../../../lexer/definition/interface/token.interface.mjs";
import type { ChunkInterface } from "./chunk.interface.mjs";
import type { ExpressionInterface } from "./expression.interface.mjs";

interface RepeatInterface
{
	body: ChunkInterface;
	condition: ExpressionInterface;
	token: TokenInterface;
}

export type { RepeatInterface };
