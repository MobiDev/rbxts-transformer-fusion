import ts from "byots";
import { TransformerConfig } from "./index";

type StageConstructor<T extends Stage<ts.Node> = Stage<ts.Node>> = new (
	context: Context,
	program: ts.Program,
	config: TransformerConfig,
	factory: ts.NodeFactory,
	typeChecker: ts.TypeChecker,
) => T;

/**
 * A shared state for all stages.
 * Objects that many transformers use can be put here (e.g TypeChecker)
 * Util functions can access the existing context through Context.Instance if necessary.
 */
export class Context {
	static Instance: Context;

	public typeChecker: ts.TypeChecker;
	private stages: Stage<ts.Node>[];
	private stageMapping = new Map<StageConstructor, Stage<ts.Node>>();

	constructor(
		public program: ts.Program,
		public config: TransformerConfig,
		public transformationContext: ts.TransformationContext,
		stages: StageConstructor[],
	) {
		if (Context.Instance) throw "Cannot instantiate two contexts";
		Context.Instance = this;

		this.typeChecker = program.getTypeChecker();
		this.stages = [];
		for (let i = 0; i < stages.length; i++) {
			const stage = stages[i];
			const entry = new stage(this, program, config, ts.factory, this.typeChecker);
			this.stages.push(entry);
			this.stageMapping.set(stage, entry);
		}
	}

	/**
	 * Runs stages sequentially across all files.
	 * Stage1 -> File1, File2, File3
	 * Stage2 -> File1, File2, File3
	 * @param sourceFiles The source files to transform
	 */
	transformAll(sourceFiles: readonly ts.SourceFile[]): Map<ts.SourceFile, ts.SourceFile> {
		const cache = new Map<ts.SourceFile, ts.SourceFile>();
		for (let i = 0; i < this.stages.length; i++) {
			for (const sourceFile of sourceFiles) {
				const actualSourceFile = cache.get(sourceFile) ?? sourceFile;
				cache.set(sourceFile, this.transform(actualSourceFile, this.stages[i]));
			}
		}
		return cache;
	}

	/**
	 * Transform a source file using a specific stage.
	 * @param sourceFile The source file to transform
	 * @param stage The stage to run on the source file
	 */
	transform(sourceFile: ts.SourceFile, stage: Stage<ts.Node>): ts.SourceFile {
		const visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
			if (stage.wants === undefined) {
				if (ts.isSourceFile(node)) {
					return stage.visit(node);
				}
				return node;
			} else {
				if (!stage.useOnSyntheticNodes && !ts.isSourceFile(node)) {
					if (ts.NodeFlags.Synthesized === (node.flags & ts.NodeFlags.Synthesized)) {
						return node;
					}
				}
				if (stage.wants?.(node)) {
					return stage.visit(node);
				}
			}
			return ts.visitEachChild(node, visitor, this.transformationContext);
		};
		sourceFile = ts.visitNode(sourceFile, visitor);
		return sourceFile;
	}

	/**
	 * Retrieve the symbol of a specific identifier.
	 * @param node The identifier to get the symbol of.
	 * @param getAliased Follow local aliases?
	 */
	getSymbol(node: ts.Node, getAliased = true): ts.Symbol | undefined {
		const symbol = this.typeChecker.getSymbolAtLocation(node);
		if (symbol) {
			if (getAliased && ts.SymbolFlags.Alias === (symbol.flags & ts.SymbolFlags.Alias)) {
				return this.typeChecker.getAliasedSymbol(symbol);
			} else {
				return symbol;
			}
		}
	}

	/**
	 * Get a reference to another stage.
	 * This should be lazy-loaded if retrieving a stage that runs later (since it may not be instantiated yet)
	 * @param stageConstructor The stage to retrieve.
	 */
	getStage<T extends Stage<ts.Node>>(stageConstructor: StageConstructor<T>): T {
		const stage = this.stageMapping.get(stageConstructor);
		if (!stage) throw new Error("Unknown stage");
		return stage as T;
	}
}

export class Stage<T extends ts.Node = ts.SourceFile> {
	constructor(
		public context: Context,
		public program: ts.Program,
		public config: TransformerConfig,
		public factory: ts.NodeFactory,
		public typeChecker: ts.TypeChecker,
	) {}

	/**
	 * Should this stage check/visit nodes made by transformers (symbol information is not available for these nodes.)
	 */
	public useOnSyntheticNodes = false;

	/**
	 * Should this stage visit the specific node
	 * @param node The node to check
	 */
	wants?(node: ts.Node): node is T;

	/**
	 * Visit, and modify, a specific node
	 * @param node The node to visit
	 */
	visit(node: T): ts.VisitResult<ts.Node> {
		return node;
	}
}
