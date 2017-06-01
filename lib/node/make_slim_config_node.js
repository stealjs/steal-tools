var path = require("path");
var prettier = require("prettier");
var getBundleFileName = require("../bundle/filename");

module.exports = function(data) {
	var loader = data.loader;
	var bundles = data.bundles;
	var configuration = data.configuration;

	// maps slim module ids (numbers) to slim bundle ids
	var slimBundlesConfig = {};

	// maps raw module ids to slim module ids
	var slimMapConfig = {};

	// maps slim bundle ids to the bundle file address
	var slimPathsConfig = {};

	function getRelativeBundlePath(bundle) {
		var baseUrl = loader.baseURL.replace("file:", "");

		return path.join(
			path.relative(baseUrl, configuration.bundlesPath),
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

	loader.bundle.forEach(function(bundleName) {
		var node = data.graph[bundleName];
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
