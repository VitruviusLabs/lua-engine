import type { TokenKindEnum } from "../enum/token-kind.enum.mjs";
import type { DebugInterface } from "./debug.interface.mjs";

interface TokenInterface {
	data: string;
	kind: TokenKindEnum;
	debug: DebugInterface;
}

export type { TokenInterface };
