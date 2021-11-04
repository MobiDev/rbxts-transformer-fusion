import ts, { JsxElement, JsxExpression, ObjectLiteralExpression, PropertyAssignment } from "byots";
import { readFileSync } from "fs";
import { join } from "path";
import { Stage } from "../Context";

const classes = JSON.parse(readFileSync(join(__dirname, "..", "classes.json"), "utf-8")) as {[key: string]: string}

const c = ts.factory

function transformJsxElement(node: ts.JsxElement, context: ts.TransformationContext): ts.Expression {
	return c.createCallExpression(
			c.createCallExpression(
			c.createPropertyAccessExpression(c.createIdentifier("Fusion"), c.createIdentifier("New")),
			undefined,
			[transformJsxTagNameExpression(node.openingElement.tagName)]
		),
		undefined,
		[c.createObjectLiteralExpression([...transformJsxAttributes(node.openingElement.attributes, context), transformJsxChildren(node.children, context)])]
	)
}

function transformJsxSelfClosingElement(node: ts.JsxSelfClosingElement, context: ts.TransformationContext): ts.Expression {
	return c.createCallExpression(
			c.createCallExpression(
			c.createPropertyAccessExpression(c.createIdentifier("Fusion"), c.createIdentifier("New")),
			undefined,
			[transformJsxTagNameExpression(node.tagName)]
		),
		undefined,
		[c.createObjectLiteralExpression([...transformJsxAttributes(node.attributes, context)])]
	)
}

function transformJsxAttributes(node: ts.JsxAttributes, context: ts.TransformationContext) {
	const properties: ts.ObjectLiteralElementLike[] = []
	node.properties.forEach(property => {
		if (ts.isJsxAttribute(property)) {
			if ((property.name?.text == "OnEvent" || property.name?.text == "OnChange") && property.initializer) {
				if (ts.isJsxExpression(property.initializer) && property.initializer.expression && ts.isObjectLiteralExpression(property.initializer.expression)) {
					properties.push(...transformEvent(property.initializer.expression, property.name.text, context))
				}
			} else {
				if (property.name && property.initializer) {
					const initializer =  ts.isJsxExpression(property.initializer) ? property.initializer.expression : property.initializer
					if (initializer) {
						properties.push(c.createPropertyAssignment(property.name, initializer))
					}
				}
			}
		} else if (ts.isJsxSpreadAttribute(property)) {
			properties.push(c.createSpreadAssignment(property.expression))
		}
	})
	return properties
}

function transformEvent(node: ObjectLiteralExpression, name: string, context: ts.TransformationContext): PropertyAssignment[] {
    const toReturn: PropertyAssignment[] = []
    node.properties.forEach(property => {
        if (property.name && ts.isPropertyAssignment(property)) {
            toReturn.push( c.createPropertyAssignment(c.createComputedPropertyName(c.createCallExpression(createFusionDot(name), undefined, [c.createStringLiteral(property.name.getText())])), property.initializer))
        } else if (ts.isShorthandPropertyAssignment(property)){
			toReturn.push( c.createPropertyAssignment(c.createComputedPropertyName(c.createCallExpression(createFusionDot(name), undefined, [c.createStringLiteral(property.name.getText())])), property.name))
		} else if (ts.isSpreadAssignment(property)) {
			context.addDiagnostic({
				file: node.getSourceFile(),
				start: property.getStart(),
				length: property.getWidth(),
				category: ts.DiagnosticCategory.Error,
				code: 736001,
				messageText: "Fusion: Events with spread assignments are not supported"
			})
		} else {
			context.addDiagnostic({
				file: node.getSourceFile(),
				start: property.getStart(),
				length: property.getWidth(),
				category: ts.DiagnosticCategory.Error,
				code: 736001,
				messageText: `Fusion: Events with ${ts.SyntaxKind[property.kind]} are not supported`
			})
		}
    })
    return toReturn
}

function transformJsxTagNameExpression(node: ts.JsxTagNameExpression): ts.Expression {
	switch (node.kind) {
		case ts.SyntaxKind.Identifier:
			return c.createStringLiteral(classes[node.text])
		default:
			return node
	}

}

function transformJsxChildren(children: ts.NodeArray<ts.JsxChild>, context: ts.TransformationContext): ts.PropertyAssignment {
	const elements = [] as ts.Expression[]
	const onlyElements = children.filter((c) => {
		if (ts.isJsxElement(c) || ts.isJsxExpression(c)) {
			return true
		} else if (ts.isJsxFragment(c)) {
			context.addDiagnostic({
				file: c.getSourceFile(),
				start: c.getStart(),
				length: c.getWidth(),
				category: ts.DiagnosticCategory.Error,
				code: 736001,
				messageText: `Fusion: JSX fragments are not supported`
			})
		}
	} ) as (JsxElement | JsxExpression)[]

	onlyElements.forEach((c) => {
		if (ts.isJsxElement(c)) {
			elements.push(transformJsxElement(c, context))
		} else if (c.expression) {
			elements.push(c.expression)
		}
	})

	return c.createPropertyAssignment(c.createComputedPropertyName(createFusionDot("Children")), c.createArrayLiteralExpression(elements))
}

function createFusionDot(something: string) {
	return c.createPropertyAccessExpression(c.createIdentifier("Fusion"), c.createIdentifier(something))
}

export class Stage1 extends Stage<ts.JsxElement> {
	// Stages can hold state, and it will persist across all files.
	public foundClasses = new Array<ts.Symbol>();

	wants(node: ts.Node): node is ts.JsxElement {
		return ts.isJsxElement(node);
	}

	visit(node: ts.JsxElement, context: ts.TransformationContext): ts.Node {
		if (!classes) {
		}
		return ts.isJsxElement(node.parent) ? node : transformJsxElement(node, context)
	}
}

export class JsxSelfClosingElement extends Stage<ts.JsxSelfClosingElement> {
	// Stages can hold state, and it will persist across all files.
	public foundClasses = new Array<ts.Symbol>();

	wants(node: ts.Node): node is ts.JsxSelfClosingElement {
		return ts.isJsxSelfClosingElement(node);
	}

	visit(node: ts.JsxSelfClosingElement, context: ts.TransformationContext): ts.Node {
		return transformJsxSelfClosingElement(node, context)
	}
}

export class JsxFragment extends Stage<ts.JsxFragment> {
	// Stages can hold state, and it will persist across all files.
	public foundClasses = new Array<ts.Symbol>();

	wants(node: ts.Node): node is ts.JsxFragment {
		return ts.isJsxFragment(node);
	}

	visit(node: ts.JsxFragment, context: ts.TransformationContext): ts.Node {
		context.addDiagnostic({
			file: node.getSourceFile(),
			start: node.getStart(),
			length: node.getWidth(),
			category: ts.DiagnosticCategory.Error,
			code: 736001,
			messageText: `Fusion: JSX fragments are not supported`
		})
		return node;
	}
}