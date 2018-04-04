var getDependencyName = require("../../node/get_dependency_name");
var getShaker = require("../../node/shaker");
var source = require("../../node/source");

module.exports = function(node, map){
	let edge = getEdge(node.load.name, map);

	let shaker = getShaker(node);
	let { getImports, settleEdge } = shaker;

	for(let imp of getImports(source.node(node))) {
		let moduleName = getDependencyName(node, imp.identifier);
		let localEdge = getEdge(moduleName, map);

		if(imp.star) {
			localEdge.allUsed = true;
		} else {
			localEdge.exports.add(imp.exportName);
		}
	}

	// Give the shaker a chance to do what it wants.
	settleEdge(edge);
};

function makeEdge(name) {
	return {
		name,
		exports: new Set(),
		allUsed: false
	};
}

function getEdge(name, map) {
	var edge = map.get(name);
	if(!edge) {
		edge = makeEdge(name);
		map.set(name, edge);
	}
	return edge;
}
