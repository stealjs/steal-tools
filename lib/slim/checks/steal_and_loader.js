var keys = require("lodash/keys");
var includes = require("lodash/includes");

/**
 * Checks whether @steal or @loader nodes are in the graph
 * @param {string} configMain - The configMain module name
 * @throws if @steal or @loader are found in the graph
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

		isLoaderOrSteal(name);
		node.dependencies.forEach(isLoaderOrSteal);
	});
};

/**
 * Whether the node is a plugin that won't be included in the build
 * @param {Object} node - A node from the dependency graph
 * @return {boolean}
 */
function isPluginExcludedFromBuild(node) {
	return Boolean(
		node.isPlugin && (!node.value.includeInBuild || node.value.pluginBuilder)
	);
}

/**
 * Checks whether the module name is either @loader or @steal
 * @param {string} name - The module name to be checked
 * @throws if the name is either @loader or @steal
 */
function isLoaderOrSteal(name) {
	if (includes(["@loader", "@steal"], name)) {
		throw new Error(
			`Cannot create slim build. "${name}" module is not supported`
		);
	}
}
