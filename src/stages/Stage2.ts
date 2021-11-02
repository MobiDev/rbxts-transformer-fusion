import ts from "byots";
import { Stage } from "../Context";
import { Stage1 } from "./Stage1";

export class Stage2 extends Stage<ts.ClassDeclaration> {
	// Future stages can access previous stages without lazy-loading.
	private stage1 = this.context.getStage(Stage1);
	// Stages can hold state, and it will persist across all files.
	private foundClasses = new Array<ts.Symbol>();

	wants(node: ts.Node): node is ts.ClassDeclaration {
		return ts.isClassDeclaration(node);
	}

	visit(node: ts.ClassDeclaration): ts.Node {
		if (node.name && ts.isIdentifier(node.name)) {
			const symbol = this.context.getSymbol(node.name);
			if (symbol) {
				console.log(`=${node.name.text}=`);
				console.log(
					this.stage1.foundClasses.indexOf(symbol) !== -1
						? "This class was found in the previous stage!"
						: "This class was not found in the previous stage!",
				);
				console.log(
					this.foundClasses.indexOf(symbol) !== -1
						? "This class was registered in the previous stage!"
						: "This class was not registered in the previous stage!",
				);
			}
		}
		return node;
	}

	registerClass(symbol: ts.Symbol): void {
		this.foundClasses.push(symbol);
	}
}
