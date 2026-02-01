import { State, type StateEnum } from "./lexer/definition/enum/state.enum.mjs";
import { TokenKind, type TokenKindEnum } from "./lexer/definition/enum/token-kind.enum.mjs";
import type { DebugInterface } from "./lexer/definition/interface/debug.interface.mjs";
import type { TokenInterface } from "./lexer/definition/interface/token.interface.mjs";

const single_token_map: Map<string, TokenKindEnum> = new Map([
	["(", TokenKind.OpenBrace],
	[")", TokenKind.CloseBrace],
	["[", TokenKind.OpenSquare],
	["]", TokenKind.CloseSquare],
	["{", TokenKind.SquiglyOpen],
	["}", TokenKind.SquiglyClose],

	["+", TokenKind.Addition],
	["-", TokenKind.Subtract],
	["*", TokenKind.Multiply],
	["/", TokenKind.Division],
	["%", TokenKind.Modulo],
	["^", TokenKind.Exponent],
	["&", TokenKind.BitAnd],
	["|", TokenKind.BitOr],
	["~", TokenKind.BitXOrNot],

	["<", TokenKind.LessThan],
	[">", TokenKind.GreaterThan],

	["=", TokenKind.Assign],
	[";", TokenKind.Semicolon],
	[",", TokenKind.Comma],
	[".", TokenKind.Dot],
	["#", TokenKind.Hash],
]);

const double_token_map: Map<string, TokenKindEnum> = new Map([
	["==", TokenKind.Equals],
	["<=", TokenKind.LessThanEquals],
	[">=", TokenKind.GreaterThanEquals],
	["~=", TokenKind.NotEquals],
	["..", TokenKind.Concat],
	["//", TokenKind.FloorDivision],
	["<<", TokenKind.BitShiftLeft],
	[">>", TokenKind.BitShiftRight],
]);

const keyword_map: Map<string, TokenKindEnum> = new Map([
	["function", TokenKind.FunctionLike],
	["if", TokenKind.If],
	["while", TokenKind.While],
	["for", TokenKind.For],
	["repeat", TokenKind.Repeat],
	["in", TokenKind.In],
	["do", TokenKind.Do],
	["then", TokenKind.Then],
	["elseif", TokenKind.ElseIf],
	["else", TokenKind.Else],
	["until", TokenKind.Until],
	["end", TokenKind.End],
	["return", TokenKind.Return],
	["break", TokenKind.Break],

	["and", TokenKind.And],
	["or", TokenKind.Or],
	["not", TokenKind.Not],

	["true", TokenKind.BooleanLiteral],
	["false", TokenKind.BooleanLiteral],
	["nil", TokenKind.NilLiteral],
	["local", TokenKind.Local],
]);

export class TokenStream
{
	public debug: DebugInterface = { line: -1, column: -1 };

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
		this.state = State.Initial;
		this.processing_stream = [];
		this.buffer = "";
		this.token_start_debug = { line: 0, column: 0 };

		this.line = 1;
		this.column = 1;
		this.peek_queue = [];
	}

	public peek(count: number = 1): TokenInterface
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
				kind: TokenKind.EOF,
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
				this.state = State.Comment;

				return;
			}

			if (double === "[[")
			{
				this.state = State.MultiLineString;
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
			this.state = State.StringLiteral;

			return;
		}

		if (/[a-zA-Z_]/.test(c))
		{
			this.start_token();
			this.state = State.Identifier;

			return;
		}

		if (/[0-9]/.test(c))
		{
			this.start_token();
			this.state = State.NumberLiteral;
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
				kind: TokenKind.StringLiteral,
				debug: this.token_start_debug,
			});

			this.state = State.Initial;

			return;
		}

		if (c === "\\")
		{
			this.state = State.StringLiteralEscape;

			return;
		}

		this.buffer = this.buffer + c;
	}

	private read_string_escape()
	{
		const c = this.current();

		this.consume();
		this.state = State.StringLiteral;

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
				kind: TokenKind.StringLiteral,
				debug: this.token_start_debug,
			});

			this.consume();
			this.state = State.Initial;

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
				kind: kind ?? TokenKind.Identifier,
				debug: this.token_start_debug,
			});

			this.state = State.Initial;

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
			this.state = State.NumberLiteralDot;

			return;
		}

		if (c === "e" || c === "E")
		{
			this.buffer = this.buffer + c;
			this.consume();
			this.state = State.NumberLiteralExp;

			return;
		}

		if (c === "x")
		{
			if (this.buffer !== "0")
			{
				this.peek_queue.push({
					data: this.buffer,
					kind: TokenKind.NumberLiteral,
					debug: this.token_start_debug,
				});

				this.state = State.Initial;

				return;
			}

			this.buffer = this.buffer + c;
			this.state = State.NumberHex;
			this.consume();

			return;
		}

		this.peek_queue.push({
			data: this.buffer,
			kind: TokenKind.NumberLiteral,
			debug: this.token_start_debug,
		});

		this.state = State.Initial;
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
			this.state = State.NumberLiteralExpSign;
			this.consume();

			return;
		}

		this.peek_queue.push({
			data: this.buffer,
			kind: TokenKind.NumberLiteral,
			debug: this.token_start_debug,
		});

		this.state = State.Initial;
	}

	private number_exp_sign()
	{
		const c = this.current() ?? "\0";

		if (/[0-9+-]/.test(c))
		{
			this.buffer = this.buffer + c;
			this.consume();
			this.state = State.NumberLiteralExp;

			return;
		}

		this.peek_queue.push({
			data: this.buffer,
			kind: TokenKind.NumberLiteral,
			debug: this.token_start_debug,
		});

		this.state = State.Initial;
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
			kind: TokenKind.NumberLiteral,
			debug: this.token_start_debug,
		});

		this.state = State.Initial;
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
			kind: TokenKind.NumberLiteral,
			debug: this.token_start_debug,
		});

		this.state = State.Initial;
	}

	private comment()
	{
		const c = this.current();

		this.consume();

		if (c === "\n")
		{
			this.state = State.Initial;
		}
	}

	private on_char()
	{
		if (this.current() === undefined)
		{
			this.peek_queue.push({
				data: "",
				kind: this.state === State.Initial
					? TokenKind.EOF
					: TokenKind.NotFinished,
				debug: {
					line: this.line,
					column: this.column,
				},
			});

			return;
		}

		switch (this.state)
		{
			case State.Initial:
				this.initial();
				break;
			case State.Identifier:
				this.read_identifier();
				break;
			case State.StringLiteral:
				this.read_string();
				break;
			case State.StringLiteralEscape:
				this.read_string_escape();
				break;
			case State.MultiLineString:
				this.read_multi_line_string();
				break;
			case State.NumberLiteral:
				this.number();
				break;
			case State.NumberLiteralDot:
				this.number_dot();
				break;
			case State.NumberLiteralExpSign:
				this.number_exp_sign();
				break;
			case State.NumberLiteralExp:
				this.number_exp();
				break;
			case State.NumberHex:
				this.number_hex();
				break;
			case State.Comment:
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
