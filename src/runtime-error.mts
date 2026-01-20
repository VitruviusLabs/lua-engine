import type { Debug } from "./lexer.mjs";

class RuntimeError extends Error
{
	protected readonly line: number | undefined = undefined;
	protected readonly column: number | undefined = undefined;

	public constructor(message: string, options?: ErrorOptions, debug?: Debug)
	{
		super(message, options);

		this.name = "RuntimeError";
		this.line = debug?.line;
		this.column = debug?.column;
	}

	public getLine(): number | undefined
	{
		return this.line;
	}

	public getColumn(): number | undefined
	{
		return this.column;
	}

	public getMessage(): string
	{
		if (this.line === undefined || this.column === undefined)
		{
			return this.message;
		}

		return `${ this.line }:${ this.column }: ${ this.message }`
	}
}

export { RuntimeError };
