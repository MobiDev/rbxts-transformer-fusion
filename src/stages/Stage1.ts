import ts from "byots";
import { Stage } from "../Context";
import { Lazy } from "../util/Lazy";
import { Stage2 } from "./Stage2";

export class Stage1 extends Stage<ts.ClassDeclaration> {
	// Previous stages can access future stages lazily.
	private stage2 = Lazy(() => this.context.getStage(Stage2));
	// Stages can hold state, and it will persist across all files.
	public foundClasses = new Array<ts.Symbol>();

	wants(node: ts.Node): node is ts.ClassDeclaration {
		return ts.isClassDeclaration(node);
	}

	visit(node: ts.ClassDeclaration): ts.Node {
		if (node.name && ts.isIdentifier(node.name)) {
			console.log("Found class ClassDeclaration");
			const symbol = this.context.getSymbol(node.name);
			if (symbol) {
				this.foundClasses.push(symbol);
				this.stage2.get().registerClass(symbol);
			}
		}
		return node;
	}
}
