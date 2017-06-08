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
		progressiveBundles: data.loader.bundle,
		bundlesPath: data.configuration.bundlesPath
	});

	return data;
}


function getMainModuleId(data) {
	var mainName = data.mains[0];
	return data.graph[mainName].load.uniqueId;
}
