var some = require("lodash/some");
var values = require("lodash/values");
var includes = require("lodash/includes");

/**
 * Checks whether there are circular dependencies in the graph
 * @param {Object} steal - The dependency graph object
 * @throws if circular dependencies are found
 */
module.exports = function(graph) {
	var nodes = values(graph);

	if (some(nodes, hasCircularDependencies)) {
		throw new Error(
			`Cannot create slim build. Circular dependencies are not supported`
		);
	}
};

/**
 * Whether the node has a circular dependency
 * @param {Object} - A node from the dependency graph
 * @param {number} - The index of the node in the (array) graph
 * @param {Array.[Object]} - A list of nodes
 * @return `true` if a circular dependency is found
 */
function hasCircularDependencies(node, index, nodes) {
	for (var i = index + 1; i < nodes.length; i += 1) {
		var nextNode = nodes[i];

		if (
			includes(node.dependencies, nextNode.load.name) &&
			includes(nextNode.dependencies, node.load.name)
		) {
			return true;
		}
	}

	return false;
}
