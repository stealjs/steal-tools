var clone = require("lodash/clone");
var ensureAST = require("../node/ensure_ast");
var getShaker = require("../node/shaker");
var markEdges = require("./treeshake/mark_edges");
var source = require("../node/source");
var transformActiveSource = require("../node/transform_active_source");
var { generate } = require("astring");

function treeshake(graph, options) {
	// 1. Parse the graph.
	parse(graph);

	// Returns a set of modules that were shaken.
	let shakenModules = shake(graph, options);

	// For modules that were shaken, regenerate source string.
	codegen(graph, shakenModules);

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

function shake(graph, options, shakenModules = new Set()) {
	let edgeMap = new Map();

	// 2. Collect import/export declarations
	for(let [name, node] of Object.entries(graph)) {
		markEdges(node, edgeMap, graph);
	}

	// A flag that will be set to true if anything was removed.
	let codeWasShaken = false;

	for(let [name, edge] of edgeMap) {
		if(edge.allUsed) {
			continue;
		}

		let node = graph[name];

		// Built-in modules like @steal
		// Potentially could be treeshaken...
		if(!node) {
			continue;
		}

		let shaker = getShaker(node);

		if(node.load.name === "treeshake@1.0.0#reexports" ||
			node.load.name === "treeshake@1.0.0#from-exports") {
			console.log("Shaking begins.", node.load.name, edge.unusedExports.size);
			debugger;

		}

		let unusedExports = edge.unusedExports;

		for(let exportName of unusedExports) {
			// Add this module as being one that was shaken.
			shakenModules.add(name);

			let exp = edge.exports.get(exportName);
			let wasRemoved = shaker.shakeOut(exp, source.node(node));

			if(wasRemoved) {
				//TODO allow this -> codeWasShaken = true;
			}
		}

		// Diff them
		// remove the exports
		// remove any code that was using those exports
	}

	// If anything was removed do the whole thing again until there is nothing left.
	if(codeWasShaken) {
		shake(graph, options, shakenModules);
	}
	return shakenModules;
}

function codegen(graph, shakenModules) {
	for(let name of shakenModules) {
		let node = graph[name];
		transformActiveSource(node, "treeshake", function(node, source){
			source = clone(source);
			source.code = generate(source.ast.program);
			return source;
		});
	}
}

module.exports = treeshake;
