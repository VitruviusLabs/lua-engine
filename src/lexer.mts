import { StateEnum } from "./lexer/definition/enum/state.enum.mjs";
import { TokenKindEnum } from "./lexer/definition/enum/token-kind.enum.mjs";
import type { DebugInterface } from "./lexer/definition/interface/debug.interface.mjs";
import type { TokenInterface } from "./lexer/definition/interface/token.interface.mjs";

const single_token_map: Map<string, TokenKindEnum> = new Map([
	["(", TokenKindEnum.OpenBrace],
	[")", TokenKindEnum.CloseBrace],
	["[", TokenKindEnum.OpenSquare],
	["]", TokenKindEnum.CloseSquare],
	["{", TokenKindEnum.SquiglyOpen],
	["}", TokenKindEnum.SquiglyClose],

	["+", TokenKindEnum.Addition],
	["-", TokenKindEnum.Subtract],
	["*", TokenKindEnum.Multiply],
	["/", TokenKindEnum.Division],
	["%", TokenKindEnum.Modulo],
	["^", TokenKindEnum.Exponent],
	["&", TokenKindEnum.BitAnd],
	["|", TokenKindEnum.BitOr],
	["~", TokenKindEnum.BitXOrNot],

	["<", TokenKindEnum.LessThan],
	[">", TokenKindEnum.GreaterThan],

	["=", TokenKindEnum.Assign],
	[";", TokenKindEnum.Semicolon],
	[",", TokenKindEnum.Comma],
	[".", TokenKindEnum.Dot],
	["#", TokenKindEnum.Hash],
]);

const double_token_map: Map<string, TokenKindEnum> = new Map([
	["==", TokenKindEnum.Equals],
	["<=", TokenKindEnum.LessThanEquals],
	[">=", TokenKindEnum.GreaterThanEquals],
	["~=", TokenKindEnum.NotEquals],
	["..", TokenKindEnum.Concat],
	["//", TokenKindEnum.FloorDivision],
	["<<", TokenKindEnum.BitShiftLeft],
	[">>", TokenKindEnum.BitShiftRight],
]);

const keyword_map: Map<string, TokenKindEnum> = new Map([
	["function", TokenKindEnum.FunctionLike],
	["if", TokenKindEnum.If],
	["while", TokenKindEnum.While],
	["for", TokenKindEnum.For],
	["repeat", TokenKindEnum.Repeat],
	["in", TokenKindEnum.In],
	["do", TokenKindEnum.Do],
	["then", TokenKindEnum.Then],
	["elseif", TokenKindEnum.ElseIf],
	["else", TokenKindEnum.Else],
	["until", TokenKindEnum.Until],
	["end", TokenKindEnum.End],
	["return", TokenKindEnum.Return],
	["break", TokenKindEnum.Break],

	["and", TokenKindEnum.And],
	["or", TokenKindEnum.Or],
	["not", TokenKindEnum.Not],

	["true", TokenKindEnum.BooleanLiteral],
	["false", TokenKindEnum.BooleanLiteral],
	["nil", TokenKindEnum.NilLiteral],
	["local", TokenKindEnum.Local],
]);

export class TokenStream
{
	private readonly processing_stream: Array<string>;
	private readonly peek_queue: Array<TokenInterface>;

	private state: StateEnum;
	private end_of_stream: boolean = false;
	private buffer: string;
	private token_start_debug: DebugInterface;

	private line: number;
	private column: number;

	public constructor()
	{
		this.state = StateEnum.Initial;
		this.processing_stream = [];
		this.buffer = "";
		this.token_start_debug = { line: 0, column: 0 };

		this.line = 1;
		this.column = 1;
		this.peek_queue = [];
	}

	public peek(count = 1): TokenInterface
	{
		while (this.peek_queue.length < count)
		{
			this.on_char();
		}

		const token = this.peek_queue[count - 1];

		if (token === undefined)
		{
			throw new Error();
		}

		return token;
	}

	private current(): string | undefined
	{
		if (this.processing_stream.length > 0)
		{
			return this.processing_stream[0];
		}

		if (this.end_of_stream)
		{
			return undefined;
		}

		this.end_of_stream = true;

		return "\0";
	}

