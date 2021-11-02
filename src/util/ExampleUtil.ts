import ts from "byots";
import { Context } from "../Context";

/**
 * Retrieve the symbol, using the context passed
 * @param context The shared context
 * @param node The node to get the symbol of
 */
export function ExplicitContext(context: Context, node: ts.Identifier): ts.Symbol | undefined {
	return context.typeChecker.getSymbolAtLocation(node);
}

/**
 * Retrieve the symbol, using Context.Instance (preferred)
 * @param node The node to get the symbol of
 */
export function ImplicitContext(node: ts.Identifier): ts.Symbol | undefined {
	const context = Context.Instance;

	return context.typeChecker.getSymbolAtLocation(node);
}
