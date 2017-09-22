var path = require("path");
var prettier = require("prettier");
var assign = require("lodash/assign");
var getBundleFileName = require("../bundle/filename");

/**
 * Returns the name of the global based on the build target
 * @param {string} target - The target build name
 * @return {string} defaults to "window" if target is falsy.
 */
function getGlobal(target) {
	return { web: "window", node: "global", worker: "self" }[target];
}

module.exports = function(options) {
	var bundles = options.bundles;

	// maps slim module ids (numbers) to slim bundle ids
	var slimBundlesConfig = {};

	// maps raw module ids to slim module ids
	var slimMapConfig = assign({}, options.slimConfig.map);

	// maps slim bundle ids to the bundle file address
	var slimPathsConfig = {};

	// maps bundles ids (build type other than js) to the module id of
	// the plugin needed to load the bundle correctly.
	var slimPluginsConfig = {};

	/**
	 * Returns the bundle's path
	 *
	 * For nodejs, the name of the bundle is returned since `require` will
	 * locate the bundle relative to the main module folder.
	 *
	 * For the web, a relative path to the loader baseUrl is returned, so the
	 * loader can use script tags to load the bundles during runtime.
	 *
	 * @param {string} target - The name of the build target (node, web)
	 * @param {Object} bundle - The bundle object
	 * @return {string} the relative path
	 */
	function getRelativeBundlePath(target, bundle) {
		var baseUrl = options.baseUrl.replace("file:", "");

		return target !== "web" ?
			getBundleFileName(bundle) :
			path.join(
				path.relative(baseUrl, options.bundlesPath),
				getBundleFileName(bundle)
			);
	}

	bundles.forEach(function(bundle) {
		slimPathsConfig[bundle.uniqueId] = getRelativeBundlePath(
			options.target,
			bundle
		);

		if (bundle.pluginName) {
			var pluginNode = options.graph[bundle.pluginName];

			if (pluginNode && pluginNode.load.uniqueId) {
				slimPluginsConfig[bundle.uniqueId] = pluginNode.load.uniqueId;
			}
		}

		bundle.nodes.forEach(function(node) {
			if (node.load.uniqueId) {
				slimBundlesConfig[node.load.uniqueId] = bundle.uniqueId;
			}
		});
	});

	// [{ id : number, name : string }]
	options.progressiveBundles.forEach(function(bundle) {
		slimMapConfig[bundle.name] = bundle.id;
	});

	var extensions = options.slimConfig.extensions;
	var idsToResolve = options.slimConfig.identifiersToResolve;

	var configSource = `
		(function(global) {
			global.steal = global.steal || {};

			global.steal.map = ${JSON.stringify(slimMapConfig)};
			global.steal.paths = ${JSON.stringify(slimPathsConfig)};
			global.steal.bundles = ${JSON.stringify(slimBundlesConfig)};
			global.steal.plugins = ${JSON.stringify(slimPluginsConfig)};
			${extensions.length ?
				`global.steal.extensions = ${JSON.stringify(extensions)};` : ""};
			${idsToResolve.length ?
				`global.steal.identifiersToResolve = ${JSON.stringify(idsToResolve)};` : ""}

		}(${getGlobal(options.target)}));
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
