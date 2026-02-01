import type { ChunkInterface } from "../../ast/definition/interface/chunk.interface.mjs";
import type { TokenStream } from "../../lexer.mjs";
import { TokenKind, type TokenKindEnum } from "../../lexer/definition/enum/token-kind.enum.mjs";
import { parse_statement } from "../parse-statement/parse-statement.mjs";

function parse(stream: TokenStream, ...end_tokens: Array<TokenKindEnum>): ChunkInterface | Error
{
	const chunk: ChunkInterface = { statements: [] };

	if (end_tokens.length === 0)
	{
		end_tokens.push(TokenKind.EOF);
	}

	for (;;)
	{
		const statement = parse_statement(stream, end_tokens);

		if (statement === undefined)
		{
			break;
		}

		if (statement instanceof Error)
		{
			return statement;
		}

		chunk.statements.push(statement);
	}

	return chunk;
}

export { parse };
