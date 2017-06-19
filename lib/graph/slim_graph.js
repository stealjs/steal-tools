var negate = require("lodash/negate");
var concat = require("lodash/concat");
var includes = require("lodash/includes");
var cloneDeep = require("lodash/cloneDeep");
var isJavaScriptBundle = require("../bundle/is_js_bundle");
var makeSlimShimNode = require("../node/make_slim_shim_node");
var makeSlimBundleNode = require("../node/make_slim_bundle_node");
var makeSlimConfigNode = require("../node/make_slim_config_node");

module.exports = function(options) {
	var slimmedBundles = [];
	var jsBundles = options.bundles.filter(isJavaScriptBundle);
	var otherBundles = options.bundles.filter(negate(isJavaScriptBundle));

	// filter out config nodes from the main bundle
	jsBundles[0] = filterMainBundleNodes(jsBundles[0]);

	var slimConfigNode = makeSlimConfigNode({
		graph: options.graph,
		baseUrl: options.baseUrl,
		bundles: options.bundles, // the config needs to receive all the bundles
		bundlesPath: options.bundlesPath,
		progressiveBundles: options.progressiveBundles
	});

	if (options.splitLoader) {
		var loaderBundle = concat(
			makeLoaderBundle([
				slimConfigNode,
				makeSlimShimNode({
					nodes: [],
					splitLoader: true,
					progressive: true,
					plugins: !!otherBundles.length,
					mainModuleId: options.mainModuleId
				})
			])
		);

		slimmedBundles = concat(
			loaderBundle,
			jsBundles.map(toSlimBundle),
			otherBundles
		);
	} else {
		var mainBundle = jsBundles.shift();

		// the main bundle includes the loader code
		mainBundle.nodes = [
			slimConfigNode,
			makeSlimShimNode({
				nodes: mainBundle.nodes,
				plugins: !!otherBundles.length,
				progressive: !!jsBundles.length,
				mainModuleId: options.mainModuleId
			})
		];

		slimmedBundles = concat(
			mainBundle,
			jsBundles.map(toSlimBundle),
			otherBundles
		);
	}

	return slimmedBundles;
};

function toSlimBundle(bundle) {
	var cloned = cloneDeep(bundle);
	cloned.nodes = [makeSlimBundleNode(cloned)];
	return cloned;
}

function makeLoaderBundle(nodes) {
	var getBundleName = require("../bundle/name").getName;

	var bundle = {
		bundles: ["loader"],
		buildType: "js",
		nodes: nodes
	};

	bundle.name = getBundleName(bundle);
	return bundle;
}

function filterMainBundleNodes(mainBundle) {
	var cloned = cloneDeep(mainBundle);

	cloned.nodes = cloned.nodes.filter(function(node) {
		return !includes(
			["[system-bundles-config]", "package.json!npm"],
			node.load.name
		);
	});

	return cloned;
}
