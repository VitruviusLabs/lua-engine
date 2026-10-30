import { StatementKind } from "../../ast/definition/enum/statement-kind.enum.mjs";
import type { StatementInterface } from "../../ast/definition/interface/statement.interface.mjs";
import type { TokenStream } from "../../lexer.mjs";
import { TokenKind } from "../../lexer/definition/enum/token-kind.enum.mjs";
import { expect } from "../expect/expect.mjs";

function parse_break(stream: TokenStream): StatementInterface
{
	expect(stream, TokenKind.Break);

	return {
		kind: StatementKind.Break,
	};
}

export { parse_break };
