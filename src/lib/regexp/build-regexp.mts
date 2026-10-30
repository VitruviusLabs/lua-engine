/**
 * Warning: doesn't handle predefined groups inside square brackets
*/
function build_regexp(input: string): RegExp
{
	const groups: Array<[string, string]> = [
		["%a", "[A-Za-z]"],
		["%A", "[^A-Za-z]"],
		["%c", "[\x00-\x1F\x7F]"],
		["%C", "[^\x00-\x1F\x7F]"],
		["%d", "[0-9]"],
		["%D", "[^0-9]"],
		["%g", "[\x00-\x20\x7F]"],
		["%G", "[^\x00-\x20\x7F]"],
		["%l", "[a-z]"],
		["%L", "[^a-z]"],
		["%p", "[\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]"],
		["%P", "[^\x21-\x2F\x3A-\x40\x5B-\x60\x7B-\x7E]"],
		["%s", "[ \t\r\n\v\f]"],
		["%S", "[^ \t\r\n\v\f]"],
		["%u", "[A-Z]"],
		["%U", "[^A-Z]"],
		["%w", "[0-9A-Za-z]"],
		["%W", "[^0-9A-Za-z]"],
		["%x", "[0-9A-Fa-f]"],
		["%X", "[^0-9A-Fa-f]"],
		["%.", String.raw`\.`],
	];

	let output: string = input;

	for (const group of groups)
	{
		output = output.replaceAll(group[0], group[1]);
	}

	output = output.replaceAll("\\", String.raw`\\`);

	// eslint-disable-next-line prefer-named-capture-group
	output = output.replaceAll(/%(.)/g, "$1");

	const regexp: RegExp = new RegExp(output);

	return regexp;
}

export { build_regexp };
