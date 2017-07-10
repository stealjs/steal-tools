var keys = require("lodash/keys");
var isPluginExcludedFromBuild = require("../../node/is_plugin_excluded");

/**
 * Checks whether the @steal node is in the graph
 * @param {string} configMain - The configMain module name
 * @throws if @steal is found in the graph
 */
module.exports = function(configMain, graph) {
	keys(graph).forEach(function(name) {
		var node = graph[name];

		// the configMain node does depend on @steal/@loader but it won't be
		// included in the slim build, we can skip it. Same for plugins that
		// will be only be used during the build process.
		if (name === configMain || isPluginExcludedFromBuild(node)) {
			return;
		}

		isAtSteal(name);
		node.dependencies.forEach(isAtSteal);
	});
};

/**
 * Checks whether the module name is @steal
 * @param {string} name - The module name to be checked
 * @throws if the name is @steal
 */
function isAtSteal(name) {
	if (name === "@steal") {
		throw new Error(
			`Cannot create slim build. "@steal" module is not supported`
		);
	}
}
