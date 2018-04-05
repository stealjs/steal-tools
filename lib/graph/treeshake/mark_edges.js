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

	edge.addExports(result.exports);
};

function makeEdge(name) {
	return {
		name,
		imports: new Map(),
		exports: new Map(),
		usedExports: new Set(),
		allUsed: false,
		exportNames: null,

		addExports(exps) {
			for(let exp of exps) {
				this.exports.set(exp.exportName, exp);
			}

			this.exportNames = new Set(this.exports.keys());
			this.unusedExports = notInOther(this.exportNames, this.usedExports);

		}
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
