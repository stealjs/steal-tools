var through = require("through2");
var slimGraph = require("../graph/slim_graph");

module.exports = function() {
	return through.obj(function(data, enc, next) {
		try {
			next(null, doSlimGrap(data));
		} catch (err) {
			next(err);
		}
	});
};

/**
 * Turns the bundles into their slim version (mutates stream data)
 * @param {Object} data - The slim stream data object
 * @return {Object} The mutated data
 */
function doSlimGrap(data) {
	data.bundles = slimGraph({
		graph: data.graph,
		bundles: data.bundles,
		baseUrl: data.loader.baseURL,
		mainModuleId: getMainModuleId(data),
		splitLoader: data.options.splitLoader,
		bundlesPath: data.configuration.bundlesPath,
		configMain: data.loader.configMain || "package.json!npm",
		progressiveBundles: getProgressiveBundles(data.loader, data.graph)
	});

	return data;
}

/**
 * Return the main module slim id
 * @param {Object} data - The slim stream data object
 * @return {number} The slim id
 */
function getMainModuleId(data) {
	var mainName = data.mains[0];
	return data.graph[mainName].load.uniqueId;
}

/**
 * An array of module names/ids to be progressively loaded
 * @param {Object} loader - The loader instance
 * @param {Object} graph - The dependency graph
 * @return {Array.<number, string>} List of module names and ids
 */
function getProgressiveBundles(loader, graph) {
	var config = loader.__loaderConfig || {};
	var configBundle = config.bundle || [];

	return loader.bundle.map(function(name, index) {
		return {
			id: graph[name].load.uniqueId,

			// use the raw module identifiers so the user won't have to use
			// the full normalized names when importing a module dynamically
			name: configBundle[index] || name
		};
	});
}
