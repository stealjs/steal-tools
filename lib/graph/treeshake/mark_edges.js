var getDependencyName = require("../../node/get_dependency_name");
var getShaker = require("../../node/shaker");
var source = require("../../node/source");

module.exports = function(node, map, graph){
	let edge = getEdge(node.load.name, map);

	let result = getShaker(node).collect(source.node(node));

	for(let imp of result.imports) {
		let moduleName = getDependencyName(node, imp.identifier);
		let localEdge = getEdge(moduleName, map);

		if(imp.star) {
			localEdge.allUsed = true;
		} else {
			localEdge.usedExports.add(imp.exportName);
		}
	}

	function* recurseStar(node, specifier) {
		let moduleName = getDependencyName(node, specifier);
		let localNode = graph[moduleName];
		let { exports } = getShaker(localNode).collect(source.node(localNode));
		for(let exp of exports) {
			if(exp.star) {
				yield* recurseStar(localNode, exp.specifier);
			} else {
				yield exp;
			}
		}
	}

	for(let exp of result.exports) {
		if(exp.star) {
			for(let lexp of recurseStar(node, exp.specifier)) {
				edge.exports.set(lexp.exportName, exp);

					let moduleName = getDependencyName(node, exp.specifier);
					getEdge(moduleName, map).usedExports.add(lexp.exportName);
			}
		} else {
			edge.exports.set(exp.exportName, exp);
		}
	}

	edge.exportNames = new Set(edge.exports.keys());
	edge.unusedExports = notInOther(edge.exportNames, edge.usedExports);
};

function makeEdge(name) {
	return {
		name,
		imports: new Map(),
		exports: new Map(),
		allUsed: false,

		usedExports: new Set(),

		/**
		 * @property {Set} exportNames
		 * A Set of all string export names.
		 */
		exportNames: null,

		/**
		 * @property {Set} unusedExports
		 * A Set of string export names for exports that are not used.
		 */
		unusedExports: null
	};
}

function notInOther(setA, setB) {
	let out = new Set();
	for(let item of setA) {
		if(!setB.has(item)) {
			out.add(item);
		}
	}
	return out;
}

function getEdge(name, map) {
	var edge = map.get(name);
	if(!edge) {
		edge = makeEdge(name);
		map.set(name, edge);
	}
	return edge;
}
