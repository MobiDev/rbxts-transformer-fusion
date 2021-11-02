import ts from "byots";
import { Context } from "./Context";
import { Stage1 } from "./stages/Stage1";
import { Stage2 } from "./stages/Stage2";

// All stages must be in this list, and will run in the order of the list.
// eslint-disable-next-line prettier/prettier
const stages = [
	Stage1,
	Stage2
]

/**
 * This is the transformer's configuration, the values are passed from the tsconfig.
 */
export interface TransformerConfig {
	_: void;
}

/**
 * The actual transformer.
 * Creates and instantiates the context, and transforms the source files.
 */
export default function (program: ts.Program, config: TransformerConfig) {
	return (context: ts.TransformationContext): ((file: ts.SourceFile) => ts.Node) => {
		Context.Instance = undefined!;
		const transformContext = new Context(program, config, context, stages);
		let transformed: Map<ts.SourceFile, ts.SourceFile>;
		return (file: ts.SourceFile) => {
			if (!transformed) {
				transformed = transformContext.transformAll(program.getSourceFiles());
			}
			return transformed.get(file) ?? file;
		};
	};
}
