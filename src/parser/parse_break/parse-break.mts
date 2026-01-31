import { StatementKindEnum } from "../../ast/definition/enum/statement-kind.enum.mjs";
import type { StatementInterface } from "../../ast/definition/interface/statement.interface.mjs";
import type { TokenStream } from "../../lexer.mjs";
import { TokenKindEnum } from "../../lexer/definition/enum/token-kind.enum.mjs";
import { expect } from "../expect/expect.mjs";

function parse_break(stream: TokenStream): StatementInterface | Error
{
	const break_token = expect(stream, TokenKindEnum.Break);

	if (break_token instanceof Error)
	{
		return break_token;
	}

	return {
		kind: StatementKindEnum.Break,
	};
}

export { parse_break };
