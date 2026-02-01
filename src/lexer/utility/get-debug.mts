import type { DebugInterface } from "../definition/interface/debug.interface.mjs";
import type { TokenInterface } from "../definition/interface/token.interface.mjs";
import { TokenStream } from "../../lexer.mjs";

function getDebug(token: TokenInterface | TokenStream): DebugInterface
{
	if (token instanceof TokenStream)
	{
		return token.peek().debug;
	}

	return token.debug;
}

export { getDebug };
