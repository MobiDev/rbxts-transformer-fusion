import ts, { defaultMaximumTruncationLength, isJsxExpression, JsxElement, ObjectLiteralExpression, PropertyAssignment } from "byots";
import { readFileSync } from "fs";
import { join } from "path";
import { Stage } from "../Context";

const classes = JSON.parse(readFileSync(join(__dirname, "..", "classes.json"), "utf-8")) as {[key: string]: string}

const c = ts.factory

function transformJsxElement(node: ts.JsxElement): ts.Expression {
	node.openingElement.attributes.properties
	node.children
	return c.createCallExpression(
			c.createCallExpression(
			c.createPropertyAccessExpression(c.createIdentifier("Fusion"), c.createIdentifier("New")),
			undefined,
			[transformJsxTagNameExpression(node.openingElement.tagName)]
		),
		undefined,
		[c.createObjectLiteralExpression([...transformJsxAttributes(node.openingElement.attributes), transformJsxChildren(node.children)])]
	)
}

function transformJsxAttributes(node: ts.JsxAttributes) {
	const properties: ts.PropertyAssignment[] = []
	node.properties.forEach(property => {
		if (ts.isJsxAttribute(property)) {
			if ((property.name?.text == "OnEvent" || property.name?.text == "OnChange") && property.initializer) {
				if (ts.isJsxExpression(property.initializer) && property.initializer.expression && ts.isObjectLiteralExpression(property.initializer.expression)) {
					properties.push(...transformEvent(property.initializer.expression, property.name.text))
				}
			} else {
				if (property.name && property.initializer) {
					const initializer =  ts.isJsxExpression(property.initializer) ? property.initializer.expression : property.initializer
					if (initializer) {
						properties.push(c.createPropertyAssignment(property.name, initializer))
					}
				}
			}
		}
	})
	return properties
}

function transformEvent(node: ObjectLiteralExpression, name: string): PropertyAssignment[] {
    const toReturn: PropertyAssignment[] = []
	// return c.createPropertyAssignment(c.createComputedPropertyName(createFusionDot(name)), )
    node.properties.forEach(property => {
        if (property.name && ts.isPropertyAssignment(property)) {
            toReturn.push( c.createPropertyAssignment(c.createComputedPropertyName(c.createCallExpression(createFusionDot(name), undefined, [c.createStringLiteral(property.name.getText())])), property.initializer))
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

function transformJsxChildren(children: ts.NodeArray<ts.JsxChild>): ts.PropertyAssignment {
	const onlyJsxElements = children.filter((c) => {
		return ts.isJsxElement(c)
	}) as JsxElement[]
	return c.createPropertyAssignment(c.createComputedPropertyName(createFusionDot("Children")),
		c.createArrayLiteralExpression([...onlyJsxElements.map((c) => {
			return transformJsxElement(c)
		})], true)
	)
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

	visit(node: ts.JsxElement): ts.Node {
		if (!classes) {
		}
		return ts.isJsxElement(node.parent) ? node : transformJsxElement(node)
	}
}