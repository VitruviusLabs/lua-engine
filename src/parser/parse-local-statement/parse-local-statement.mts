import { StatementKind } from "../../ast/definition/enum/statement-kind.enum.mjs";
import { ValueKind } from "../../ast/definition/enum/value-kind.enum.mjs";
import type { ExpressionInterface } from "../../ast/definition/interface/expression.interface.mjs";
import type { StatementInterface } from "../../ast/definition/interface/statement.interface.mjs";
import type { TokenStream } from "../../lexer.mjs";
import type { TokenInterface } from "../../lexer/definition/interface/token.interface.mjs";
import { to_error } from "../error/to-error.mjs";

function parse_local_statement(local: TokenInterface, values: Array<ExpressionInterface>): StatementInterface | Error
{
	const names: Array<TokenInterface | TokenStream> = [];

	for (const expression of values)
	{
		const value = expression.value;

		if (value === undefined || value.kind !== ValueKind.Variable)
		{
			return to_error(expression.token, "Invalid local name");
		}

		names.push(value.token);
	}

	return {
		kind: StatementKind.Local,
		local: {
			token: local,
			names: names,
		},
	};
}

export { parse_local_statement };
