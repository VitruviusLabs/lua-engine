import type { DebugInterface } from "./lexer/definition/interface/debug.interface.mjs";

class RuntimeError extends Error
{
	protected readonly line: number | undefined = undefined;
	protected readonly column: number | undefined = undefined;

	public constructor(message: string, options?: ErrorOptions, debug?: DebugInterface)
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

		return `${this.line.toFixed(0)}:${this.column.toFixed(0)}: ${this.message}`;
	}
}

export { RuntimeError };
