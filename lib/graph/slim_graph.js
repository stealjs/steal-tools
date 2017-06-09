var negate = require("lodash/negate");
var isJavaScriptBundle = require("../bundle/is_js_bundle");
var makeSlimShimNode = require("../node/make_slim_shim_node");
var makeSlimBundleNode = require("../node/make_slim_bundle_node");
var makeSlimConfigNode = require("../node/make_slim_config_node");

module.exports = function(options) {
	var jsBundles = options.bundles.filter(isJavaScriptBundle);
	var otherBundles = options.bundles.filter(negate(isJavaScriptBundle));

	var slimConfigNode = makeSlimConfigNode({
		graph: options.graph,
		baseUrl: options.baseUrl,
		bundles: options.bundles, // the config needs to receive all the bundles
		bundlesPath: options.bundlesPath,
		progressiveBundles: options.progressiveBundles
	});

	var slimmedBundles = jsBundles.map(function(bundle, index) {
		var isMainBundle = index === 0;

		if (isMainBundle) {
			bundle.nodes = [
				slimConfigNode,
				makeSlimShimNode({
					nodes: bundle.nodes,
					plugins: !!otherBundles.length,
					progressive: jsBundles.length > 1,
					mainModuleId: options.mainModuleId
				})
			];
		} else {
			bundle.nodes = [makeSlimBundleNode(bundle)];
		}

		return bundle;
	});

	return slimmedBundles.concat(otherBundles);
};