	private consume()
	{
		if (this.processing_stream.length <= 0)
		{
			return;
		}

		this.column = this.column + 1;

		if (this.processing_stream.shift() === "\n")
		{
			this.line = this.line + 1;
			this.column = 1;
		}
	}

	private start_token()
	{
		this.token_start_debug = {
			line: this.line,
			column: this.column,
		};

		this.buffer = "";
	}

	private initial()
	{
		if (this.processing_stream.length === 0)
		{
			this.peek_queue.push({
				data: "",
				kind: TokenKindEnum.EOF,
				debug: {
					line: this.line,
					column: this.column,
				},
			});

			return;
		}

		const c = this.current() ?? "\0";

		if (/\s/.test(c))
			{
this.consume();

 return;
}

		if (this.processing_stream.length > 1)
		{
			const double = c + this.processing_stream[1];

			if (double === "--")
			{
				this.state = StateEnum.Comment;

				return;
			}

			if (double === "[[")
			{
				this.state = StateEnum.MultiLineString;
				this.start_token();
				this.consume();
				this.consume();

				return;
			}

			const dobule_token_type = double_token_map.get(double);

			if (dobule_token_type !== undefined)
			{
				this.peek_queue.push({
					data: double,
					kind: dobule_token_type,
					debug: {
						line: this.line,
						column: this.column,
					},
				});

				this.consume();
				this.consume();

				return;
			}
		}

		const single_token_type = single_token_map.get(c);

		if (single_token_type !== undefined)
		{
			this.peek_queue.push({
				data: c,
				kind: single_token_type,
				debug: {
					line: this.line,
					column: this.column,
				},
			});

			this.consume();

			return;
		}

		if (c === '"')
		{
			this.start_token();
			this.consume();
			this.state = StateEnum.StringLiteral;

			return;
		}

		if (/[a-zA-Z_]/.test(c))
		{
			this.start_token();
			this.state = StateEnum.Identifier;

			return;
		}

		if (/[0-9]/.test(c))
		{
			this.start_token();
			this.state = StateEnum.NumberLiteral;
		}
	}

	private read_string()
	{
		const c = this.current();

		this.consume();

		if (c === '"')
		{
			this.peek_queue.push({
				data: this.buffer,
				kind: TokenKindEnum.StringLiteral,
				debug: this.token_start_debug,
			});

			this.state = StateEnum.Initial;

			return;
		}

		if (c === "\\")
		{
			this.state = StateEnum.StringLiteralEscape;

			return;
		}

		this.buffer = this.buffer + c;
	}

	private read_string_escape()
	{
		const c = this.current();

		this.consume();
		this.state = StateEnum.StringLiteral;

		switch (c)
		{
			case "n": this.buffer = `${this.buffer}\n`; break;
			case "0": this.buffer = `${this.buffer}\0`; break;
			case "r": this.buffer = `${this.buffer}\r`; break;
			case "t": this.buffer = `${this.buffer}\t`; break;

			default:
				this.buffer = this.buffer + c;
				break;
		}
	}

	private read_multi_line_string()
	{
		const c = this.current() ?? "\0";

		this.consume();

		if (c + this.current() === "]]")
		{
			this.peek_queue.push({
				data: this.buffer,
				kind: TokenKindEnum.StringLiteral,
				debug: this.token_start_debug,
			});

			this.consume();
			this.state = StateEnum.Initial;

			return;
		}

		this.buffer = this.buffer + c;
	}

	private read_identifier()
	{
		const c = this.current() ?? "\0";

		if (!/[a-zA-Z0-9_]/.test(c))
		{
			const kind = keyword_map.get(this.buffer);

			this.peek_queue.push({
				data: this.buffer,
				kind: kind ?? TokenKindEnum.Identifier,
				debug: this.token_start_debug,
			});

			this.state = StateEnum.Initial;

			return;
		}

		this.buffer = this.buffer + c;
		this.consume();
	}

