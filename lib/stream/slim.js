var through = require("through2");
var slimGraph = require("../graph/slim_graph");

/**
 * @param {Object} options - An options object
 */
module.exports = function(options) {
	var opts = options != null ? options : {};

	return through.obj(function(data, enc, next) {
		try {
			next(null, doSlimGrap(data, opts));
		} catch (err) {
			next(err);
		}
	});
};

/**
 * Turns the bundles into their slim version (mutates stream data)
 * @param {Object} data - The slim stream data object
 * @param {Object} options - An options object
 * @return {Object} The mutated data
 */
function doSlimGrap(data, options) {
	data.bundles = slimGraph({
		graph: data.graph,
		bundles: data.bundles,
		target: options.target,
		baseUrl: data.loader.baseURL,
		slimConfig: data.loader.slimConfig,
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
