function build_replacement(input: string): string
{
	const percent_placeholder: string = "¶¹¶²¶³¶";

	let output: string = input;

	output = output.replaceAll("%%", percent_placeholder);

	// eslint-disable-next-line prefer-named-capture-group
	output = output.replaceAll(/%(\d+)/g, "$$$1");

	output = output.replaceAll(percent_placeholder, "%");

	return output;
}

export { build_replacement };
