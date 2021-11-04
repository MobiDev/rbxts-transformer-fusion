/// <reference types="@rbxts/types" />

import { Computed } from "@rbxts/fusion";

type lowercaseCreatableInstances = {
	[P in keyof CreatableInstances as Lowercase<P>]: CreatableInstances[P];
};


declare global {
	namespace JSX {
		type Element = Instance
		export type JsxInstance<T extends Instance> = {
			[P in WritablePropertyNames<T>]?: T[P] | Computed<T[P]>;
		} & {
			OnEvent?: Partial<{
				[K in InstanceEventNames<T>]: T[K] extends RBXScriptSignal<infer C>
					? (...args: Parameters<C>) => void
					: never;
			}>;
			OnChange?: Partial<{
				[K in Exclude<ExcludeKeys<T, symbol | Callback | RBXScriptSignal<Callback>>, "Changed">]:
					| ((newValue: T[K]) => void)
					| undefined;
			}>;
		};
		type IntrinsicElements<T extends Instance> = {
			[K in keyof lowercaseCreatableInstances]: JsxInstance<lowercaseCreatableInstances[K]>;
		};
	}
}

export {}