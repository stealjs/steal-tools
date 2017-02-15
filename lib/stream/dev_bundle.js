var _ = require("lodash");
var through = require("through2");
var hasES6 = require("../graph/has_es6");
var unbundle = require("../graph/unbundle");
var makeBundle = require("../bundle/make_bundle");
var splitByBuildType = require("../bundle/split_by_build_type");
var addTraceurRuntime = require("../bundle/add_traceur_runtime");
var makeBundlesConfig = require("../bundle/make_bundles_config");

module.exports = function() {
	return through.obj(function(data, enc, done) {
		try {
			var result = bundle(data);
			done(null, result);
		} catch(err) {
			done(err);
		}
	});
};

function bundle(data) {
	var graph = data.graph;
	var configGraph = data.configGraph;
	var configuration = data.configuration;

	unbundle(graph);

	var mainBundle = makeBundle(graph);
	var splitMainBundles = nameBundles(splitByBuildType(mainBundle));

	splitMainBundles.forEach(function(mainJSBundle) {
		var unshift = [].unshift;

		unshift.apply(mainJSBundle.nodes, configGraph);

		// Make config JS code so System knows where to look for bundles.
		var configNode = makeBundlesConfig(
			splitMainBundles,
			configuration,
			mainJSBundle,
			{ excludedBundles: [] }
		);

		mainJSBundle.nodes.unshift(configNode);

		// Traceur code requires a runtime.
		if (hasES6(graph)) {
			addTraceurRuntime(mainJSBundle);
		}
	});

	return _.assign(
		{},
		data,
		{ bundles: splitMainBundles }
	);
}

function nameBundles(bundles) {
	return bundles.map(function(bundle) {
		return _.assign(
			{},
			bundle,
			{ name: "dev-bundle" }
		);
	});
}
