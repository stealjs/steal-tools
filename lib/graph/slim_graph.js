var negate = require("lodash/negate");
var concat = require("lodash/concat");
var partial = require("lodash/partial");
var includes = require("lodash/includes");
var cloneDeep = require("lodash/cloneDeep");
var isJavaScriptBundle = require("../bundle/is_js_bundle");
var makeSlimShimNode = require("../node/make_slim_shim_node");
var makeSlimBundleNode = require("../node/make_slim_bundle_node");
var makeSlimConfigNode = require("../node/make_slim_config_node");

module.exports = function(options) {
	var slimmedBundles = [];

	var jsBundles = options.bundles
		.filter(isJavaScriptBundle)
		.map(function(bundle) {
			bundle.nodes = bundle.nodes.filter(function(node) {
				return (
					!isConfigNode(options.configMain, node) && !isExcludedFromBuild(node)
				);
			});
			return bundle;
		});

	var otherBundles = options.bundles
		.filter(negate(isJavaScriptBundle))
		.map(function(bundle) {
			bundle.nodes = bundle.nodes.filter(negate(isExcludedFromBuild));
			return bundle;
		});

	var slimConfigNode = makeSlimConfigNode({
		target: options.target,
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
					target: options.target,
					plugins: !!otherBundles.length,
					mainModuleId: options.mainModuleId
				})
			])
		);

		slimmedBundles = concat(
			loaderBundle,
			jsBundles.map(partial(toSlimBundle, options.target)),
			otherBundles
		);
	} else {
		var mainBundle = jsBundles.shift();

		// the main bundle includes the loader code
		mainBundle.nodes = [
			slimConfigNode,
			makeSlimShimNode({
				target: options.target,
				nodes: mainBundle.nodes,
				plugins: !!otherBundles.length,
				progressive: !!jsBundles.length,
				mainModuleId: options.mainModuleId
			})
		];

		slimmedBundles = concat(
			mainBundle,
			jsBundles.map(partial(toSlimBundle, options.target)),
			otherBundles
		);
	}

	return slimmedBundles;
};

function toSlimBundle(target, bundle) {
	var cloned = cloneDeep(bundle);
	cloned.nodes = [makeSlimBundleNode(target, cloned)];
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

/**
 * Whether the node is flagged to be removed from the build
 * @param {Object} node - A node from a bundle
 * @return {boolean} `true` if flagged, `false` otherwise
 */
function isExcludedFromBuild(node) {
	if (node.load.excludeFromBuild) {
		return true;
	}

	if (
		node.load.metadata &&
		node.load.metadata.hasOwnProperty("bundle") &&
		node.load.metadata.bundle === false
	) {
		return true;
	}

	if (
		node.isPlugin &&
		!node.value.includeInBuild &&
		!node.load.metadata.includeInBuild
	) {
		return true;
	}

	return false;
}

/**
 * Whether the node is a config module (like package.json)
 * @param {string} configMain - The configMain module identifier
 * @param {Object} node - A node from a bundle
 * @return {boolean} `true` if a config node, `false` otherwise
 */
function isConfigNode(configMain, node) {
	return includes([configMain, "[system-bundles-config]"], node.load.name);
}
