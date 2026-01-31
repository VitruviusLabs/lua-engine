import type { TokenInterface } from "../../lexer/definition/interface/token.interface.mjs";

function to_error(token: TokenInterface, message: string): Error
{
	return new Error(
		`${token.debug.line.toFixed(0)}:${token.debug.column.toFixed(0)}: ${message}`
	);
}

export { to_error };
