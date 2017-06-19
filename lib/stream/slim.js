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

function doSlimGrap(data) {
	data.bundles = slimGraph({
		graph: data.graph,
		bundles: data.bundles,
		baseUrl: data.loader.baseURL,
		mainModuleId: getMainModuleId(data),
		splitLoader: data.options.splitLoader,
		progressiveBundles: data.loader.bundle,
		bundlesPath: data.configuration.bundlesPath,
		configMain: data.loader.configMain || "package.json!npm"
	});

	return data;
}


function getMainModuleId(data) {
	var mainName = data.mains[0];
	return data.graph[mainName].load.uniqueId;
}
