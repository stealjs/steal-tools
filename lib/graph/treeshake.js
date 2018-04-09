var clone = require("lodash/clone");
var ensureAST = require("../node/ensure_ast");
var getShaker = require("../node/shaker");
var markEdges = require("./treeshake/mark_edges");
var source = require("../node/source");
var transformActiveSource = require("../node/transform_active_source");
var { moduleSpecifierFromName } = require("../node/dependency_resolver");
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
	let force = options.treeShakingForce;
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

		// The sideEffects: false hint is needed to tree-shake.
		// unless treeShakingForce: true is on.
		let packageJson = node.load.metadata.packageJson || {};
		if(!force && packageJson.sideEffects !== false) {
			continue;
		}

		let shaker = getShaker(node);

		let unusedExports = edge.unusedExports;

		for(let exportName of unusedExports) {
			let exp = edge.exports.get(exportName);
			let wasRemoved = shaker.shakeOut(exp, source.node(node), edge);

			if(wasRemoved) {
				// Add this module as being one that was shaken.
				shakenModules.add(name);
				codeWasShaken = true;
			}
		}
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

function treeshake2(data, options) {
	let graph = data.graph;
	let rollup = require("rollup");
	let getDependencyName = require("../node/get_dependency_name");
	let entry = data.mains.map(main => `export * from "${main}";`).join("\n");
	let entryName = "@@TREESHAKE_ENTRY";

	return rollup.rollup({
		entry: data.mains[0],//entryName,
		acorn: {
			allowReserved: true,
			ecmaVersion: 8
		},
		experimentalPreserveModules: true,
		plugins: [{
			resolveId: function(id, importer, options) {
				if(importer === entryName) {
					return id;
				} else if(importer) {
					let node = graph[importer];
					return getDependencyName(node, id);
				}
				return id;
			},
			load: function(id, options) {
				if(id === entryName) {
					return entry;
				}
				let node = graph[id];
				if(!node || node.load.metadata.format !== "es6") {
					return "export default {}";
				}
				return source.node(node);
			}
		}],
		onwarn: function(){}
	}).then(function(bundle){
		return bundle.generate({
			format:'es',
			paths: chunkNameToSpecifierResolver.bind(null, bundle, graph)
		}).then(function(out){
			var chunks = bundle.chunks;
			for(let [chunkName, source] of Object.entries(out)) {
				let id = chunks[chunkName].modules[0].id;
				let node = graph[id];
				if(!node || node.load.metadata.format !== "es6") {
					continue;
				}

				transformActiveSource(node, "treeshake", () => source);
			}
		});

	});
}

function chunkNameToSpecifierResolver(bundle, graph, chunkName, parentChunkName) {
	let chunks = bundle.chunks;
	let moduleName = chunks[chunkName].modules[0].id;
	let parentModuleName = chunks[parentChunkName].modules[0].id;

	let parentNode = graph[parentModuleName];
	if(!parentNode) {
		return moduleName;
	}
	let specifier = moduleSpecifierFromName(parentNode, moduleName);
	return specifier || moduleName;
}

module.exports = treeshake2;
