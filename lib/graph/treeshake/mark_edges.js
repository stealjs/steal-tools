var getDependencyName = require("../node/get_dependency_name");
var getShaker = require("../../node/get_shaker");
var source = require("../../node/source");

module.exports = function(node, map){
	var edge = map.get(node);
	if(!edge) {
		edge = makeEdge(node);
		map.set(node, edge);
	}

	let shaker = getShaker(node);
	let { getImports, settleEdge } = shaker;

	for(let imp of getImports(source(node))) {
		let moduleName = getDependencyName(node, imp.identifier);

	}

	if(!settleEdge(edge)) {

	}


};

function makeEdge(node) {
	return {
		node,
		exports: new Map(),
		allUsed: false
	};
}
