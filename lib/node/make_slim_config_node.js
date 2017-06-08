var path = require("path");
var prettier = require("prettier");
var getBundleFileName = require("../bundle/filename");

module.exports = function(options) {
	var bundles = options.bundles;

	// maps slim module ids (numbers) to slim bundle ids
	var slimBundlesConfig = {};

	// maps raw module ids to slim module ids
	var slimMapConfig = {};

	// maps slim bundle ids to the bundle file address
	var slimPathsConfig = {};

	/**
	 * Retuns bundles path relative to the loader baseUrl
	 *
	 * The bundles path at this point is an absolute file url, the relative
	 * version is needed in the written config so the loader can use script
	 * tags to load the bundles during runtime.
	 *
	 * @param {Object} bundle - The bundle object
	 * @return {string} the relative path
	 */
	function getRelativeBundlePath(bundle) {
		var baseUrl = options.baseUrl.replace("file:", "");

		return path.join(
			path.relative(baseUrl, options.bundlesPath),
			getBundleFileName(bundle)
		);
	}

	bundles.forEach(function(bundle) {
		slimPathsConfig[bundle.uniqueId] = getRelativeBundlePath(bundle);

		bundle.nodes.forEach(function(node) {
			if (node.load.uniqueId) {
				slimBundlesConfig[node.load.uniqueId] = bundle.uniqueId;
			}
		});
	});

	options.progressiveBundles.forEach(function(bundleName) {
		var node = options.graph[bundleName];
		slimMapConfig[bundleName] = node.load.uniqueId;
	});

	var configSource = `
		(function(global) {
			global.steal = global.steal || {};

			global.steal.map = ${ JSON.stringify(slimMapConfig) };
			global.steal.paths = ${ JSON.stringify(slimPathsConfig) };
			global.steal.bundles = ${ JSON.stringify(slimBundlesConfig) };

		}(window));
	`;

	return {
		load: {
			name: "[slim-loader-config]",
			metadata: { format: "global" },
			source: prettier.format(configSource, { useTabs: true })
		},
		dependencies: [],
		deps: []
	};
};
