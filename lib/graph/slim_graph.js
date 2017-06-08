var negate = require("lodash/negate");
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

/**
 * Whether the bundle contains only JavaScript nodes
 * @param {Object} bundle - The bundle
 * @return {boolean}
 */
function isJavaScriptBundle(bundle) {
	return bundle.buildType == null || bundle.buildType === "js";
}
