var keys = require("lodash/keys");
var some = require("lodash/some");
var includes = require("lodash/includes");

var modulesBlackList = ["@steal", "@loader"];

module.exports = function(configMain, graph) {
	var configMainNode = graph[configMain];

	if (configMainNode && dependsOnStealConditional(configMainNode)) {
		throw new Error(
			`Cannot create slim build. "steal-conditional" is not supported`
		);
	}

	keys(graph).forEach(function(name) {
		var node = graph[name];

		if (name === configMain || isPluginExcludedFromBuild(node)) {
			return;
		}

		checkModuleSupport(name);
		node.dependencies.forEach(checkModuleSupport);
	});
};

function dependsOnStealConditional(configMainNode) {
	return some(configMainNode.dependencies, function(depName) {
		return includes(depName, "steal-conditional/conditional");
	});
}

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

function checkModuleSupport(name) {
	if (includes(modulesBlackList, name)) {
		throw new Error(
			`Cannot create slim build. "${name}" module is not supported`
		);
	}
}
