var _ = require("lodash");
var through = require("through2");
var hasES6 = require("../graph/has_es6");
var unbundle = require("../graph/unbundle");
var flattenBundle = require("../bundle/flatten");
var makeBundle = require("../bundle/make_bundle");
var splitByBuildType = require("../bundle/split_by_build_type");
var addTraceurRuntime = require("../bundle/add_traceur_runtime");
var makeBundlesConfig = require("../bundle/make_bundles_config");

var BUNDLE_DEPTH = 1;

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
	var configGraph = data.configGraph;
	var configuration = data.configuration;
	var graph = includePluginsInBuild(data.graph);

	unbundle(graph);

	var mainBundle = makeBundle(graph);
	flattenBundle(mainBundle, BUNDLE_DEPTH);
	var splitMainBundles = nameBundles(splitByBuildType(mainBundle));

	splitMainBundles.filter(isJSBundle).forEach(function(bundle) {
		var unshift = [].unshift;
		unshift.apply(bundle.nodes, configGraph);

		// Make config JS code so System knows where to look for bundles.
		var configNode = makeBundlesConfig(
			splitMainBundles,
			configuration,
			bundle,
			{ excludedBundles: {} }
		);

		bundle.nodes.unshift(configNode);

		// Traceur code requires a runtime.
		if (hasES6(graph)) {
			addTraceurRuntime(bundle);
		}
	});

	return _.assign({}, data, {
		bundles: splitMainBundles
	});
}

function isJSBundle(bundle) {
	return bundle.buildType !== "css";
}

function nameBundles(bundles) {
	return bundles.map(function(bundle) {
		var type = bundle.buildType;

		// this is needed so css bundles are written out with the
		// right file extension
		var suffix = type === "js" ? "" : "." + type + "!";

		return _.assign({}, bundle, {
			name: "dev-bundle" + suffix
		});
	});
}

function includePluginsInBuild(graph) {
	var cloned = _.assign({}, graph);

	function isPlugin(name) {
		return cloned[name].isPlugin;
	}

	function includeInBuild(name) {
		var node = cloned[name];
		var metadata = node.load.metadata;

		if (metadata) metadata.includeInBuild = true;
	}

	_.keys(cloned).filter(isPlugin).forEach(includeInBuild);

	return cloned;
}
