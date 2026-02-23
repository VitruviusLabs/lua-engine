import { State, type StateEnum } from "./lexer/definition/enum/state.enum.mjs";
import { TokenKind } from "./lexer/definition/enum/token-kind.enum.mjs";
import type { DebugInterface } from "./lexer/definition/interface/debug.interface.mjs";
import type { TokenInterface } from "./lexer/definition/interface/token.interface.mjs";
import { get_double_token } from "./lexer/get-double-token/get-double-token.mjs";
import { get_keyword } from "./lexer/get-keyword/get-keyword.mjs";
import { get_single_token } from "./lexer/get-single-token/get-single-token.mjs";

export class TokenStream
{
	public debug: DebugInterface = { line: -1, column: -1 };

	private readonly processing_stream: Array<string>;
	private readonly peek_queue: Array<TokenInterface>;

	private state: StateEnum;
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

	public feed(stream: string): void
	{
		this.processing_stream.push(...stream.split(""));
	}

	public next(): TokenInterface
	{
		if (this.peek_queue.length === 0)
		{
			this.peek();
		}

		return this.peek_queue.shift() as TokenInterface;
	}

	private getCurrent(): string
	{
		return this.processing_stream[0] ?? "\0";
	}

	private peekDouble(): string | undefined
	{
		if (this.processing_stream.length < 2)
		{
			return undefined;
		}

		return this.processing_stream.slice(0, 2).join("");
	}

	private consume(): void
	{
		if (this.processing_stream.length === 0)
		{
			return;
		}

		const current: string | undefined = this.processing_stream[0];

		this.processing_stream.shift();

		if (current === "\n")
		{
			++this.line;
			this.column = 1;

			return;
		}

		++this.column;
	}

	private start_token(): void
	{
		this.token_start_debug = {
			line: this.line,
			column: this.column,
		};

		this.buffer = "";
	}

	private initial(): void
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

		const current: string = this.getCurrent();

		if (/\s/.test(current))
		{
			this.consume();

			return;
		}

		const double: string | undefined = this.peekDouble();

		if (double !== undefined)
		{
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

			const double_token_type = get_double_token(double);

			if (double_token_type !== undefined)
			{
				this.peek_queue.push({
					data: double,
					kind: double_token_type,
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

		const single_token_type = get_single_token(current);

		if (single_token_type !== undefined)
		{
			this.peek_queue.push({
				data: current,
				kind: single_token_type,
				debug: {
					line: this.line,
					column: this.column,
				},
			});

			this.consume();

			return;
		}

		if (current === '"')
		{
			this.start_token();
			this.consume();
			this.state = State.StringLiteral;

			return;
		}

		if (/[a-zA-Z_]/.test(current))
		{
			this.start_token();
			this.state = State.Identifier;

			return;
		}

		if (/[0-9]/.test(current))
		{
			this.start_token();
			this.state = State.NumberLiteral;
		}
	}

	private read_string(): void
	{
		const current = this.getCurrent();

		if (current === "\0")
		{
			return;
		}

		this.consume();

		if (current === '"')
		{
			this.peek_queue.push({
				data: this.buffer,
				kind: TokenKind.StringLiteral,
				debug: this.token_start_debug,
			});

			this.state = State.Initial;

			return;
		}

		if (current === "\\")
		{
			this.state = State.StringLiteralEscape;

			return;
		}

		this.buffer = this.buffer + current;
	}

	private read_string_escape(): void
	{
		const current: string = this.getCurrent();

		this.consume();
		this.state = State.StringLiteral;

		switch (current)
		{
			case "n":
				this.buffer = `${this.buffer}\n`;
				break;

			case "0":
				this.buffer = `${this.buffer}\0`;
				break;

			case "r":
				this.buffer = `${this.buffer}\r`;
				break;

			case "t":
				this.buffer = `${this.buffer}\t`;
				break;

			default:
				this.buffer = this.buffer + current;
				break;
		}
	}

	private read_multi_line_string(): void
	{
		const current: string = this.getCurrent();
		const double: string | undefined = this.peekDouble();

		this.consume();

		if (double === "]]")
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

		this.buffer = this.buffer + current;
	}

	private read_identifier(): void
	{
		const current: string = this.getCurrent();

		if (!/[a-zA-Z0-9_]/.test(current))
		{
			const kind = get_keyword(this.buffer);

			this.peek_queue.push({
				data: this.buffer,
				kind: kind ?? TokenKind.Identifier,
				debug: this.token_start_debug,
			});

			this.state = State.Initial;

			return;
		}

		this.buffer = this.buffer + current;
		this.consume();
	}

	private number(): void
	{
		const current: string = this.getCurrent();

		if (/[0-9]/.test(current))
		{
			this.buffer = this.buffer + current;
			this.consume();

			return;
		}

		if (current === ".")
		{
			this.buffer = this.buffer + current;
			this.consume();
			this.state = State.NumberLiteralDot;

			return;
		}

		if (current === "e" || current === "E")
		{
			this.buffer = this.buffer + current;
			this.consume();
			this.state = State.NumberLiteralExp;

			return;
		}

		if (current === "x")
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

			this.buffer = this.buffer + current;
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

	private number_dot(): void
	{
		const current: string = this.getCurrent();

		if (/[0-9]/.test(current))
		{
			this.buffer = this.buffer + current;
			this.consume();

			return;
		}

		if (current === "e" || current === "E")
		{
			this.buffer = this.buffer + current;
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

	private number_exp_sign(): void
	{
		const current: string = this.getCurrent();

		if (/[0-9+-]/.test(current))
		{
			this.buffer = this.buffer + current;
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

	private number_exp(): void
	{
		const current: string = this.getCurrent();

		if (/[0-9]/.test(current))
		{
			this.buffer = this.buffer + current;
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

	private number_hex(): void
	{
		const current: string = this.getCurrent();

		if (/[0-9a-fA-F]/.test(current))
		{
			this.buffer = this.buffer + current;
			this.consume();

			return;
		}

		const hex_without_prefix: string = this.buffer.slice(2);

		this.peek_queue.push({
			data: parseInt(hex_without_prefix, 16).toString(),
			kind: TokenKind.NumberLiteral,
			debug: this.token_start_debug,
		});

		this.state = State.Initial;
	}

	private comment(): void
	{
		const current: string = this.getCurrent();

		this.consume();

		if (current === "\n")
		{
			this.state = State.Initial;
		}
	}

	private on_char(): void
	{
		const current: string = this.getCurrent();

		if (current === "\0")
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
}
