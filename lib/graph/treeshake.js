var ensureAST = require("../node/ensure_ast");

function treeshake(graph, options) {
	// 1. Parse the graph.
	parse(graph);

	shake(graph, options);

	return graph;
}

/**
 * Go through the graph and make sure each module is parsed.
 */
function parse(graph) {
	for(let [name, node] of Object.entries(graph)) {
		ensureAST(node);
	}
}

function shake(graph, options) {
	var edgeMap = new Map();

	// 2. Collect import/export declarations
	for(let [name, node] of Object.entries(graph)) {
		markEdges(node, edgeMap);
	}

	for(let [node, edge] of edgeGraph) {

	}


	// collect(graph);

	// 3. Remove unused exports

	// 4. Remove dead-code

	// 5. Start back at 2
}

module.exports = treeshake;
