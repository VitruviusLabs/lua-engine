import { assertArray, assertDefined, isNullish } from "@vitruvius-labs/ts-predicate";
import type { Engine } from "./engine.mjs";
import { make_variable } from "./runtime.mjs";
import { VariableKind } from "./variable/definition/enum/variable-kind.enum.mjs";
import type { Variable } from "./variable/definition/type/variable.type.mjs";
import type { NativeFunction } from "./boundary/definition/type/native-function.type.mjs";
import { VariableUnwrapUtility } from "./variable/unwrap-variable.mjs";
import type { VariableNativeFunction } from "./variable/definition/interface/variable-native-function.interface.mjs";
import { handle_error } from "./create-binding/handle-error/handle-error.mjs";

export const ParameterOptionEnum = {
	REQUIRED: "required",
	OPTIONAL: "optional",
	VARIADIC: "variadic",
} as const satisfies Record<string, string>;

export type ParameterOptionEnum = typeof ParameterOptionEnum[keyof typeof ParameterOptionEnum];

export interface ParameterDescriptorInterface<T = unknown>
{
	test: (value: unknown) => asserts value is T;
	option?: ParameterOptionEnum;
}

function sanitize_parameters(input: Array<unknown>, descriptors: Array<ParameterDescriptorInterface>): Array<unknown>
{
	const output: Array<unknown> = [];

	for (let i = 0; i < descriptors.length; ++i)
	{
		const descriptor: ParameterDescriptorInterface | undefined = descriptors.at(i);

		assertDefined(descriptor);

		const option: ParameterOptionEnum = descriptor.option ?? ParameterOptionEnum.REQUIRED;

		if (option === ParameterOptionEnum.VARIADIC)
		{
			const variadic_args: Array<unknown> = input.slice(i);

			assertArray(variadic_args, descriptor.test);

			output.push(...variadic_args);

			break;
		}

		const parameter_value: unknown = input.at(i);

		if (isNullish(parameter_value))
		{
			if (option === ParameterOptionEnum.REQUIRED)
			{
				throw new Error(`Missing required parameter at index ${i.toFixed(0)}.`);
			}

			output.push(undefined);

			continue;
		}

		// @ts-expect-error: We cannot know which type is expected
		descriptor.test(parameter_value);

		output.push(parameter_value);
	}

	return output;
}

export function make_function(callable: (...args: Array<unknown>) => unknown, parameters_descriptor: Array<ParameterDescriptorInterface>): VariableNativeFunction
{
	// @ts-expect-error: engine is unused for now.
	const proxy_function: NativeFunction = async (engine: Engine, ...args: Array<Variable>): Promise<Array<Variable>> =>
	{
		try
		{
			const unwrapped_args: Array<unknown> = args.map(VariableUnwrapUtility.unwrap);
			const sanitized_args: Array<unknown> = sanitize_parameters(unwrapped_args, parameters_descriptor);
			const result: unknown = await callable(...sanitized_args);
			const variable: Variable = make_variable(result);

			return [variable];
		}
		catch (error: unknown)
		{
			handle_error(error, callable);
		}
	};

	// Bypass readonly constraint
	Object.defineProperty(proxy_function, "name", { value: callable.name });

	return {
		data_type: VariableKind.NativeFunction,
		native_function: proxy_function,
	};
}
