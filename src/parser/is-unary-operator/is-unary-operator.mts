import { isEnumValue } from "@vitruvius-labs/ts-predicate";
import { TokenKind, type TokenKindEnum } from "../../lexer/definition/enum/token-kind.enum.mjs";

type UnaryOperatorTokenKind = (
    | typeof TokenKind.Not
    | typeof TokenKind.Subtract
    | typeof TokenKind.Hash
);

function isUnaryOperatorToken(token: TokenKindEnum): token is UnaryOperatorTokenKind
{
    return isEnumValue(token, [
        TokenKind.Not,
        TokenKind.Subtract,
        TokenKind.Hash,
    ]);
}

export { isUnaryOperatorToken };