	private number()
	{
		const c = this.current() ?? "\0";

		if (/[0-9]/.test(c))
		{
			this.buffer = this.buffer + c;
			this.consume();

			return;
		}

		if (c === ".")
		{
			this.buffer = this.buffer + c;
			this.consume();
			this.state = StateEnum.NumberLiteralDot;

			return;
		}

		if (c === "e" || c === "E")
		{
			this.buffer = this.buffer + c;
			this.consume();
			this.state = StateEnum.NumberLiteralExp;

			return;
		}

		if (c === "x")
		{
			if (this.buffer !== "0")
			{
				this.peek_queue.push({
					data: this.buffer,
					kind: TokenKindEnum.NumberLiteral,
					debug: this.token_start_debug,
				});

				this.state = StateEnum.Initial;

				return;
			}

			this.buffer = this.buffer + c;
			this.state = StateEnum.NumberHex;
			this.consume();

			return;
		}

		this.peek_queue.push({
			data: this.buffer,
			kind: TokenKindEnum.NumberLiteral,
			debug: this.token_start_debug,
		});

		this.state = StateEnum.Initial;
	}

	private number_dot()
	{
		const c = this.current() ?? "\0";

		if (/[0-9]/.test(c))
		{
			this.buffer = this.buffer + c;
			this.consume();

			return;
		}

		if (c === "e" || c === "E")
		{
			this.buffer = this.buffer + c;
			this.state = StateEnum.NumberLiteralExpSign;
			this.consume();

			return;
		}

		this.peek_queue.push({
			data: this.buffer,
			kind: TokenKindEnum.NumberLiteral,
			debug: this.token_start_debug,
		});

		this.state = StateEnum.Initial;
	}

	private number_exp_sign()
	{
		const c = this.current() ?? "\0";

		if (/[0-9+-]/.test(c))
		{
			this.buffer = this.buffer + c;
			this.consume();
			this.state = StateEnum.NumberLiteralExp;

			return;
		}

		this.peek_queue.push({
			data: this.buffer,
			kind: TokenKindEnum.NumberLiteral,
			debug: this.token_start_debug,
		});

		this.state = StateEnum.Initial;
	}

	private number_exp()
	{
		const c = this.current() ?? "\0";

		if (/[0-9]/.test(c))
		{
			this.buffer = this.buffer + c;
			this.consume();

			return;
		}

		this.peek_queue.push({
			data: this.buffer,
			kind: TokenKindEnum.NumberLiteral,
			debug: this.token_start_debug,
		});

		this.state = StateEnum.Initial;
	}

	private number_hex()
	{
		const c = this.current() ?? "\0";

		if (/[0-9a-fA-F]/.test(c))
		{
			this.buffer = this.buffer + c;
			this.consume();

			return;
		}

		this.peek_queue.push({
			data: parseInt(this.buffer.slice(2), 16).toString(),
			kind: TokenKindEnum.NumberLiteral,
			debug: this.token_start_debug,
		});

		this.state = StateEnum.Initial;
	}

	private comment()
	{
		const c = this.current();

		this.consume();

		if (c === "\n")
		{
			this.state = StateEnum.Initial;
		}
	}

	private on_char()
	{
		if (this.current() === undefined)
		{
			this.peek_queue.push({
				data: "",
				kind: this.state === StateEnum.Initial
					? TokenKindEnum.EOF
					: TokenKindEnum.NotFinished,
				debug: {
					line: this.line,
					column: this.column,
				},
			});

			return;
		}

		switch (this.state)
		{
			case StateEnum.Initial:
				this.initial();
				break;
			case StateEnum.Identifier:
				this.read_identifier();
				break;
			case StateEnum.StringLiteral:
				this.read_string();
				break;
			case StateEnum.StringLiteralEscape:
				this.read_string_escape();
				break;
			case StateEnum.MultiLineString:
				this.read_multi_line_string();
				break;
			case StateEnum.NumberLiteral:
				this.number();
				break;
			case StateEnum.NumberLiteralDot:
				this.number_dot();
				break;
			case StateEnum.NumberLiteralExpSign:
				this.number_exp_sign();
				break;
			case StateEnum.NumberLiteralExp:
				this.number_exp();
				break;
			case StateEnum.NumberHex:
				this.number_hex();
				break;
			case StateEnum.Comment:
				this.comment();
				break;
		}
	}

	feed(stream: string)
	{
		this.processing_stream.push(...stream.split(""));
		this.end_of_stream = false;
	}

	next(): TokenInterface
	{
		if (this.peek_queue.length === 0)
		{
			this.peek();
		}

		return this.peek_queue.shift() as TokenInterface;
	}
}
